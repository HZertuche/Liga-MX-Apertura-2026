/**
 * Calculate points for a prediction given the official match result.
 * 5 pts = exact score, 3 pts = correct result (win/draw/loss), 0 pts = wrong
 */
export function calculatePoints(
  predHome: number | null,
  predAway: number | null,
  realHome: number,
  realAway: number,
): number {
  if (predHome === null || predAway === null) return 0;

  // Exact score
  if (predHome === realHome && predAway === realAway) return 5;

  // Correct result
  const predResult = Math.sign(predHome - predAway); // 1 = home win, -1 = away win, 0 = draw
  const realResult = Math.sign(realHome - realAway);
  if (predResult === realResult) return 3;

  return 0;
}

/**
 * Given two players' total prediction points for a jornada,
 * return [player1MatchupPoints, player2MatchupPoints]
 */
export function calculateMatchupPoints(p1: number, p2: number): [number, number] {
  if (p1 > p2) return [3, 0];
  if (p2 > p1) return [0, 3];
  return [1, 1];
}

/**
 * Determine matchup result string
 */
export function matchupResult(p1: number, p2: number): "player1_wins" | "player2_wins" | "draw" {
  if (p1 > p2) return "player1_wins";
  if (p2 > p1) return "player2_wins";
  return "draw";
}
