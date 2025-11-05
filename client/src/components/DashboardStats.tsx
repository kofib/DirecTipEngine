import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign } from "lucide-react";

interface StatsData {
  today: number;
  week: number;
  month: number;
}

interface DashboardStatsProps {
  stats: StatsData;
  currency?: string;
}

export default function DashboardStats({ stats, currency = "USD" }: DashboardStatsProps) {
  const formatAmount = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const periods = [
    { label: "Today", value: stats.today, key: "today" },
    { label: "7 Days", value: stats.week, key: "week" },
    { label: "30 Days", value: stats.month, key: "month" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {periods.map((period) => (
        <Card key={period.key} className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {period.label}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold tabular-nums" data-testid={`stat-${period.key}`}>
              {formatAmount(period.value)}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
