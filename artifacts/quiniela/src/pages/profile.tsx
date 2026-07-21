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
    <div className="max-w-5xl mx-auto p-3 md:p-6 space-y-5">

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

          <p className="text-2xl md:text-3xl font-bold">
            {data.resumen.puntos}
          </p>
        </div>

        <div className="rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">
            Efectividad
          </p>

          <p className="text-2xl md:text-3xl font-bold">
            {data.resumen.efectividad}%
          </p>
        </div>

        <div className="rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">
            Exactos
          </p>

          <p className="text-2xl md:text-3xl font-bold">
            {data.resumen.exactos}
          </p>
        </div>

        <div className="rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">
            Aciertos
          </p>

          <p className="text-2xl md:text-3xl font-bold">
            {data.resumen.aciertos}
          </p>
        </div>

      </div>

      {/* Logros */}
      <div className="space-y-4">
      
        <h2 className="text-xl font-bold">
          Mis Logros
        </h2>
      
        <div className="grid md:grid-cols-2 gap-4">
      
      
          <div className="border rounded-xl p-4">
            <p className="text-sm text-muted-foreground">
              🔒 Candado
            </p>
      
            <p className="text-2xl font-bold">
              {data.logros.candado}
            </p>
      
            <p className="text-sm text-muted-foreground">
              partidos consecutivos acertando
            </p>
          </div>
      
      
      
          <div className="border rounded-xl p-4">
            <p className="text-sm text-muted-foreground">
              💥 Farol
            </p>
      
            <p className="text-2xl font-bold">
              {data.logros.farol}
            </p>
      
            <p className="text-sm text-muted-foreground">
              partidos consecutivos sin puntos
            </p>
          </div>
      
      
      
          <div className="border rounded-xl p-4">
      
            <p className="text-sm text-muted-foreground">
              🎯 Cazador de Puntos
            </p>
      
            <p className="text-2xl font-bold">
              J{data.logros.cazadorPuntos.jornada}
            </p>
      
            <p className="text-sm text-muted-foreground">
              {data.logros.cazadorPuntos.puntos} puntos
            </p>
      
          </div>
      
      
        </div>
      
      </div>

      {/* Mis Récords */}
      
      <div className="space-y-4">
      
        <h2 className="text-xl font-bold">
          🔥 Mis Récords
        </h2>
      
      
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      
      
          {/* Especialista */}
      
          <div className="border rounded-xl p-3">
      
            <p className="text-xs text-muted-foreground">
              🟢 Especialista
            </p>
      
            {data.records?.especialista ? (
              <>
                <p className="text-lg font-bold mt-2">
                  {data.records.especialista.equipo}
                </p>
      
                <p className="text-sm">
                  {data.records.especialista.efectividad}%
                </p>
              </>
            ) : (
              <p className="text-sm mt-2">
                Sin datos
              </p>
            )}
      
          </div>
      
      
      
          {/* Pesadilla */}
      
          <div className="border rounded-xl p-3">
      
            <p className="text-xs text-muted-foreground">
              😈 Pesadilla
            </p>
      
            {data.records?.pesadilla ? (
              <>
                <p className="text-lg font-bold mt-2">
                  {data.records.pesadilla.equipo}
                </p>
      
                <p className="text-sm">
                  {data.records.pesadilla.efectividad}%
                </p>
              </>
            ) : (
              <p className="text-sm mt-2">
                Sin datos
              </p>
            )}
      
          </div>
      
      
      
          {/* Sorpresas */}
      
          <div className="border rounded-xl p-3">
      
            <p className="text-xs text-muted-foreground">
              💥 Sorpresas
            </p>
      
            <p className="text-2xl font-bold mt-2">
              {data.records?.detectorSorpresas?.aciertos ?? 0}
            </p>
      
            <p className="text-xs">
              aciertos
            </p>
      
          </div>
      
      
      
          {/* Riesgo */}
      
          <div className="border rounded-xl p-3">
      
            <p className="text-xs text-muted-foreground">
              🎲 Riesgo
            </p>
      
            <p className="text-lg font-bold mt-2">
              {data.records?.riesgo?.perfil?.nivel ?? "Sin datos"}
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


      {/* Perfil de Riesgo */}
      <div className="space-y-4">

        <h2 className="text-xl font-bold">
          🎲 Perfil de Riesgo
        </h2>


        <div className="border rounded-xl p-4">

          <p className="text-2xl font-bold">
            {data.riesgo.perfil.nivel}
          </p>


          <p className="text-muted-foreground mt-2">
            {data.riesgo.perfil.descripcion}
          </p>


          <div className="grid grid-cols-3 gap-4 mt-6">


            <div>
              <p className="text-sm text-muted-foreground">
                🏟️ Local
              </p>

              <p className="text-xl font-bold">
                {data.riesgo.distribucion.local}%
              </p>
            </div>


            <div>
              <p className="text-sm text-muted-foreground">
                ✈️ Visitante
              </p>

              <p className="text-xl font-bold">
                {data.riesgo.distribucion.visitante}%
              </p>
            </div>


            <div>
              <p className="text-sm text-muted-foreground">
                🤝 Empate
              </p>

              <p className="text-xl font-bold">
                {data.riesgo.distribucion.empate}%
              </p>
            </div>


          </div>

        </div>

      </div>

      {/* Detector de Sorpresas */}
      <div className="space-y-4">

        <h2 className="text-xl font-bold">
          💥 Detector de Sorpresas
        </h2>


        <div className="border rounded-xl p-4">

          <p className="text-3xl font-bold">
            {data.detectorSorpresas.aciertos}
          </p>


          <p className="text-muted-foreground">
            resultados inesperados acertados
          </p>


          <p className="text-sm mt-3">
            Especialista encontrando resultados
            que pocos jugadores esperaban.
          </p>

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

