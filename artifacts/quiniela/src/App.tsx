import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { AuthProvider } from '@/contexts/auth-context';
import { Layout } from '@/components/layout';
import { ProtectedRoute, PublicRoute } from '@/components/auth-routes';
import NotFound from '@/pages/not-found';

import Login from '@/pages/login';
import Register from '@/pages/register';
import Dashboard from '@/pages/dashboard';
import Jornadas from '@/pages/jornadas';
import JornadaDetail from '@/pages/jornadas-detail';
import GeneralStandings from '@/pages/standings-general';
import MatchupStandings from '@/pages/standings-matchups';
import PlayerHistory from '@/pages/history';
import AdminUsers from '@/pages/admin-users';
import HallOfFame from '@/pages/hall-of-fame';
import Profile from '@/pages/profile';
import AdminJornadas from '@/pages/admin-jornadas';
import AdminMatches from '@/pages/admin-matches';
import AdminMatchups from '@/pages/admin-matchups';
import AdminPredictions from '@/pages/admin-predictions';
import WeeklyStandings from '@/pages/standings-weekly';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        {/* Public Routes */}
        <Route path="/">
          <PublicRoute>
            <Login />
          </PublicRoute>
        </Route>
        <Route path="/register">
          <PublicRoute>
            <Register />
          </PublicRoute>
        </Route>

        {/* Protected Player Routes */}
        <Route path="/dashboard">
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        </Route>
        <Route path="/jornadas">
          <ProtectedRoute>
            <Jornadas />
          </ProtectedRoute>
        </Route>
        <Route path="/jornadas/:id">
          <ProtectedRoute>
            <JornadaDetail />
          </ProtectedRoute>
        </Route>
        <Route path="/standings/general">
          <ProtectedRoute>
            <GeneralStandings />
          </ProtectedRoute>
        </Route>
        <Route path="/standings/weekly">
          <ProtectedRoute>
            <WeeklyStandings />
          </ProtectedRoute>
        </Route>
        <Route path="/standings/matchups">
          <ProtectedRoute>
            <MatchupStandings />
          </ProtectedRoute>
        </Route>
        <Route path="/history/:userId">
          <ProtectedRoute>
            <PlayerHistory />
          </ProtectedRoute>
        </Route>

        <Route path="/hall-of-fame">
          <ProtectedRoute>
            <HallOfFame />
          </ProtectedRoute>
        </Route>

        <Route path="/profile">
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        </Route>      

        {/* Protected Admin Routes */}
        <Route path="/admin/users">
          <ProtectedRoute adminOnly>
            <AdminUsers />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/jornadas">
          <ProtectedRoute adminOnly>
            <AdminJornadas />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/matches">
          <ProtectedRoute adminOnly>
            <AdminMatches />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/matchups">
          <ProtectedRoute adminOnly>
            <AdminMatchups />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/predictions">
          <ProtectedRoute adminOnly>
            <AdminPredictions />
          </ProtectedRoute>
        </Route>

        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
