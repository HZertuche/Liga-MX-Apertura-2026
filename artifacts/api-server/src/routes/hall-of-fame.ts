import { calculateDailyLeaders } from "../lib/historical-standings";
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
  const dailyLeaders = calculateDailyLeaders(
    users,
    matches,
    predictions,
  );  
  
// ===============================
  // Datos base para estadísticas
  // ===============================
  
  const finishedMatches = matches.filter(
    match => match.status === "finished"
  );
  
  const finishedMatchIds = new Set(
    finishedMatches.map(match => match.id)
  );
  
  const finishedPredictions = predictions.filter(
    prediction => finishedMatchIds.has(prediction.matchId)
  );
  
  const predictionsByUser = new Map<number, typeof finishedPredictions>();
  
  for (const prediction of finishedPredictions) {
  
    const list = predictionsByUser.get(prediction.userId);
  
    if (list) {
      list.push(prediction);
    } else {
      predictionsByUser.set(prediction.userId, [prediction]);
    }
  
  }  

  

  // aquí calcularemos los premios
const exactos = users.map(user => {

  const userPredictions =
    predictionsByUser.get(user.id) ?? [];    


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

  const userPredictions =
    predictionsByUser.get(user.id) ?? [];    

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

  const userPredictions =
    predictionsByUser.get(user.id) ?? [];

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
    valor: Number(porcentaje.toFixed(1))
  };

});

especialistas.sort(
  (a, b) => b.valor - a.valor
);

const especialista = especialistas[0];

// =====================================
// ESPECIALISTAS POR TIPO DE PRONÓSTICO
// =====================================

const estilos = users.map(user => {

  const userPredictions =
    predictionsByUser.get(user.id) ?? [];

  let intentosLocal = 0;
  let aciertosLocal = 0;

  let intentosVisitante = 0;
  let aciertosVisitante = 0;

  let intentosEmpate = 0;
  let aciertosEmpate = 0;

  for (const prediction of userPredictions) {

    const match = finishedMatches.find(
      m => m.id === prediction.matchId
    );

    if (!match) continue;

    // Pronosticó local
    if (prediction.homeScore! > prediction.awayScore!) {

      intentosLocal++;

      if (match.homeScore! > match.awayScore!) {
        aciertosLocal++;
      }

    }

    // Pronosticó visitante
    else if (prediction.awayScore! > prediction.homeScore!) {

      intentosVisitante++;

      if (match.awayScore! > match.homeScore!) {
        aciertosVisitante++;
      }

    }

    // Pronosticó empate
    else {

      intentosEmpate++;

      if (match.homeScore === match.awayScore) {
        aciertosEmpate++;
      }

    }

  }

  return {

    jugador: user.displayName,

    local: {
      efectividad:
        intentosLocal === 0
          ? 0
          : Number(((aciertosLocal / intentosLocal) * 100).toFixed(1)),
      aciertos: aciertosLocal,
      intentos: intentosLocal,
    },

    visitante: {
      efectividad:
        intentosVisitante === 0
          ? 0
          : Number(((aciertosVisitante / intentosVisitante) * 100).toFixed(1)),
      aciertos: aciertosVisitante,
      intentos: intentosVisitante,
    },

    empate: {
      efectividad:
        intentosEmpate === 0
          ? 0
          : Number(((aciertosEmpate / intentosEmpate) * 100).toFixed(1)),
      aciertos: aciertosEmpate,
      intentos: intentosEmpate,
    },

  };

});

const especialistaLocal =
  [...estilos]
    .filter(e => e.local.intentos >= 5)
    .sort((a, b) => b.local.efectividad - a.local.efectividad)[0] ?? null;

const especialistaVisitante =
  [...estilos]
    .filter(e => e.visitante.intentos >= 5)
    .sort((a, b) => b.visitante.efectividad - a.visitante.efectividad)[0] ?? null;

const maestroEmpate =
  [...estilos]
    .filter(e => e.empate.intentos >= 5)
    .sort((a, b) => b.empate.efectividad - a.empate.efectividad)[0] ?? null;

// =====================================
// CONSERVADOR DEL AÑO Y REY DEL RIESGO
// =====================================

const perfiles = users.map(user => {

  const userPredictions =
    predictionsByUser.get(user.id) ?? [];

  let local = 0;
  let visitante = 0;
  let empate = 0;

  for (const prediction of userPredictions) {

    if (prediction.homeScore! > prediction.awayScore!) {
      local++;
    }
    else if (prediction.awayScore! > prediction.homeScore!) {
      visitante++;
    }
    else {
      empate++;
    }

  }

  const total =
    local + visitante + empate;

  return {

    jugador: user.displayName,

    conservador:
      total === 0
        ? 0
        : Number(
            ((local / total) * 100).toFixed(1)
          ),

    riesgo:
      total === 0
        ? 0
        : Number(
            (((visitante + empate) / total) * 100).toFixed(1)
          ),

  };

});

const conservadorDelAno =
  [...perfiles]
    .sort(
      (a, b) =>
        b.conservador - a.conservador
    )[0];

const reyRiesgo =
  [...perfiles]
    .sort(
      (a, b) =>
        b.riesgo - a.riesgo
    )[0];

  
// =====================================
// CAZADOR DE SORPRESAS
// =====================================

