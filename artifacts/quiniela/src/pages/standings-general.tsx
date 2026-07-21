import { useState, useMemo } from "react";
import { useGetGeneralStandings } from "@workspace/api-client-react";
import { Trophy, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function GeneralStandings() {
  const { data: standings, isLoading, isError } = useGetGeneralStandings();
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
    let direction: 'asc' | 'desc' = 'desc'; // Default to desc for points/stats
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
    return <div className="p-8 text-destructive">Error al cargar la tabla general.</div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center">
            <Trophy className="h-8 w-8 mr-3 text-secondary" />
            Tabla General
          </h1>
          <p className="text-muted-foreground mt-1">Acumulación de puntos por resultados exactos y aciertos.</p>
        </div>
      </div>

      {/* Tabla para celular */}
      <div className="md:hidden">
        
        <div className="bg-card rounded-xl border border-card-border shadow-sm overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="py-2 text-center w-8">#</th>
                <th className="py-2 text-left">Jugador</th>
                <th className="py-2 text-center w-8">🎯</th>
                <th className="py-2 text-center w-8">✅</th>
                <th className="py-2 text-center w-10">%</th>
                <th className="py-2 text-center w-10">Pts</th>
              </tr>
            </thead>
        
            <tbody>
              {sortedStandings.map((row) => (
                <tr key={row.userId}>
                  <td className="py-2 text-center">
                    {row.position}
                  </td>
        
                  <td className="py-2">
                    {row.displayName}
                  </td>
        
                  <td className="py-2 text-center">
                    {row.exactScores}
                  </td>
        
                  <td className="py-2 text-center">
                    {row.correctResults}
                  </td>
        
                  <td className="py-2 text-center">
                    {Math.round(row.accuracy)}%
                  </td>
        
                  <td className="py-2 text-center font-bold">
                    {row.totalPoints}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        

      </div>

      {/* Tabla para escritorio */}
      <div className="hidden md:block">    

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
                <th className="px-4 py-4 text-center cursor-pointer hover:text-foreground" onClick={() => requestSort('exactScores')} title="Marcadores Exactos (3 pts)">
                  Exactos{getSortIndicator('exactScores')}
                </th>
                <th className="px-4 py-4 text-center cursor-pointer hover:text-foreground" onClick={() => requestSort('correctResults')} title="Resultados Correctos (1 pt)">
                  Aciertos{getSortIndicator('correctResults')}
                </th>
                <th className="px-4 py-4 text-center cursor-pointer hover:text-foreground" onClick={() => requestSort('accuracy')}>
                  Efectividad{getSortIndicator('accuracy')}
                </th>
                <th className="px-4 py-4 text-right cursor-pointer hover:text-foreground font-bold text-foreground" onClick={() => requestSort('totalPoints')}>
                  Puntos{getSortIndicator('totalPoints')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {sortedStandings.map((row) => (

                <tr 
                  key={row.userId} 
                  className={cn(
                    "hover:bg-muted/30 transition-colors",
                    row.position === 1 
                      ? "bg-yellow-100 dark:bg-yellow-900/30" 
                      : row.position === 2 
                      ? "bg-slate-100 dark:bg-slate-700/30"
                      : row.position === 3
                      ? "bg-orange-100 dark:bg-orange-900/30"
                      : row.position === 8
                      ? "bg-yellow-50 dark:bg-yellow-900/20"
                      : row.position >= 9
                      ? "bg-red-100 dark:bg-red-900/30"
                      : ""
                  )}
                >                  
     
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className={cn(
                        "font-display font-bold w-6 h-6 flex items-center justify-center rounded-full",
                        row.position === 1 ? "bg-yellow-500 text-white" :
                        row.position === 2 ? "bg-slate-400 text-white" :
                        row.position === 3 ? "bg-orange-600 text-white" :
                        row.position === 8 ? "bg-yellow-400 text-black" :
                        row.position >= 9 ? "bg-red-500 text-white" :
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
                      row.position === 1 ? "text-foreground font-bold" : "text-foreground/90"
                    )}>
                      {row.displayName}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{row.exactScores}</td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{row.correctResults}</td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{row.accuracy}%</td>
                  <td className={cn(
                    "px-4 py-3 text-right font-mono font-bold text-base",
                    row.position === 1 ? "text-secondary" : "text-foreground"
                  )}>
                    {row.totalPoints}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sortedStandings.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">
              Aún no hay puntos registrados en la tabla general.
            </div>
          )}

        </div>  

      </div>  

    </div> 

  </div> 

  );
}
