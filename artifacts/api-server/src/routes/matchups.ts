import { Router } from "express";
import { db } from "@workspace/db";
import { matchupsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateMatchupBody, GenerateMatchupsBody, DeleteMatchupParams, ListMatchupsQueryParams } from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../lib/auth";

const router = Router();

async function formatMatchup(mu: typeof matchupsTable.$inferSelect) {
  const [p1] = await db.select({ displayName: usersTable.displayName }).from(usersTable).where(eq(usersTable.id, mu.player1Id));
  const [p2] = await db.select({ displayName: usersTable.displayName }).from(usersTable).where(eq(usersTable.id, mu.player2Id));
  return {
    ...mu,
    player1DisplayName: p1?.displayName ?? "Jugador",
    player2DisplayName: p2?.displayName ?? "Jugador",
  };
}

// GET /api/matchups
router.get("/matchups", requireAuth, async (req, res) => {
  const parsed = ListMatchupsQueryParams.safeParse({
    jornadaId: req.query.jornadaId ? Number(req.query.jornadaId) : undefined,
  });
  if (!parsed.success) { res.status(400).json({ error: "Parámetros inválidos" }); return; }

  let matchups;
  if (parsed.data.jornadaId) {
    matchups = await db.select().from(matchupsTable).where(eq(matchupsTable.jornadaId, parsed.data.jornadaId));
  } else {
    matchups = await db.select().from(matchupsTable);
  }

  // Fetch all players in one query for efficiency
  const players = await db.select({ id: usersTable.id, displayName: usersTable.displayName }).from(usersTable);
  const playerMap = Object.fromEntries(players.map(p => [p.id, p.displayName]));

  res.json(matchups.map(mu => ({
    ...mu,
    player1DisplayName: playerMap[mu.player1Id] ?? "Jugador",
    player2DisplayName: playerMap[mu.player2Id] ?? "Jugador",
  })));
});

// POST /api/matchups (admin)
router.post("/matchups", requireAdmin, async (req, res) => {
  const parsed = CreateMatchupBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Datos inválidos" }); return; }

  const [mu] = await db.insert(matchupsTable).values({
    jornadaId: parsed.data.jornadaId,
    player1Id: parsed.data.player1Id,
    player2Id: parsed.data.player2Id,
  }).returning();

  res.status(201).json(await formatMatchup(mu));
});

// POST /api/matchups/generate (admin) — random pairings
router.post("/matchups/generate", requireAdmin, async (req, res) => {
  const parsed = GenerateMatchupsBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Datos inválidos" }); return; }

  const { jornadaId } = parsed.data;

  // Delete existing matchups for this jornada
  await db.delete(matchupsTable).where(eq(matchupsTable.jornadaId, jornadaId));

  // Get all users (players and admins all participate)
  const players = await db.select({ id: usersTable.id, displayName: usersTable.displayName })
    .from(usersTable);

  if (players.length < 2) {
    res.status(400).json({ error: "Se necesitan al menos 2 usuarios" });
    return;
  }

  // Shuffle players
  const shuffled = [...players].sort(() => Math.random() - 0.5);

  const created = [];
  for (let i = 0; i + 1 < shuffled.length; i += 2) {
    const [mu] = await db.insert(matchupsTable).values({
      jornadaId,
      player1Id: shuffled[i].id,
      player2Id: shuffled[i + 1].id,
    }).returning();
    created.push({
      ...mu,
      player1DisplayName: shuffled[i].displayName,
      player2DisplayName: shuffled[i + 1].displayName,
    });
  }

  res.json(created);
});

// DELETE /api/matchups/:id (admin)
router.delete("/matchups/:id", requireAdmin, async (req, res) => {
  const parsed = DeleteMatchupParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) { res.status(400).json({ error: "ID inválido" }); return; }
  await db.delete(matchupsTable).where(eq(matchupsTable.id, parsed.data.id));
  res.json({ success: true, message: "Enfrentamiento eliminado" });
});

export default router;
