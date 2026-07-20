import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";

export default function Profile() {
  const params = useParams();

  const userId = params.userId ?? "1";

  const { data, isLoading } = useQuery({
    queryKey: ["profile", userId],
    queryFn: () =>
      fetch(`/api/profile/${userId}`, {
        credentials: "include",
      }).then((r) => r.json()),
  });

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        Cargando perfil...
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">

      <div>
        <h1 className="text-3xl font-display font-bold">
          {data.jugador}
        </h1>

        <p className="text-muted-foreground">
          {data.torneo}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">

        <div className="border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">
            Puntos
          </p>

          <p className="text-3xl font-bold">
            {data.resumen.puntos}
          </p>
        </div>

        <div className="border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">
            Efectividad
          </p>

          <p className="text-3xl font-bold">
            {data.resumen.efectividad}%
          </p>
        </div>

        <div className="border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">
            Exactos
          </p>

          <p className="text-3xl font-bold">
            {data.resumen.exactos}
          </p>
        </div>

        <div className="border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">
            Aciertos
          </p>

          <p className="text-3xl font-bold">
            {data.resumen.aciertos}
          </p>
        </div>

      </div>

    </div>
  );
}
