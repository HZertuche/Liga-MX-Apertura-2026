import { useState } from "react";
import { useListJornadas, useListUsers, useListPredictions, useListMatches } from "@workspace/api-client-react";
import { formatDate } from "@/lib/format";
import { Pencil, X, Save } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const LOCK_MS = 10 * 60 * 1000;
const isMatchLocked = (m: { isLocked: boolean; matchDate?: string | null }) =>
  m.isLocked || (!!m.matchDate && new Date(m.matchDate).getTime() - Date.now() < LOCK_MS);

type EditingCell = {
  matchId: number;
  userId: number;
  matchLabel: string;
  userName: string;
  homeScore: string;
  awayScore: string;
};

export default function AdminPredictions() {
  const [jornadaId, setJornadaId] = useState<number | null>(null);
  const [editing, setEditing] = useState<EditingCell | null>(null);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

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

  // lookup: predsByMatchAndUser[matchId][userId]
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

  const submittedCount = (userId: number) =>
    sortedMatches.filter(m => predsByMatchAndUser[m.id]?.[userId] !== undefined).length;

  const openEdit = (matchId: number, userId: number, matchLabel: string, userName: string) => {
    const existing = predsByMatchAndUser[matchId]?.[userId];
    setEditing({
      matchId, userId, matchLabel, userName,
      homeScore: existing?.homeScore != null ? String(existing.homeScore) : "",
      awayScore: existing?.awayScore != null ? String(existing.awayScore) : "",
    });
  };

  const handleSaveOverride = async () => {
    if (!editing) return;
    const home = parseInt(editing.homeScore);
    const away = parseInt(editing.awayScore);
    if (isNaN(home) || isNaN(away) || home < 0 || away < 0) {
      toast({ title: "Error", description: "Ingresa marcadores válidos (números ≥ 0)", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/predictions/override", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: editing.userId, matchId: editing.matchId, homeScore: home, awayScore: away }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Error al guardar");
      toast({ title: "Guardado", description: `Pronóstico de ${editing.userName} capturado correctamente.` });
      queryClient.invalidateQueries({ queryKey: ["/api/predictions"] });
      setEditing(null);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

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
            <option key={j.id} value={j.id}>Jornada {j.number} — {j.name}</option>
          ))}
        </select>
      </div>

      {!jornadaId && (
        <div className="text-center py-16 text-muted-foreground">Selecciona una jornada para ver las quinielas</div>
      )}
      {jornadaId && isLoading && (
        <div className="text-center py-16 text-muted-foreground">Cargando…</div>
      )}
      {jornadaId && !isLoading && sortedMatches.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">No hay partidos capturados en esta jornada</div>
      )}

      {jornadaId && !isLoading && sortedMatches.length > 0 && (
        <>
          {/* Summary chips */}
          <div className="flex flex-wrap gap-2">
            {sortedUsers.map(u => {
              const count = submittedCount(u.id);
              const total = sortedMatches.length;
              const done = count === total;
              const partial = count > 0 && count < total;
              return (
                <span key={u.id} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium
                  ${done ? "bg-green-100 text-green-800" : partial ? "bg-yellow-100 text-yellow-800" : "bg-muted text-muted-foreground"}`}>
                  {u.displayName}
                  <span className="opacity-70">{count}/{total}</span>
                </span>
              );
            })}
          </div>

          {/* Grid */}
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left p-3 font-semibold border-b sticky left-0 bg-muted/50 min-w-[200px]">Partido</th>
                  <th className="text-left p-3 font-semibold border-b text-muted-foreground text-xs min-w-[140px]">Horario</th>
                  {sortedUsers.map(u => (
                    <th key={u.id} className="text-center p-3 font-semibold border-b min-w-[110px]">
                      <div>{u.displayName}</div>
                      {u.role === "admin" && <div className="text-[10px] font-normal text-muted-foreground">admin</div>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedMatches.map((match, i) => {
                  const locked = isMatchLocked(match);
                  const hasResult = match.homeScore !== null && match.awayScore !== null;
                  return (
                    <tr key={match.id} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                      {/* Match name */}
                      <td className="p-3 border-b sticky left-0 bg-inherit font-medium">
                        <span>{match.homeTeam}</span>
                        <span className="text-muted-foreground mx-1.5">vs</span>
                        <span>{match.awayTeam}</span>
                        {hasResult && locked && (
                          <div className="text-xs text-primary font-semibold mt-0.5">
                            Resultado: {match.homeScore} – {match.awayScore}
                          </div>
                        )}
                      </td>
                      {/* Date + status */}
                      <td className="p-3 border-b text-muted-foreground text-xs">
                        <div>{formatDate(match.matchDate)}</div>
                        {locked
                          ? <span className="text-destructive/70 font-medium">Cerrado</span>
                          : <span className="text-green-600 font-medium">Abierto</span>}
                      </td>
                      {/* User predictions */}
                      {sortedUsers.map(u => {
                        if (!locked) {
                          return (
                            <td key={u.id} className="p-3 border-b text-center text-muted-foreground/30">—</td>
                          );
                        }

                        const pred = predsByMatchAndUser[match.id]?.[u.id];
                        const submitted = pred !== undefined;
                        const hasScore = submitted && pred.homeScore !== null && pred.awayScore !== null;

                        let outcomeClass = "";
                        if (hasResult && hasScore) {
                          const rH = match.homeScore!, rA = match.awayScore!;
                          const pH = pred.homeScore!, pA = pred.awayScore!;
                          if (pH === rH && pA === rA) outcomeClass = "bg-green-100 text-green-800 font-semibold";
                          else if (
                            (pH > pA && rH > rA) || (pH < pA && rH < rA) || (pH === pA && rH === rA)
                          ) outcomeClass = "bg-blue-100 text-blue-800";
                          else outcomeClass = "bg-red-100 text-red-800";
                        }

                        const matchLabel = `${match.homeTeam} vs ${match.awayTeam}`;

                        return (
                          <td key={u.id} className="p-3 border-b text-center">
                            <div className="flex items-center justify-center gap-1 group">
                              {!submitted ? (
                                <span className="text-muted-foreground/40">—</span>
                              ) : !hasScore ? (
                                <span className="text-muted-foreground/60 text-xs">sin marcador</span>
                              ) : (
                                <span className={`px-2 py-0.5 rounded text-sm ${outcomeClass || "text-foreground"}`}>
                                  {pred.homeScore} – {pred.awayScore}
                                </span>
                              )}
                              {/* Edit button — always visible on locked matches */}
                              <button
                                onClick={() => openEdit(match.id, u.id, matchLabel, u.displayName)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                                title={`Capturar pronóstico de ${u.displayName}`}
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                            </div>
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
            <span className="ml-4 text-muted-foreground/60">Pasa el cursor sobre una celda para editar el pronóstico.</span>
          </p>
        </>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-card border rounded-xl shadow-xl p-6 w-full max-w-sm mx-4 space-y-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-bold text-lg">Capturar pronóstico</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  <span className="font-medium text-foreground">{editing.userName}</span> — {editing.matchLabel}
                </p>
              </div>
              <button onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground p-1 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Local</label>
                <input
                  type="number" min="0" max="99"
                  value={editing.homeScore}
                  onChange={e => setEditing(prev => prev ? { ...prev, homeScore: e.target.value } : null)}
                  className="w-full border rounded-md px-3 py-2 text-center text-xl font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                />
              </div>
              <span className="text-2xl font-bold text-muted-foreground mt-5">–</span>
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Visitante</label>
                <input
                  type="number" min="0" max="99"
                  value={editing.awayScore}
                  onChange={e => setEditing(prev => prev ? { ...prev, awayScore: e.target.value } : null)}
                  className="w-full border rounded-md px-3 py-2 text-center text-xl font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setEditing(null)}
                className="flex-1 border rounded-lg px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveOverride}
                disabled={saving}
                className="flex-1 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
