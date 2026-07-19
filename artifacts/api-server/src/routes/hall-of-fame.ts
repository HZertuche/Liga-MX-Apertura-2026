import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable,
  predictionsTable,
  matchesTable,
  jornadasTable
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();


router.get("/hall-of-fame", requireAuth, async (_req, res) => {

  const users = await db.select().from(usersTable);
  const predictions = await db.select().from(predictionsTable);
  const matches = await db.select().from(matchesTable);
  const jornadas = await db.select().from(jornadasTable);

  

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
  
const resultados = users.map(user => {

  const userPredictions = predictions.filter(
    p => p.userId === user.id
  );

  const totalResultados = userPredictions.filter(
    p => p.points === 3
  ).length;


  return {
    jugador: user.displayName,
    valor: totalResultados
  };

});


resultados.sort((a,b)=> b.valor - a.valor);  

  
const reyResultado = resultados[0];

  // cazapuntos
let mejorJornada = {
  jugador: "",
  puntos: -1,
  jornada: 0,
};

for (const jornada of jornadas) {

  const partidosJornada = matches.filter(
    m => m.jornadaId === jornada.id
  );

  const idsPartidos = partidosJornada.map(
    p => p.id
  );

  for (const user of users) {

    const puntos = predictions
      .filter(
        p =>
          p.userId === user.id &&
          idsPartidos.includes(p.matchId)
      )
      .reduce(
        (sum, p) => sum + (p.points ?? 0),
        0
      );

    if (puntos > mejorJornada.puntos) {

      mejorJornada = {
        jugador: user.displayName,
        puntos,
        jornada: jornada.number,
      };

    }

  }

}  
 
const cazadorPuntos = {
  jugador: mejorJornada.jugador,
  valor: `${mejorJornada.puntos} puntos`,
  descripcion: `Mayor cantidad de puntos logrados en una sola jornada (Jornada ${mejorJornada.jornada}).`,
};  

const especialistas = users.map(user => {

  const userPredictions = predictions.filter(
    p => p.userId === user.id
  );

  const totalPronosticos = userPredictions.length;

  const aciertos = userPredictions.filter(
    p => p.points === 5 || p.points === 3
  ).length;

  const porcentaje =
    totalPronosticos === 0
      ? 0
      : (aciertos / totalPronosticos) * 100;

  return {
    jugador: user.displayName,
    valor: porcentaje
  };

});

especialistas.sort(
  (a, b) => b.valor - a.valor
);

const especialista = especialistas[0];

  
  res.json({
    reyExacto,
    reyResultado,
    reyLiderato: {},
    farol: {},
    especialista,
    cazadorPuntos,
    muro: {},
    sobreviviente: {},
    descenso: {}
  });  
    
});


export default router;
