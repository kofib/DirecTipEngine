import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, RequireAuth, RequireAdmin } from "@/hooks/useAuth";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import TipPage from "@/pages/TipPage";
import Dashboard from "@/pages/Dashboard";
import QRPage from "@/pages/QRPage";
import PayoutSettings from "@/pages/PayoutSettings";
import Onboarding from "@/pages/Onboarding";
import AdminPanel from "@/pages/AdminPanel";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/onboarding">
        <RequireAuth>
          <Onboarding />
        </RequireAuth>
      </Route>
      <Route path="/dashboard">
        <RequireAuth>
          <Dashboard />
        </RequireAuth>
      </Route>
      <Route path="/dashboard/qr">
        <RequireAuth>
          <QRPage />
        </RequireAuth>
      </Route>
      <Route path="/dashboard/settings">
        <RequireAuth>
          <PayoutSettings />
        </RequireAuth>
      </Route>
      <Route path="/admin">
        <RequireAdmin>
          <AdminPanel />
        </RequireAdmin>
      </Route>
      <Route path="/demo" component={TipPage} />
      <Route path="/:handle" component={TipPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
