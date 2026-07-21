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
      

      {/* Tarjeta principal del jugador */}
      
      <div className="border rounded-xl p-4 bg-card space-y-4">
      
        <div>
          <h1 className="text-2xl font-bold">
            👤 {data.jugador}
          </h1>
      
          <p className="text-xs text-muted-foreground">
            Perfil del jugador
          </p>
        </div>
      
      
        <div className="flex items-center justify-between">
      
          <div>
            <p className="text-xs text-muted-foreground">
              Ranking actual
            </p>
      
            <p className="text-xl font-bold">
              🏆 #{data.ranking?.posicion ?? "-"}
            </p>
      
            <p className="text-xs text-muted-foreground">
              de {data.ranking?.total ?? "-"} jugadores
            </p>
          </div>
      
      
          <div className="text-right">
      
            <p className="text-xs text-muted-foreground">
              ⭐ Puntos
            </p>
      
            <p className="text-3xl font-bold text-primary">
              {data.resumen.puntos}
            </p>
      
          </div>
      
        </div>
      
      
        <div className="grid grid-cols-3 gap-2">
      
      
          <div className="border rounded-lg p-2 text-center">
      
            <p className="text-xs text-muted-foreground">
              🎯 Exactos
            </p>
      
            <p className="text-lg font-bold">
              {data.resumen.exactos}
            </p>
      
          </div>
      
      
      
          <div className="border rounded-lg p-2 text-center">
      
            <p className="text-xs text-muted-foreground">
              ✅ Aciertos
            </p>
      
            <p className="text-lg font-bold">
              {data.resumen.aciertos}
            </p>
      
          </div>
      
      
      
          <div className="border rounded-lg p-2 text-center">
      
            <p className="text-xs text-muted-foreground">
              📈 Efect.
            </p>
      
            <p className="text-lg font-bold">
              {data.resumen.efectividad}%
            </p>
      
          </div>
      
      
        </div>
      
      
      </div>




      

      
      {/* Logros */}
      
      <div className="space-y-2">
      
        <h2 className="text-sm font-bold">
          Mis Logros
        </h2>
      
      
        <div className="grid grid-cols-2 gap-2">
      
      
          <div className="border rounded-lg p-1.5">
      
            <p className="text-[11px] text-muted-foreground">
              🔒 Candado
            </p>
      
            <p className="text-xl font-bold">
              {data.logros.candado}
            </p>
      
            <p className="text-[11px] text-muted-foreground">
              rachas acertando
            </p>
      
          </div>
      
      
      
          <div className="border rounded-lg p-1.5">
      
            <p className="text-[11px] text-muted-foreground">
              🤡 Farol
            </p>
      
            <p className="text-xl font-bold">
              {data.logros.farol}
            </p>
      
            <p className="text-[11px] text-muted-foreground">
              rachas sin puntos
            </p>
      
          </div>
      
      
      
          <div className="border rounded-lg p-1.5">
      
            <p className="text-[11px] text-muted-foreground">
              🎯 Cazador
            </p>
      
            <p className="text-xl font-bold">
              J{data.logros.cazadorPuntos.jornada}
            </p>
      
            <p className="text-[11px] text-muted-foreground">
              {data.logros.cazadorPuntos.puntos} puntos
            </p>
      
          </div>
      
      
        </div>
      
      </div>
      
    
      {/* Mis Récords */}
      
      <div className="space-y-2">
      
        <h2 className="text-sm font-bold">
          🏆 Mis Récords
        </h2>
      
      
        <div className="grid grid-cols-2 gap-2">
      
      
          {/* Especialista */}
      
          <div className="border rounded-lg p-1.5">
      
            <p className="text-[11px] text-muted-foreground">
              🟢 Especialista
            </p>
      
            {data.records?.especialista ? (
              <>
                <p className="text-sm font-bold mt-1 truncate">
                  {data.records.especialista.equipo}
                </p>
      
                <p className="text-xs">
                  {data.records.especialista.efectividad}%
                </p>
              </>
            ) : (
              <p className="text-xs mt-1">
                Sin datos
              </p>
            )}
      
          </div>
      
      
      
          {/* Pesadilla */}
      
          <div className="border rounded-lg p-1.5">
      
            <p className="text-[11px] text-muted-foreground">
              😈 Pesadilla
            </p>
      
            {data.records?.pesadilla ? (
              <>
                <p className="text-sm font-bold mt-1 truncate">
                  {data.records.pesadilla.equipo}
                </p>
      
                <p className="text-xs">
                  {data.records.pesadilla.efectividad}%
                </p>
              </>
            ) : (
              <p className="text-xs mt-1">
                Sin datos
              </p>
            )}
      
          </div>
      
      
      
          {/* Sorpresas */}
      
          <div className="border rounded-lg p-1.5">
      
            <p className="text-[11px] text-muted-foreground">
              💥 Sorpresas
            </p>
      
            <p className="text-xl font-bold mt-1">
              {data.records?.detectorSorpresas?.aciertos ?? 0}
            </p>
      
            <p className="text-xs">
              aciertos
            </p>
      
          </div>
      
      
        </div>
      
      </div>      
      
      
          {/* Riesgo */}
          
          <div className="border rounded-lg p-1.5">
          
            <p className="text-xs text-muted-foreground">
              🎲 Riesgo
            </p>
          
            <p className="text-sm font-bold mt-1">
              {data.records?.riesgo?.perfil?.nivel ?? "Sin datos"}
            </p>
          
          </div> 
      
      {/* Estilo de Juego */}
      <div className="space-y-3">
      
        <h2 className="text-base font-bold">
          📊 Mi Estilo de Juego
        </h2>
      
      
        <div className="grid grid-cols-3 gap-2">
      
      
          {/* Local */}
          <div className="border rounded-lg p-2">
      
            <p className="text-[11px] text-muted-foreground">
              🏟️ Local
            </p>
      
            <p className="text-lg font-bold mt-1">
              {data.estilo.local.efectividad}%
            </p>
      
            <p className="text-[11px]">
              {data.estilo.local.aciertos} de {data.estilo.local.intentos}
            </p>
      
            {!data.estilo.local.muestraSuficiente && (
              <p className="text-[10px] text-muted-foreground mt-1">
                ⚠️ Muestra pequeña
              </p>
            )}
      
          </div>
      
      
      
          {/* Visitante */}
          <div className="border rounded-lg p-2">
      
            <p className="text-[11px] text-muted-foreground">
              ✈️ Visitante
            </p>
      
            <p className="text-lg font-bold mt-1">
              {data.estilo.visitante.efectividad}%
            </p>
      
            <p className="text-[11px]">
              {data.estilo.visitante.aciertos} de {data.estilo.visitante.intentos}
            </p>
      
            {!data.estilo.visitante.muestraSuficiente && (
              <p className="text-[10px] text-muted-foreground mt-1">
                ⚠️ Muestra pequeña
              </p>
            )}
      
          </div>
      
      
      
          {/* Empate */}
          <div className="border rounded-lg p-2">
      
            <p className="text-[11px] text-muted-foreground">
              🤝 Empate
            </p>
      
            <p className="text-lg font-bold mt-1">
              {data.estilo.empate.efectividad}%
            </p>
      
            <p className="text-[11px]">
              {data.estilo.empate.aciertos} de {data.estilo.empate.intentos}
            </p>
      
            {!data.estilo.empate.muestraSuficiente && (
              <p className="text-[10px] text-muted-foreground mt-1">
                ⚠️ Muestra pequeña
              </p>
            )}
      
          </div>
      
      
        </div>
      
      </div>



      {/* Perfil de Riesgo */}
      
      <div className="space-y-3">
      
        <h2 className="text-base font-bold">
          🎲 Perfil de Riesgo
        </h2>
      
      
        <div className="border rounded-lg p-2">
      
          <p className="text-xl font-bold">
            {data.riesgo.perfil.nivel}
          </p>
      
      
          <p className="text-xs text-muted-foreground mt-1">
            {data.riesgo.perfil.descripcion}
          </p>
      
      
          <div className="grid grid-cols-3 gap-2 mt-2">
      
      
            <div>
              <p className="text-[11px] text-muted-foreground">
                🏟️ Local
              </p>
      
              <p className="text-base font-bold">
                {data.riesgo.distribucion.local}%
              </p>
            </div>
      
      
            <div>
              <p className="text-[11px] text-muted-foreground">
                ✈️ Visitante
              </p>
      
              <p className="text-base font-bold">
                {data.riesgo.distribucion.visitante}%
              </p>
            </div>
      
      
            <div>
              <p className="text-[11px] text-muted-foreground">
                🤝 Empate
              </p>
      
              <p className="text-base font-bold">
                {data.riesgo.distribucion.empate}%
              </p>
            </div>
      
      
          </div>
      
        </div>
      
      </div>     
      {/* Detector de Sorpresas */}
      <div className="space-y-2">
      
        <h2 className="text-sm font-bold">
          💥 Detector de Sorpresas
        </h2>
      
      
        <div className="border rounded-lg p-1.5">
      
          <p className="text-xl font-bold">
            {data.detectorSorpresas.aciertos}
          </p>
      
      
          <p className="text-xs text-muted-foreground">
            resultados inesperados acertados
          </p>
      
      
          <p className="text-xs mt-1">
            Especialista encontrando resultados
            que pocos esperaban.
          </p>
      
        </div>
      
      </div>
      
      
      {/* Equipos */}
      <div className="space-y-2">
      
        <h2 className="text-sm font-bold">
          Mis Equipos
        </h2>
      
      
        <div className="grid grid-cols-2 gap-2">
      
      
          <div className="border rounded-lg p-1.5">
      
            <p className="text-xs text-muted-foreground">
              🟢 Especialista
            </p>
      
      
            {data.equipos.especialista ? (
              <>
                <p className="text-lg font-bold mt-1">
                  {data.equipos.especialista.equipo}
                </p>
      
                <p className="text-xs text-muted-foreground">
                  {data.equipos.especialista.efectividad}% efectividad
                </p>
      
                <p className="text-[11px]">
                  {data.equipos.especialista.aciertos} de {data.equipos.especialista.partidos}
                </p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">
                Sin datos
              </p>
            )}
      
          </div>
      
      
      
          <div className="border rounded-lg p-1.5">
      
            <p className="text-xs text-muted-foreground">
              🔴 Tu pesadilla
            </p>
      
      
            {data.equipos.pesadilla ? (
              <>
                <p className="text-lg font-bold mt-1">
                  {data.equipos.pesadilla.equipo}
                </p>
      
                <p className="text-xs text-muted-foreground">
                  {data.equipos.pesadilla.efectividad}% efectividad
                </p>
      
                <p className="text-[11px]">
                  {data.equipos.pesadilla.aciertos} de {data.equipos.pesadilla.partidos}
                </p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">
                Aun no hay suficientes datos
              </p>
            )}
      
          </div>
      
      
        </div>
      
      </div>
    

    </div>
  );
}

