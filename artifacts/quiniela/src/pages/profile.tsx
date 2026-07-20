import { useAuth } from "@/contexts/auth-context";
import { useQuery } from "@tanstack/react-query";

export default function Profile() {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const response = await fetch(`/api/profile/${user!.id}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("No se pudo cargar el perfil");
      }

      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        Cargando perfil...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        Error al cargar el perfil.
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">

      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-bold">
          {data.jugador}
        </h1>

        <p className="text-muted-foreground">
          Estadísticas del torneo
        </p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        <div className="rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">
            Puntos
          </p>

          <p className="text-3xl font-bold">
            {data.resumen.puntos}
          </p>
        </div>

        <div className="rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">
            Efectividad
          </p>

          <p className="text-3xl font-bold">
            {data.resumen.efectividad}%
          </p>
        </div>

        <div className="rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">
            Exactos
          </p>

          <p className="text-3xl font-bold">
            {data.resumen.exactos}
          </p>
        </div>

        <div className="rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">
            Aciertos
          </p>

          <p className="text-3xl font-bold">
            {data.resumen.aciertos}
          </p>
        </div>

      </div>

      {/* Medallas */}
      <div className="space-y-4">

        <h2 className="text-xl font-bold">
          Mis Medallas
        </h2>

        <div className="grid md:grid-cols-2 gap-4">

          <div className="border rounded-xl p-4">
            <p className="text-sm text-muted-foreground">
              🔒 Candado
            </p>

            <p className="text-2xl font-bold">
              {data.medallas.candado}
            </p>

            <p className="text-sm text-muted-foreground">
              partidos consecutivos con acierto
            </p>
          </div>

          <div className="border rounded-xl p-4">
            <p className="text-sm text-muted-foreground">
              🎯 Francotirador
            </p>

            <p className="text-2xl font-bold">
              {data.medallas.francotirador}
            </p>

            <p className="text-sm text-muted-foreground">
              exactos consecutivos
            </p>
          </div>

          <div className="border rounded-xl p-4">
            <p className="text-sm text-muted-foreground">
              💥 Farol
            </p>

            <p className="text-2xl font-bold">
              {data.medallas.farol}
            </p>

            <p className="text-sm text-muted-foreground">
              partidos sin sumar puntos
            </p>
          </div>

          <div className="border rounded-xl p-4">
            <p className="text-sm text-muted-foreground">
              ⭐ Mejor Jornada
            </p>

            <p className="text-2xl font-bold">
              J{data.medallas.mejorJornada.jornada}
            </p>

            <p className="text-sm text-muted-foreground">
              {data.medallas.mejorJornada.puntos} puntos
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
