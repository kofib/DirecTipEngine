import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";

interface WorkerHeaderProps {
  displayName: string;
  photoUrl?: string;
  tipsEnabled: boolean;
}

export default function WorkerHeader({ displayName, photoUrl, tipsEnabled }: WorkerHeaderProps) {
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-col items-center text-center space-y-4 py-8">
      <Avatar className="w-24 h-24 ring-4 ring-primary/10 ring-offset-2 ring-offset-background">
        <AvatarImage src={photoUrl} alt={displayName} />
        <AvatarFallback className="text-2xl font-semibold bg-primary/10 text-primary">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold" data-testid="text-worker-name">
          {displayName}
        </h1>
        <p className="text-sm text-muted-foreground">
          Tips go directly to {displayName.split(" ")[0]}
        </p>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Shield className="w-4 h-4" />
        <span>Secured by Stripe</span>
      </div>

      {!tipsEnabled && (
        <Badge variant="destructive" data-testid="badge-tips-disabled">
          Tips temporarily unavailable
        </Badge>
      )}
    </div>
  );
}
