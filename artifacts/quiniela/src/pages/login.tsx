import { useState } from "react";
import { useLogin, getGetMeQueryKey } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const loginMutation = useLogin();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ data: { username, password } }, {
      onSuccess: () => {
        // Refetch user data and navigate
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setLocation("/dashboard");
      },
      onError: (err) => {
        toast({
          title: "Error de autenticación",
          description: (err.data as any)?.error || "Usuario o contraseña incorrectos",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left Panel: Branding */}
      <div className="hidden lg:flex flex-col flex-1 bg-primary text-primary-foreground p-12 justify-between relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1518605368461-1e128224b456?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay"></div>
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-primary via-primary/80 to-transparent"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <Trophy className="h-10 w-10 text-secondary" />
            <span className="font-display font-bold text-2xl tracking-tight text-white">LIGA MX POOL</span>
          </div>
        </div>

        <div className="relative z-10 max-w-lg">
          <h1 className="text-5xl font-display font-bold leading-tight mb-6 text-white">
            Apertura 2026. <br />
            <span className="text-secondary">Demuestra quién sabe más.</span>
          </h1>
          <p className="text-primary-foreground/80 text-lg leading-relaxed">
            Predice resultados, compite cara a cara cada jornada y domina la tabla general en la quiniela definitiva del fútbol mexicano.
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
            <h2 className="text-3xl font-display font-bold text-foreground">Iniciar Sesión</h2>
            <p className="text-muted-foreground mt-2">Ingresa tus credenciales para acceder a la quiniela.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 mt-8">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Usuario</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 bg-input/30 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="Ingresa tu usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Contraseña</label>
              <input
                type="password"
                required
                className="w-full px-4 py-3 bg-input/30 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-4 rounded-lg transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 flex justify-center items-center"
            >
              {loginMutation.isPending ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                "Entrar a la Cancha"
              )}
            </button>
          </form>

          <div className="text-center mt-6">
            <p className="text-muted-foreground text-sm">
              ¿Aún no tienes cuenta?{" "}
              <Link href="/register" className="text-primary font-semibold hover:underline">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
