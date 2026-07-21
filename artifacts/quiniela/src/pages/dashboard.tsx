import { useGetDashboard, getGetDashboardQueryKey } from "@workspace/api-client-react";
import { Trophy, Users, CheckCircle2, CircleDashed, Lock, Clock, Medal } from "lucide-react";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

export default function Dashboard() {
  const { data, isLoading, isError } = useGetDashboard();

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-10 w-48 bg-muted rounded-md animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-muted rounded-xl animate-pulse"></div>)}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return <div className="p-8 text-destructive">Error al cargar el dashboard.</div>;
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
  
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
            Inicio
          </h1>
  
          <p className="text-sm text-muted-foreground mt-1">
            Apertura 2026
          </p>
        </div>
  
        {data.currentJornada && (
          <div className="inline-flex w-fit bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-semibold border border-primary/20 items-center">
            <span className="relative flex h-2.5 w-2.5 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
            </span>
  
            Jornada {data.currentJornada}
          </div>
        )}
      </div> 

    
        {/* Lider General */}
        
        <div className="bg-card rounded-xl p-6 border border-card-border shadow-sm flex flex-col justify-between gold-shimmer relative">
          <div className="flex justify-between items-start mb-4 relative z-10">
            <h3 className="font-medium text-muted-foreground">
              Líder General
            </h3>
        
            <div className="p-2 bg-secondary/20 text-secondary-foreground rounded-lg">
              <Trophy className="h-5 w-5" />
            </div>
          </div>
        
          <p
            className="text-2xl font-display font-bold text-foreground truncate relative z-10"
            title={data.generalLeader || "N/A"}
          >
            {data.generalLeader || "-"}
          </p>
        </div>
        
        
        <div className="space-y-8">        
        
    
        {/* Última Hora */}
        <div className="space-y-3">
        
          <h2 className="text-lg font-display font-bold flex items-center">
            📰 Última Hora
          </h2>
        
          <div className="bg-card rounded-xl border border-card-border shadow-sm overflow-hidden">
        
            {data.ultimasNoticias.length === 0 ? (
        
              <div className="p-4 text-center text-sm text-muted-foreground">
                Sin noticias por el momento.
              </div>
        
            ) : (
        
              <div className="divide-y divide-card-border">
        
                {data.ultimasNoticias.map((noticia, index) => (
        
                  <div
                    key={index}
                    className="flex items-start gap-2.5 p-3"
                  >
        
                    <div className="text-lg shrink-0">
                      {noticia.icono}
                    </div>
        
                    <p className="text-xs sm:text-sm leading-5 text-foreground">
                      {noticia.texto}
                    </p>
        
                  </div>
        
                ))}
        
              </div>
        
            )}
        
          </div>
        
        </div>        
        
        
        {/* Próximos Partidos */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-bold flex items-center">
              <Clock className="h-5 w-5 mr-2 text-primary" />
              Próximos Partidos
            </h2>
            <Link href="/jornadas" className="text-sm font-medium text-primary hover:underline">Ver todos</Link>
          </div>
          
          <div className="bg-card rounded-xl border border-card-border shadow-sm overflow-hidden">
            {data.upcomingMatches.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No hay partidos próximos programados.
              </div>
            ) : (
              <div className="divide-y divide-card-border">
          
                {data.upcomingMatches.map(match => (
                  <div
                    key={match.id}
                    className="p-3 hover:bg-muted/50 transition-colors"
                  >
          
                    {/* Jornada */}
                    <div className="text-[11px] text-muted-foreground mb-2">
                      ⚽ Jornada {match.jornadaNumber}
                    </div>
          
          
                    {/* Partido */}
                    <div className="flex items-center justify-center gap-5">
                    
                      {/* Local */}
                      <div className="flex-1 flex flex-col items-center min-w-0">
                    
                        <img
                          src={match.homeLogo}
                          alt={match.homeTeam}
                          className="h-10 w-10 object-contain mb-1"
                        />
                    
                        <p className="font-semibold text-xs text-center truncate w-full">
                          {match.homeTeam}
                        </p>
                    
                      </div>
                    
                    
                      {/* VS */}
                      <div className="bg-muted border rounded-full px-3 py-1 text-xs font-bold shrink-0">
                        VS
                      </div>
                    
                    
                      {/* Visitante */}
                      <div className="flex-1 flex flex-col items-center min-w-0">
                    
                        <img
                          src={match.awayLogo}
                          alt={match.awayTeam}
                          className="h-10 w-10 object-contain mb-1"
                        />
                    
                        <p className="font-semibold text-xs text-center truncate w-full">
                          {match.awayTeam}
                        </p>
                    
                      </div>
                    
                    </div>
          
          
                    {/* Fecha / Estadio / Candado */}
                    <div className="flex justify-between items-center mt-4 text-xs text-muted-foreground">
          
                      <div>
                        <p className="font-medium text-foreground">
                          {formatDate(match.matchDate)}
                        </p>
          
                        <p>
                          {match.stadium || "Estadio TBD"}
                        </p>
                      </div>
          
          
                      {match.isLocked && (
                        <div className="flex items-center gap-1 text-destructive">
                          <Lock className="h-4 w-4" />
                          Cerrado
                        </div>
                      )}
          
                    </div>
          
                  </div>
                ))}
          
              </div>
            )}
          </div>



            
        {/* Tablas Rápidas */}
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-xl font-display font-bold flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-secondary" />
              Top 3 General
            </h2>
            <div className="bg-card rounded-xl border border-card-border shadow-sm overflow-hidden p-2 space-y-2">
              {data.top3General.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">Sin datos</div>
              ) : (
                data.top3General.map(player => (
                  <div key={player.userId} className={cn(
                    "flex items-center justify-between p-3 rounded-lg border",
                    player.position === 1 ? "bg-gradient-to-r from-secondary/20 to-transparent border-secondary/30" : "border-transparent bg-muted/30"
                  )}>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-6 h-6 flex items-center justify-center rounded-full font-bold text-xs",
                        player.position === 1 ? "bg-secondary text-white" : "bg-muted-foreground/20 text-muted-foreground"
                      )}>{player.position}</div>
                      <span className={cn("font-medium", player.position === 1 && "font-bold text-foreground")}>{player.displayName}</span>
                    </div>
                    <span className="font-mono font-semibold">{player.points} pts</span>
                  </div>
                ))
              )}
              <div className="pt-2 text-center">
                <Link href="/standings/general" className="text-sm font-medium text-primary hover:underline">Ver tabla completa</Link>
              </div>
            </div>
          </div>

        {/* Zona de Descenso */}
        
          <div className="space-y-4">
          
            <h2 className="text-xl font-display font-bold flex items-center">
              ⚠️ Zona de Descenso
            </h2>
            
            <p className="text-xs text-muted-foreground mt-1">
              🟡 Advertencia · 🔴 Descenso
            </p>
          </div>
          
          
          
            <div className="bg-card rounded-xl border border-card-border shadow-sm p-2 space-y-2">
          
              {data.zonaDescenso.map(player => (
          
                <div
                  key={player.userId}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg",
                    player.position === 8
                      ? "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300"
                      : "bg-red-50 dark:bg-red-900/20 border border-red-300"
                  )}
                >
          
                  <div className="flex items-center gap-3">
          
                    <div className="font-bold text-sm">
                      {player.position}
                    </div>
          
                    <span className="font-medium">
                      {player.displayName}
                    </span>
          
                  </div>
          
          
                  <span className="font-mono font-semibold">
                    {player.points} pts
                  </span>
          
          
                </div>
          
              ))}
          
            </div>
          
          </div>
          
          <div className="space-y-4">
            <h2 className="text-xl font-display font-bold flex items-center">
              <Medal className="h-5 w-5 mr-2 text-blue-600" />
              Top 3 Enfrentamientos
            </h2>
            <div className="bg-card rounded-xl border border-card-border shadow-sm overflow-hidden p-2 space-y-2">
              {data.top3Matchups.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">Sin datos</div>
              ) : (
                data.top3Matchups.map(player => (
                  <div key={player.userId} className={cn(
                    "flex items-center justify-between p-3 rounded-lg border",
                    player.position === 1 ? "bg-gradient-to-r from-blue-50 to-transparent border-blue-100" : "border-transparent bg-muted/30"
                  )}>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-6 h-6 flex items-center justify-center rounded-full font-bold text-xs",
                        player.position === 1 ? "bg-blue-600 text-white" : "bg-muted-foreground/20 text-muted-foreground"
                      )}>{player.position}</div>
                      <span className={cn("font-medium", player.position === 1 && "font-bold text-foreground")}>{player.displayName}</span>
                    </div>
                    <span className="font-mono font-semibold">{player.points} pts</span>
                  </div>
                ))
              )}
              <div className="pt-2 text-center">
                <Link href="/standings/matchups" className="text-sm font-medium text-primary hover:underline">Ver tabla completa</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
