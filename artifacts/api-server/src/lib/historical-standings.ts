import { Match, Prediction, User } from "@workspace/db";

export function calculateDailyLeaders(
  users: User[],
  matches: Match[],
  predictions: Prediction[],
) {

  // Solo partidos finalizados con fecha
  const finishedMatches = matches
    .filter(
      (m) => m.status === "finished" && m.matchDate
    )
    .sort(
      (a, b) =>
        a.matchDate!.getTime() - b.matchDate!.getTime()
    );

  // Agrupar partidos por día
  const matchesByDay = new Map<string, Match[]>();

  for (const match of finishedMatches) {

    const day = match.matchDate!
      .toISOString()
      .split("T")[0];

    const list = matchesByDay.get(day);

    if (list) {
      list.push(match);
    } else {
      matchesByDay.set(day, [match]);
    }

  }

  const leaders: {
    fecha: string;
    jugador: string;
    puntos: number;
  }[] = [];

  // Partidos que ya se han disputado hasta ese día
  const playedMatchIds = new Set<number>();

  // Recorremos día por día
  for (const [day, dayMatches] of matchesByDay) {

    // Agregamos todos los partidos jugados ese día
    for (const match of dayMatches) {
      playedMatchIds.add(match.id);
    }

    // Construimos la tabla general acumulada
    const standings = users.map((user) => {

      const totalPoints = predictions
        .filter(
          (p) =>
            p.userId === user.id &&
            playedMatchIds.has(p.matchId)
        )
        .reduce(
          (sum, p) => sum + (p.points ?? 0),
          0
        );

      return {
        jugador: user.displayName,
        puntos: totalPoints,
      };

    });

    // Ordenamos la tabla
    standings.sort((a, b) => {

      if (b.puntos !== a.puntos) {
        return b.puntos - a.puntos;
      }

      return a.jugador.localeCompare(b.jugador);

    });

    // Guardamos quién terminó líder ese día
    leaders.push({
      fecha: day,
      jugador: standings[0].jugador,
      puntos: standings[0].puntos,
    });

  }

  return leaders;

}
