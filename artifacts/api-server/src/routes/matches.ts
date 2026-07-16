import { Router } from "express";
import { db } from "@workspace/db";
import { matchesTable, predictionsTable, matchupsTable, jornadasTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  CreateMatchBody, UpdateMatchBody, GetMatchParams,
  UpdateMatchParams, DeleteMatchParams, SetMatchResultParams, SetMatchResultBody,
  ListMatchesQueryParams,
} from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../lib/auth";
import { calculatePoints, calculateMatchupPoints, matchupResult } from "../lib/scoring";

const router = Router();

function formatMatch(m: typeof matchesTable.$inferSelect) {
  return {
    ...m,
    matchDate: m.matchDate ? m.matchDate.toISOString() : null,
  };
}

// GET /api/matches
router.get("/matches", requireAuth, async (req, res) => {
  const parsed = ListMatchesQueryParams.safeParse({
    jornadaId: req.query.jornadaId ? Number(req.query.jornadaId) : undefined,
    status: req.query.status,
  });
  if (!parsed.success) { res.status(400).json({ error: "Parámetros inválidos" }); return; }

  let query = db.select().from(matchesTable).$dynamic();
  if (parsed.data.jornadaId) {
    query = query.where(eq(matchesTable.jornadaId, parsed.data.jornadaId));
  }
  const matches = await query.orderBy(matchesTable.matchDate);
  res.json(matches.map(formatMatch));
});

// POST /api/matches (admin)
router.post("/matches", requireAdmin, async (req, res) => {
  const parsed = CreateMatchBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Datos inválidos" }); return; }

  const [match] = await db.insert(matchesTable).values({
    jornadaId: parsed.data.jornadaId,
    homeTeam: parsed.data.homeTeam,
    awayTeam: parsed.data.awayTeam,
    homeTeamLogo: parsed.data.homeTeamLogo ?? null,
    awayTeamLogo: parsed.data.awayTeamLogo ?? null,
    matchDate: parsed.data.matchDate ? new Date(parsed.data.matchDate) : null,
    stadium: parsed.data.stadium ?? null,
  }).returning();
  res.status(201).json(formatMatch(match));
});

// GET /api/matches/:id
router.get("/matches/:id", requireAuth, async (req, res) => {
  const parsed = GetMatchParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) { res.status(400).json({ error: "ID inválido" }); return; }

  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, parsed.data.id));
  if (!match) { res.status(404).json({ error: "Partido no encontrado" }); return; }
  res.json(formatMatch(match));
});

// PUT /api/matches/:id (admin)
router.put("/matches/:id", requireAdmin, async (req, res) => {
  const params = UpdateMatchParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) { res.status(400).json({ error: "ID inválido" }); return; }

  const parsed = UpdateMatchBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Datos inválidos" }); return; }

  const updates: Record<string, unknown> = {};
  if (parsed.data.homeTeam) updates.homeTeam = parsed.data.homeTeam;
  if (parsed.data.awayTeam) updates.awayTeam = parsed.data.awayTeam;
  if (parsed.data.homeTeamLogo !== undefined) updates.homeTeamLogo = parsed.data.homeTeamLogo;
  if (parsed.data.awayTeamLogo !== undefined) updates.awayTeamLogo = parsed.data.awayTeamLogo;
  if (parsed.data.matchDate !== undefined) updates.matchDate = parsed.data.matchDate ? new Date(parsed.data.matchDate) : null;
  if (parsed.data.stadium !== undefined) updates.stadium = parsed.data.stadium;
  if (parsed.data.status) updates.status = parsed.data.status;

  const [match] = await db.update(matchesTable).set(updates).where(eq(matchesTable.id, params.data.id)).returning();
  if (!match) { res.status(404).json({ error: "Partido no encontrado" }); return; }
  res.json(formatMatch(match));
});

// DELETE /api/matches/:id (admin)
router.delete("/matches/:id", requireAdmin, async (req, res) => {
  const parsed = DeleteMatchParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) { res.status(400).json({ error: "ID inválido" }); return; }
  await db.delete(matchesTable).where(eq(matchesTable.id, parsed.data.id));
  res.json({ success: true, message: "Partido eliminado" });
});

// POST /api/matches/:id/result (admin) — sets official result + triggers recalculation
router.post("/matches/:id/result", requireAdmin, async (req, res) => {
  const params = SetMatchResultParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) { res.status(400).json({ error: "ID inválido" }); return; }

  const parsed = SetMatchResultBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Datos inválidos" }); return; }

  const { homeScore, awayScore, status } = parsed.data;

  // Lock match and set result
  const [match] = await db.update(matchesTable).set({
    homeScore,
    awayScore,
    status,
    isLocked: true,
  }).where(eq(matchesTable.id, params.data.id)).returning();

  if (!match) { res.status(404).json({ error: "Partido no encontrado" }); return; }

  // Recalculate prediction points for this match
  const predictions = await db.select().from(predictionsTable).where(eq(predictionsTable.matchId, match.id));
  for (const pred of predictions) {
    const pts = calculatePoints(pred.homeScore, pred.awayScore, homeScore, awayScore);
    await db.update(predictionsTable).set({ points: pts, isLocked: true }).where(eq(predictionsTable.id, pred.id));
  }

  // If all matches in the jornada are finished, recalculate matchup results
  if (status === "finished") {
    const jornadaMatches = await db.select().from(matchesTable).where(eq(matchesTable.jornadaId, match.jornadaId));
    const allFinished = jornadaMatches.every(m => m.status === "finished" || m.id === match.id);

    if (allFinished) {
      await db.update(jornadasTable).set({ status: "finished" }).where(eq(jornadasTable.id, match.jornadaId));
    } else {
      await db.update(jornadasTable).set({ status: "active" }).where(eq(jornadasTable.id, match.jornadaId));
    }

    // Recalculate matchups for this jornada
    const matchups = await db.select().from(matchupsTable).where(eq(matchupsTable.jornadaId, match.jornadaId));
    
    for (const mu of matchups) {
      // Sum points for each player from all predictions in this jornada
      const jornadaMatchIds = jornadaMatches.map(m => m.id);
      
      const p1Preds = await db.select().from(predictionsTable)
        .where(and(eq(predictionsTable.userId, mu.player1Id)));
      const p1Points = p1Preds.filter(p => jornadaMatchIds.includes(p.matchId)).reduce((sum, p) => sum + (p.points ?? 0), 0);

      const p2Preds = await db.select().from(predictionsTable)
        .where(and(eq(predictionsTable.userId, mu.player2Id)));
      const p2Points = p2Preds.filter(p => jornadaMatchIds.includes(p.matchId)).reduce((sum, p) => sum + (p.points ?? 0), 0);

      const [mp1, mp2] = calculateMatchupPoints(p1Points, p2Points);
      const result = matchupResult(p1Points, p2Points);

      await db.update(matchupsTable).set({
        player1Points: p1Points,
        player2Points: p2Points,
        player1MatchupPoints: mp1,
        player2MatchupPoints: mp2,
        result,
      }).where(eq(matchupsTable.id, mu.id));
    }
  }

  res.json(formatMatch(match));
});

export default router;
