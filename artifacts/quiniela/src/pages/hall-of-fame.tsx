import { useQuery } from "@tanstack/react-query";


export default function HallOfFame() {

  const { data, isLoading } = useQuery({
    queryKey: ["hall-of-fame"],
    queryFn: () =>
      fetch("/api/hall-of-fame", {
        credentials: "include",
      }).then((r) => r.json()),
  });


  if (isLoading) {
    return (
      <div className="p-8 text-center">
        Cargando Salón de la Fama...
      </div>
    );
  }


  const awards = [
    {
      titulo: "Campeón de Jornadas",
      icono: "👑",
      jugador: data?.campeonJornadas?.jugador ?? "Sin datos",
      valor: `${data?.campeonJornadas?.valor ?? 0} jornadas`,
      descripcion:
        "Jugador que más veces ha terminado una jornada en primer lugar.",
    },
  
    {
      titulo: "Rey del Liderato",
      icono: "👑",
      jugador: data?.reyLiderato?.jugador ?? "Sin datos",
      valor: `${data?.reyLiderato?.valor ?? 0} días`,
      descripcion:
        "Jugador que más días ha permanecido como líder de la tabla general.",
    },
  
    {
      titulo: "Cazador de Puntos",
      jugador: data?.cazadorPuntos?.jugador ?? "Sin datos",
      icono: "🎯",
      valor: data?.cazadorPuntos?.valor ?? "0 puntos",
      descripcion:
        "Mayor cantidad de puntos obtenidos en una sola jornada.",
    },
  
    {
      titulo: "Especialista",
      jugador: data?.especialista?.jugador ?? "Sin datos",
      icono: "📈",
      valor: `${(data?.especialista?.valor ?? 0).toFixed(1)}%`,
      descripcion:
        "Mayor porcentaje histórico de aciertos entre todos sus pronósticos.",
    },

    {
      titulo: "Especialista Local",
      jugador: data?.especialistaLocal?.jugador ?? "Sin datos",
      icono: "🏟️",
      valor:
        data?.especialistaLocal
          ? `${data.especialistaLocal.local.efectividad}%`
          : "Sin datos",
      descripcion:
        "Mayor efectividad histórica al pronosticar victorias del equipo local.",
    },    

    {
      titulo: "Especialista Visitante",
      jugador: data?.especialistaVisitante?.jugador ?? "Sin datos",
      icono: "✈️",
      valor:
        data?.especialistaVisitante
          ? `${data.especialistaVisitante.visitante.efectividad}%`
          : "Sin datos",
      descripcion:
        "Mayor efectividad histórica al pronosticar victorias del visitante.",
    },

    {
      titulo: "Maestro del Empate",
      jugador: data?.maestroEmpate?.jugador ?? "Sin datos",
      icono: "🤝",
      valor:
        data?.maestroEmpate
          ? `${data.maestroEmpate.empate.efectividad}%`
          : "Sin datos",
      descripcion:
        "Mayor efectividad histórica al pronosticar empates.",
    },
    
    {
      titulo: "Cazador de Sorpresas",
      icono: "💥",
      jugador: data?.cazadorSorpresas?.jugador ?? "Sin datos",
      valor: `${data?.cazadorSorpresas?.valor ?? 0} sorpresas`,
      descripcion:
        "Jugador que más veces acertó resultados elegidos por menos del 20% de los participantes.",
    },

    {
      titulo: "Conservador del Año",
      icono: "🛡️",
      jugador: data?.conservadorDelAno?.jugador ?? "Sin datos",
      valor: `${data?.conservadorDelAno?.conservador ?? 0}%`,
      descripcion:
        "Jugador que más confía en las victorias del equipo local.",
    },

    {
      titulo: "Rey del Riesgo",
      icono: "🎲",
      jugador: data?.reyRiesgo?.jugador ?? "Sin datos",
      valor: `${data?.reyRiesgo?.riesgo ?? 0}%`,
      descripcion:
        "Jugador que más apuesta por victorias visitantes y empates.",
    },

    {
      titulo: "🤝 Mejor Aliado",
      jugador: data?.mejorAliado?.jugador ?? "Sin datos",
      icono: "🤝",
      valor:
        data?.mejorAliado?.valor ?? "0%",
      descripcion:
        "Jugador con mejor rendimiento histórico contra un equipo específico.",
    },
    
    {
      titulo: "😈 Pesadilla",
      jugador: data?.pesadilla?.jugador ?? "Sin datos",
      icono: "😈",
      valor:
        data?.pesadilla?.valor ?? "0%",
      descripcion:
        "Equipo contra el que más ha sufrido históricamente un jugador.",
    },
    
    {
      titulo: "Rey del Exacto",
      jugador: data?.reyExacto?.jugador ?? "Sin datos",
      icono: "🎯",
      valor: `${data?.reyExacto?.valor ?? 0} exactos`,
      descripcion:
        "Jugador con más resultados exactos históricos.",
    },
  
    {
      titulo: "Rey del Resultado",
      icono: "⚽",
      jugador: data?.reyResultado?.jugador ?? "Sin datos",
      valor: `${data?.reyResultado?.valor ?? 0} resultados`,
      descripcion:
        "Jugador con más partidos acertados en ganador, empate o derrota.",
    },
  
    {
      titulo: "El Candado",
      icono: "🔒",
      jugador: data?.candado?.jugador ?? "Sin datos",
      valor: data?.candado?.valor ?? "0 partidos",
      descripcion:
        "Mayor racha histórica de partidos acertando el resultado (3 puntos o más) sin fallar.",
    },
  
    {
      titulo: "Farol",
      icono: "🤡",
      jugador: data?.farol?.jugador ?? "Sin datos",
      valor: data?.farol?.valor ?? "0 partidos",
      descripcion:
        "Mayor racha histórica de partidos consecutivos sin obtener puntos.",
    },
  ];    



  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">

      <div>
        <h1 className="text-3xl font-display font-bold">
          🏆 Salón de la Fama
        </h1>

        <p className="text-muted-foreground mt-1">
          Los mejores jugadores históricos de la quiniela.
        </p>
      </div>


      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
      
        {awards.map((award) => (
      
          <div
            key={award.titulo}
            className="bg-card border rounded-lg p-2 md:p-3 space-y-1.5"
          >
      
            <div className="text-xl md:text-2xl">
              {award.icono}
            </div>
      
            <h2 className="font-bold text-xs md:text-sm">
              {award.titulo}
            </h2>
      
            <p className="text-sm md:text-lg font-bold truncate">
              {award.jugador}
            </p>
      
            <p className="text-sm md:text-base text-primary font-semibold">
              {award.valor}
            </p>
      
            <p className="text-[10px] md:text-xs text-muted-foreground line-clamp-2">
              {award.descripcion}
            </p>
      
          </div>
      
        ))}
      
      </div>



        


      <div className="bg-card border rounded-xl p-3">

        <div className="flex items-center gap-2 mb-3">

          <div className="text-2xl">
            🔻
          </div>          

          <h2 className="font-bold text-sm">
            🔻 Zona de Descenso
          </h2>

        </div>


        <div className="space-y-2">

          {data?.descenso?.map((j: any) => (

            <div
              key={j.posicion}
              className="flex justify-between items-center border-b pb-2"
            >

              <div className="font-semibold">
                {j.posicion}. {j.jugador}
              </div>

              <div className="text-primary font-bold">
                {j.valor}
              </div>

            </div>

          ))}

        </div>


        <p className="text-xs text-muted-foreground mt-3">
          Los jugadores con menor puntuación actual en la competencia.
        </p>

      </div>


    </div>
  );
}
  
    
