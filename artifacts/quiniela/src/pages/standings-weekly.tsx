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
        <div className="bg-card rounded-xl border border-card-border shadow-sm overflow-hidden">
      
          {/* Ganador */}
          {standings[0] && standings[0].totalPoints > 0 && (
            <div className="bg-yellow-100 dark:bg-yellow-900/30 border-b px-4 py-3 flex items-center">
              
              <Trophy className="h-5 w-5 text-yellow-600 mr-2" />
      
              <div>
                <p className="text-xs text-muted-foreground">
                  Ganador Jornada {selectedJornada?.number}
                </p>
      
                <p className="font-bold">
                  {standings[0].displayName}
                </p>
              </div>
      
              <span className="ml-auto font-bold">
                {standings[0].totalPoints} pts
              </span>
      
            </div>
          )}
      
      
          {/* Tabla móvil */}
          <table className="w-full text-xs">
      
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="py-2 text-center w-10">
                  #
                </th>
      
                <th className="py-2 text-left">
                  Jugador
                </th>
      
                <th className="py-2 text-center">
                  🎯
                </th>
      
                <th className="py-2 text-center">
                  ✅
                </th>
      
                <th className="py-2 text-center">
                  Pts
                </th>
              </tr>
            </thead>
      
      
            <tbody>
      
              {standings.map(row => (
      
                <tr
                  key={row.userId}
                  className={cn(
                    "border-b",
                    row.position === 1 &&
                    "bg-yellow-100 dark:bg-yellow-900/30"
                  )}
                >
      
                  <td className="py-2 text-center font-bold">
      
                    {row.position === 1
                      ? "🥇"
                      : row.position === 2
                      ? "🥈"
                      : row.position === 3
                      ? "🥉"
                      : row.position}
      
                  </td>
      
      
                  <td className="py-2 font-medium">
                    {row.displayName}
                  </td>
      
      
                  <td className="py-2 text-center">
                    {row.exactScores}
                  </td>
      
      
                  <td className="py-2 text-center">
                    {row.correctResults}
                  </td>
      
      
                  <td className="py-2 text-center font-bold">
                    {row.totalPoints}
                  </td>
      
      
                </tr>
      
              ))}
      
            </tbody>
      
      
          </table>
      
        </div>
      )}
    </div>
  );
}
