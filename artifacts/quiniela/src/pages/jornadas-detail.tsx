import { useState, useEffect, useRef } from "react";
import { 
  useGetJornada, getGetJornadaQueryKey,
  useListPredictions, getListPredictionsQueryKey,
  useSavePredictions,
  useGetMe
} from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { ChevronLeft, Lock, Save, Trophy, AlertCircle, Users, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useQuery } from "@tanstack/react-query";
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

// ──────────────────────────────────────────
// Types
// ──────────────────────────────────────────
type MatchPrediction = {
  userId: number;
  displayName: string;
  homeScore: number | null;
  awayScore: number | null;
  points: number | null;
};

// ──────────────────────────────────────────
// Hook: fetch all predictions for a locked match
// ──────────────────────────────────────────
function useMatchPredictions(matchId: number | null) {
  return useQuery<MatchPrediction[]>({
    queryKey: ["/api/predictions/match", matchId],
    queryFn: async () => {
      const res = await fetch(`/api/predictions/match/${matchId}`, { credentials: "include" });
      if (!res.ok) throw new Error("No se pudieron cargar los pronósticos");
      return res.json();
    },
    enabled: !!matchId,
  });
}

// ──────────────────────────────────────────
// Sub-component: modal with all predictions for a locked match
// ──────────────────────────────────────────
function MatchPredictionsModal({
  matchId,
  matchLabel,
  homeScore,
  awayScore,
  onClose,
}: {
  matchId: number;
  matchLabel: string;
  homeScore: number | null;
  awayScore: number | null;
  onClose: () => void;
}) {
  const { data: preds, isLoading, isError } = useMatchPredictions(matchId);
  const hasResult = homeScore !== null && awayScore !== null;

  const getOutcome = (pH: number | null, pA: number | null) => {
    if (pH === null || pA === null || !hasResult) return null;
    if (pH === homeScore && pA === awayScore) return "exact";
    const predSign = Math.sign(pH - pA);
    const realSign = Math.sign(homeScore! - awayScore!);
    if (predSign === realSign) return "result";
    return "wrong";
  };

  const outcomeClass = (o: string | null) => {
    if (o === "exact") return "bg-green-100 text-green-800 font-semibold";
    if (o === "result") return "bg-blue-100 text-blue-800";
    if (o === "wrong") return "bg-red-100 text-red-800";
    return "text-foreground";
  };

  const outcomeLabel = (o: string | null) => {
    if (o === "exact") return "Exacto";
    if (o === "result") return "Resultado";
    if (o === "wrong") return "Incorrecto";
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-card border rounded-xl shadow-xl p-5 w-full max-w-sm mx-4 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-bold text-base leading-tight">{matchLabel}</h2>
            {hasResult && (
              <p className="text-sm text-primary font-semibold mt-0.5">
                Resultado oficial: {homeScore} – {awayScore}
              </p>
            )}
            {!hasResult && (
              <p className="text-xs text-muted-foreground mt-0.5">Partido en curso o por jugarse</p>
            )}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded shrink-0">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        {isLoading && (
          <div className="py-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        )}
        {isError && (
          <p className="text-destructive text-sm text-center py-4">Error al cargar los pronósticos.</p>
        )}
        {!isLoading && !isError && preds && (
          <div className="divide-y divide-border/50 -mx-5 px-5">
            {preds.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-4">
                Nadie registró un pronóstico para este partido.
              </p>
            )}
            {preds.map(p => {
              const outcome = getOutcome(p.homeScore, p.awayScore);
              const hasPred = p.homeScore !== null && p.awayScore !== null;
              return (
                <div key={p.userId} className="py-2.5 flex items-center justify-between gap-3">
                  <span className="font-medium text-sm truncate">{p.displayName}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    {hasPred ? (
                      <>
                        <span className={cn("px-2 py-0.5 rounded text-sm", outcomeClass(outcome))}>
                          {p.homeScore} – {p.awayScore}
                        </span>
                        {outcome && (
                          <span className="text-xs text-muted-foreground">{outcomeLabel(outcome)}</span>
                        )}
                        {p.points !== null && hasResult && (
                          <span className="text-xs font-bold text-primary">+{p.points}</span>
                        )}
                      </>
                    ) : (
                      <span className="text-muted-foreground/50 text-sm">Sin pronóstico</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
// Main page
// ──────────────────────────────────────────
export default function JornadaDetail() {
  const params = useParams();
  const jornadaId = Number(params.id);
  const { data: user } = useGetMe();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [openMatchId, setOpenMatchId] = useState<number | null>(null);
  const [openMatchLabel, setOpenMatchLabel] = useState("");
  const [openMatchHome, setOpenMatchHome] = useState<number | null>(null);
  const [openMatchAway, setOpenMatchAway] = useState<number | null>(null);

  const { data: jornada, isLoading: isJornadaLoading } = useGetJornada(jornadaId, {
    query: { enabled: !!jornadaId, queryKey: getGetJornadaQueryKey(jornadaId) }
  });

  const { data: predictions, isLoading: isPredictionsLoading } = useListPredictions(
    jornadaId ? { jornadaId } : {},
    { query: { enabled: !!user?.id && !!jornadaId, queryKey: getListPredictionsQueryKey({ userId: user?.id, jornadaId }) } }
  ) as any;

  const saveMutation = useSavePredictions();

  const [localScores, setLocalScores] = useState<Record<number, { home: string, away: string }>>({});
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const initializedRef = useRef<number | null>(null);

  useEffect(() => {
    if (predictions && initializedRef.current !== jornadaId) {
      const scores: Record<number, { home: string, away: string }> = {};
      predictions.forEach((p: any) => {
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
    if (value !== "" && !/^\d+$/.test(value)) return;
    setLocalScores(prev => ({
      ...prev,
      [matchId]: { ...prev[matchId], [type]: value }
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
      onError: (err: any) => {
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
    jornada?.matches.forEach((match: any) => {
      const p = predictions.find((pr: any) => pr.matchId === match.id);
      const local = localScores[match.id] || { home: "", away: "" };
      const pHome = p?.homeScore !== null && p?.homeScore !== undefined ? String(p.homeScore) : "";
      const pAway = p?.awayScore !== null && p?.awayScore !== undefined ? String(p.awayScore) : "";
      if (local.home !== pHome || local.away !== pAway) dirty = true;
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
  const LOCK_MS = 10 * 60 * 1000;
  const isMatchLocked = (m: { isLocked: boolean; matchDate?: string | null }) =>
    m.isLocked || (!!m.matchDate && new Date(m.matchDate).getTime() - Date.now() < LOCK_MS);
  const allLocked = jornada.matches.every(isMatchLocked);

  const handleOpenPredictions = (match: any) => {
    setOpenMatchId(match.id);
    setOpenMatchLabel(`${match.homeTeam} vs ${match.awayTeam}`);
    setOpenMatchHome(match.homeScore ?? null);
    setOpenMatchAway(match.awayScore ?? null);
  };

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
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2" />
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
          jornada.matches.map((match: any) => {
            const isLocked = isMatchLocked(match);
            const pred = predictions?.find((p: any) => p.matchId === match.id);
            const score = localScores[match.id] || { home: "", away: "" };
            const hasOfficialResult = match.homeScore !== null && match.awayScore !== null;

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
                      <span className="flex items-center text-destructive/80 font-medium">
                        <Lock className="h-3.5 w-3.5 mr-1" /> Cerrado
                      </span>
                    ) : (
                      <span className="text-green-600 font-medium flex items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5" /> Abierto
                      </span>
                    )}
                    {/* Ver quinielas button — only when locked */}
                    {isLocked && (
                      <button
                        onClick={() => handleOpenPredictions(match)}
                        className="flex items-center gap-1 text-primary font-medium hover:underline"
                      >
                        <Users className="h-3.5 w-3.5" />
                        Ver quinielas
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-4 sm:p-6 flex flex-col gap-5">
                <div className="p-4 sm:p-6 flex flex-col gap-5">
                
                  {/* Resultado oficial */}
                  {isLocked && hasOfficialResult && (
                    <div className="text-center bg-primary/5 rounded-lg p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-3">
                        Resultado Final
                      </p>
                
                      <div className="flex items-center justify-center gap-4 sm:gap-8">
                        <span className="font-display font-bold text-lg sm:text-xl">
                          {match.homeTeam}
                        </span>
                
                        <span className="text-3xl font-bold">
                          {match.homeScore} - {match.awayScore}
                        </span>
                
                        <span className="font-display font-bold text-lg sm:text-xl">
                          {match.awayTeam}
                        </span>
                      </div>
                    </div>
                  )}
                
                
                  {/* Tu predicción */}
                  <div className="text-center">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-3">
                      Tu Predicción
                    </p>
                
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
                
                      {/* Local */}
                      <div className="flex items-center gap-3">
                        <span className="font-display font-bold text-lg sm:text-xl">
                          {match.homeTeam}
                        </span>
                
                        <input
                          type="text"
                          inputMode="numeric"
                          value={score.home}
                          onChange={(e) => handleScoreChange(match.id, 'home', e.target.value)}
                          disabled={isLocked}
                          className={cn(
                            "w-14 h-14 sm:w-16 sm:h-16 text-center text-2xl font-bold rounded-lg border-2",
                            isLocked
                              ? "bg-muted text-muted-foreground border-border cursor-not-allowed"
                              : "bg-background focus:border-primary focus:ring-0",
                            score.home !== "" ? "text-foreground" : "text-muted-foreground/30"
                          )}
                          placeholder="-"
                        />
                      </div>
                
                
                      <span className="font-bold text-muted-foreground/50">
                        VS
                      </span>
                
                
                      {/* Visitante */}
                      <div className="flex items-center gap-3">
                
                        <input
                          type="text"
                          inputMode="numeric"
                          value={score.away}
                          onChange={(e) => handleScoreChange(match.id, 'away', e.target.value)}
                          disabled={isLocked}
                          className={cn(
                            "w-14 h-14 sm:w-16 sm:h-16 text-center text-2xl font-bold rounded-lg border-2",
                            isLocked
                              ? "bg-muted text-muted-foreground border-border cursor-not-allowed"
                              : "bg-background focus:border-primary focus:ring-0",
                            score.away !== "" ? "text-foreground" : "text-muted-foreground/30"
                          )}
                          placeholder="-"
                        />
                
                        <span className="font-display font-bold text-lg sm:text-xl">
                          {match.awayTeam}
                        </span>
                
                      </div>
                
                    </div>
                  </div>
                
                </div>           

                {/* Result summary if finished */}
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
            );
          })
        )}
      </div>

      {/* Match predictions modal */}
      {openMatchId && (
        <MatchPredictionsModal
          matchId={openMatchId}
          matchLabel={openMatchLabel}
          homeScore={openMatchHome}
          awayScore={openMatchAway}
          onClose={() => setOpenMatchId(null)}
        />
      )}

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
