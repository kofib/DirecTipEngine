import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard, QrCode, LogOut, Settings, Loader2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import AccountStatusBanner from "@/components/AccountStatusBanner";
import ConnectOnboarding from "@/components/ConnectOnboarding";
import { queryClient } from "@/lib/queryClient";

export default function PayoutSettings() {
  const [location, setLocation] = useLocation();
  const { worker, logout, isLoading } = useAuth();
  const { toast } = useToast();
  const [embeddedClientSecret, setEmbeddedClientSecret] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const { data: statusData, isLoading: isLoadingStatus } = useQuery({
    queryKey: ["/api/worker/connect/status"],
    queryFn: api.worker.getConnectStatus,
    enabled: !!worker,
    refetchInterval: 10000, // Refresh every 10 seconds for status updates
  });

  const createSessionMutation = useMutation({
    mutationFn: api.worker.createConnectSession,
    onSuccess: (data) => {
      if (data.useEmbedded && data.embeddedClientSecret) {
        setEmbeddedClientSecret(data.embeddedClientSecret);
        setShowOnboarding(true);
      } else if (data.accountLinkUrl) {
        window.location.href = data.accountLinkUrl;
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create onboarding session",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!worker) {
    setLocation("/onboarding");
    return null;
  }

  const status = statusData || {
    accountCreated: false,
    chargesEnabled: false,
    payoutsEnabled: false,
    tipsEnabled: false,
    requirementsCurrentlyDue: [],
  };

  const handleCompleteOnboarding = () => {
    createSessionMutation.mutate();
  };

  const handleOnboardingExit = () => {
    setShowOnboarding(false);
    setEmbeddedClientSecret(null);
    queryClient.invalidateQueries({ queryKey: ["/api/worker/connect/status"] });
    queryClient.invalidateQueries({ queryKey: ["/api/me"] });
    toast({
      title: "Progress saved",
      description: "Your changes have been saved. Complete any remaining steps to activate your account.",
    });
  };

  // Show embedded onboarding flow
  if (showOnboarding && embeddedClientSecret) {
    return (
      <div className="min-h-screen bg-muted/30">
        <nav className="bg-background border-b sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold">DirectTip</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOnboardingExit}
                data-testid="button-exit-onboarding"
              >
                Save & Exit
              </Button>
            </div>
          </div>
        </nav>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold">Complete Your Account Setup</h1>
            <p className="text-muted-foreground mt-2">
              Verify your information and add payout details
            </p>
          </div>
          <ConnectOnboarding
            clientSecret={embeddedClientSecret}
            onExit={handleOnboardingExit}
          />
        </main>
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold mb-2">Account Settings</h1>
            <p className="text-muted-foreground">
              Manage your Stripe account and payout settings
            </p>
          </div>

          <AccountStatusBanner
            status={status}
            onCompleteOnboarding={handleCompleteOnboarding}
            isLoadingSession={createSessionMutation.isPending}
          />

          <Card data-testid="card-account-details">
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
              <CardDescription>
                Current status of your Stripe Connect account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Handle</p>
                  <p className="font-medium">@{worker.handle}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Display Name</p>
                  <p className="font-medium">{worker.displayName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Currency</p>
                  <p className="font-medium">{worker.currency}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Account Type</p>
                  <p className="font-medium">Stripe Connect Custom</p>
                </div>
              </div>

              {isLoadingStatus ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">Charges Enabled</p>
                    <p className={`font-medium ${status.chargesEnabled ? "text-green-600" : "text-yellow-600"}`}>
                      {status.chargesEnabled ? "Yes" : "No"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payouts Enabled</p>
                    <p className={`font-medium ${status.payoutsEnabled ? "text-green-600" : "text-yellow-600"}`}>
                      {status.payoutsEnabled ? "Yes" : "No"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payout Method</p>
                    <p className={`font-medium ${status.hasExternalAccount ? "text-green-600" : "text-yellow-600"}`}>
                      {status.hasExternalAccount ? "Added" : "Not Added"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tips Enabled</p>
                    <p className={`font-medium ${status.tipsEnabled ? "text-green-600" : "text-yellow-600"}`}>
                      {status.tipsEnabled ? "Yes" : "No"}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {status.requirementsCurrentlyDue.length > 0 && (
            <Card data-testid="card-requirements">
              <CardHeader>
                <CardTitle>Outstanding Requirements</CardTitle>
                <CardDescription>
                  Complete these requirements to fully activate your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {status.requirementsCurrentlyDue.map((req) => (
                    <li key={req} className="text-sm">
                      • {req.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
