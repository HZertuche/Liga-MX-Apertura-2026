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
      titulo: "Farol",
      jugador: data?.farol?.jugador ?? "Sin datos",
      valor: data?.farol?.valor ?? "0 partidos",
      descripcion:
        "Mayor racha histórica de partidos consecutivos sin obtener puntos.",
    },
    {
      titulo: "Zona de Descenso",
      jugador: data?.descenso
        ?.map(
          (j: any) =>
            `${j.posicion}. 🔻 ${j.jugador}`
        )
        .join("\n") ?? "Sin datos",
      valor: data?.descenso
        ?.map(
          (j: any) =>
            `${j.valor}`
        )
        .join(" | ") ?? "",
      descripcion:
        "Los jugadores con menor puntuación actual en la competencia.",
    },
    {
      titulo: "El Candado",
      jugador: data?.candado?.jugador ?? "Sin datos",
      valor: data?.candado?.valor ?? "0 partidos",
      descripcion:
        "Mayor racha histórica de partidos acertando el resultado (3 puntos o más) sin fallar.",
    },    
    {
      titulo: "Rey del Liderato",
      jugador: data?.reyLiderato?.jugador ?? "Sin datos",
      valor: data?.reyLiderato?.valor ?? "0 días",
      descripcion:
        "Jugador que más días ha permanecido como líder de la tabla general.",
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


      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

        {awards.map((award) => (

          <div
            key={award.titulo}
            className="bg-card border rounded-xl p-5 space-y-3"
          >

            <Trophy className="h-8 w-8 text-primary" />

            <h2 className="font-bold text-lg">
              {award.titulo}
            </h2>

            <p className="text-2xl font-bold">
              {award.jugador}
            </p>

            <p className="text-primary font-semibold">
              {award.valor}
            </p>

            <p className="text-sm text-muted-foreground">
              {award.descripcion}
            </p>

          </div>

        ))}

      </div>

    </div>
  );
}
