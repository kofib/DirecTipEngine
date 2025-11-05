import { useState } from "react";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import WorkerHeader from "@/components/WorkerHeader";
import TipAmountSelector from "@/components/TipAmountSelector";
import TipSuccessScreen from "@/components/TipSuccessScreen";

export default function TipPage() {
  const [, params] = useRoute("/:handle");
  const handle = params?.handle || "demo";

  const [selectedAmount, setSelectedAmount] = useState<number>();
  const [note, setNote] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const workerData = {
    displayName: "Sarah Johnson",
    handle: handle,
    photoUrl: undefined,
    tipsEnabled: true,
    currency: "USD",
  };

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setShowPayment(true);
    console.log("Amount selected, showing payment form");
  };

  const handlePayment = () => {
    console.log("Processing payment...");
    setTimeout(() => {
      setShowSuccess(true);
      console.log("Payment successful!");
    }, 1500);
  };

  const handleSendAnother = () => {
    setSelectedAmount(undefined);
    setNote("");
    setShowPayment(false);
    setShowSuccess(false);
    console.log("Reset for another tip");
  };

  if (showSuccess && selectedAmount) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <TipSuccessScreen
            workerName={workerData.displayName}
            amount={selectedAmount}
            onSendAnother={handleSendAnother}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4">
      <div className="max-w-md mx-auto space-y-6 py-8">
        <WorkerHeader
          displayName={workerData.displayName}
          photoUrl={workerData.photoUrl}
          tipsEnabled={workerData.tipsEnabled}
        />

        <div className="space-y-4">
          <TipAmountSelector
            onAmountSelect={handleAmountSelect}
            selectedAmount={selectedAmount}
          />

          {selectedAmount && (
            <>
              <div className="space-y-2">
                <label htmlFor="note" className="text-sm font-medium">
                  Add a note (optional)
                </label>
                <Textarea
                  id="note"
                  placeholder="Leave a message..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={200}
                  className="resize-none"
                  rows={3}
                  data-testid="textarea-note"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {note.length}/200
                </p>
              </div>

              {showPayment && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Payment Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-md text-center text-sm text-muted-foreground">
                      Stripe Payment Element would appear here
                    </div>
                    <Button
                      onClick={handlePayment}
                      className="w-full"
                      size="lg"
                      data-testid="button-submit-payment"
                    >
                      Send ${(selectedAmount / 100).toFixed(2)} Tip
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
