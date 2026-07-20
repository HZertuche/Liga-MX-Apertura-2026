import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useQuery } from "@tanstack/react-query";

export default function Profile() {
  const { user } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const { data: users } = useQuery({
    queryKey: ["users"],
    enabled: !!user,
    queryFn: async () => {
      const response = await fetch("/api/users", {
        credentials: "include",
      });
  
      if (!response.ok) {
        throw new Error("No se pudieron cargar los usuarios");
      }
  
      return response.json();
    },
  });  
  
  const { data, isLoading, error } = useQuery({
    queryKey: ["profile", selectedUserId ?? user?.id],
    enabled: !!user,
    queryFn: async () => {
      const profileUserId = selectedUserId ?? user!.id;
      const response = await fetch(`/api/profile/${profileUserId}`, {
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

      {/* Selector */}
      <div className="space-y-2">
      
        <label className="text-sm font-medium">
          Ver perfil de
        </label>
      
        <select
          className="w-full max-w-sm rounded-lg border p-2"
          value={selectedUserId ?? user!.id}
          onChange={(e) => setSelectedUserId(Number(e.target.value))}
        >
          {users?.map((u: any) => (
            <option
              key={u.id}
              value={u.id}
            >
              {u.displayName}
            </option>
          ))}
        </select>
      
      </div>
      
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
      
      {/* Estilo de Juego */}
      <div className="space-y-4">

        <h2 className="text-xl font-bold">
          📊 Mi Estilo de Juego
        </h2>


        <div className="grid md:grid-cols-3 gap-4">


          {/* Local */}
          <div className="border rounded-xl p-4">
          
            <p className="text-sm text-muted-foreground">
              🏟️ Especialista Local
            </p>
          
            <p className="text-3xl font-bold mt-2">
              {data.estilo.local.efectividad}%
            </p>
          
            <p className="text-sm">
              {data.estilo.local.aciertos} de{" "}
              {data.estilo.local.intentos}
              {" "}aciertos
            </p>
          
            {!data.estilo.local.muestraSuficiente && (
              <p className="text-sm text-muted-foreground mt-2">
                ⚠️ Muestra pequeña
              </p>
            )}
          
          </div>



          {/* Visitante */}
          <div className="border rounded-xl p-4">

            <p className="text-sm text-muted-foreground">
              ✈️ Especialista Visitante
            </p>

            <p className="text-3xl font-bold mt-2">
              {data.estilo.visitante.efectividad}%
            </p>

            <p className="text-sm">
              {data.estilo.visitante.aciertos} de{" "}
              {data.estilo.visitante.intentos}
              {" "}aciertos
            </p>

            {!data.estilo.visitante.muestraSuficiente && (
              <p className="text-sm text-muted-foreground mt-2">
                ⚠️ Muestra pequeña
              </p>
            )}            

          </div>



          {/* Empate */}
          <div className="border rounded-xl p-4">

            <p className="text-sm text-muted-foreground">
              🤝 Especialista Empates
            </p>

            <p className="text-3xl font-bold mt-2">
              {data.estilo.empate.efectividad}%
            </p>

            <p className="text-sm">
              {data.estilo.empate.aciertos} de{" "}
              {data.estilo.empate.intentos}
              {" "}aciertos
            </p>
            
            {!data.estilo.empate.muestraSuficiente && (
              <p className="text-sm text-muted-foreground mt-2">
                ⚠️ Muestra pequeña
              </p>
            )}
            
          </div>

        </div>

      </div> 
      
      {/* Equipos */}
      <div className="space-y-4">

        <h2 className="text-xl font-bold">
          Mis Equipos
        </h2>


        <div className="grid md:grid-cols-2 gap-4">


          <div className="border rounded-xl p-4">

            <p className="text-sm text-muted-foreground">
              🟢 Especialista
            </p>


            {data.equipos.especialista ? (
              <>
                <p className="text-2xl font-bold mt-2">
                  {data.equipos.especialista.equipo}
                </p>

                <p className="text-muted-foreground">
                  {data.equipos.especialista.efectividad}% efectividad
                </p>

                <p className="text-sm">
                  {data.equipos.especialista.aciertos} de {data.equipos.especialista.partidos} aciertos
                </p>
              </>
            ) : (
              <p className="text-muted-foreground mt-2">
                Aún no hay suficientes datos
              </p>
            )}

          </div>



          <div className="border rounded-xl p-4">

            <p className="text-sm text-muted-foreground">
              🔴 Tu pesadilla
            </p>


            {data.equipos.pesadilla ? (
              <>
                <p className="text-2xl font-bold mt-2">
                  {data.equipos.pesadilla.equipo}
                </p>

                <p className="text-muted-foreground">
                  {data.equipos.pesadilla.efectividad}% efectividad
                </p>

                <p className="text-sm">
                  {data.equipos.pesadilla.aciertos} de {data.equipos.pesadilla.partidos} aciertos
                </p>
              </>
            ) : (
              <p className="text-muted-foreground mt-2">
                Aún no hay suficientes datos
              </p>
            )}

          </div>


        </div>

      </div>


    </div>
  );
}

