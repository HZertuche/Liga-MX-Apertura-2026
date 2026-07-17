import { Router } from "express";
import { db } from "@workspace/db";
import { predictionsTable, matchesTable, usersTable } from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";
import { SavePredictionsBody, ListPredictionsQueryParams } from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../lib/auth";

const router = Router();

// GET /api/predictions
router.get("/predictions", requireAuth, async (req, res) => {
  const parsed = ListPredictionsQueryParams.safeParse({
    userId: req.query.userId ? Number(req.query.userId) : undefined,
    jornadaId: req.query.jornadaId ? Number(req.query.jornadaId) : undefined,
  });
  if (!parsed.success) { res.status(400).json({ error: "Parámetros inválidos" }); return; }

  const { userId, jornadaId } = parsed.data;

  // Build conditions
  let matchIds: number[] | undefined;
  if (jornadaId) {
    const matches = await db.select({ id: matchesTable.id }).from(matchesTable).where(eq(matchesTable.jornadaId, jornadaId));
    matchIds = matches.map(m => m.id);
    if (matchIds.length === 0) {
      res.json([]);
      return;
    }
  }

  let predictions;
  if (userId && matchIds) {
    predictions = await db.select().from(predictionsTable).where(
      and(eq(predictionsTable.userId, userId), inArray(predictionsTable.matchId, matchIds))
    );
  } else if (userId) {
    predictions = await db.select().from(predictionsTable).where(eq(predictionsTable.userId, userId));
  } else if (matchIds) {
    predictions = await db.select().from(predictionsTable).where(inArray(predictionsTable.matchId, matchIds));
  } else {
    // Return only current user's predictions
    predictions = await db.select().from(predictionsTable).where(eq(predictionsTable.userId, req.session.userId!));
  }

  // Attach match data
  const matchIds2 = [...new Set(predictions.map(p => p.matchId))];
  let matchesData: typeof matchesTable.$inferSelect[] = [];
  if (matchIds2.length > 0) {
    matchesData = await db.select().from(matchesTable).where(inArray(matchesTable.id, matchIds2));
  }
  const matchesMap = Object.fromEntries(matchesData.map(m => [m.id, m]));

  res.json(predictions.map(p => ({
    ...p,
    match: matchesMap[p.matchId] ? {
      ...matchesMap[p.matchId],
      matchDate: matchesMap[p.matchId].matchDate ? matchesMap[p.matchId].matchDate!.toISOString() : null,
    } : undefined,
  })));
});

// POST /api/predictions/bulk
router.post("/predictions/bulk", requireAuth, async (req, res) => {
  const parsed = SavePredictionsBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Datos inválidos" }); return; }

  const { jornadaId, predictions } = parsed.data;
  const userId = req.session.userId!;
  const now = new Date();
  const lockThresholdMs = 10 * 60 * 1000; // 10 minutes

  // Get all matches for this jornada
  const jornadaMatches = await db.select().from(matchesTable).where(eq(matchesTable.jornadaId, jornadaId));
  const matchMap = Object.fromEntries(jornadaMatches.map(m => [m.id, m]));

  const results = [];
  for (const pred of predictions) {
    const match = matchMap[pred.matchId];
    if (!match) continue;

    // Check lock: match starts in < 10 minutes or is already locked
    const isLocked = match.isLocked || (
      match.matchDate !== null &&
      new Date(match.matchDate).getTime() - now.getTime() < lockThresholdMs
    );

    if (isLocked) {
      res.status(400).json({ error: `El partido ${match.homeTeam} vs ${match.awayTeam} ya está bloqueado` });
      return;
    }

    // Upsert prediction
    const [saved] = await db.insert(predictionsTable).values({
      userId,
      matchId: pred.matchId,
      homeScore: pred.homeScore ?? null,
      awayScore: pred.awayScore ?? null,
      isLocked: false,
    }).onConflictDoUpdate({
      target: [predictionsTable.userId, predictionsTable.matchId],
      set: {
        homeScore: pred.homeScore ?? null,
        awayScore: pred.awayScore ?? null,
        updatedAt: now,
      },
    }).returning();

    results.push({
      ...saved,
      match: {
        ...match,
        matchDate: match.matchDate ? match.matchDate.toISOString() : null,
      },
    });
  }

  res.json(results);
});

// GET /api/predictions/match/:matchId — all users' predictions for a locked match
router.get("/predictions/match/:matchId", requireAuth, async (req, res) => {
  const matchId = Number(req.params.matchId);
  if (isNaN(matchId)) { res.status(400).json({ error: "matchId inválido" }); return; }

  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, matchId));
  if (!match) { res.status(404).json({ error: "Partido no encontrado" }); return; }

  // Only expose if match is locked (started within 10 min) or finished
  const LOCK_MS = 10 * 60 * 1000;
  const isLocked = match.isLocked ||
    match.status === "finished" ||
    (match.matchDate !== null && new Date(match.matchDate).getTime() - Date.now() < LOCK_MS);

  if (!isLocked) {
    res.status(403).json({ error: "El partido aún no está cerrado" });
    return;
  }

  const preds = await db.select().from(predictionsTable).where(eq(predictionsTable.matchId, matchId));
  const users = await db.select().from(usersTable);
  const usersMap = Object.fromEntries(users.map(u => [u.id, u]));

  res.json(preds.map(p => ({
    userId: p.userId,
    displayName: usersMap[p.userId]?.displayName ?? "—",
    homeScore: p.homeScore,
    awayScore: p.awayScore,
    points: p.points,
  })));
});

export default router;
