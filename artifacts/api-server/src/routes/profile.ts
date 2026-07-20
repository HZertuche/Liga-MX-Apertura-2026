import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable,
  predictionsTable,
  matchesTable,
  jornadasTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/profile/:userId", async (req, res) => {
  const userId = Number(req.params.userId);

  if (!userId) {
    return res.status(400).json({
      error: "Usuario inválido",
    });
  }


  const users = await db
    .select()
    .from(usersTable);


  const user = users.find(
    u => u.id === userId
  );


  if (!user) {
    return res.status(404).json({
      error: "Usuario no encontrado",
    });
  }


  const predictions = await db
    .select()
    .from(predictionsTable)
    .where(eq(predictionsTable.userId, userId));


  const matches = await db
    .select()
    .from(matchesTable);
  
  // Solo partidos finalizados
  const finishedPredictions = predictions.filter((prediction) => {
    const match = matches.find((m) => m.id === prediction.matchId);
  
    return match?.status === "finished";
  });

  const jornadas = await db
    .select()
    .from(jornadasTable);
  // ===============================
  // ESTILO DE JUEGO
  // ===============================

  const calcularEspecialidad = (
    tipo: "local" | "visitante" | "empate"
  ) => {

    let intentos = 0;
    let aciertos = 0;


    for (const prediction of finishedPredictions) {

      const match = matches.find(
        m => m.id === prediction.matchId
      );


      if (!match) continue;


      const predijoLocal =
        prediction.homeScore! > prediction.awayScore!;


      const predijoVisitante =
        prediction.awayScore! > prediction.homeScore!;


      const predijoEmpate =
        prediction.homeScore === prediction.awayScore;


      let predijoEsteResultado = false;


      if (
        tipo === "local" &&
        predijoLocal
      ) {
        predijoEsteResultado = true;
      }


      if (
        tipo === "visitante" &&
        predijoVisitante
      ) {
        predijoEsteResultado = true;
      }


      if (
        tipo === "empate" &&
        predijoEmpate
      ) {
        predijoEsteResultado = true;
      }


      if (!predijoEsteResultado) continue;


      intentos++;


      const resultadoLocal =
        match.homeScore! > match.awayScore!;


      const resultadoVisitante =
        match.awayScore! > match.homeScore!;


      const resultadoEmpate =
        match.homeScore === match.awayScore;


      const acertado =
        (tipo === "local" && resultadoLocal) ||
        (tipo === "visitante" && resultadoVisitante) ||
        (tipo === "empate" && resultadoEmpate);


      if (acertado) {
        aciertos++;
      }

    }



    return {
      efectividad:
        intentos === 0
          ? 0
          :
          Number(
            (
              (aciertos / intentos) *
              100
            ).toFixed(1)
          ),
    
      aciertos,
      intentos,
    
      muestraSuficiente: intentos >= 5,
    };

  };


  const estilo = {

    local:
      calcularEspecialidad("local"),

    visitante:
      calcularEspecialidad("visitante"),

    empate:
      calcularEspecialidad("empate"),

  };

  // ===============================
  // PERFIL DE RIESGO
  // ===============================
  
  let apuestasLocal = 0;
  let apuestasVisitante = 0;
  let apuestasEmpate = 0;
  
  
  for (const prediction of finishedPredictions) {
  
    if (
      prediction.homeScore! >
      prediction.awayScore!
    ) {
      apuestasLocal++;
    }
    else if (
      prediction.awayScore! >
      prediction.homeScore!
    ) {
      apuestasVisitante++;
    }
    else {
      apuestasEmpate++;
    }
  
  }
  
  
  const totalPronosticos =
    apuestasLocal +
    apuestasVisitante +
    apuestasEmpate;
  
  
  const distribucion = {
  
    local:
      totalPronosticos === 0
        ? 0
        :
        Number(
          (
            (apuestasLocal / totalPronosticos) *
            100
          ).toFixed(1)
        ),
  
    visitante:
      totalPronosticos === 0
        ? 0
        :
        Number(
          (
            (apuestasVisitante / totalPronosticos) *
            100
          ).toFixed(1)
        ),
  
    empate:
      totalPronosticos === 0
        ? 0
        :
        Number(
          (
            (apuestasEmpate / totalPronosticos) *
            100
          ).toFixed(1)
        ),
  
  };
  
  
  let perfilRiesgo = {
    nivel: "Balanceado",
    descripcion:
      "Distribuye sus pronósticos entre diferentes resultados."
  };
  
  
  if (distribucion.local >= 60) {
  
    perfilRiesgo = {
      nivel: "Conservador",
      descripcion:
        "Confía principalmente en victorias locales."
    };
  
  }
  
  
  if (
    distribucion.visitante +
    distribucion.empate >= 40
  ) {
  
    perfilRiesgo = {
      nivel: "Arriesgado",
      descripcion:
        "Busca resultados menos esperados."
    };
  
  }
  
  
  const riesgo = {
    perfil: perfilRiesgo,
    distribucion
  };  

  
  // ===============================
  // DETECTOR DE SORPRESAS
  // ===============================
  
  let sorpresas = 0;
  
  
  for (const match of matches.filter(
    m => m.status === "finished"
  )) {
  
    const matchPredictions =
      await db
        .select()
        .from(predictionsTable)
        .where(
          eq(
            predictionsTable.matchId,
            match.id
          )
        );
  
  
    if (matchPredictions.length === 0)
      continue;
  
  
    let local = 0;
    let visitante = 0;
    let empate = 0;
  
  
    for (const prediction of matchPredictions) {
  
      if (
        prediction.homeScore! >
        prediction.awayScore!
      ) {
        local++;
      }
      else if (
        prediction.awayScore! >
        prediction.homeScore!
      ) {
        visitante++;
      }
      else {
        empate++;
      }
  
    }
  
  
    const total =
      local +
      visitante +
      empate;
  
  
    const resultadoReal =
      match.homeScore! >
      match.awayScore!
        ? "local"
        :
      match.awayScore! >
      match.homeScore!
        ? "visitante"
        :
        "empate";
  
  
    const elegidoPor =
      resultadoReal === "local"
        ? local
        :
      resultadoReal === "visitante"
        ? visitante
        :
        empate;
  
  
    const porcentaje =
      (elegidoPor / total) * 100;
  
  
    const miPrediccion =
      finishedPredictions.find(
        p => p.matchId === match.id
      );
  
  
    if (
      miPrediccion &&
      miPrediccion.points &&
      miPrediccion.points >= 3 &&
      porcentaje <= 20
    ) {
  
      sorpresas++;
  
    }
  
  }
  
  
  const detectorSorpresas = {
    aciertos: sorpresas
  };


  // ===============================
  // RESUMEN
  // ===============================

  const puntos = finishedPredictions.reduce(
    (sum, p) => sum + (p.points ?? 0),
    0
  );


  const exactos = finishedPredictions.filter(
    p => p.points === 5
  ).length;


  const aciertos = finishedPredictions.filter(
    p => p.points === 3
  ).length;


  const efectividad =
    finishedPredictions.length === 0
      ? 0
      : Number(
          (
            ((exactos + aciertos) /
              finishedPredictions.length) *
            100
          ).toFixed(1)
        );



  // ===============================
  // RACHAS
  // ===============================

  const partidosOrdenados = [...matches]
    .sort(
      (a, b) =>
        new Date(a.matchDate ?? 0).getTime() -
        new Date(b.matchDate ?? 0).getTime()
    );


  let candado = 0;
  let mejorCandado = 0;

  let farol = 0;
  let peorFarol = 0;


  for (const match of partidosOrdenados) {

    const prediction = predictions.find(
      p => p.matchId === match.id
    );


    if (!prediction) continue;


    if ((prediction.points ?? 0) >= 3) {

      candado++;

      if (candado > mejorCandado) {
        mejorCandado = candado;
      }

    } else {

      candado = 0;

    }


    if ((prediction.points ?? 0) === 0) {

      farol++;

      if (farol > peorFarol) {
        peorFarol = farol;
      }

    } else {

      farol = 0;

    }

  }






  // ===============================
  // MEJOR JORNADA
  // ===============================

  let cazadorPuntos = {
    jornada: 0,
    puntos: 0,
  };


  for (const jornada of jornadas) {

    const ids = matches
      .filter(
        m => m.jornadaId === jornada.id
      )
      .map(
        m => m.id
      );


    const puntosJornada = predictions
      .filter(
        p => ids.includes(p.matchId)
      )
      .reduce(
        (sum, p) => sum + (p.points ?? 0),
        0
      );


    if (puntosJornada > mejorJornada.puntos) {

      cazadorPuntos = {
        jornada: jornada.number,
        puntos: puntosJornada,
      };

    }

  }



  // ===============================
  // EQUIPOS
  // ===============================

  const equipos: Record<string, {
    partidos:number;
    aciertos:number;
  }> = {};


  for (const prediction of predictions) {

    const match = matches.find(
      m => m.id === prediction.matchId
    );


    if (!match) continue;


    const nombres = [
      match.homeTeam,
      match.awayTeam
    ];


    for (const equipo of nombres) {

      if (!equipos[equipo]) {
        equipos[equipo] = {
          partidos:0,
          aciertos:0
        };
      }


      equipos[equipo].partidos++;


      if ((prediction.points ?? 0) >= 3) {
        equipos[equipo].aciertos++;
      }

    }

  }


  const rendimientoEquipos =
    Object.entries(equipos)
      .filter(
        ([_, data]) =>
          data.partidos >= 3
      )
      .map(
        ([equipo, data]) => ({
          equipo,
          partidos:data.partidos,
          aciertos:data.aciertos,
          efectividad:
            Number(
              (
                (data.aciertos /
                data.partidos) *
                100
              ).toFixed(1)
            )
        })
      );


  rendimientoEquipos.sort(
    (a,b) =>
      b.efectividad -
      a.efectividad
  );


  const especialista =
    rendimientoEquipos[0] ?? null;


  const pesadilla =
    rendimientoEquipos.length > 0
      ? [...rendimientoEquipos]
          .sort(
            (a,b) =>
              a.efectividad -
              b.efectividad
          )[0]
      : null;



  return res.json({

    jugador:
      user.displayName,


    resumen:{
      puntos,
      exactos,
      aciertos,
      efectividad
    },


    logros:{
      candado: mejorCandado,
      farol: peorFarol,
      cazadorPuntos
    },


    equipos:{
      especialista,
      pesadilla
    },

    estilo,
    riesgo,
    detectorSorpresas

  });

});


export default router;