const cazadoresSorpresas = users.map(user => {

  let sorpresas = 0;

  for (const match of finishedMatches) {

    const matchPredictions =
      finishedPredictions.filter(
        p => p.matchId === match.id
      );

    if (matchPredictions.length === 0) continue;

    let local = 0;
    let visitante = 0;
    let empate = 0;

    for (const prediction of matchPredictions) {

      if (prediction.homeScore! > prediction.awayScore!) {
        local++;
      }
      else if (prediction.awayScore! > prediction.homeScore!) {
        visitante++;
      }
      else {
        empate++;
      }

    }

    const total = matchPredictions.length;

    const resultadoReal =
      match.homeScore! > match.awayScore!
        ? "local"
        : match.awayScore! > match.homeScore!
        ? "visitante"
        : "empate";

    const votosResultado =
      resultadoReal === "local"
        ? local
        : resultadoReal === "visitante"
        ? visitante
        : empate;

    const porcentaje =
      (votosResultado / total) * 100;

    if (porcentaje > 20) continue;

    const miPrediccion =
      finishedPredictions.find(
        p =>
          p.userId === user.id &&
          p.matchId === match.id
      );

    if (
      miPrediccion &&
      (miPrediccion.points ?? 0) >= 3
    ) {
      sorpresas++;
    }

  }

  return {
    jugador: user.displayName,
    valor: sorpresas,
  };

});

cazadoresSorpresas.sort(
  (a, b) => b.valor - a.valor
);

const cazadorSorpresas =
  cazadoresSorpresas[0];

  
// FAROL
let peorRacha = {
  jugador: "",
  partidos: 0,
};


const matchesOrdenados = [...finishedMatches].sort(
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

// EL CANDADO
let mejorRachaAciertos = {
  jugador: "",
  partidos: 0,
};


const partidosOrdenados = [...finishedMatches].sort(
  (a, b) =>
    new Date(a.matchDate ?? 0).getTime() -
    new Date(b.matchDate ?? 0).getTime()
);


for (const user of users) {

  let rachaActual = 0;
  let rachaMaxima = 0;


  for (const match of partidosOrdenados) {

    const prediction = predictions.find(
      p =>
        p.userId === user.id &&
        p.matchId === match.id
    );


    if (!prediction) continue;


    if ((prediction.points ?? 0) >= 3) {

      rachaActual++;

      if (rachaActual > rachaMaxima) {
        rachaMaxima = rachaActual;
      }

    } else {

      rachaActual = 0;

    }

  }


  if (rachaMaxima > mejorRachaAciertos.partidos) {

    mejorRachaAciertos = {
      jugador: user.displayName,
      partidos: rachaMaxima,
    };

  }

}


const candado = {
  jugador: mejorRachaAciertos.jugador,
  valor: `${mejorRachaAciertos.partidos} partidos`,
  descripcion:
    "Mayor racha histórica de partidos acertando el resultado (3 puntos o más) sin fallar.",
};  

const farol = {
  jugador: peorRacha.jugador,
  valor: `${peorRacha.partidos} partidos`,
  descripcion:
    "Mayor racha histórica de partidos consecutivos sin obtener puntos.",
};  


// REY DEL LIDERATO

const diasPorJugador = new Map<string, number>();

for (const leader of dailyLeaders) {

  diasPorJugador.set(
    leader.jugador,
    (diasPorJugador.get(leader.jugador) ?? 0) + 1
  );

}

const rankingLideres = [...diasPorJugador.entries()]
  .map(([jugador, dias]) => ({
    jugador,
    valor: dias,
  }))
  .sort((a, b) => b.valor - a.valor);

const reyLiderato = rankingLideres[0] ?? {
  jugador: "Sin datos",
  valor: 0,
};

// CAMPEÓN DE JORNADAS
const jornadasGanadas = new Map<string, number>();


for (const jornada of jornadas) {

  // Solo jornadas terminadas
  if (jornada.status !== "finished") {
    continue;
  }


  const partidosJornada = matches.filter(
    m => m.jornadaId === jornada.id
  );


  const idsPartidos = partidosJornada.map(
    m => m.id
  );


  const tablaJornada = users.map(user => {

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


    return {
      jugador: user.displayName,
      puntos,
    };

  });


  tablaJornada.sort(
    (a, b) => b.puntos - a.puntos
  );


  const ganador = tablaJornada[0];


  if (ganador) {

    jornadasGanadas.set(
      ganador.jugador,
      (jornadasGanadas.get(ganador.jugador) ?? 0) + 1
    );

  }

}


const campeonJornadasRanking = [...jornadasGanadas.entries()]
  .map(([jugador, jornadas]) => ({
    jugador,
    valor: jornadas,
  }))
  .sort((a, b) => b.valor - a.valor);


const campeonJornadas = campeonJornadasRanking[0] ?? {
  jugador: "Sin datos",
  valor: 0,
};  


  
// ZONA DE DESCENSO

const tablaGeneral = users.map(user => {

  const puntos = predictions
    .filter(p => p.userId === user.id)
    .reduce((sum, p) => sum + (p.points ?? 0), 0);

  return {
    jugador: user.displayName,
    puntos,
  };

});

tablaGeneral.sort((a, b) => b.puntos - a.puntos);

const descenso = tablaGeneral
  .slice(-3)
  .map((jugador, index) => ({
    posicion: tablaGeneral.length - 2 + index,
    jugador: jugador.jugador,
    valor: `${jugador.puntos} pts`,
  }));
  
  res.json({
    reyExacto,
    reyResultado,
    reyLiderato,
    farol,
    especialista,
    especialistaLocal,
    especialistaVisitante,
    maestroEmpate,

    conservadorDelAno,
    reyRiesgo,
    
    cazadorSorpresas,
    cazadorPuntos,
    candado,
    campeonJornadas,
    descenso,
  });  
    
});


export default router;
