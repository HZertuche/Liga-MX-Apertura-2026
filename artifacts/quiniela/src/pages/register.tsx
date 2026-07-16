import { useState } from "react";
import { useRegister, getGetMeQueryKey } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Register() {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const registerMutation = useRegister();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Error", description: "La contraseña debe tener al menos 6 caracteres", variant: "destructive" });
      return;
    }
    
    registerMutation.mutate({ data: { username, displayName, password } }, {
      onSuccess: () => {
        // Refetch user data and navigate
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({ title: "¡Bienvenido!", description: "Tu cuenta ha sido creada exitosamente." });
        setLocation("/dashboard");
      },
      onError: (err) => {
        toast({
          title: "Error de registro",
          description: (err.data as any)?.error || "No se pudo crear la cuenta",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left Panel: Branding */}
      <div className="hidden lg:flex flex-col flex-1 bg-primary text-primary-foreground p-12 justify-between relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1508344928928-7137b29de216?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay"></div>
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-primary via-primary/80 to-transparent"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <Trophy className="h-10 w-10 text-secondary" />
            <span className="font-display font-bold text-2xl tracking-tight text-white">LIGA MX POOL</span>
          </div>
        </div>

        <div className="relative z-10 max-w-lg">
          <h1 className="text-5xl font-display font-bold leading-tight mb-6 text-white">
            Únete a la liga. <br />
            <span className="text-secondary">Haz historia.</span>
          </h1>
          <p className="text-primary-foreground/80 text-lg leading-relaxed">
            Regístrate, arma tus pronósticos y compite por la gloria. La temporada está por comenzar y cada punto cuenta.
          </p>
        </div>
      </div>

      {/* Right Panel: Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 sm:p-12 relative">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:hidden gap-2 mb-8 text-primary">
              <Trophy className="h-8 w-8 text-secondary" />
              <span className="font-display font-bold text-xl tracking-tight">LIGA MX POOL</span>
            </div>
            <h2 className="text-3xl font-display font-bold text-foreground">Crear Cuenta</h2>
            <p className="text-muted-foreground mt-2">Registra tus datos para participar.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 mt-8">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Usuario</label>
              <input
                type="text"
                required
                minLength={3}
                className="w-full px-4 py-3 bg-input/30 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="ej: juanperez123"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Mínimo 3 caracteres, sin espacios.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Nombre a Mostrar</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 bg-input/30 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="ej: Juan Pérez"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Así te verán los demás jugadores en la tabla.</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Contraseña</label>
              <input
                type="password"
                required
                minLength={6}
                className="w-full px-4 py-3 bg-input/30 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Mínimo 6 caracteres.</p>
            </div>

            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-4 rounded-lg transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 flex justify-center items-center mt-2"
            >
              {registerMutation.isPending ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                "Registrarse"
              )}
            </button>
          </form>

          <div className="text-center mt-6">
            <p className="text-muted-foreground text-sm">
              ¿Ya tienes una cuenta?{" "}
              <Link href="/" className="text-primary font-semibold hover:underline">
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
