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
  // FRANCOTIRADOR
  // ===============================

  let francotirador = 0;
  let mejorFrancotirador = 0;


  for (const match of partidosOrdenados) {

    const prediction = predictions.find(
      p => p.matchId === match.id
    );


    if (!prediction) continue;


    if (prediction.points === 5) {

      francotirador++;

      if (francotirador > mejorFrancotirador) {
        mejorFrancotirador = francotirador;
      }

    } else {

      francotirador = 0;

    }

  }



  // ===============================
  // MEJOR JORNADA
  // ===============================

  let mejorJornada = {
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

      mejorJornada = {
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


    medallas:{
      candado: mejorCandado,
      francotirador: mejorFrancotirador,
      farol: peorFarol,
      mejorJornada
    },


    equipos:{
      especialista,
      pesadilla
    },

    estilo

  });

});


export default router;
