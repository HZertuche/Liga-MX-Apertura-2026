import { useState, useMemo } from "react";
import { useGetMatchupStandings, useListJornadas, useListMatchups } from "@workspace/api-client-react";
import { Swords, ArrowUp, ArrowDown, Minus, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

function useMatchupsForJornada(jornadaId: number | null) {
  return useListMatchups({
    query: { enabled: !!jornadaId, queryKey: ["/api/matchups", { jornadaId }] },
    request: { query: { jornadaId: jornadaId || undefined } },
  } as any);
}

export default function MatchupStandings() {
  const { data: standings, isLoading, isError } = useGetMatchupStandings();
  const { data: jornadas } = useListJornadas();
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  // Default to first jornada
  const [selectedJornadaId, setSelectedJornadaId] = useState<number | null>(null);
  if (!selectedJornadaId && jornadas && jornadas.length > 0) {
    const active = jornadas.find(j => j.status === "active") || jornadas[0];
    setSelectedJornadaId(active.id);
  }

  const { data: matchups, isLoading: loadingMatchups } = useMatchupsForJornada(selectedJornadaId);

  const sortedStandings = useMemo(() => {
    if (!standings) return [];
    let sortableItems = [...standings];
    if (sortConfig !== null) {
      sortableItems.sort((a: any, b: any) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === "asc" ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [standings, sortConfig]);

  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "desc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "desc") direction = "asc";
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: string) =>
    !sortConfig || sortConfig.key !== key ? null : sortConfig.direction === "asc" ? " ↑" : " ↓";

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto">
        <div className="h-10 w-64 bg-muted rounded-md animate-pulse"></div>
        <div className="h-[600px] w-full bg-card rounded-xl border animate-pulse"></div>
      </div>
    );
  }

  if (isError || !standings) {
    return <div className="p-8 text-destructive">Error al cargar la tabla de enfrentamientos.</div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">

      {/* ── Emparejamientos de la jornada ── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <Swords className="h-6 w-6 text-blue-600" />
              Emparejamientos
            </h2>
            <p className="text-muted-foreground text-sm mt-0.5">¿Contra quién juegas esta jornada?</p>
          </div>
          <select
            className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            value={selectedJornadaId ?? ""}
            onChange={e => setSelectedJornadaId(Number(e.target.value))}
          >
            {jornadas?.map(j => (
              <option key={j.id} value={j.id}>{j.name}</option>
            ))}
          </select>
        </div>

        {loadingMatchups ? (
          <div className="p-8 text-center"><div className="animate-spin inline-block h-6 w-6 border-b-2 border-primary rounded-full"></div></div>
        ) : !matchups || matchups.length === 0 ? (
          <div className="text-center p-8 bg-card rounded-xl border border-dashed text-muted-foreground text-sm">
            Aún no se han generado los emparejamientos para esta jornada.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {matchups.map(matchup => {
              const isP1Winner = matchup.result === "player1_wins";
              const isP2Winner = matchup.result === "player2_wins";
              const isDraw = matchup.result === "draw";
              const hasResult = matchup.result !== null && matchup.result !== undefined;

              return (
                <div key={matchup.id} className="bg-card border rounded-xl p-4 flex flex-col gap-3 shadow-sm">
                  <div className="flex items-center justify-between w-full">
                    {/* Player 1 */}
                    <div className={cn(
                      "flex-1 text-center p-3 rounded-lg border",
                      isP1Winner ? "bg-green-100 border-green-200" :
                      (hasResult && !isDraw) ? "opacity-50" : "bg-background"
                    )}>
                      <p className={cn("font-bold text-sm truncate", isP1Winner && "text-green-800")}>
                        {matchup.player1DisplayName}
                      </p>
                      {hasResult && <p className="font-mono text-lg mt-0.5">{matchup.player1Points ?? "-"}</p>}
                    </div>

                    <div className="px-3 text-center shrink-0">
                      <Swords className="h-4 w-4 text-muted-foreground mx-auto mb-0.5" />
                      <span className="text-[10px] font-bold text-muted-foreground">VS</span>
                    </div>

                    {/* Player 2 */}
                    <div className={cn(
                      "flex-1 text-center p-3 rounded-lg border",
                      isP2Winner ? "bg-green-100 border-green-200" :
                      (hasResult && !isDraw) ? "opacity-50" : "bg-background"
                    )}>
                      <p className={cn("font-bold text-sm truncate", isP2Winner && "text-green-800")}>
                        {matchup.player2DisplayName}
                      </p>
                      {hasResult && <p className="font-mono text-lg mt-0.5">{matchup.player2Points ?? "-"}</p>}
                    </div>
                  </div>

                  {hasResult && (
                    <div className="text-center text-xs font-medium uppercase tracking-wider text-muted-foreground bg-muted/50 py-1 rounded">
                      {isDraw ? "Empate" : isP1Winner ? `Ganó ${matchup.player1DisplayName}` : `Ganó ${matchup.player2DisplayName}`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Tabla general de enfrentamientos ── */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Trophy className="h-6 w-6 text-blue-600" />
            Tabla General
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">Puntos obtenidos en duelos directos (V=3, E=1, D=0).</p>
        </div>

        <div className="bg-card rounded-xl border border-card-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border/50 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-4 py-4 text-center w-16 cursor-pointer hover:text-foreground" onClick={() => requestSort("position")}>
                    Pos{getSortIndicator("position")}
                  </th>
                  <th className="px-4 py-4 cursor-pointer hover:text-foreground" onClick={() => requestSort("displayName")}>
                    Jugador{getSortIndicator("displayName")}
                  </th>
                  <th className="px-4 py-4 text-center cursor-pointer hover:text-foreground" onClick={() => requestSort("wins")}>
                    V{getSortIndicator("wins")}
                  </th>
                  <th className="px-4 py-4 text-center cursor-pointer hover:text-foreground" onClick={() => requestSort("draws")}>
                    E{getSortIndicator("draws")}
                  </th>
                  <th className="px-4 py-4 text-center cursor-pointer hover:text-foreground" onClick={() => requestSort("losses")}>
                    D{getSortIndicator("losses")}
                  </th>
                  <th className="px-4 py-4 text-center cursor-pointer hover:text-foreground" onClick={() => requestSort("pointDiff")}>
                    Dif{getSortIndicator("pointDiff")}
                  </th>
                  <th className="px-4 py-4 text-right cursor-pointer hover:text-foreground font-bold text-foreground" onClick={() => requestSort("points")}>
                    Puntos{getSortIndicator("points")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {sortedStandings.map((row) => (
                  <tr key={row.userId} className={cn(
                    "hover:bg-muted/30 transition-colors",
                    row.position === 1 ? "bg-gradient-to-r from-blue-50/50 to-transparent" : ""
                  )}>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className={cn(
                          "font-display font-bold w-6 h-6 flex items-center justify-center rounded-full",
                          row.position === 1 ? "bg-blue-600 text-white" : "text-muted-foreground"
                        )}>
                          {row.position}
                        </span>
                        <span className="w-4 flex justify-center text-xs">
                          {row.positionChange > 0 ? <ArrowUp className="h-3 w-3 text-green-500" /> :
                           row.positionChange < 0 ? <ArrowDown className="h-3 w-3 text-destructive" /> :
                           <Minus className="h-3 w-3 text-muted-foreground/30" />}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "font-medium",
                        row.position === 1 ? "text-blue-700 dark:text-blue-400 font-bold" : "text-foreground/90"
                      )}>
                        {row.displayName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-green-600 dark:text-green-500 font-medium">{row.wins}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{row.draws}</td>
                    <td className="px-4 py-3 text-center text-destructive font-medium">{row.losses}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        "font-medium",
                        row.pointDiff > 0 ? "text-green-600" : row.pointDiff < 0 ? "text-destructive" : "text-muted-foreground"
                      )}>
                        {row.pointDiff > 0 ? `+${row.pointDiff}` : row.pointDiff}
                      </span>
                    </td>
                    <td className={cn(
                      "px-4 py-3 text-right font-mono font-bold text-base",
                      row.position === 1 ? "text-blue-700 dark:text-blue-400" : "text-foreground"
                    )}>
                      {row.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sortedStandings.length === 0 && (
              <div className="p-12 text-center text-muted-foreground">
                Aún no hay puntos registrados en la tabla de enfrentamientos.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
