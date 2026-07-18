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
const exactos = users.map(user => {

  const userPredictions = predictions.filter(
    p => p.userId === user.id
  );

  const totalExactos = userPredictions.filter(
    p => p.points === 5
  ).length;


  return {
    jugador: user.displayName,
    valor: totalExactos
  };

});


exactos.sort((a,b)=> b.valor - a.valor);


const reyExacto = exactos[0];

  res.json({
    reyExacto,
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
