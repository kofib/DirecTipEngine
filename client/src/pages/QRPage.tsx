import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function QRPage() {
  const { worker } = useAuth();

  if (!worker) {
    return null;
  }

  const tipUrl = `${window.location.origin}/${worker.handle}`;

  return (
    <div className="min-h-screen bg-muted/30">
      <nav className="bg-background border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" data-testid="button-back-dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">Your QR Code</h1>
            <p className="text-muted-foreground">
              Share this QR code with customers to receive tips
            </p>
          </div>

          <QRCodeDisplay url={tipUrl} workerName={worker.displayName} />

          <div className="bg-muted/50 p-6 rounded-lg space-y-2">
            <h3 className="font-semibold">Tips for using your QR code:</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Print it and display it at your workspace</li>
              <li>Add it to your business cards or receipts</li>
              <li>Share it on social media</li>
              <li>Send it directly to customers via messaging apps</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
