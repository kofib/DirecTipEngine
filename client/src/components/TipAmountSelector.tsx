import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface TipAmountSelectorProps {
  currency?: string;
  onAmountSelect: (amount: number) => void;
  selectedAmount?: number;
}

export default function TipAmountSelector({ 
  currency = "USD", 
  onAmountSelect,
  selectedAmount 
}: TipAmountSelectorProps) {
  const [customAmount, setCustomAmount] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const presetAmounts = [
    { value: 200, label: "$2", popular: false },
    { value: 500, label: "$5", popular: true },
    { value: 1000, label: "$10", popular: false },
  ];

  const handlePresetClick = (amount: number) => {
    setShowCustomInput(false);
    setCustomAmount("");
    onAmountSelect(amount);
    console.log(`Preset amount selected: $${amount / 100}`);
  };

  const handleCustomClick = () => {
    setShowCustomInput(true);
    console.log("Custom amount input opened");
  };

  const handleCustomSubmit = () => {
    const cents = Math.round(parseFloat(customAmount) * 100);
    if (cents > 0) {
      onAmountSelect(cents);
      console.log(`Custom amount selected: $${customAmount}`);
    }
  };

  const formatAmount = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {presetAmounts.map((preset) => (
          <Button
            key={preset.value}
            variant={selectedAmount === preset.value ? "default" : "outline"}
            size="lg"
            className="min-h-16 text-xl font-semibold relative hover-elevate active-elevate-2"
            onClick={() => handlePresetClick(preset.value)}
            data-testid={`button-tip-${preset.value}`}
          >
            {preset.label}
            {preset.popular && (
              <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                Popular
              </span>
            )}
          </Button>
        ))}
        
        <Button
          variant={showCustomInput ? "default" : "outline"}
          size="lg"
          className="min-h-16 text-xl font-semibold hover-elevate active-elevate-2"
          onClick={handleCustomClick}
          data-testid="button-tip-custom"
        >
          Custom
        </Button>
      </div>

      {showCustomInput && (
        <Card className="p-4 space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="custom-amount">
              Enter Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-2xl font-mono text-muted-foreground">
                $
              </span>
              <Input
                id="custom-amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                className="pl-8 text-2xl font-mono h-14"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCustomSubmit()}
                autoFocus
                data-testid="input-custom-amount"
              />
            </div>
          </div>
          <Button
            onClick={handleCustomSubmit}
            disabled={!customAmount || parseFloat(customAmount) <= 0}
            className="w-full"
            data-testid="button-submit-custom"
          >
            Continue
          </Button>
        </Card>
      )}
    </div>
  );
}
