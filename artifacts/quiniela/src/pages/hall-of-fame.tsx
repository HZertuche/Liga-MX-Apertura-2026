import { Trophy } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

type Award = {
  titulo: string;
  jugador: string;
  valor: string;
  descripcion: string;
};

export default function HallOfFame() {

  const { data, isLoading, isError } = useQuery({
    queryKey: ["hall-of-fame"],
    queryFn: async () => {
      const res = await fetch("/api/hall-of-fame", {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Error cargando Salón de la Fama");
      }

      return res.json();
    },
  });


  if (isLoading) {
    return (
      <div className="p-8 text-center">
        Cargando Salón de la Fama...
      </div>
    );
  }


  if (isError || !data) {
    return (
      <div className="p-8 text-destructive">
        No se pudo cargar el Salón de la Fama.
      </div>
    );
  }


  const awards: Award[] = [
    {
      titulo: "👑 Rey del Exacto",
      jugador: data.reyExacto?.jugador ?? "-",
      valor: data.reyExacto?.valor ?? "0 exactos",
      descripcion:
        "Jugador con más marcadores exactos acertados en la historia.",
    },

    {
      titulo: "🎯 Rey del Resultado",
      jugador: data.reyResultado?.jugador ?? "-",
      valor: data.reyResultado?.valor ?? "0 resultados",
      descripcion:
        "Jugador con más partidos acertando ganador o empate.",
    },

    {
      titulo: "⚡ Cazador de Puntos",
      jugador: data.cazadorPuntos?.jugador ?? "-",
      valor: data.cazadorPuntos?.valor ?? "0 puntos",
      descripcion:
        "Mayor cantidad de puntos obtenidos en una sola jornada.",
    },

    {
      titulo: "🏮 Farol",
      jugador: data.farol?.jugador ?? "-",
      valor: data.farol?.valor ?? "0 partidos",
      descripcion:
        "Mayor cantidad de partidos consecutivos sin acertar resultado.",
    },

    {
      titulo: "🧠 Especialista",
      jugador: data.especialista?.jugador ?? "-",
      valor: data.especialista?.valor ?? "0%",
      descripcion:
        "Mejor porcentaje de aciertos considerando sus pronósticos.",
    },

    {
      titulo: "📉 Descenso",
      jugador: data.descenso?.jugador ?? "-",
      valor: data.descenso?.valor ?? "Últimos lugares",
      descripcion:
        "Jugadores que actualmente ocupan las posiciones más bajas de la tabla.",
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
