import { useState, useEffect, useRef } from "react";
import { 
  useGetJornada, getGetJornadaQueryKey,
  useListPredictions, getListPredictionsQueryKey,
  useSavePredictions,
  useGetMe
} from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { ChevronLeft, Lock, Save, Trophy, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function JornadaDetail() {
  const params = useParams();
  const jornadaId = Number(params.id);
  const { data: user } = useGetMe();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: jornada, isLoading: isJornadaLoading } = useGetJornada(jornadaId, {
    query: { enabled: !!jornadaId, queryKey: getGetJornadaQueryKey(jornadaId) }
  });

  const { data: predictions, isLoading: isPredictionsLoading } = useListPredictions({
    query: { 
      enabled: !!user?.id && !!jornadaId, 
      queryKey: getListPredictionsQueryKey({ userId: user?.id, jornadaId }) 
    },
    request: { query: { userId: user?.id, jornadaId } }
  } as any); // Type override to handle custom query passing pattern

  const saveMutation = useSavePredictions();

  const [localScores, setLocalScores] = useState<Record<number, { home: string, away: string }>>({});
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const initializedRef = useRef<number | null>(null);

  // Initialize local state from predictions
  useEffect(() => {
    if (predictions && initializedRef.current !== jornadaId) {
      const scores: Record<number, { home: string, away: string }> = {};
      predictions.forEach(p => {
        scores[p.matchId] = {
          home: p.homeScore !== null && p.homeScore !== undefined ? String(p.homeScore) : "",
          away: p.awayScore !== null && p.awayScore !== undefined ? String(p.awayScore) : ""
        };
      });
      setLocalScores(scores);
      initializedRef.current = jornadaId;
    }
  }, [predictions, jornadaId]);

  const handleScoreChange = (matchId: number, type: 'home' | 'away', value: string) => {
    // Only allow numbers
    if (value !== "" && !/^\d+$/.test(value)) return;
    
    setLocalScores(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [type]: value
      }
    }));
  };

  const handleSave = () => {
    setIsConfirmOpen(false);
    
    const payload = Object.entries(localScores).map(([matchId, scores]) => ({
      matchId: Number(matchId),
      homeScore: scores.home !== "" ? Number(scores.home) : null,
      awayScore: scores.away !== "" ? Number(scores.away) : null
    }));

    saveMutation.mutate({ data: { jornadaId, predictions: payload } }, {
      onSuccess: () => {
        toast({ title: "Guardado exitoso", description: "Tus pronósticos han sido guardados." });
        queryClient.invalidateQueries({ queryKey: getListPredictionsQueryKey({ userId: user?.id, jornadaId }) });
      },
      onError: (err) => {
        toast({ 
          title: "Error al guardar", 
          description: (err.data as any)?.error || "Hubo un problema al guardar tus pronósticos.", 
          variant: "destructive" 
        });
      }
    });
  };

  const isFormDirty = () => {
    if (!predictions) return false;
    let dirty = false;
    
    // Check if any match has changed
    jornada?.matches.forEach(match => {
      const p = predictions.find(pr => pr.matchId === match.id);
      const local = localScores[match.id] || { home: "", away: "" };
      
      const pHome = p?.homeScore !== null && p?.homeScore !== undefined ? String(p.homeScore) : "";
      const pAway = p?.awayScore !== null && p?.awayScore !== undefined ? String(p.awayScore) : "";
      
      if (local.home !== pHome || local.away !== pAway) {
        dirty = true;
      }
    });
    
    return dirty;
  };

  if (isJornadaLoading || isPredictionsLoading) {
    return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  if (!jornada) {
    return <div className="p-8 text-destructive">Jornada no encontrada.</div>;
  }

  const dirty = isFormDirty();
  const allLocked = jornada.matches.every(m => m.isLocked);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <Link href="/jornadas" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-2">
        <ChevronLeft className="h-4 w-4 mr-1" />
        Volver a Jornadas
      </Link>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">{jornada.name}</h1>
          <p className="text-muted-foreground mt-1">Completa tus pronósticos antes de que cierren los partidos.</p>
        </div>
        {!allLocked && (
          <button
            onClick={() => setIsConfirmOpen(true)}
            disabled={!dirty || saveMutation.isPending}
            className={cn(
              "flex items-center justify-center px-6 py-2.5 rounded-lg font-semibold transition-all",
              dirty 
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md" 
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            {saveMutation.isPending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2"></div>
            ) : (
              <Save className="h-5 w-5 mr-2" />
            )}
            Guardar Cambios
          </button>
        )}
      </div>

      <div className="space-y-4">
        {jornada.matches.length === 0 ? (
          <div className="text-center p-12 bg-card rounded-xl border border-dashed">
            <p className="text-muted-foreground">No hay partidos configurados para esta jornada.</p>
          </div>
        ) : (
          jornada.matches.map(match => {
            const isLocked = match.isLocked;
            const pred = predictions?.find(p => p.matchId === match.id);
            const score = localScores[match.id] || { home: "", away: "" };
            
            return (
              <div key={match.id} className={cn(
                "bg-card border rounded-xl overflow-hidden transition-all",
                isLocked ? "bg-muted/30 opacity-90" : "hover:border-primary/30"
              )}>
                <div className="flex flex-col sm:flex-row border-b border-border/50 bg-muted/20 px-4 py-2 sm:items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{formatDate(match.matchDate)}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="truncate">{match.stadium || "Estadio TBD"}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 sm:mt-0">
                    {match.status === 'finished' && (
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-bold">Finalizado</span>
                    )}
                    {isLocked ? (
                      <span className="flex items-center text-destructive/80 font-medium"><Lock className="h-3.5 w-3.5 mr-1" /> Cerrado</span>
                    ) : (
                      <span className="text-green-600 font-medium flex items-center"><div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></div> Abierto</span>
                    )}
                  </div>
                </div>

                <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                  {/* Home Team */}
                  <div className="flex-1 flex items-center justify-end sm:justify-start gap-4 w-full sm:w-auto">
                    <span className="font-display font-bold text-lg sm:text-xl order-2 sm:order-1 flex-1 text-right">{match.homeTeam}</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={score.home}
                      onChange={(e) => handleScoreChange(match.id, 'home', e.target.value)}
                      disabled={isLocked}
                      className={cn(
                        "w-14 h-14 sm:w-16 sm:h-16 text-center text-2xl font-bold rounded-lg border-2 order-1 sm:order-2",
                        isLocked ? "bg-muted text-muted-foreground border-border cursor-not-allowed" : "bg-background focus:border-primary focus:ring-0",
                        score.home !== "" ? "text-foreground" : "text-muted-foreground/30"
                      )}
                      placeholder="-"
                    />
                  </div>

                  {/* VS */}
                  <div className="shrink-0 font-bold text-muted-foreground/50 text-sm">VS</div>

                  {/* Away Team */}
                  <div className="flex-1 flex items-center justify-start sm:justify-end gap-4 w-full sm:w-auto">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={score.away}
                      onChange={(e) => handleScoreChange(match.id, 'away', e.target.value)}
                      disabled={isLocked}
                      className={cn(
                        "w-14 h-14 sm:w-16 sm:h-16 text-center text-2xl font-bold rounded-lg border-2",
                        isLocked ? "bg-muted text-muted-foreground border-border cursor-not-allowed" : "bg-background focus:border-primary focus:ring-0",
                        score.away !== "" ? "text-foreground" : "text-muted-foreground/30"
                      )}
                      placeholder="-"
                    />
                    <span className="font-display font-bold text-lg sm:text-xl flex-1 text-left">{match.awayTeam}</span>
                  </div>
                </div>

                {/* Score / Result summary if finished */}
                {match.status === 'finished' && (
                  <div className="bg-primary/5 px-4 py-3 border-t flex flex-wrap justify-between items-center text-sm">
                    <div className="font-medium text-foreground">
                      Resultado Oficial: {match.homeScore ?? '-'} - {match.awayScore ?? '-'}
                    </div>
                    {pred?.points !== null && pred?.points !== undefined && (
                      <div className="flex items-center text-primary font-bold">
                        <Trophy className="h-4 w-4 mr-1.5" />
                        +{pred.points} pts
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-primary" />
              Confirmar Pronósticos
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de guardar estos resultados? Podrás modificarlos más tarde siempre y cuando el partido no haya comenzado (bloqueado).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Sí, guardar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
