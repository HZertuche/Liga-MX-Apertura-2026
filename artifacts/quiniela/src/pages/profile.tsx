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

    </div>
  );
}
