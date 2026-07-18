import { Trophy } from "lucide-react";

const awards = [
  {
    titulo: "Rey del Liderato",
    jugador: "Por definir",
    valor: "0 jornadas como líder",
    descripcion:
      "Jugador que más jornadas ha terminado en la primera posición de la tabla general.",
  },
  {
    titulo: "Rey del Exacto",
    jugador: "Por definir",
    valor: "0 resultados exactos",
    descripcion:
      "Jugador con más marcadores exactos acertados en la historia de la quiniela.",
  },
  {
    titulo: "Rey del Resultado",
    jugador: "Por definir",
    valor: "0 resultados acertados",
    descripcion:
      "Jugador con más partidos acertados en ganador, empate o derrota.",
  },
  {
    titulo: "Farol",
    jugador: "Por definir",
    valor: "0 errores consecutivos",
    descripcion:
      "Mayor racha consecutiva de partidos sin acertar el resultado.",
  },
  {
    titulo: "Cazador de Puntos",
    jugador: "Por definir",
    valor: "0 puntos",
    descripcion:
      "Mayor cantidad de puntos obtenidos en una sola jornada.",
  },
  {
    titulo: "Campeón Histórico",
    jugador: "Por definir",
    valor: "0 puntos acumulados",
    descripcion:
      "Jugador con más puntos acumulados desde el inicio de la quiniela.",
  },
];

export default function HallOfFame() {

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
