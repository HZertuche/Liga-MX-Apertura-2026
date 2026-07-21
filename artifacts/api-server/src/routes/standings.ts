import { Router } from "express";
import { db } from "@workspace/db";
import { predictionsTable, matchupsTable, usersTable, matchesTable, standingsHistoryTable, jornadasTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth";
import { calculatePoints, calculateMatchupPoints, matchupResult } from "../lib/scoring";

const router = Router();

// GET /api/standings/general
router.get("/standings/general", requireAuth, async (_req, res) => {
  const players = await db.select().from(usersTable);
  const allMatches = await db.select().from(matchesTable).where(eq(matchesTable.status, "finished"));
  const allPredictions = await db.select().from(predictionsTable);

  const rows = players.map(player => {
    const preds = allPredictions.filter(p => p.userId === player.id);
    let exactScores = 0;
    let correctResults = 0;
    let totalPoints = 0;

    for (const pred of preds) {
      const match = allMatches.find(m => m.id === pred.matchId);
      if (!match || match.homeScore === null || match.awayScore === null) continue;
      if (pred.homeScore === null || pred.awayScore === null) continue;

      const pts = pred.points ?? calculatePoints(pred.homeScore, pred.awayScore, match.homeScore, match.awayScore);
      totalPoints += pts;
      if (pts === 5) exactScores++;
      if (pts === 3) correctResults++;
    }

    const totalPredictions = preds.filter(p => {
      const m = allMatches.find(m2 => m2.id === p.matchId);
      return m !== undefined;
    }).length;
    const accuracy = totalPredictions > 0 ? ((exactScores + correctResults) / totalPredictions) * 100 : 0;

    return {
      userId: player.id,
      displayName: player.displayName,
      exactScores,
      correctResults,
      totalPoints,
      accuracy: Math.round(accuracy * 10) / 10,
    };
  });

  // Sort by totalPoints desc
  rows.sort((a, b) => b.totalPoints - a.totalPoints || b.exactScores - a.exactScores);

  // Add positions with change indicator (static for now: positionChange = 0)
  const withPosition = rows.map((row, i) => ({
    position: i + 1,
    positionChange: 0,
    ...row,
  }));

  res.json(withPosition);
});

// GET /api/standings/matchups
router.get("/standings/matchups", requireAuth, async (_req, res) => {
  const players = await db.select().from(usersTable);
  const allMatchups = await db.select().from(matchupsTable);

  const rows = players.map(player => {
    const asP1 = allMatchups.filter(m => m.player1Id === player.id);
    const asP2 = allMatchups.filter(m => m.player2Id === player.id);

    let wins = 0, draws = 0, losses = 0, points = 0, pointDiff = 0;

    for (const mu of asP1) {
      if (mu.result === null) continue;
      const mp = mu.player1MatchupPoints ?? 0;
      points += mp;
      const oppMp = mu.player2MatchupPoints ?? 0;
      pointDiff += (mu.player1Points ?? 0) - (mu.player2Points ?? 0);
      if (mu.result === "player1_wins") wins++;
      else if (mu.result === "draw") draws++;
      else losses++;
    }

    for (const mu of asP2) {
      if (mu.result === null) continue;
      const mp = mu.player2MatchupPoints ?? 0;
      points += mp;
      pointDiff += (mu.player2Points ?? 0) - (mu.player1Points ?? 0);
      if (mu.result === "player2_wins") wins++;
      else if (mu.result === "draw") draws++;
      else losses++;
    }

    return {
      userId: player.id,
      displayName: player.displayName,
      wins,
      draws,
      losses,
      points,
      pointDiff,
    };
  });

  rows.sort((a, b) => b.points - a.points || b.wins - a.wins || b.pointDiff - a.pointDiff);

  const withPosition = rows.map((row, i) => ({
    position: i + 1,
    positionChange: 0,
    ...row,
  }));

  res.json(withPosition);
});

// GET /api/standings/weekly?jornadaId=X — points for a single jornada
router.get("/standings/weekly", requireAuth, async (req, res) => {
  const jornadaId = req.query.jornadaId ? Number(req.query.jornadaId) : null;

  const players = await db.select().from(usersTable);
  const jornadaMatches = jornadaId
    ? await db.select().from(matchesTable).where(and(eq(matchesTable.jornadaId, jornadaId), eq(matchesTable.status, "finished")))
    : await db.select().from(matchesTable).where(eq(matchesTable.status, "finished"));

  const matchIds = jornadaMatches.map(m => m.id);
  const allPredictions = matchIds.length > 0
    ? await db.select().from(predictionsTable)
    : [];

  const rows = players.map(player => {
    const preds = allPredictions.filter(p => p.userId === player.id && matchIds.includes(p.matchId));
    let exactScores = 0, correctResults = 0, totalPoints = 0;

    for (const pred of preds) {
      const match = jornadaMatches.find(m => m.id === pred.matchId);
      if (!match || match.homeScore === null || match.awayScore === null) continue;
      if (pred.homeScore === null || pred.awayScore === null) continue;
      const pts = pred.points ?? calculatePoints(pred.homeScore, pred.awayScore, match.homeScore, match.awayScore);
      totalPoints += pts;
      if (pts === 5) exactScores++;
      if (pts === 3) correctResults++;
    }

    return { userId: player.id, displayName: player.displayName, exactScores, correctResults, totalPoints };
  });

  rows.sort((a, b) => b.totalPoints - a.totalPoints || b.exactScores - a.exactScores);
  res.json(rows.map((row, i) => ({ position: i + 1, ...row })));
});

// POST /api/admin/recalculate — recalculate all scores
router.post("/admin/recalculate", requireAdmin, async (_req, res) => {
  const allMatches = await db.select().from(matchesTable).where(eq(matchesTable.status, "finished"));
  const allPredictions = await db.select().from(predictionsTable);

  for (const match of allMatches) {
    if (match.homeScore === null || match.awayScore === null) continue;
    const preds = allPredictions.filter(p => p.matchId === match.id);
    for (const pred of preds) {
      const pts = calculatePoints(pred.homeScore, pred.awayScore, match.homeScore, match.awayScore);
      await db.update(predictionsTable).set({ points: pts }).where(eq(predictionsTable.id, pred.id));
    }
  }

  // Recalculate all matchup results
  const allMatchups = await db.select().from(matchupsTable);
  for (const mu of allMatchups) {
    const jornadaMatches = allMatches.filter(m => m.jornadaId === mu.jornadaId);
    const matchIds = jornadaMatches.map(m => m.id);

    const p1Preds = allPredictions.filter(p => p.userId === mu.player1Id && matchIds.includes(p.matchId));
    const p2Preds = allPredictions.filter(p => p.userId === mu.player2Id && matchIds.includes(p.matchId));

    const p1Total = p1Preds.reduce((s, p) => s + (p.points ?? 0), 0);
    const p2Total = p2Preds.reduce((s, p) => s + (p.points ?? 0), 0);

    if (p1Total === 0 && p2Total === 0 && jornadaMatches.length === 0) continue;

    const [mp1, mp2] = calculateMatchupPoints(p1Total, p2Total);
    const result = matchupResult(p1Total, p2Total);

    await db.update(matchupsTable).set({
      player1Points: p1Total,
      player2Points: p2Total,
      player1MatchupPoints: mp1,
      player2MatchupPoints: mp2,
      result,
    }).where(eq(matchupsTable.id, mu.id));
  }
    // Guardar histórico de posiciones
    
    const jornadas = await db.select().from(jornadasTable);
    
    const ultimaJornada = jornadas
      .filter(j => j.status === "finished")
      .sort((a,b)=>b.number-a.number)[0];
    
    
    if (ultimaJornada) {
    
      const players = await db.select().from(usersTable);
    
      const historyRows = players.map(player => {
    
        const preds = allPredictions.filter(
          p => p.userId === player.id
        );
    
        const points = preds.reduce(
          (sum,p)=>sum+(p.points ?? 0),
          0
        );
    
    
        return {
          jornadaId: ultimaJornada.id,
          userId: player.id,
          position: 0,
          points,
          exactScores: 0
        };
    
      });
    
    
      historyRows.sort(
        (a,b)=>b.points-a.points
      );
    
    
      const finalRows = historyRows.map(
        (row,index)=>({
          ...row,
          position:index+1
        })
      );
    
    
      await db.insert(standingsHistoryTable)
        .values(finalRows);
    
    }
  res.json({ success: true, message: "Recalculación completada" });
});

export default router;
