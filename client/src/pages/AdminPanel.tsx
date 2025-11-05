import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Search } from "lucide-react";

interface Worker {
  id: string;
  displayName: string;
  handle: string;
  photoUrl?: string;
  tipsEnabled: boolean;
  suspended: boolean;
  lastTipAmount?: number;
  lastTipDate?: Date;
}

export default function AdminPanel() {
  const [platformFee, setPlatformFee] = useState("200");
  const [searchQuery, setSearchQuery] = useState("");

  const mockWorkers: Worker[] = [
    {
      id: "1",
      displayName: "Sarah Johnson",
      handle: "sarah",
      tipsEnabled: true,
      suspended: false,
      lastTipAmount: 500,
      lastTipDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: "2",
      displayName: "Mike Chen",
      handle: "mike",
      tipsEnabled: true,
      suspended: false,
      lastTipAmount: 1000,
      lastTipDate: new Date(Date.now() - 5 * 60 * 60 * 1000),
    },
    {
      id: "3",
      displayName: "Emma Davis",
      handle: "emma",
      tipsEnabled: false,
      suspended: false,
    },
  ];

  const handleSaveFee = () => {
    console.log("Saving platform fee:", platformFee);
  };

  const handleToggleSuspend = (workerId: string, currentState: boolean) => {
    console.log(`Toggle suspend for worker ${workerId}:`, !currentState);
  };

  const filteredWorkers = mockWorkers.filter(
    (w) =>
      w.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.handle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-muted/30 p-4">
      <div className="max-w-6xl mx-auto space-y-6 py-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">Manage workers and platform settings</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Platform Fee</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 items-end">
              <div className="flex-1 space-y-2">
                <label htmlFor="platform-fee" className="text-sm font-medium">
                  Fee (basis points)
                </label>
                <Input
                  id="platform-fee"
                  type="number"
                  value={platformFee}
                  onChange={(e) => setPlatformFee(e.target.value)}
                  placeholder="200"
                  data-testid="input-platform-fee"
                />
                <p className="text-xs text-muted-foreground">
                  {platformFee} bps = {(parseInt(platformFee) / 100).toFixed(2)}%
                </p>
              </div>
              <Button onClick={handleSaveFee} data-testid="button-save-fee">
                Save Fee
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search workers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-workers"
              />
            </div>

            <div className="space-y-3">
              {filteredWorkers.map((worker) => (
                <Card key={worker.id} data-testid={`card-worker-${worker.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={worker.photoUrl} alt={worker.displayName} />
                        <AvatarFallback>
                          {worker.displayName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="font-semibold">{worker.displayName}</div>
                        <div className="text-sm text-muted-foreground">@{worker.handle}</div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right text-sm">
                          {worker.tipsEnabled ? (
                            <Badge variant="default">Tips Enabled</Badge>
                          ) : (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                          {worker.lastTipAmount && (
                            <div className="text-muted-foreground mt-1">
                              Last: ${(worker.lastTipAmount / 100).toFixed(2)}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <label
                            htmlFor={`suspend-${worker.id}`}
                            className="text-sm font-medium"
                          >
                            Suspend
                          </label>
                          <Switch
                            id={`suspend-${worker.id}`}
                            checked={worker.suspended}
                            onCheckedChange={(checked) =>
                              handleToggleSuspend(worker.id, worker.suspended)
                            }
                            data-testid={`switch-suspend-${worker.id}`}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
