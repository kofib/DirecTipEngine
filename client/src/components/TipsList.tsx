import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface Tip {
  id: string;
  amountGrossCents: number;
  amountNetCents: number;
  currency: string;
  status: "succeeded" | "refunded" | "disputed" | "failed" | "pending";
  note?: string;
  createdAt: Date;
}

interface TipsListProps {
  tips: Tip[];
}

const statusConfig = {
  succeeded: { label: "Succeeded", variant: "default" as const },
  refunded: { label: "Refunded", variant: "secondary" as const },
  disputed: { label: "Disputed", variant: "destructive" as const },
  failed: { label: "Failed", variant: "destructive" as const },
  pending: { label: "Pending", variant: "secondary" as const },
};

export default function TipsList({ tips }: TipsListProps) {
  const formatAmount = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  if (tips.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No tips yet
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {tips.map((tip) => (
        <Card key={tip.id} className="hover-elevate" data-testid={`card-tip-${tip.id}`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={statusConfig[tip.status].variant} className="text-xs">
                    {statusConfig[tip.status].label}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(tip.createdAt, { addSuffix: true })}
                  </span>
                </div>
                {tip.note && (
                  <p className="text-sm italic text-muted-foreground line-clamp-2 mt-2">
                    "{tip.note}"
                  </p>
                )}
                <div className="text-xs text-muted-foreground mt-2">
                  Net: {formatAmount(tip.amountNetCents)}
                </div>
              </div>
              <div className="text-2xl font-bold tabular-nums text-right" data-testid={`text-tip-amount-${tip.id}`}>
                {formatAmount(tip.amountGrossCents)}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
