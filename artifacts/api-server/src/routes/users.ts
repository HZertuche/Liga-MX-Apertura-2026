import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateUserBody, UpdateUserBody, GetUserParams, UpdateUserParams, DeleteUserParams } from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../lib/auth";

const router = Router();

const userFields = {
  id: usersTable.id,
  username: usersTable.username,
  displayName: usersTable.displayName,
  role: usersTable.role,
  createdAt: usersTable.createdAt,
};

// GET /api/users
router.get("/users", requireAuth, async (_req, res) => {
  const users = await db.select(userFields).from(usersTable);
  res.json(users);
});

// POST /api/users (admin)
router.post("/users", requireAdmin, async (req, res) => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos" });
    return;
  }
  const { username, password, displayName, role } = parsed.data;

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (existing) {
    res.status(400).json({ error: "El nombre de usuario ya existe" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({ username, passwordHash, displayName, role }).returning({
    id: usersTable.id, username: usersTable.username, displayName: usersTable.displayName, role: usersTable.role, createdAt: usersTable.createdAt,
  });
  res.status(201).json(user);
});

// GET /api/users/:id
router.get("/users/:id", requireAuth, async (req, res) => {
  const parsed = GetUserParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) { res.status(400).json({ error: "ID inválido" }); return; }

  const [user] = await db.select(userFields).from(usersTable).where(eq(usersTable.id, parsed.data.id));
  if (!user) { res.status(404).json({ error: "Usuario no encontrado" }); return; }
  res.json(user);
});

// PUT /api/users/:id (admin)
router.put("/users/:id", requireAdmin, async (req, res) => {
  const params = UpdateUserParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) { res.status(400).json({ error: "ID inválido" }); return; }

  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Datos inválidos" }); return; }

  const updates: Record<string, unknown> = {};
  if (parsed.data.username) updates.username = parsed.data.username;
  if (parsed.data.displayName) updates.displayName = parsed.data.displayName;
  if (parsed.data.role) updates.role = parsed.data.role;
  if (parsed.data.password) updates.passwordHash = await bcrypt.hash(parsed.data.password, 10);

  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, params.data.id)).returning({
    id: usersTable.id, username: usersTable.username, displayName: usersTable.displayName, role: usersTable.role, createdAt: usersTable.createdAt,
  });
  if (!user) { res.status(404).json({ error: "Usuario no encontrado" }); return; }
  res.json(user);
});

// DELETE /api/users/:id (admin)
router.delete("/users/:id", requireAdmin, async (req, res) => {
  const parsed = DeleteUserParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) { res.status(400).json({ error: "ID inválido" }); return; }
  await db.delete(usersTable).where(eq(usersTable.id, parsed.data.id));
  res.json({ success: true, message: "Usuario eliminado" });
});

export default router;
