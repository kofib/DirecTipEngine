import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import OTPInput from "@/components/OTPInput";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const sendOTPMutation = useMutation({
    mutationFn: () => api.auth.sendOTP(email),
    onSuccess: () => {
      setOtpSent(true);
      toast({
        title: "Code sent",
        description: `We sent a verification code to ${email}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send code",
        variant: "destructive",
      });
    },
  });

  const verifyOTPMutation = useMutation({
    mutationFn: (code: string) => api.auth.verifyOTP(email, code),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "You're logged in!",
      });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Invalid code",
        variant: "destructive",
      });
    },
  });

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    sendOTPMutation.mutate();
  };

  const handleOTPComplete = (otp: string) => {
    verifyOTPMutation.mutate(otp);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <div className="w-full max-w-md space-y-4">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Worker Sign In</CardTitle>
            <CardDescription>
              {otpSent
                ? `Enter the code we sent to ${email}`
                : "Sign in with your email to access your dashboard"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!otpSent ? (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="worker@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    data-testid="input-email"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={sendOTPMutation.isPending || !email}
                  data-testid="button-send-otp"
                >
                  {sendOTPMutation.isPending ? "Sending..." : "Send Verification Code"}
                </Button>
              </form>
            ) : (
              <div className="space-y-6">
                <OTPInput onComplete={handleOTPComplete} />
                {verifyOTPMutation.isPending && (
                  <p className="text-center text-sm text-muted-foreground">Verifying...</p>
                )}
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => setOtpSent(false)}
                  data-testid="button-resend"
                >
                  Use a different email
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
