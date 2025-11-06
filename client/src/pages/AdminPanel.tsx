import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Search } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function AdminPanel() {
  const [platformFee, setPlatformFee] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: workersData } = useQuery({
    queryKey: ["/api/admin/workers"],
    queryFn: api.admin.getWorkers,
  });

  const { data: settingsData } = useQuery({
    queryKey: ["/api/admin/settings"],
    queryFn: api.admin.getSettings,
  });

  if (settingsData && !platformFee) {
    setPlatformFee(settingsData.platformFeeBps.toString());
  }

  const updateFeeMutation = useMutation({
    mutationFn: () =>
      api.admin.updateSettings({ platformFeeBps: parseInt(platformFee) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({
        title: "Success",
        description: "Platform fee updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update fee",
        variant: "destructive",
      });
    },
  });

  const toggleSuspendMutation = useMutation({
    mutationFn: ({ id, suspended }: { id: string; suspended: boolean }) =>
      api.admin.updateWorker(id, { suspended }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/workers"] });
      toast({
        title: "Success",
        description: "Worker status updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update worker",
        variant: "destructive",
      });
    },
  });

  const workers = workersData?.workers || [];
  const filteredWorkers = workers.filter(
    (w) =>
      w.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.handle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveFee = () => {
    updateFeeMutation.mutate();
  };

  const handleToggleSuspend = (workerId: string, currentState: boolean) => {
    toggleSuspendMutation.mutate({ id: workerId, suspended: !currentState });
  };

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
                  {platformFee ? (parseInt(platformFee) / 100).toFixed(2) : "0"}%
                </p>
              </div>
              <Button
                onClick={handleSaveFee}
                disabled={updateFeeMutation.isPending}
                data-testid="button-save-fee"
              >
                {updateFeeMutation.isPending ? "Saving..." : "Save Fee"}
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

                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                          <div className="flex flex-wrap gap-1">
                            {worker.tipsEnabled ? (
                              <Badge variant="default" data-testid={`badge-tips-${worker.id}`}>Tips Enabled</Badge>
                            ) : (
                              <Badge variant="secondary" data-testid={`badge-tips-${worker.id}`}>Tips Pending</Badge>
                            )}
                            {worker.chargesEnabled ? (
                              <Badge variant="default" className="bg-green-600" data-testid={`badge-charges-${worker.id}`}>Charges OK</Badge>
                            ) : (
                              <Badge variant="outline" data-testid={`badge-charges-${worker.id}`}>No Charges</Badge>
                            )}
                            {worker.payoutsEnabled ? (
                              <Badge variant="default" className="bg-blue-600" data-testid={`badge-payouts-${worker.id}`}>Payouts OK</Badge>
                            ) : (
                              <Badge variant="outline" data-testid={`badge-payouts-${worker.id}`}>No Payouts</Badge>
                            )}
                            {(worker.payoutMethodStatus === "added" || worker.payoutMethodStatus === "verified") && (
                              <Badge 
                                variant="outline" 
                                className="border-green-600 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950" 
                                data-testid={`badge-payout-method-${worker.id}`}
                              >
                                {worker.payoutMethodStatus === "verified" ? "Bank Verified" : "Bank Added"}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <label
                              htmlFor={`suspend-${worker.id}`}
                              className="text-sm font-medium whitespace-nowrap"
                            >
                              Suspend
                            </label>
                            <Switch
                              id={`suspend-${worker.id}`}
                              checked={worker.suspended}
                              onCheckedChange={() =>
                                handleToggleSuspend(worker.id, worker.suspended)
                              }
                              disabled={toggleSuspendMutation.isPending}
                              data-testid={`switch-suspend-${worker.id}`}
                            />
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Account: Custom • KYC: {worker.kycStatus}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredWorkers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No workers found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
