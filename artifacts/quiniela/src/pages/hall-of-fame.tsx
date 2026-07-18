import { Trophy } from "lucide-react";

const awards = [
  {
    titulo: "Rey del Exacto",
    jugador: "Torin",
    valor: "45 exactos",
    descripcion: "Mayor cantidad histórica de resultados exactos."
  },
  {
    titulo: "Rey del Resultado",
    jugador: "Juan Carlos",
    valor: "120 aciertos",
    descripcion: "Mayor cantidad de resultados acertados."
  },
  {
    titulo: "Cazador de Puntos",
    jugador: "Marcelo",
    valor: "34 puntos",
    descripcion: "Mayor cantidad de puntos obtenidos en una jornada."
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
