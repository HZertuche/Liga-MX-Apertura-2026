import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable,
  predictionsTable,
  matchesTable,
  jornadasTable,
  matchupsTable
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();


router.get("/hall-of-fame", requireAuth, async (_req, res) => {

  const users = await db.select().from(usersTable);
  const predictions = await db.select().from(predictionsTable);
  const matches = await db.select().from(matchesTable);
  const jornadas = await db.select().from(jornadasTable);
  const matchups = await db.select().from(matchupsTable);
  
  const predictionsByUser = new Map<number, typeof predictions>();
  
  for (const prediction of predictions) {
  
    const list = predictionsByUser.get(prediction.userId);
  
    if (list) {
      list.push(prediction);
    } else {
      predictionsByUser.set(prediction.userId, [prediction]);
    }
  
  }
    

  

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

// FAROL
let peorRacha = {
  jugador: "",
  partidos: 0,
};


const matchesOrdenados = [...matches].sort(
  (a, b) =>
    new Date(a.matchDate ?? 0).getTime() -
    new Date(b.matchDate ?? 0).getTime()
);


for (const user of users) {

  let rachaActual = 0;
  let rachaMaxima = 0;


  for (const match of matchesOrdenados) {

    const prediction = predictions.find(
      p =>
        p.userId === user.id &&
        p.matchId === match.id
    );


    // Si no hay predicción no contamos el partido
    if (!prediction) continue;


    if ((prediction.points ?? 0) === 0) {

      rachaActual++;

      if (rachaActual > rachaMaxima) {
        rachaMaxima = rachaActual;
      }

    } else {

      rachaActual = 0;

    }

  }


  if (rachaMaxima > peorRacha.partidos) {

    peorRacha = {
      jugador: user.displayName,
      partidos: rachaMaxima,
    };

  }

}


const farol = {
  jugador: peorRacha.jugador,
  valor: `${peorRacha.partidos} partidos`,
  descripcion:
    "Mayor racha histórica de partidos consecutivos sin obtener puntos.",
};  

// DESCENSO
const tablaDescenso = users.map(user => {

  const userPredictions = predictions.filter(
    p => p.userId === user.id
  );

  const puntos = userPredictions.reduce(
    (sum, p) => sum + (p.points ?? 0),
    0
  );

  return {
    jugador: user.displayName,
    puntos,
  };

});


tablaDescenso.sort(
  (a, b) => a.puntos - b.puntos
);


const descenso = tablaDescenso
  .slice(0, 3)
  .map((jugador, index) => ({
    posicion: index + 1,
    jugador: jugador.jugador,
    valor: `${jugador.puntos} puntos`,
  }));
  
  res.json({
    reyExacto,
    reyResultado,
    reyLiderato: {},
    farol,
    especialista,
    cazadorPuntos,
    muro: {},
    sobreviviente: {},
    descenso,
  });  
    
});


export default router;
