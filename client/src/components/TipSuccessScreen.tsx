import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TipSuccessScreenProps {
  workerName: string;
  amount: number;
  currency?: string;
  onSendAnother?: () => void;
}

export default function TipSuccessScreen({ 
  workerName, 
  amount, 
  currency = "USD",
  onSendAnother 
}: TipSuccessScreenProps) {
  const formatAmount = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-6 py-12 px-4">
      <div className="animate-in zoom-in duration-300">
        <CheckCircle2 className="w-20 h-20 text-primary" />
      </div>

      <div className="space-y-2">
        <h1 className="text-4xl font-bold" data-testid="text-success-title">
          Thank you!
        </h1>
        <p className="text-lg text-muted-foreground" data-testid="text-success-message">
          {workerName} received your {formatAmount(amount)} tip
        </p>
      </div>

      {onSendAnother && (
        <Button 
          variant="outline" 
          size="lg"
          onClick={onSendAnother}
          className="mt-4"
          data-testid="button-send-another"
        >
          Send Another Tip
        </Button>
      )}
    </div>
  );
}
