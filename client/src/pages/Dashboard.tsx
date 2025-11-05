import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardStats from "@/components/DashboardStats";
import TipsList from "@/components/TipsList";
import { LayoutDashboard, QrCode, LogOut, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

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

          {!worker.tipsEnabled && (
            <Card className="border-yellow-500/50 bg-yellow-500/10">
              <CardContent className="p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                    Complete Stripe Onboarding
                  </h3>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                    You need to complete your Stripe Connect onboarding to start receiving tips.
                  </p>
                  <Link href="/onboarding">
                    <Button variant="outline" size="sm" className="mt-3">
                      Complete Onboarding
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
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
