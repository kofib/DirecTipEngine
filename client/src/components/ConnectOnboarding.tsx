import { useEffect, useState } from "react";
import { ConnectAccountOnboarding, ConnectComponentsProvider } from "@stripe/react-connect-js";
import { loadConnectAndInitialize } from "@stripe/connect-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";

interface ConnectOnboardingProps {
  clientSecret: string;
  onExit?: () => void;
}

export default function ConnectOnboarding({ clientSecret, onExit }: ConnectOnboardingProps) {
  const [stripeConnectInstance, setStripeConnectInstance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientSecret) {
      setError("Missing client secret");
      setLoading(false);
      return;
    }

    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    
    if (!publishableKey) {
      setError("Stripe publishable key not configured");
      setLoading(false);
      return;
    }

    loadConnectAndInitialize({
      publishableKey,
      fetchClientSecret: async () => clientSecret,
      appearance: {
        overlays: 'dialog',
        variables: {
          colorPrimary: 'hsl(var(--primary))',
          colorBackground: 'hsl(var(--background))',
          colorText: 'hsl(var(--foreground))',
          colorDanger: 'hsl(var(--destructive))',
          fontFamily: 'system-ui, sans-serif',
          borderRadius: '0.5rem',
        },
      },
    })
      .then((instance) => {
        setStripeConnectInstance(instance);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to initialize Stripe Connect:", err);
        setError("Failed to load onboarding. Please try again.");
        setLoading(false);
      });
  }, [clientSecret]);

  if (error) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            Error Loading Onboarding
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (loading || !stripeConnectInstance) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Loading Onboarding...</CardTitle>
          <CardDescription>
            Preparing your Stripe Connect onboarding experience
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto" data-testid="connect-onboarding">
      <ConnectComponentsProvider connectInstance={stripeConnectInstance}>
        <ConnectAccountOnboarding
          onExit={onExit}
          // Customize collection options
          collectionOptions={{
            fields: 'eventually_due',
            futureRequirements: 'include',
          }}
        />
      </ConnectComponentsProvider>
    </div>
  );
}
