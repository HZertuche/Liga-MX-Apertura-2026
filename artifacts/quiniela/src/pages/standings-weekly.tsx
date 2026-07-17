import { useState } from "react";
import { useListJornadas } from "@workspace/api-client-react";
import { Star, Trophy, Target, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

type WeeklyRow = {
  position: number;
  userId: number;
  displayName: string;
  exactScores: number;
  correctResults: number;
  totalPoints: number;
};

function useWeeklyStandings(jornadaId: number | null) {
  return useQuery<WeeklyRow[]>({
    queryKey: ["/api/standings/weekly", jornadaId],
    queryFn: async () => {
      const url = `/api/standings/weekly${jornadaId ? `?jornadaId=${jornadaId}` : ""}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Error al cargar la tabla semanal");
      return res.json();
    },
    enabled: !!jornadaId,
  });
}

export default function WeeklyStandings() {
  const { data: jornadas } = useListJornadas();
  const [selectedJornadaId, setSelectedJornadaId] = useState<number | null>(null);

  if (!selectedJornadaId && jornadas && jornadas.length > 0) {
    const active = jornadas.find(j => j.status === "active") || jornadas[jornadas.length - 1];
    setSelectedJornadaId(active.id);
  }

  const { data: standings, isLoading, isError } = useWeeklyStandings(selectedJornadaId);
  const selectedJornada = jornadas?.find(j => j.id === selectedJornadaId);

  const maxPoints = standings && standings.length > 0 ? standings[0].totalPoints : 0;

  if (isLoading && selectedJornadaId) {
    return (
      <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto">
        <div className="h-10 w-64 bg-muted rounded-md animate-pulse" />
        <div className="h-96 w-full bg-card rounded-xl border animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <Star className="h-8 w-8 text-yellow-500" />
            Premio Semanal
          </h1>
          <p className="text-muted-foreground mt-1">
            Puntos de quiniela por jornada — se reinicia cada semana.
          </p>
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

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-green-500" />
          Marcador exacto (5 pts)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-blue-500" />
          Resultado correcto (3 pts)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-muted-foreground/30" />
          Incorrecto (0 pts)
        </span>
      </div>

      {/* Error state */}
      {isError && (
        <div className="p-8 text-destructive">Error al cargar la tabla semanal.</div>
      )}

      {/* No results yet */}
      {!isLoading && standings && standings.every(r => r.totalPoints === 0) && (
        <div className="text-center p-12 bg-card rounded-xl border border-dashed text-muted-foreground">
          <Trophy className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p>Aún no hay resultados capturados para {selectedJornada?.name ?? "esta jornada"}.</p>
          <p className="text-sm mt-1">La tabla se actualizará conforme se ingresen los marcadores finales.</p>
        </div>
      )}

      {/* Standings table */}
      {standings && standings.some(r => r.totalPoints > 0) && (
        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
          {/* Winner banner */}
          {standings[0] && standings[0].totalPoints > 0 && (
            <div className="bg-gradient-to-r from-yellow-400/20 to-amber-300/10 border-b border-yellow-200 px-5 py-3 flex items-center gap-3">
              <Trophy className="h-5 w-5 text-yellow-600 shrink-0" />
              <span className="font-semibold text-yellow-800">
                Líder: {standings[0].displayName}
              </span>
              <span className="ml-auto font-mono font-bold text-yellow-700 text-lg">
                {standings[0].totalPoints} pts
              </span>
            </div>
          )}

          <div className="divide-y divide-border/50">
            {standings.map((row, idx) => {
              const isLeader = row.position === 1 && row.totalPoints > 0;
              const barPct = maxPoints > 0 ? (row.totalPoints / maxPoints) * 100 : 0;

              return (
                <div
                  key={row.userId}
                  className={cn(
                    "px-5 py-4 flex items-center gap-4 transition-colors hover:bg-muted/30",
                    isLeader && "bg-yellow-50/50"
                  )}
                >
                  {/* Position */}
                  <div className="w-8 shrink-0 flex items-center justify-center">
                    {isLeader ? (
                      <span className="w-7 h-7 flex items-center justify-center rounded-full bg-yellow-400 text-white font-bold text-sm">
                        1
                      </span>
                    ) : (
                      <span className="text-muted-foreground font-semibold text-sm">{row.position}</span>
                    )}
                  </div>

                  {/* Name + bar */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn("font-semibold truncate", isLeader && "text-yellow-800")}>
                        {row.displayName}
                      </span>
                      <span className={cn("font-mono font-bold text-base ml-3 shrink-0", isLeader ? "text-yellow-700" : "text-foreground")}>
                        {row.totalPoints} pts
                      </span>
                    </div>
                    {/* Points bar */}
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", isLeader ? "bg-yellow-400" : "bg-primary/60")}
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                    {/* Breakdown */}
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        {row.exactScores} exactos
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="h-3 w-3 text-blue-500" />
                        {row.correctResults} resultado
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
