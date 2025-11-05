import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import WorkerHeader from "@/components/WorkerHeader";
import TipAmountSelector from "@/components/TipAmountSelector";
import TipSuccessScreen from "@/components/TipSuccessScreen";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || "");

function PaymentForm({
  amount,
  handle,
  note,
  onSuccess,
}: {
  amount: number;
  handle: string;
  note: string;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage("");

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: "if_required",
    });

    if (error) {
      setErrorMessage(error.message || "Payment failed");
      setIsProcessing(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {errorMessage && (
        <p className="text-sm text-destructive">{errorMessage}</p>
      )}
      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={isProcessing || !stripe}
        data-testid="button-submit-payment"
      >
        {isProcessing ? "Processing..." : `Send $${(amount / 100).toFixed(2)} Tip`}
      </Button>
    </form>
  );
}

export default function TipPage() {
  const [, params] = useRoute("/:handle");
  const handle = params?.handle || "demo";

  const [selectedAmount, setSelectedAmount] = useState<number>();
  const [note, setNote] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: workerData, isLoading } = useQuery({
    queryKey: ["/api/qr", handle],
    queryFn: () => api.worker.getByHandle(handle),
  });

  const createIntentMutation = useMutation({
    mutationFn: (amountCents: number) =>
      api.tips.createIntent({
        handle,
        amountCents,
        note: note || undefined,
      }),
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
    },
  });

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    createIntentMutation.mutate(amount);
  };

  const handlePaymentSuccess = () => {
    setShowSuccess(true);
  };

  const handleSendAnother = () => {
    setSelectedAmount(undefined);
    setNote("");
    setClientSecret("");
    setShowSuccess(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!workerData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <h2 className="text-xl font-semibold mb-2">Worker not found</h2>
            <p className="text-muted-foreground">
              This tip page doesn't exist or has been deactivated.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

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

        {!workerData.tipsEnabled ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Tips are temporarily unavailable for this worker.
              </p>
            </CardContent>
          </Card>
        ) : (
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

                {clientSecret && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Payment Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Elements stripe={stripePromise} options={{ clientSecret }}>
                        <PaymentForm
                          amount={selectedAmount}
                          handle={handle}
                          note={note}
                          onSuccess={handlePaymentSuccess}
                        />
                      </Elements>
                    </CardContent>
                  </Card>
                )}

                {createIntentMutation.isPending && (
                  <p className="text-center text-sm text-muted-foreground">
                    Preparing payment...
                  </p>
                )}

                {createIntentMutation.isError && (
                  <Card className="border-destructive">
                    <CardContent className="py-4 text-center text-destructive">
                      Failed to create payment. Please try again.
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
