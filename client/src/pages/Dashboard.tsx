import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardStats from "@/components/DashboardStats";
import TipsList from "@/components/TipsList";
import { LayoutDashboard, QrCode, LogOut } from "lucide-react";

export default function Dashboard() {
  const [location] = useLocation();

  const mockStats = {
    today: 2450,
    week: 15680,
    month: 48920,
  };

  const mockTips = [
    {
      id: "1",
      amountGrossCents: 500,
      amountNetCents: 480,
      currency: "USD",
      status: "succeeded" as const,
      note: "Great service, thank you!",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: "2",
      amountGrossCents: 1000,
      amountNetCents: 970,
      currency: "USD",
      status: "succeeded" as const,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    },
    {
      id: "3",
      amountGrossCents: 200,
      amountNetCents: 190,
      currency: "USD",
      status: "succeeded" as const,
      note: "Keep up the good work! You made my day better.",
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  ];

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
              <Button variant="ghost" size="sm" data-testid="button-logout">
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

          <DashboardStats stats={mockStats} />

          <Card>
            <CardHeader>
              <CardTitle>Recent Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <TipsList tips={mockTips} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
