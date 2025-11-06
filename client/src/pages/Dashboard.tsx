import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardStats from "@/components/DashboardStats";
import TipsList from "@/components/TipsList";
import { LayoutDashboard, QrCode, LogOut, Settings } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import AccountStatusBanner from "@/components/AccountStatusBanner";

export default function Dashboard() {
  const [location, setLocation] = useLocation();
  const { worker, logout, isLoading } = useAuth();

  const { data: statsData } = useQuery({
    queryKey: ["/api/me/stats"],
    queryFn: api.tips.getMyStats,
    enabled: !!worker,
  });

  const { data: tipsData } = useQuery({
    queryKey: ["/api/me/tips"],
    queryFn: () => api.tips.getMyTips(),
    enabled: !!worker,
  });

  const { data: statusData } = useQuery({
    queryKey: ["/api/worker/connect/status"],
    queryFn: api.worker.getConnectStatus,
    enabled: !!worker && !worker.tipsEnabled,
    refetchInterval: 10000, // Poll for status updates if not enabled
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!worker) {
    setLocation("/onboarding");
    return null;
  }

  const stats = statsData || { today: 0, week: 0, month: 0 };
  const tips = tipsData?.tips || [];

  return (
    <div className="min-h-screen bg-muted/30">
      <nav className="bg-background border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">DirectTip</span>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/dashboard">
                <Button
                  variant={location === "/dashboard" ? "default" : "ghost"}
                  size="sm"
                  data-testid="link-dashboard"
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/dashboard/qr">
                <Button
                  variant={location === "/dashboard/qr" ? "default" : "ghost"}
                  size="sm"
                  data-testid="link-qr"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  My QR
                </Button>
              </Link>
              <Link href="/dashboard/settings">
                <Button
                  variant={location === "/dashboard/settings" ? "default" : "ghost"}
                  size="sm"
                  data-testid="link-settings"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={logout} data-testid="button-logout">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">
              Track your tips and earnings
            </p>
          </div>

          {!worker.tipsEnabled && statusData && (
            <AccountStatusBanner
              status={statusData}
              onCompleteOnboarding={() => setLocation("/dashboard/settings")}
            />
          )}

          <DashboardStats stats={stats} />

          <Card>
            <CardHeader>
              <CardTitle>Recent Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <TipsList tips={tips} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
