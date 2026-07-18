import { useAuth } from '@/contexts/auth-context';
import { useLogout } from '@workspace/api-client-react';
import { Link, useLocation } from 'wouter';
import { LayoutDashboard, CalendarDays, Trophy, Swords, History, Users, Settings, LogOut, ChevronLeft, Menu, ClipboardList, Star } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const logoutMutation = useLogout();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();

  if (!user) {
    return <>{children}</>;
  }

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        setLocation('/');
      },
      onError: () => {
        toast({ title: 'Error', description: 'No se pudo cerrar sesión.', variant: 'destructive' });
      }
    });
  };

  const navItems = [
    { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
    { href: '/jornadas', label: 'Jornadas', icon: CalendarDays },
    { href: '/standings/general', label: 'Tabla General', icon: Trophy },
    { href: '/standings/weekly', label: 'Premio Semanal', icon: Star },
    { href: '/standings/matchups', label: 'Enfrentamientos', icon: Swords },
    { href: `/history/${user.id}`, label: 'Mi Historial', icon: History },
    { href: '/hall-of-fame', label: 'Salón de la Fama', icon: Trophy },
  ];

  const adminItems = [
    { href: '/admin/users', label: 'Jugadores', icon: Users },
    { href: '/admin/jornadas', label: 'Jornadas Admin', icon: Settings },
    { href: '/admin/matches', label: 'Partidos', icon: CalendarDays },
    { href: '/admin/matchups', label: 'Admin Enfrentamientos', icon: Swords },
    { href: '/admin/predictions', label: 'Quinielas', icon: ClipboardList },
  ];

  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed md:static top-0 left-0 z-50 h-full w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-transform duration-300 flex flex-col",
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border/50 shrink-0">
          <Trophy className="h-6 w-6 text-sidebar-primary mr-3" />
          <span className="font-display font-bold text-lg tracking-tight">LIGA MX POOL</span>
          <button 
            className="ml-auto md:hidden text-sidebar-foreground/70"
            onClick={() => setSidebarOpen(false)}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-1 px-3">
          <div className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider mb-2 px-3">Navegación</div>
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== '/dashboard' && location.startsWith(item.href));
            return (
              <Link 
                key={item.href} 
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm" 
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5 mr-3", isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/50")} />
                {item.label}
              </Link>
            )
          })}

          {user.role === 'admin' && (
            <>
              <div className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider mt-6 mb-2 px-3">Administración</div>
              {adminItems.map((item) => {
                const isActive = location.startsWith(item.href);
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm" 
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <item.icon className={cn("h-5 w-5 mr-3", isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/50")} />
                    {item.label}
                  </Link>
                )
              })}
            </>
          )}
        </div>

        <div className="p-4 border-t border-sidebar-border/50 shrink-0">
          <div className="flex items-center mb-4 px-2">
            <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-foreground font-bold shrink-0">
              {user.displayName.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium truncate">{user.displayName}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">{user.username}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="h-16 md:hidden flex items-center px-4 border-b bg-card shrink-0">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="text-foreground p-2 -ml-2 rounded-md hover:bg-muted"
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="font-display font-bold text-lg ml-2">LIGA MX POOL</span>
        </header>

        <main className="flex-1 overflow-y-auto bg-muted/30">
          {children}
        </main>
      </div>
    </div>
  );
}
