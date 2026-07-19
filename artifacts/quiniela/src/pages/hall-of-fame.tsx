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
