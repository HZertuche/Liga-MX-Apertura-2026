import { Trophy } from "lucide-react";
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
      jugador: data?.campeonJornadas?.jugador ?? "Sin datos",
      valor: `${data?.campeonJornadas?.valor ?? 0} jornadas`,
      descripcion:
        "Jugador que más veces ha terminado una jornada en primer lugar.",
    },
  
    {
      titulo: "Rey del Liderato",
      jugador: data?.reyLiderato?.jugador ?? "Sin datos",
      valor: `${data?.reyLiderato?.valor ?? 0} días`,
      descripcion:
        "Jugador que más días ha permanecido como líder de la tabla general.",
    },
  
    {
      titulo: "Cazador de Puntos",
      jugador: data?.cazadorPuntos?.jugador ?? "Sin datos",
      valor: data?.cazadorPuntos?.valor ?? "0 puntos",
      descripcion:
        "Mayor cantidad de puntos obtenidos en una sola jornada.",
    },
  
    {
      titulo: "Especialista",
      jugador: data?.especialista?.jugador ?? "Sin datos",
      valor: `${(data?.especialista?.valor ?? 0).toFixed(1)}%`,
      descripcion:
        "Mayor porcentaje histórico de aciertos entre todos sus pronósticos.",
    },
  
    {
      titulo: "Rey del Exacto",
      jugador: data?.reyExacto?.jugador ?? "Sin datos",
      valor: `${data?.reyExacto?.valor ?? 0} exactos`,
      descripcion:
        "Jugador con más resultados exactos históricos.",
    },
  
    {
      titulo: "Rey del Resultado",
      jugador: data?.reyResultado?.jugador ?? "Sin datos",
      valor: `${data?.reyResultado?.valor ?? 0} resultados`,
      descripcion:
        "Jugador con más partidos acertados en ganador, empate o derrota.",
    },
  
    {
      titulo: "El Candado",
      jugador: data?.candado?.jugador ?? "Sin datos",
      valor: data?.candado?.valor ?? "0 partidos",
      descripcion:
        "Mayor racha histórica de partidos acertando el resultado (3 puntos o más) sin fallar.",
    },
  
    {
      titulo: "Farol",
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


      <div className="grid grid-cols-2 gap-3">

        {awards.map((award) => (

          <div
            key={award.titulo}
            className="bg-card border rounded-xl p-3 space-y-2"
          >

            <Trophy className="h-5 w-5 text-primary" />

            <h2 className="font-bold text-sm">
              {award.titulo}
            </h2>

            <p className="text-lg font-bold">
              {award.jugador}
            </p>

            <p className="text-primary font-semibold">
              {award.valor}
            </p>

            <p className="text-xs text-muted-foreground">
              {award.descripcion}
            </p>

          </div>

        ))}

      </div>


      <div className="bg-card border rounded-xl p-3">

        <div className="flex items-center gap-2 mb-3">

          <Trophy className="h-5 w-5 text-primary" />

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
  
    
