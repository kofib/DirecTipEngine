import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import OTPInput from "@/components/OTPInput";

export default function Login() {
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    console.log("Sending OTP to:", email);
    
    setTimeout(() => {
      setOtpSent(true);
      setLoading(false);
    }, 1000);
  };

  const handleOTPComplete = (otp: string) => {
    console.log("Verifying OTP:", otp);
    setTimeout(() => {
      console.log("OTP verified, redirecting to dashboard");
    }, 500);
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
                  disabled={loading || !email}
                  data-testid="button-send-otp"
                >
                  {loading ? "Sending..." : "Send Verification Code"}
                </Button>
              </form>
            ) : (
              <div className="space-y-6">
                <OTPInput onComplete={handleOTPComplete} />
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
