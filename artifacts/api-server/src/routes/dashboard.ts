import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, jornadasTable, matchesTable, predictionsTable, matchupsTable, standingsHistoryTable} from "@workspace/db";
import { eq, count, and, gte, lte } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

// GET /api/dashboard
router.get("/dashboard", requireAuth, async (_req, res) => {
  // Total players
  const [{ count: totalPlayers }] = await db.select({ count: count() }).from(usersTable);

  // Match counts
  const allMatches = await db.select().from(matchesTable);
  const playedMatches = allMatches.filter(m => m.status === "finished").length;
  const pendingMatches = allMatches.filter(m => m.status === "pending").length;

  // Current jornada (most recently active or first upcoming)
  const jornadas = await db.select().from(jornadasTable).orderBy(jornadasTable.number);
  const activeJornada = jornadas.find(j => j.status === "active");
  const upcomingJornada = jornadas.find(j => j.status === "upcoming");
  const currentJornada = activeJornada?.number ?? upcomingJornada?.number ?? null;

  // Upcoming matches (next 10 pending)
  const upcomingMatchesRaw = allMatches
    .filter(m => m.status === "pending" && m.matchDate !== null)
    .sort((a, b) => new Date(a.matchDate!).getTime() - new Date(b.matchDate!).getTime())
    .slice(0, 10);

  const upcomingMatches = upcomingMatchesRaw.map(m => {
    const jornada = jornadas.find(j => j.id === m.jornadaId);
    return {
      id: m.id,
      jornadaId: m.jornadaId,
      jornadaNumber: jornada?.number ?? 0,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      homeTeamLogo: m.homeTeamLogo ?? null,
      awayTeamLogo: m.awayTeamLogo ?? null,
      matchDate: m.matchDate ? m.matchDate.toISOString() : null,
      stadium: m.stadium ?? null,
      isLocked: m.isLocked,
    };
  });

  // General standings for top 3
  const players = await db.select().from(usersTable);
  const finishedMatches = allMatches.filter(m => m.status === "finished");
  const allPredictions = await db.select().from(predictionsTable);  
  const standingsHistory: any[] = [];
  

  const generalRows = players.map(player => {
    const preds = allPredictions.filter(p => p.userId === player.id);
    const totalPoints = preds.reduce((sum, p) => {
      const match = finishedMatches.find(m => m.id === p.matchId);
      return sum + (match ? (p.points ?? 0) : 0);
    }, 0);
    return { userId: player.id, displayName: player.displayName, points: totalPoints };
  }).sort((a, b) => b.points - a.points);

  const top3General = generalRows.slice(0, 3).map((r, i) => ({ position: i + 1, ...r }));
  const zonaDescenso = generalRows
    .slice(-3)
    .map((r, i) => ({
      position: generalRows.length - 2 + i,
      ...r
    }));  
  const generalLeader = top3General[0]?.displayName ?? null;

  // Matchup standings for top 3
  const allMatchups = await db.select().from(matchupsTable);
  const matchupRows = players.map(player => {
    const asP1 = allMatchups.filter(m => m.player1Id === player.id);
    const asP2 = allMatchups.filter(m => m.player2Id === player.id);
    const points = asP1.reduce((s, m) => s + (m.player1MatchupPoints ?? 0), 0)
                 + asP2.reduce((s, m) => s + (m.player2MatchupPoints ?? 0), 0);
    return { userId: player.id, displayName: player.displayName, points };
  }).sort((a, b) => b.points - a.points);

  const top3Matchups = matchupRows.slice(0, 3).map((r, i) => ({ position: i + 1, ...r }));
  const matchupLeader = top3Matchups[0]?.displayName ?? null;

  
  // ============================
  // ÚLTIMA HORA
  // ============================

  const ultimasNoticias: {
    icono: string;
    texto: string;
  }[] = [];  
  
  
  // Líder General

  if (top3General.length > 0) {

    ultimasNoticias.push({
      icono: "👑",
      texto: `${top3General[0].displayName} lidera la tabla general con ${top3General[0].points} puntos.`
    });

  }

    // Última jornada terminada

  const jornadasTerminadas = jornadas
    .filter(j => j.status === "finished")
    .sort((a, b) => b.number - a.number);

  if (jornadasTerminadas.length > 0) {

    const ultima = jornadasTerminadas[0];

    const partidos = finishedMatches.filter(
      m => m.jornadaId === ultima.id
    );

    const ids = partidos.map(p => p.id);

    const ganador = players
      .map(player => {

        const puntos = allPredictions
          .filter(p => p.userId === player.id && ids.includes(p.matchId))
          .reduce((s, p) => s + (p.points ?? 0), 0);

        return {
          nombre: player.displayName,
          puntos
        };

      })
      .sort((a, b) => b.puntos - a.puntos)[0];

    if (ganador) {

      ultimasNoticias.push({

        icono: "🏆",

        texto: `${ganador.nombre} ganó la Jornada ${ultima.number} con ${ganador.puntos} puntos.`

      });

    }

  }

   /* // Cambios de posiciones usando standings history
    
    const ultimaJornadaHistory = standingsHistory
      .sort((a,b) => b.jornadaId - a.jornadaId)
      .slice(0, players.length);
    
    
    if (ultimaJornadaHistory.length > 0) {
    
      const cambios = players.map(player => {
    
        const actual = standingsHistory
          .filter(h => h.userId === player.id)
          .sort((a,b)=> b.jornadaId - a.jornadaId)[0];
    
    
        const anterior = standingsHistory
          .filter(h => h.userId === player.id)
          .sort((a,b)=> b.jornadaId - a.jornadaId)[1];
    
    
        if (!actual || !anterior) return null;
    
    
        return {
          nombre: player.displayName,
          cambio: anterior.position - actual.position,
          posicion: actual.position
        };
    
      }).filter(Boolean);
    
    
      const subida = cambios
        .filter(c => c!.cambio > 0)
        .sort((a,b)=> b!.cambio - a!.cambio)[0];
    
    
      if(subida){
    
        ultimasNoticias.push({
          icono:"🚀",
          texto:
          `${subida.nombre} subió ${subida.cambio} posiciones y ahora está en el lugar ${subida.posicion}.`
        });
    
      }
    
    }  */




  
  res.json({
    totalPlayers: Number(totalPlayers),
    currentJornada,
    playedMatches,
    pendingMatches,
    generalLeader,
    matchupLeader,
    upcomingMatches,
    top3General,
    top3Matchups,
    ultimasNoticias,
    zonaDescenso,
  });
});

export default router;
