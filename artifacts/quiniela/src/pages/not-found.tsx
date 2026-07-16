import { Link } from "wouter";
import { Trophy } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-center p-4">
      <Trophy className="h-24 w-24 text-muted-foreground/30 mb-6" />
      <h1 className="text-6xl font-display font-bold text-foreground mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-muted-foreground mb-8">Fuera de Lugar</h2>
      <p className="text-lg text-muted-foreground max-w-md mb-10">
        La página que estás buscando no existe o fue movida a otra cancha.
      </p>
      <Link 
        href="/dashboard" 
        className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 px-8 rounded-lg transition-all"
      >
        Volver al Inicio
      </Link>
    </div>
  );
}
