import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable,
  predictionsTable,
  matchesTable
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();


router.get("/hall-of-fame", requireAuth, async (_req, res) => {

  const users = await db.select().from(usersTable);
  const predictions = await db.select().from(predictionsTable);
  const matches = await db.select().from(matchesTable);


  // aquí calcularemos los premios


  res.json({
    reyExacto: {},
    reyResultado: {},
    reyLiderato: {},
    farol: {},
    especialista: {},
    cazadorPuntos: {},
    muro: {},
    sobreviviente: {},
    descenso: {}
  });

});


export default router;
