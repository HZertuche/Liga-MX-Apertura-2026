import { Match, Prediction, User } from "@workspace/db";

export function calculateDailyLeaders(
  users: User[],
  matches: Match[],
  predictions: Prediction[],
) {

  // Solo partidos terminados
  const finishedMatches = matches
    .filter(
      m =>
        m.status === "finished" &&
        m.matchDate
    )
    .sort(
      (a, b) =>
        a.matchDate!.getTime() -
        b.matchDate!.getTime()
    );

  // Agrupar partidos por día
  const matchesByDay = new Map<string, Match[]>();

  for (const match of finishedMatches) {

    const day =
      match.matchDate!
        .toISOString()
        .split("T")[0];

    const list = matchesByDay.get(day);

    if (list) {

      list.push(match);

    } else {

      matchesByDay.set(day, [match]);

    }

  }

  return matchesByDay;

}
