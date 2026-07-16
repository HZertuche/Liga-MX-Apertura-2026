import { Redirect } from 'wouter';
import { useAuth } from '@/contexts/auth-context';

export function ProtectedRoute({ children, adminOnly }: { children: React.ReactNode, adminOnly?: boolean }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-sm font-medium animate-pulse">Cargando...</p>
      </div>
    );
  }
  
  if (!user) {
    return <Redirect to="/" />;
  }
  
  if (adminOnly && user.role !== 'admin') {
    return <Redirect to="/dashboard" />;
  }
  
  return <>{children}</>;
}

export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (user) {
    return <Redirect to="/dashboard" />;
  }
  
  return <>{children}</>;
}
