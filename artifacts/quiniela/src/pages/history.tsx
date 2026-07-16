import { useGetPlayerHistory, getGetPlayerHistoryQueryKey } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { History, ChevronLeft, Target, Award, Percent, Swords, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PlayerHistory() {
  const params = useParams();
  const userId = Number(params.userId);

  const { data: history, isLoading, isError } = useGetPlayerHistory(userId, {
    query: { enabled: !!userId, queryKey: getGetPlayerHistoryQueryKey(userId) }
  });

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
        <div className="h-10 w-64 bg-muted rounded-md animate-pulse"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse"></div>)}
        </div>
        <div className="h-64 w-full bg-card rounded-xl border animate-pulse mt-8"></div>
      </div>
    );
  }

  if (isError || !history) {
    return <div className="p-8 text-destructive">Error al cargar el historial del jugador.</div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <Link href="/standings/general" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-2">
        <ChevronLeft className="h-4 w-4 mr-1" />
        Volver a Posiciones
      </Link>

      <div className="flex items-center gap-4">
        <div className="h-16 w-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-display font-bold text-2xl shadow-sm">
          {history.displayName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">{history.displayName}</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <History className="h-4 w-4" /> Historial de Temporada
          </p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div className="bg-card p-4 rounded-xl border border-card-border shadow-sm flex flex-col justify-between">
          <div className="text-muted-foreground text-sm font-medium flex items-center gap-2 mb-2">
            <Award className="h-4 w-4" /> Pts. General
          </div>
          <div className="text-2xl font-display font-bold">{history.totalPoints}</div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-card-border shadow-sm flex flex-col justify-between">
          <div className="text-muted-foreground text-sm font-medium flex items-center gap-2 mb-2">
            <Swords className="h-4 w-4" /> Pts. Enfrent.
          </div>
          <div className="text-2xl font-display font-bold">{history.totalMatchupPoints}</div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-card-border shadow-sm flex flex-col justify-between">
          <div className="text-muted-foreground text-sm font-medium flex items-center gap-2 mb-2">
            <Target className="h-4 w-4" /> Exactos (3p)
          </div>
          <div className="text-2xl font-display font-bold">{history.exactScores}</div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-card-border shadow-sm flex flex-col justify-between">
          <div className="text-muted-foreground text-sm font-medium flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4" /> Aciertos (1p)
          </div>
          <div className="text-2xl font-display font-bold">{history.correctResults}</div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-card-border shadow-sm flex flex-col justify-between col-span-2 md:col-span-4 lg:col-span-1">
          <div className="text-muted-foreground text-sm font-medium flex items-center gap-2 mb-2">
            <Percent className="h-4 w-4" /> Efectividad
          </div>
          <div className="text-2xl font-display font-bold text-primary">{history.accuracy}%</div>
        </div>
      </div>

      {/* Jornada by Jornada Breakdown */}
      <div className="space-y-4">
        <h2 className="text-xl font-display font-bold">Desglose por Jornada</h2>
        <div className="bg-card rounded-xl border border-card-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border/50 text-xs">
                <tr>
                  <th className="px-4 py-3">Jornada</th>
                  <th className="px-4 py-3 text-center">Pts General</th>
                  <th className="px-4 py-3 text-center">Exactos</th>
                  <th className="px-4 py-3 text-center">Aciertos</th>
                  <th className="px-4 py-3">Rival</th>
                  <th className="px-4 py-3 text-center">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {history.jornadaSummaries.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No hay actividad registrada aún.</td></tr>
                ) : (
                  history.jornadaSummaries.map((js) => (
                    <tr key={js.jornadaId} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">Jornada {js.jornadaNumber}</td>
                      <td className="px-4 py-3 text-center font-bold text-primary">+{js.points}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{js.exactScores}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{js.correctResults}</td>
                      <td className="px-4 py-3">
                        {js.matchupOpponent ? (
                          <span className="font-medium">{js.matchupOpponent}</span>
                        ) : (
                          <span className="text-muted-foreground/50 italic">Sin rival</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {js.matchupResult ? (
                          <span className={cn(
                            "px-2.5 py-1 rounded text-xs font-bold",
                            js.matchupResult === 'win' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                            js.matchupResult === 'draw' ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" :
                            "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          )}>
                            {js.matchupResult === 'win' ? 'VICTORIA' : js.matchupResult === 'draw' ? 'EMPATE' : 'DERROTA'}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
