import { useState } from "react";
import { useListJornadas, useListUsers, useListPredictions, useListMatches } from "@workspace/api-client-react";
import { formatDate } from "@/lib/format";

export default function AdminPredictions() {
  const [jornadaId, setJornadaId] = useState<number | null>(null);

  const { data: jornadas } = useListJornadas();
  const { data: users } = useListUsers();
  const { data: matches } = useListMatches(
    jornadaId ? { jornadaId } : {},
    { query: { enabled: !!jornadaId } }
  );
  const { data: predictions, isLoading } = useListPredictions(
    jornadaId ? { jornadaId } : {},
    { query: { enabled: !!jornadaId } }
  );

  // Build lookup: predsByMatchAndUser[matchId][userId] = {homeScore, awayScore}
  const predsByMatchAndUser: Record<number, Record<number, { homeScore: number | null; awayScore: number | null }>> = {};
  for (const p of predictions ?? []) {
    if (!predsByMatchAndUser[p.matchId]) predsByMatchAndUser[p.matchId] = {};
    predsByMatchAndUser[p.matchId][p.userId] = { homeScore: p.homeScore, awayScore: p.awayScore };
  }

  const sortedMatches = [...(matches ?? [])].sort((a, b) => {
    if (!a.matchDate) return 1;
    if (!b.matchDate) return -1;
    return new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime();
  });

  const sortedUsers = [...(users ?? [])].sort((a, b) => a.displayName.localeCompare(b.displayName));

  const selectedJornada = jornadas?.find(j => j.id === jornadaId);

  // Count how many predictions each user submitted
  const submittedCount = (userId: number) =>
    sortedMatches.filter(m => predsByMatchAndUser[m.id]?.[userId] !== undefined).length;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-full">
      <div>
        <h1 className="text-2xl font-bold">Quinielas por Jornada</h1>
        <p className="text-muted-foreground text-sm mt-1">Revisa lo que pronosticó cada participante</p>
      </div>

      {/* Jornada selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium whitespace-nowrap">Jornada:</label>
        <select
          className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          value={jornadaId ?? ""}
          onChange={e => setJornadaId(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">-- Selecciona --</option>
          {jornadas?.map(j => (
            <option key={j.id} value={j.id}>
              Jornada {j.number} — {j.name}
            </option>
          ))}
        </select>
      </div>

      {!jornadaId && (
        <div className="text-center py-16 text-muted-foreground">
          Selecciona una jornada para ver las quinielas
        </div>
      )}

      {jornadaId && isLoading && (
        <div className="text-center py-16 text-muted-foreground">Cargando…</div>
      )}

      {jornadaId && !isLoading && sortedMatches.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          No hay partidos capturados en esta jornada
        </div>
      )}

      {jornadaId && !isLoading && sortedMatches.length > 0 && (
        <>
          {/* Summary chips: who submitted */}
          <div className="flex flex-wrap gap-2">
            {sortedUsers.map(u => {
              const count = submittedCount(u.id);
              const total = sortedMatches.length;
              const done = count === total;
              const partial = count > 0 && count < total;
              return (
                <span
                  key={u.id}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium
                    ${done ? "bg-green-100 text-green-800" : partial ? "bg-yellow-100 text-yellow-800" : "bg-muted text-muted-foreground"}`}
                >
                  {u.displayName}
                  <span className="opacity-70">{count}/{total}</span>
                </span>
              );
            })}
          </div>

          {/* Predictions grid */}
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left p-3 font-semibold border-b sticky left-0 bg-muted/50 min-w-[200px]">
                    Partido
                  </th>
                  <th className="text-left p-3 font-semibold border-b text-muted-foreground text-xs min-w-[140px]">
                    Horario
                  </th>
                  {sortedUsers.map(u => (
                    <th key={u.id} className="text-center p-3 font-semibold border-b min-w-[100px]">
                      <div>{u.displayName}</div>
                      {u.role === "admin" && (
                        <div className="text-[10px] font-normal text-muted-foreground">admin</div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedMatches.map((match, i) => {
                  const hasResult = match.homeScore !== null && match.awayScore !== null;
                  return (
                    <tr key={match.id} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                      {/* Match */}
                      <td className="p-3 border-b sticky left-0 bg-inherit font-medium">
                        <span>{match.homeTeam}</span>
                        <span className="text-muted-foreground mx-1.5">vs</span>
                        <span>{match.awayTeam}</span>
                        {hasResult && (
                          <div className="text-xs text-primary font-semibold mt-0.5">
                            Resultado: {match.homeScore} – {match.awayScore}
                          </div>
                        )}
                      </td>
                      {/* Date */}
                      <td className="p-3 border-b text-muted-foreground text-xs">
                        {formatDate(match.matchDate)}
                      </td>
                      {/* Each user's prediction */}
                      {sortedUsers.map(u => {
                        const pred = predsByMatchAndUser[match.id]?.[u.id];
                        const submitted = pred !== undefined;
                        const hasScore = submitted && pred.homeScore !== null && pred.awayScore !== null;

                        // If result exists, determine outcome color
                        let outcomeClass = "";
                        if (hasResult && hasScore) {
                          const realHome = match.homeScore!;
                          const realAway = match.awayScore!;
                          const predHome = pred.homeScore!;
                          const predAway = pred.awayScore!;
                          if (predHome === realHome && predAway === realAway) {
                            outcomeClass = "bg-green-100 text-green-800 font-semibold"; // exact
                          } else if (
                            (predHome > predAway && realHome > realAway) ||
                            (predHome < predAway && realHome < realAway) ||
                            (predHome === predAway && realHome === realAway)
                          ) {
                            outcomeClass = "bg-blue-100 text-blue-800"; // correct outcome
                          } else {
                            outcomeClass = "bg-red-100 text-red-800"; // wrong
                          }
                        }

                        return (
                          <td key={u.id} className="p-3 border-b text-center">
                            {!submitted ? (
                              <span className="text-muted-foreground/40">—</span>
                            ) : !hasScore ? (
                              <span className="text-muted-foreground/60 text-xs">sin marcador</span>
                            ) : (
                              <span className={`px-2 py-0.5 rounded text-sm ${outcomeClass || "text-foreground"}`}>
                                {pred.homeScore} – {pred.awayScore}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-muted-foreground">
            <span className="inline-block w-3 h-3 rounded bg-green-100 mr-1 align-middle" />Exacto (5 pts)
            <span className="inline-block w-3 h-3 rounded bg-blue-100 ml-3 mr-1 align-middle" />Resultado correcto (3 pts)
            <span className="inline-block w-3 h-3 rounded bg-red-100 ml-3 mr-1 align-middle" />Incorrecto (0 pts)
          </p>
        </>
      )}
    </div>
  );
}
