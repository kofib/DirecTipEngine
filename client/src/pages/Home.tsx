import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { QrCode, Zap, Shield } from "lucide-react";
import heroImage from "@assets/generated_images/Happy_service_worker_with_phone_e4f9c82e.png";

export default function Home() {
  return (
    <div className="min-h-screen">
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-sm bg-background/80 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <QrCode className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold">DirectTip</span>
            </div>
            <Link href="/login">
              <Button variant="outline" data-testid="button-worker-signin">
                Worker Sign In
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="pt-16">
        <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={heroImage}
              alt="Happy service worker"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
          </div>

          <div className="relative z-10 max-w-4xl mx-auto px-4 text-center text-white">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Scan. Tip. Done.
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90">
              Send tips directly to workers. No apps. No accounts. Just scan and pay.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button
                  size="lg"
                  className="min-h-14 text-lg backdrop-blur-sm bg-primary/90 hover:bg-primary"
                  data-testid="button-get-started"
                >
                  Get Started for Workers
                </Button>
              </Link>
              <Link href="/demo">
                <Button
                  size="lg"
                  variant="outline"
                  className="min-h-14 text-lg backdrop-blur-sm bg-white/10 border-white/30 text-white hover:bg-white/20"
                  data-testid="button-try-demo"
                >
                  Try Demo
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <QrCode className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Instant QR Codes</h3>
                <p className="text-muted-foreground">
                  Get your personalized QR code instantly. Print it, share it, display it anywhere.
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Zap className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Direct Deposits</h3>
                <p className="text-muted-foreground">
                  Tips go straight to your bank account. No waiting. No hassle.
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Secure & Trusted</h3>
                <p className="text-muted-foreground">
                  Powered by Stripe. Bank-level security. Your money is always safe.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-4 bg-muted/30">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold">
              How It Works
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
              <div className="space-y-2">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg mb-3">
                  1
                </div>
                <h4 className="font-semibold text-lg">Sign Up</h4>
                <p className="text-sm text-muted-foreground">
                  Create your account and connect your bank account via Stripe.
                </p>
              </div>

              <div className="space-y-2">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg mb-3">
                  2
                </div>
                <h4 className="font-semibold text-lg">Get Your QR</h4>
                <p className="text-sm text-muted-foreground">
                  Download your personalized QR code and display it for customers.
                </p>
              </div>

              <div className="space-y-2">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg mb-3">
                  3
                </div>
                <h4 className="font-semibold text-lg">Receive Tips</h4>
                <p className="text-sm text-muted-foreground">
                  Customers scan and tip. Money goes directly to your account.
                </p>
              </div>
            </div>
          </div>
        </section>

        <footer className="py-12 px-4 border-t">
          <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
            <p>&copy; 2025 DirectTip. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
