import { useState } from "react";
import { 
  useListJornadas, 
  useListMatches, 
  useCreateMatch,
  useSetMatchResult,
  useUpdateMatch,
  useDeleteMatch,
  useRecalculateAll
} from "@workspace/api-client-react";
import { CalendarDays, Plus, RefreshCw, AlertTriangle, Save, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// Helper hook pattern wrapper due to API client constraints

function useMatchData(jornadaId: number | null) {
  return useListMatches(
    jornadaId ? { jornadaId } : {},
    { query: { enabled: !!jornadaId } }
  );
}

const LIGA_MX_TEAMS = [
  "América", "Atlas", "Atlante", "Atlético San Luis", "Cruz Azul", "Guadalajara",
  "Juárez", "León", "Monterrey", "Necaxa",
  "Pachuca", "Puebla", "Pumas UNAM", "Querétaro", "Santos Laguna",
  "Tigres UANL", "Tijuana", "Toluca"
];

export default function AdminMatches() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: jornadas, isLoading: loadingJornadas } = useListJornadas();
  
  // Try to default to current active jornada, or first available
  const [selectedJornadaId, setSelectedJornadaId] = useState<number | null>(null);
  
  // Set default when loaded
  if (!selectedJornadaId && jornadas && jornadas.length > 0) {
    const active = jornadas.find(j => j.status === 'active') || jornadas[0];
    setSelectedJornadaId(active.id);
  }

  const { data: matches, isLoading: loadingMatches } = useMatchData(selectedJornadaId);
  
  const createMatch = useCreateMatch();
  const setMatchResult = useSetMatchResult();
  const deleteMatch = useDeleteMatch();
  const recalculate = useRecalculateAll();

  // Create Form State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [homeTeam, setHomeTeam] = useState(LIGA_MX_TEAMS[0]);
  const [awayTeam, setAwayTeam] = useState(LIGA_MX_TEAMS[1]);
  const [matchDate, setMatchDate] = useState("");
  const [stadium, setStadium] = useState("");

  // Result Forms State (matchId -> { homeScore, awayScore, status })
  const [resultForms, setResultForms] = useState<Record<number, { homeScore: string, awayScore: string, status: string }>>({});

  const handleInitResultForm = (matchId: number, match: any) => {
    setResultForms(prev => ({
      ...prev,
      [matchId]: {
        homeScore: match.homeScore !== null ? String(match.homeScore) : "",
        awayScore: match.awayScore !== null ? String(match.awayScore) : "",
        status: match.status === 'pending' ? 'live' : match.status // default next status
      }
    }));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJornadaId) return;
    if (homeTeam === awayTeam) {
      toast({ title: "Error", description: "Un equipo no puede jugar contra sí mismo", variant: "destructive" });
      return;
    }

    createMatch.mutate({
      data: {
        jornadaId: selectedJornadaId,
        homeTeam,
        awayTeam,
        // Append Mexico City offset so the entered time is stored correctly
        matchDate: matchDate ? `${matchDate}:00-06:00` : null,
        stadium: stadium || null
      }
    }, {
      onSuccess: () => {
        toast({ title: "Partido agregado" });
        setIsCreateOpen(false);
        queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
        queryClient.invalidateQueries({ queryKey: ["/api/jornadas"] }); // Updates matchCount
        // Reset parts of form
        setMatchDate("");
        setStadium("");
      },
      onError: (err) => toast({ title: "Error", description: (err.data as any)?.error || "No se pudo agregar", variant: "destructive" })
    });
  };

  const handleSaveResult = (matchId: number) => {
    const form = resultForms[matchId];
    if (!form) return;
    if (form.homeScore === "" || form.awayScore === "") {
      toast({ title: "Error", description: "Debes ingresar ambos marcadores", variant: "destructive" });
      return;
    }

    setMatchResult.mutate({
      id: matchId,
      data: {
        homeScore: parseInt(form.homeScore, 10),
        awayScore: parseInt(form.awayScore, 10),
        status: form.status as 'live' | 'finished'
      }
    }, {
      onSuccess: () => {
        toast({ title: "Resultado guardado" });
        queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
        // Clear form state to hide it
        setResultForms(prev => {
          const newState = { ...prev };
          delete newState[matchId];
          return newState;
        });
      },
      onError: (err) => toast({ title: "Error", description: (err.data as any)?.error || "No se pudo guardar", variant: "destructive" })
    });
  };

  const handleDelete = (matchId: number) => {
    if (!confirm("¿Eliminar este partido? Se perderán todos los pronósticos asociados.")) return;
    deleteMatch.mutate({ id: matchId }, {
      onSuccess: () => {
        toast({ title: "Partido eliminado" });
        queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
        queryClient.invalidateQueries({ queryKey: ["/api/jornadas"] });
      }
    });
  };

  const handleRecalculate = () => {
    if (!confirm("Esto recalculará todos los puntos y posiciones de todos los jugadores basándose en los resultados actuales. Puede tardar unos segundos. ¿Continuar?")) return;
    
    recalculate.mutate(undefined, {
      onSuccess: (res) => {
        toast({ title: "Recálculo completado", description: res.message });
      },
      onError: () => toast({ title: "Error", description: "Falló el recálculo masivo", variant: "destructive" })
    });
  };

  if (loadingJornadas) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center">
            <CalendarDays className="h-8 w-8 mr-3 text-primary" />
            Admin: Partidos y Resultados
          </h1>
          <p className="text-muted-foreground mt-1">Ingresa partidos por jornada y actualiza los marcadores reales.</p>
        </div>
        <button
          onClick={handleRecalculate}
          disabled={recalculate.isPending}
          className="bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800 px-4 py-2 rounded-lg font-medium flex items-center transition-colors shrink-0"
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", recalculate.isPending && "animate-spin")} />
          Forzar Recálculo General
        </button>
      </div>

      {/* Jornada Selector */}
      <div className="bg-card p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center gap-4">
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
            onClick={() => setIsCreateOpen(true)}
            disabled={!selectedJornadaId}
            className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg font-medium flex items-center justify-center disabled:opacity-50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Partido
          </button>
        </div>
      </div>

      {/* Matches List */}
      <div className="space-y-4">
        {loadingMatches ? (
          <div className="p-8 text-center"><div className="animate-spin inline-block h-6 w-6 border-b-2 border-primary"></div></div>
        ) : !selectedJornadaId ? (
          <div className="text-center p-12 bg-card rounded-xl border border-dashed text-muted-foreground">
            Selecciona una jornada arriba para ver sus partidos.
          </div>
        ) : matches?.length === 0 ? (
          <div className="text-center p-12 bg-card rounded-xl border border-dashed text-muted-foreground">
            No hay partidos programados para esta jornada.
          </div>
        ) : (
          matches?.map(match => (
            <div key={match.id} className="bg-card border rounded-xl overflow-hidden shadow-sm">
              <div className="flex justify-between items-center bg-muted/30 px-4 py-2 border-b text-xs text-muted-foreground">
                <div>
                  <span className="font-medium text-foreground">{formatDate(match.matchDate)}</span>
                  <span className="ml-2">{match.stadium}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "font-bold px-2 py-0.5 rounded",
                    match.status === 'finished' ? "bg-primary/10 text-primary" :
                    match.status === 'live' ? "bg-red-100 text-red-600 animate-pulse" : "bg-muted text-foreground"
                  )}>
                    {match.status.toUpperCase()}
                  </span>
                  <button onClick={() => handleDelete(match.id)} className="text-destructive hover:bg-destructive/10 p-1 rounded">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                {/* Match Info */}
                <div className="flex-1 flex items-center justify-center md:justify-start gap-4">
                  <span className="font-display font-bold text-lg md:text-xl text-right flex-1">{match.homeTeam}</span>
                  <div className="bg-muted px-4 py-2 rounded-lg font-mono font-bold text-xl border shadow-inner">
                    {match.homeScore ?? '-'} : {match.awayScore ?? '-'}
                  </div>
                  <span className="font-display font-bold text-lg md:text-xl text-left flex-1">{match.awayTeam}</span>
                </div>

                {/* Actions / Edit Form */}
                <div className="w-full md:w-auto shrink-0 bg-muted/20 p-3 rounded-lg border">
                  {!resultForms[match.id] ? (
                    <button
                      onClick={() => handleInitResultForm(match.id, match)}
                      className="w-full flex justify-center items-center px-4 py-2 text-sm font-medium border bg-card hover:bg-muted rounded-md transition-colors"
                    >
                      Actualizar Resultado Oficial
                    </button>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      <input 
                        type="number" 
                        min="0" 
                        value={resultForms[match.id].homeScore}
                        onChange={e => setResultForms(prev => ({ ...prev, [match.id]: { ...prev[match.id], homeScore: e.target.value } }))}
                        className="w-16 px-2 py-1.5 text-center border rounded font-bold bg-background focus:ring-1 focus:ring-primary"
                        placeholder="L"
                      />
                      <span className="text-muted-foreground">-</span>
                      <input 
                        type="number" 
                        min="0" 
                        value={resultForms[match.id].awayScore}
                        onChange={e => setResultForms(prev => ({ ...prev, [match.id]: { ...prev[match.id], awayScore: e.target.value } }))}
                        className="w-16 px-2 py-1.5 text-center border rounded font-bold bg-background focus:ring-1 focus:ring-primary"
                        placeholder="V"
                      />
                      <select
                        value={resultForms[match.id].status}
                        onChange={e => setResultForms(prev => ({ ...prev, [match.id]: { ...prev[match.id], status: e.target.value } }))}
                        className="px-2 py-1.5 border rounded text-sm bg-background focus:ring-1 focus:ring-primary"
                      >
                        <option value="live">En Vivo (Cierra pronósticos)</option>
                        <option value="finished">Finalizado (Calcula puntos)</option>
                      </select>
                      <button
                        onClick={() => handleSaveResult(match.id)}
                        className="bg-primary text-primary-foreground px-3 py-1.5 rounded text-sm font-medium hover:bg-primary/90 flex items-center"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          const newForms = {...resultForms};
                          delete newForms[match.id];
                          setResultForms(newForms);
                        }}
                        className="px-3 py-1.5 rounded text-sm font-medium border hover:bg-muted text-muted-foreground"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {match.status === 'live' && resultForms[match.id]?.status === 'finished' && (
                <div className="bg-amber-50 dark:bg-amber-900/20 px-4 py-2 border-t border-amber-200 dark:border-amber-800/50 flex items-center text-xs text-amber-800 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4 mr-2 shrink-0" />
                  Al marcar como "Finalizado", se calcularán automáticamente los puntos de todos los usuarios para este partido.
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Partido a la Jornada</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Local</label>
                <select value={homeTeam} onChange={e => setHomeTeam(e.target.value)} className="w-full px-3 py-2 border rounded-md bg-background focus:ring-1 focus:ring-primary">
                  {LIGA_MX_TEAMS.map(t => <option key={`h-${t}`} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Visitante</label>
                <select value={awayTeam} onChange={e => setAwayTeam(e.target.value)} className="w-full px-3 py-2 border rounded-md bg-background focus:ring-1 focus:ring-primary">
                  {LIGA_MX_TEAMS.map(t => <option key={`a-${t}`} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha y Hora</label>
              <input type="datetime-local" value={matchDate} onChange={e => setMatchDate(e.target.value)} className="w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-primary text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Estadio</label>
              <input type="text" value={stadium} onChange={e => setStadium(e.target.value)} placeholder="Ej. Estadio Azteca" className="w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-primary" />
            </div>
            <DialogFooter>
              <button type="submit" disabled={createMatch.isPending} className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium hover:bg-primary/90 mt-4">
                {createMatch.isPending ? "Guardando..." : "Guardar Partido"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
