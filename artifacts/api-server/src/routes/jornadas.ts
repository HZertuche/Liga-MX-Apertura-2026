import { Router } from "express";
import { db } from "@workspace/db";
import { jornadasTable, matchesTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { CreateJornadaBody, UpdateJornadaBody, GetJornadaParams, UpdateJornadaParams } from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../lib/auth";

const router = Router();

// GET /api/jornadas
router.get("/jornadas", requireAuth, async (_req, res) => {
  const jornadas = await db.select().from(jornadasTable).orderBy(jornadasTable.number);
  
  // Add match counts
  const withCounts = await Promise.all(jornadas.map(async (j) => {
    const [{ count: matchCount }] = await db.select({ count: count() }).from(matchesTable).where(eq(matchesTable.jornadaId, j.id));
    return {
      ...j,
      startDate: j.startDate ? j.startDate.toISOString() : null,
      endDate: j.endDate ? j.endDate.toISOString() : null,
      matchCount: Number(matchCount),
    };
  }));
  
  res.json(withCounts);
});

// POST /api/jornadas (admin)
router.post("/jornadas", requireAdmin, async (req, res) => {
  const parsed = CreateJornadaBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Datos inválidos" }); return; }

  const [jornada] = await db.insert(jornadasTable).values({
    number: parsed.data.number,
    name: parsed.data.name,
    startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : undefined,
    endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : undefined,
  }).returning();

  res.status(201).json({
    ...jornada,
    startDate: jornada.startDate ? jornada.startDate.toISOString() : null,
    endDate: jornada.endDate ? jornada.endDate.toISOString() : null,
    matchCount: 0,
  });
});

// GET /api/jornadas/:id
router.get("/jornadas/:id", requireAuth, async (req, res) => {
  const parsed = GetJornadaParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) { res.status(400).json({ error: "ID inválido" }); return; }

  const [jornada] = await db.select().from(jornadasTable).where(eq(jornadasTable.id, parsed.data.id));
  if (!jornada) { res.status(404).json({ error: "Jornada no encontrada" }); return; }

  const matches = await db.select().from(matchesTable).where(eq(matchesTable.jornadaId, jornada.id)).orderBy(matchesTable.matchDate);

  res.json({
    ...jornada,
    startDate: jornada.startDate ? jornada.startDate.toISOString() : null,
    endDate: jornada.endDate ? jornada.endDate.toISOString() : null,
    matches: matches.map(m => ({
      ...m,
      matchDate: m.matchDate ? m.matchDate.toISOString() : null,
    })),
  });
});

// PUT /api/jornadas/:id (admin)
router.put("/jornadas/:id", requireAdmin, async (req, res) => {
  const params = UpdateJornadaParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) { res.status(400).json({ error: "ID inválido" }); return; }

  const parsed = UpdateJornadaBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Datos inválidos" }); return; }

  const updates: Record<string, unknown> = {
    number: parsed.data.number,
    name: parsed.data.name,
  };
  if (parsed.data.startDate !== undefined) updates.startDate = parsed.data.startDate ? new Date(parsed.data.startDate) : null;
  if (parsed.data.endDate !== undefined) updates.endDate = parsed.data.endDate ? new Date(parsed.data.endDate) : null;

  const [jornada] = await db.update(jornadasTable).set(updates).where(eq(jornadasTable.id, params.data.id)).returning();
  if (!jornada) { res.status(404).json({ error: "Jornada no encontrada" }); return; }

  const [{ count: matchCount }] = await db.select({ count: count() }).from(matchesTable).where(eq(matchesTable.jornadaId, jornada.id));
  res.json({
    ...jornada,
    startDate: jornada.startDate ? jornada.startDate.toISOString() : null,
    endDate: jornada.endDate ? jornada.endDate.toISOString() : null,
    matchCount: Number(matchCount),
  });
});

export default router;
