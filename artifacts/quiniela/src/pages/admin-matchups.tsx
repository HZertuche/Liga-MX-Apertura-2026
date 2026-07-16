import { useState } from "react";
import { 
  useListJornadas, 
  useListMatchups, 
  useGenerateMatchups,
  useDeleteMatchup
} from "@workspace/api-client-react";
import { Swords, Wand2, Trash2, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

// Custom hook wrapper
function useMatchupsData(jornadaId: number | null) {
  return useListMatchups({
    query: {
      enabled: !!jornadaId,
      queryKey: ["/api/matchups", { jornadaId }]
    },
    request: { query: { jornadaId: jornadaId || undefined } }
  } as any);
}

export default function AdminMatchups() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: jornadas, isLoading: loadingJornadas } = useListJornadas();
  const [selectedJornadaId, setSelectedJornadaId] = useState<number | null>(null);
  
  if (!selectedJornadaId && jornadas && jornadas.length > 0) {
    const active = jornadas.find(j => j.status === 'active') || jornadas[0];
    setSelectedJornadaId(active.id);
  }

  const { data: matchups, isLoading: loadingMatchups } = useMatchupsData(selectedJornadaId);
  const generateMatchups = useGenerateMatchups();
  const deleteMatchup = useDeleteMatchup();

  const handleGenerate = () => {
    if (!selectedJornadaId) return;
    if (matchups && matchups.length > 0) {
      if (!confirm("Ya existen enfrentamientos para esta jornada. ¿Borrar los actuales y regenerar?")) return;
    }
    
    generateMatchups.mutate({ data: { jornadaId: selectedJornadaId } }, {
      onSuccess: () => {
        toast({ title: "Éxito", description: "Enfrentamientos generados correctamente." });
        queryClient.invalidateQueries({ queryKey: ["/api/matchups"] });
      },
      onError: (err) => {
        toast({ title: "Error", description: (err.data as any)?.error || "No se pudieron generar", variant: "destructive" });
      }
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm("¿Eliminar este enfrentamiento?")) return;
    deleteMatchup.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Eliminado" });
        queryClient.invalidateQueries({ queryKey: ["/api/matchups"] });
      }
    });
  };

  if (loadingJornadas) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center">
            <Swords className="h-8 w-8 mr-3 text-blue-600" />
            Admin: Enfrentamientos
          </h1>
          <p className="text-muted-foreground mt-1">Genera los duelos head-to-head (1 vs 1) para la jornada.</p>
        </div>
      </div>

      <div className="bg-card p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm">
        <label className="font-medium whitespace-nowrap">Seleccionar Jornada:</label>
        <select 
          className="w-full sm:max-w-xs px-3 py-2 border rounded-md focus:ring-1 focus:ring-primary bg-background"
          value={selectedJornadaId || ""}
          onChange={(e) => setSelectedJornadaId(Number(e.target.value))}
        >
          <option value="" disabled>Elige una jornada...</option>
          {jornadas?.map(j => (
            <option key={j.id} value={j.id}>{j.name} ({j.status})</option>
          ))}
        </select>
        
        <div className="sm:ml-auto">
          <button
            onClick={handleGenerate}
            disabled={!selectedJornadaId || generateMatchups.isPending}
            className="w-full sm:w-auto bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg font-medium flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <Wand2 className={cn("h-4 w-4 mr-2", generateMatchups.isPending && "animate-pulse")} />
            {generateMatchups.isPending ? "Generando..." : "Generar Aleatoriamente"}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {loadingMatchups ? (
          <div className="p-8 text-center"><div className="animate-spin inline-block h-6 w-6 border-b-2 border-primary"></div></div>
        ) : !selectedJornadaId ? (
          <div className="text-center p-12 bg-card rounded-xl border border-dashed text-muted-foreground">
            Selecciona una jornada para ver sus enfrentamientos.
          </div>
        ) : matchups?.length === 0 ? (
          <div className="text-center p-12 bg-card rounded-xl border border-dashed flex flex-col items-center">
            <ShieldAlert className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground max-w-md">
              No hay enfrentamientos generados. Usa el botón de arriba para emparejar a los jugadores al azar.
              (Si hay número impar, un jugador no tendrá duelo).
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matchups?.map(matchup => {
              // Determine visual winner if results are settled
              const isP1Winner = matchup.result === 'player1_wins';
              const isP2Winner = matchup.result === 'player2_wins';
              const isDraw = matchup.result === 'draw';
              const hasResult = matchup.result !== null && matchup.result !== undefined;

              return (
                <div key={matchup.id} className={cn(
                  "bg-card border rounded-xl p-4 flex flex-col gap-4 relative overflow-hidden transition-all shadow-sm",
                  hasResult && isDraw && "bg-slate-50 dark:bg-slate-900/20"
                )}>
                  <div className="flex justify-between items-center text-xs text-muted-foreground border-b pb-2 mb-2">
                    <span className="font-mono">ID: #{matchup.id}</span>
                    <button onClick={() => handleDelete(matchup.id)} className="text-destructive hover:bg-destructive/10 p-1 rounded transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between w-full">
                    {/* Player 1 */}
                    <div className={cn(
                      "flex-1 text-center p-3 rounded-lg border",
                      isP1Winner ? "bg-green-100 border-green-200 dark:bg-green-900/30 dark:border-green-800" : 
                      (hasResult && !isP1Winner && !isDraw) ? "opacity-50" : "bg-background"
                    )}>
                      <p className={cn("font-bold truncate text-base", isP1Winner && "text-green-800 dark:text-green-400")}>
                        {matchup.player1DisplayName}
                      </p>
                      <p className="font-mono text-xl mt-1">{matchup.player1Points ?? '-'}</p>
                    </div>

                    <div className="px-4 text-center shrink-0 flex flex-col items-center justify-center">
                      <Swords className="h-5 w-5 text-muted-foreground mb-1" />
                      <span className="text-xs font-bold text-muted-foreground">VS</span>
                    </div>

                    {/* Player 2 */}
                    <div className={cn(
                      "flex-1 text-center p-3 rounded-lg border",
                      isP2Winner ? "bg-green-100 border-green-200 dark:bg-green-900/30 dark:border-green-800" : 
                      (hasResult && !isP2Winner && !isDraw) ? "opacity-50" : "bg-background"
                    )}>
                      <p className={cn("font-bold truncate text-base", isP2Winner && "text-green-800 dark:text-green-400")}>
                        {matchup.player2DisplayName}
                      </p>
                      <p className="font-mono text-xl mt-1">{matchup.player2Points ?? '-'}</p>
                    </div>
                  </div>
                  
                  {hasResult && (
                    <div className="text-center text-xs font-medium uppercase tracking-wider text-muted-foreground bg-muted/50 py-1 rounded">
                      {isDraw ? "Empate" : isP1Winner ? "Ganó " + matchup.player1DisplayName : "Ganó " + matchup.player2DisplayName}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
