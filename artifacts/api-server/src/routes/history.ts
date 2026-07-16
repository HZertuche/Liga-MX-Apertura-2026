import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, jornadasTable, matchesTable, predictionsTable, matchupsTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import { GetPlayerHistoryParams } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { calculatePoints } from "../lib/scoring";

const router = Router();

// GET /api/users/:id/history
router.get("/users/:id/history", requireAuth, async (req, res) => {
  const parsed = GetPlayerHistoryParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) { res.status(400).json({ error: "ID inválido" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, parsed.data.id));
  if (!user) { res.status(404).json({ error: "Jugador no encontrado" }); return; }

  const jornadas = await db.select().from(jornadasTable).orderBy(jornadasTable.number);
  const allMatches = await db.select().from(matchesTable);
  const finishedMatches = allMatches.filter(m => m.status === "finished");
  const predictions = await db.select().from(predictionsTable).where(eq(predictionsTable.userId, user.id));
  const matchups = await db.select().from(matchupsTable);

  // Compute totals
  let totalPoints = 0, exactScores = 0, correctResults = 0, matchupPredCount = 0;
  for (const pred of predictions) {
    const match = finishedMatches.find(m => m.id === pred.matchId);
    if (!match) continue;
    const pts = pred.points ?? 0;
    totalPoints += pts;
    if (pts === 5) exactScores++;
    if (pts === 3) correctResults++;
    matchupPredCount++;
  }
  const accuracy = matchupPredCount > 0 ? Math.round(((exactScores + correctResults) / matchupPredCount) * 1000) / 10 : 0;

  // Matchup points total
  const asP1 = matchups.filter(m => m.player1Id === user.id);
  const asP2 = matchups.filter(m => m.player2Id === user.id);
  const totalMatchupPoints = asP1.reduce((s, m) => s + (m.player1MatchupPoints ?? 0), 0)
                           + asP2.reduce((s, m) => s + (m.player2MatchupPoints ?? 0), 0);

  // Per-jornada summaries
  const jornadaSummaries = jornadas.map(j => {
    const jornadaMatches = finishedMatches.filter(m => m.jornadaId === j.id);
    const jornadaPreds = predictions.filter(p => jornadaMatches.some(m => m.id === p.matchId));

    let pts = 0, exact = 0, correct = 0;
    for (const pred of jornadaPreds) {
      const match = jornadaMatches.find(m => m.id === pred.matchId);
      if (!match || match.homeScore === null || match.awayScore === null) continue;
      const p = pred.points ?? calculatePoints(pred.homeScore, pred.awayScore, match.homeScore, match.awayScore);
      pts += p;
      if (p === 5) exact++;
      if (p === 3) correct++;
    }

    // Matchup for this jornada
    const mu = matchups.find(m => m.jornadaId === j.id && (m.player1Id === user.id || m.player2Id === user.id));
    let matchupResult: string | null = null;
    let matchupOpponent: string | null = null;
    let matchupPoints: number | null = null;

    if (mu) {
      if (mu.player1Id === user.id) {
        matchupPoints = mu.player1MatchupPoints ?? null;
        matchupResult = mu.result ?? null;
      } else {
        matchupPoints = mu.player2MatchupPoints ?? null;
        matchupResult = mu.result === "player1_wins" ? "player2_wins" : mu.result === "player2_wins" ? "player1_wins" : mu.result ?? null;
      }
    }

    return {
      jornadaId: j.id,
      jornadaNumber: j.number,
      jornadaName: j.name,
      points: pts,
      exactScores: exact,
      correctResults: correct,
      matchupResult,
      matchupOpponent,
      matchupPoints,
    };
  });

  // Format predictions with match data
  const formattedPredictions = predictions.map(p => {
    const match = allMatches.find(m => m.id === p.matchId);
    return {
      ...p,
      match: match ? {
        ...match,
        matchDate: match.matchDate ? match.matchDate.toISOString() : null,
      } : undefined,
    };
  });

  res.json({
    userId: user.id,
    displayName: user.displayName,
    totalPoints,
    totalMatchupPoints,
    exactScores,
    correctResults,
    accuracy,
    jornadaSummaries,
    predictions: formattedPredictions,
  });
});

export default router;
