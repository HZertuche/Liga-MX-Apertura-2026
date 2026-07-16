import { useState, useMemo } from "react";
import { useGetMatchupStandings } from "@workspace/api-client-react";
import { Swords, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MatchupStandings() {
  const { data: standings, isLoading, isError } = useGetMatchupStandings();
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const sortedStandings = useMemo(() => {
    if (!standings) return [];
    
    let sortableItems = [...standings];
    if (sortConfig !== null) {
      sortableItems.sort((a: any, b: any) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [standings, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
  };

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
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center">
            <Swords className="h-8 w-8 mr-3 text-blue-600" />
            Tabla de Enfrentamientos
          </h1>
          <p className="text-muted-foreground mt-1">Puntos obtenidos en duelos directos (V=3, E=1, D=0).</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-card-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border/50 uppercase text-xs tracking-wider">
              <tr>
                <th className="px-4 py-4 text-center w-16 cursor-pointer hover:text-foreground" onClick={() => requestSort('position')}>
                  Pos{getSortIndicator('position')}
                </th>
                <th className="px-4 py-4 cursor-pointer hover:text-foreground" onClick={() => requestSort('displayName')}>
                  Jugador{getSortIndicator('displayName')}
                </th>
                <th className="px-4 py-4 text-center cursor-pointer hover:text-foreground" onClick={() => requestSort('wins')}>
                  V{getSortIndicator('wins')}
                </th>
                <th className="px-4 py-4 text-center cursor-pointer hover:text-foreground" onClick={() => requestSort('draws')}>
                  E{getSortIndicator('draws')}
                </th>
                <th className="px-4 py-4 text-center cursor-pointer hover:text-foreground" onClick={() => requestSort('losses')}>
                  D{getSortIndicator('losses')}
                </th>
                <th className="px-4 py-4 text-center cursor-pointer hover:text-foreground" onClick={() => requestSort('pointDiff')}>
                  Dif{getSortIndicator('pointDiff')}
                </th>
                <th className="px-4 py-4 text-right cursor-pointer hover:text-foreground font-bold text-foreground" onClick={() => requestSort('points')}>
                  Puntos{getSortIndicator('points')}
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
                        row.position === 1 ? "bg-blue-600 text-white" :
                        "text-muted-foreground"
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
  );
}
