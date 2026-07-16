import { useState } from "react";
import { useListUsers, useCreateUser, useDeleteUser, useUpdateUser } from "@workspace/api-client-react";
import { Users, Trash2, Plus, Shield, User as UserIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AdminUsers() {
  const { data: users, isLoading } = useListUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Form State
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<'admin' | 'player'>('player');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUser.mutate({ data: { username, displayName, password, role } }, {
      onSuccess: () => {
        toast({ title: "Usuario creado exitosamente" });
        setIsCreateOpen(false);
        queryClient.invalidateQueries({ queryKey: ["/api/users"] });
        // Reset form
        setUsername(""); setDisplayName(""); setPassword(""); setRole("player");
      },
      onError: (err) => {
        toast({ title: "Error", description: (err.data as any)?.error || "No se pudo crear", variant: "destructive" });
      }
    });
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteUser.mutate({ id: deleteId }, {
      onSuccess: () => {
        toast({ title: "Usuario eliminado" });
        setDeleteId(null);
        queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      },
      onError: (err) => {
        toast({ title: "Error", description: (err.data as any)?.error || "No se pudo eliminar", variant: "destructive" });
        setDeleteId(null);
      }
    });
  };

  const toggleRole = (userId: number, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'player' : 'admin';
    updateUser.mutate({ id: userId, data: { role: newRole } }, {
      onSuccess: () => {
        toast({ title: "Rol actualizado" });
        queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      },
      onError: (err) => {
        toast({ title: "Error", description: "No se pudo cambiar el rol", variant: "destructive" });
      }
    });
  };

  if (isLoading) return <div className="p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center">
            <Users className="h-8 w-8 mr-3 text-primary" />
            Gestión de Jugadores
          </h1>
          <p className="text-muted-foreground mt-1">Administra los accesos y roles de la liga.</p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg font-medium flex items-center shadow-sm"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nuevo Jugador
        </button>
      </div>

      <div className="bg-card rounded-xl border border-card-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border/50 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Jugador</th>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {users?.map(u => (
                <tr key={u.id} className="hover:bg-muted/30">
                  <td className="px-4 py-4 font-medium text-foreground">{u.displayName}</td>
                  <td className="px-4 py-4 text-muted-foreground">{u.username}</td>
                  <td className="px-4 py-4">
                    <span className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                      u.role === 'admin' 
                        ? "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800" 
                        : "bg-muted text-muted-foreground border-border"
                    )}>
                      {u.role === 'admin' ? <Shield className="w-3 h-3 mr-1" /> : <UserIcon className="w-3 h-3 mr-1" />}
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => toggleRole(u.id, u.role)}
                        className="text-xs font-medium px-3 py-1.5 border rounded-md hover:bg-muted transition-colors"
                      >
                        Hacer {u.role === 'admin' ? 'Jugador' : 'Admin'}
                      </button>
                      <button
                        onClick={() => setDeleteId(u.id)}
                        className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Jugador</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre a Mostrar</label>
              <input required type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-primary focus:outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Usuario</label>
              <input required minLength={3} type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-primary focus:outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Contraseña</label>
              <input required minLength={6} type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-primary focus:outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Rol</label>
              <select value={role} onChange={e => setRole(e.target.value as any)} className="w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-primary focus:outline-none bg-background">
                <option value="player">Jugador Regular</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <DialogFooter>
              <button type="submit" disabled={createUser.isPending} className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium hover:bg-primary/90 mt-4">
                {createUser.isPending ? "Creando..." : "Crear Jugador"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar jugador?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán todos sus pronósticos y puntos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar Definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
