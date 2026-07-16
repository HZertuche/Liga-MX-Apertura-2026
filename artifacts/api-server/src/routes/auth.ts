import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { LoginBody, RegisterBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router = Router();

// POST /api/auth/login
router.post("/auth/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos" });
    return;
  }
  const { username, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (!user) {
    res.status(401).json({ error: "Credenciales incorrectas" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Credenciales incorrectas" });
    return;
  }

  req.session.userId = user.id;
  req.session.username = user.username;
  req.session.role = user.role;
  req.session.displayName = user.displayName;

  res.json({ id: user.id, username: user.username, displayName: user.displayName, role: user.role });
});

// POST /api/auth/register
router.post("/auth/register", async (req, res) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos" });
    return;
  }
  const { username, password, displayName } = parsed.data;

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (existing) {
    res.status(400).json({ error: "El nombre de usuario ya existe" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({
    username,
    passwordHash,
    displayName,
    role: "player",
  }).returning();

  req.session.userId = user.id;
  req.session.username = user.username;
  req.session.role = user.role;
  req.session.displayName = user.displayName;

  res.status(201).json({ id: user.id, username: user.username, displayName: user.displayName, role: user.role });
});

// POST /api/auth/logout
router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true, message: "Sesión cerrada" });
  });
});

// GET /api/auth/me
router.get("/auth/me", requireAuth, async (req, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!));
  if (!user) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }
  res.json({ id: user.id, username: user.username, displayName: user.displayName, role: user.role });
});

export default router;
