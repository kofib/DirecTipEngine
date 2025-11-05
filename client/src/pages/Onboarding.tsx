import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export default function Onboarding() {
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { worker } = useAuth();

  const createWorkerMutation = useMutation({
    mutationFn: () =>
      api.worker.create({
        handle: handle.toLowerCase().trim(),
        displayName: displayName.trim(),
      }),
    onSuccess: (data) => {
      toast({
        title: "Profile created!",
        description: "Redirecting to Stripe to complete onboarding...",
      });
      window.location.href = data.onboardingUrl;
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create profile",
        variant: "destructive",
      });
    },
  });

  if (worker) {
    setLocation("/dashboard");
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createWorkerMutation.mutate();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Create Your Profile</CardTitle>
            <CardDescription>
              Set up your worker profile to start receiving tips
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="displayName" className="text-sm font-medium">
                  Display Name
                </label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Sarah Johnson"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={100}
                  data-testid="input-display-name"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="handle" className="text-sm font-medium">
                  Handle
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    @
                  </span>
                  <Input
                    id="handle"
                    type="text"
                    placeholder="sarah"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value.toLowerCase())}
                    required
                    minLength={3}
                    maxLength={30}
                    pattern="[a-z0-9_-]+"
                    className="pl-8"
                    data-testid="input-handle"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Your tip page will be: {window.location.origin}/{handle || "yourhandle"}
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={createWorkerMutation.isPending || !handle || !displayName}
                data-testid="button-create-profile"
              >
                {createWorkerMutation.isPending ? "Creating..." : "Create Profile & Connect Stripe"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
