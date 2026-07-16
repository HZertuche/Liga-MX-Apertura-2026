import { useListJornadas } from "@workspace/api-client-react";
import { Link } from "wouter";
import { CalendarDays, ChevronRight, PlayCircle, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatShortDate } from "@/lib/format";

export default function Jornadas() {
  const { data: jornadas, isLoading, isError } = useListJornadas();

  if (isLoading) {
    return (
      <div className="p-8 space-y-4 max-w-5xl mx-auto">
        <div className="h-8 w-48 bg-muted rounded-md animate-pulse mb-8"></div>
        {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse"></div>)}
      </div>
    );
  }

  if (isError || !jornadas) {
    return <div className="p-8 text-destructive">Error al cargar las jornadas.</div>;
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return { icon: PlayCircle, color: 'text-primary', bg: 'bg-primary/10', label: 'En Juego', border: 'border-primary/30' };
      case 'finished':
        return { icon: CheckCircle2, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Finalizada', border: 'border-border' };
      case 'upcoming':
      default:
        return { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Próxima', border: 'border-blue-100' };
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Jornadas</h1>
        <p className="text-muted-foreground mt-1">Selecciona una jornada para ver o editar tus pronósticos.</p>
      </div>

      <div className="grid gap-4">
        {jornadas.length === 0 ? (
          <div className="text-center p-12 bg-card rounded-xl border border-dashed">
            <CalendarDays className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No hay jornadas registradas aún.</p>
          </div>
        ) : (
          jornadas.map((jornada) => {
            const config = getStatusConfig(jornada.status);
            const StatusIcon = config.icon;

            return (
              <Link key={jornada.id} href={`/jornadas/${jornada.id}`}>
                <div className={cn(
                  "group flex items-center justify-between p-4 sm:p-6 bg-card rounded-xl border transition-all duration-200 hover:shadow-md cursor-pointer",
                  jornada.status === 'active' ? "border-primary/30 hover:border-primary/60" : "border-card-border hover:border-foreground/20"
                )}>
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="hidden sm:flex h-12 w-12 rounded-full bg-muted items-center justify-center font-display font-bold text-xl text-foreground">
                      {jornada.number}
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg sm:text-xl text-foreground group-hover:text-primary transition-colors">
                        {jornada.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <CalendarDays className="h-4 w-4 mr-1.5 opacity-70" />
                          {formatShortDate(jornada.startDate)} - {formatShortDate(jornada.endDate)}
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span>{jornada.matchCount} partidos</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className={cn("hidden sm:flex items-center px-3 py-1 rounded-full border text-xs font-medium", config.bg, config.color, config.border)}>
                      <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
                      {config.label}
                    </div>
                    <ChevronRight className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  );
}
