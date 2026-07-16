import { useState } from "react";
import { useListJornadas, useCreateJornada, useUpdateJornada } from "@workspace/api-client-react";
import { Settings, Plus, PlayCircle, CheckCircle2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { formatShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function AdminJornadas() {
  const { data: jornadas, isLoading } = useListJornadas();
  const createJornada = useCreateJornada();
  const updateJornada = useUpdateJornada();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  // Form State
  const [number, setNumber] = useState(1);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createJornada.mutate({ 
      data: { 
        number, 
        name, 
        startDate: startDate || null, 
        endDate: endDate || null 
      } 
    }, {
      onSuccess: () => {
        toast({ title: "Jornada creada" });
        setIsCreateOpen(false);
        queryClient.invalidateQueries({ queryKey: ["/api/jornadas"] });
        // Increment number for next easy creation
        setNumber(prev => prev + 1);
        setName(`Jornada ${number + 1}`);
      },
      onError: (err) => {
        toast({ title: "Error", description: (err.data as any)?.error || "No se pudo crear", variant: "destructive" });
      }
    });
  };

  const handleUpdateStatus = (id: number, currentStatus: string, jornadaNumber: number, jornadaName: string) => {
    // Simple rotation: upcoming -> active -> finished -> upcoming
    const nextStatus = currentStatus === 'upcoming' ? 'active' : currentStatus === 'active' ? 'finished' : 'upcoming';
    
    updateJornada.mutate({ id, data: { number: jornadaNumber, name: jornadaName } as any }, {
      onSuccess: () => {
        toast({ title: "Estado actualizado" });
        queryClient.invalidateQueries({ queryKey: ["/api/jornadas"] });
      },
      onError: () => toast({ title: "Error", description: "No se pudo actualizar", variant: "destructive" })
    });
  };

  if (isLoading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center">
            <Settings className="h-8 w-8 mr-3 text-primary" />
            Admin: Jornadas
          </h1>
          <p className="text-muted-foreground mt-1">Crea las jornadas de la liga (1 a 17) y administra su estado.</p>
        </div>
        <button
          onClick={() => {
            setNumber(jornadas ? jornadas.length + 1 : 1);
            setName(`Jornada ${jornadas ? jornadas.length + 1 : 1}`);
            setIsCreateOpen(true);
          }}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg font-medium flex items-center shadow-sm"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nueva Jornada
        </button>
      </div>

      <div className="grid gap-4">
        {jornadas?.length === 0 ? (
          <div className="p-12 text-center border border-dashed rounded-xl text-muted-foreground">
            No hay jornadas creadas.
          </div>
        ) : (
          jornadas?.map(jornada => (
            <div key={jornada.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-card border rounded-xl shadow-sm gap-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center font-bold text-lg">
                  {jornada.number}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{jornada.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatShortDate(jornada.startDate)} - {formatShortDate(jornada.endDate)} • {jornada.matchCount} partidos
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => handleUpdateStatus(jornada.id, jornada.status, jornada.number, jornada.name)}
                  className={cn(
                    "flex-1 sm:flex-none flex items-center justify-center px-4 py-2 rounded-md font-medium text-sm border transition-colors",
                    jornada.status === 'active' ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20" :
                    jornada.status === 'finished' ? "bg-muted text-muted-foreground hover:bg-muted/80" :
                    "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                  )}
                >
                  {jornada.status === 'active' ? <><PlayCircle className="w-4 h-4 mr-2" /> Activa</> :
                   jornada.status === 'finished' ? <><CheckCircle2 className="w-4 h-4 mr-2" /> Finalizada</> :
                   <><Clock className="w-4 h-4 mr-2" /> Próxima</>}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Jornada</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-1 space-y-2">
                <label className="text-sm font-medium">Nº</label>
                <input required type="number" min={1} max={20} value={number} onChange={e => setNumber(Number(e.target.value))} className="w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-primary focus:outline-none" />
              </div>
              <div className="col-span-3 space-y-2">
                <label className="text-sm font-medium">Nombre</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-primary focus:outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Fecha Inicio (Opcional)</label>
                <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-primary focus:outline-none text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Fecha Fin (Opcional)</label>
                <input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-primary focus:outline-none text-sm" />
              </div>
            </div>
            <DialogFooter>
              <button type="submit" disabled={createJornada.isPending} className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium hover:bg-primary/90 mt-4">
                {createJornada.isPending ? "Guardando..." : "Guardar Jornada"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
