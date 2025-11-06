import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Info, Loader2 } from "lucide-react";
import { ConnectStatus } from "@/lib/api";

interface AccountStatusBannerProps {
  status: ConnectStatus;
  onCompleteOnboarding?: () => void;
  isLoadingSession?: boolean;
}

export default function AccountStatusBanner({
  status,
  onCompleteOnboarding,
  isLoadingSession,
}: AccountStatusBannerProps) {
  // Account fully enabled
  if (status.chargesEnabled && status.payoutsEnabled && status.hasExternalAccount) {
    return (
      <Card className="border-green-500/50 bg-green-500/10" data-testid="status-enabled">
        <CardContent className="p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-green-900 dark:text-green-100">
              Account Active
            </h3>
            <p className="text-sm text-green-800 dark:text-green-200 mt-1">
              Your account is fully set up and ready to receive tips.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Account needs payout method
  if (status.chargesEnabled && status.payoutsEnabled && !status.hasExternalAccount) {
    return (
      <Card className="border-blue-500/50 bg-blue-500/10" data-testid="status-needs-payout">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">
              Add Payout Method
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
              Add a bank account to receive your earnings.
            </p>
            {onCompleteOnboarding && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={onCompleteOnboarding}
                disabled={isLoadingSession}
                data-testid="button-add-payout-method"
              >
                {isLoadingSession ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Add Payout Method"
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Account has requirements
  if (status.requirementsCurrentlyDue.length > 0) {
    return (
      <Card className="border-yellow-500/50 bg-yellow-500/10" data-testid="status-needs-info">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
              Action Required
            </h3>
            <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
              Complete your account setup to start receiving tips.
            </p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2">
              Missing: {status.requirementsCurrentlyDue.length} requirement(s)
            </p>
            {onCompleteOnboarding && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={onCompleteOnboarding}
                disabled={isLoadingSession}
                data-testid="button-complete-onboarding"
              >
                {isLoadingSession ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Complete Setup"
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Account disabled
  if (status.disabledReason) {
    return (
      <Card className="border-destructive/50 bg-destructive/10" data-testid="status-restricted">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-destructive">
              Account Restricted
            </h3>
            <p className="text-sm text-destructive/90 mt-1">
              Your account has been restricted. Reason: {status.disabledReason}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Please contact support for assistance.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Pending verification
  if (status.requirementsPendingVerification && status.requirementsPendingVerification.length > 0) {
    return (
      <Card className="border-blue-500/50 bg-blue-500/10" data-testid="status-pending">
        <CardContent className="p-4 flex items-start gap-3">
          <Loader2 className="w-5 h-5 text-blue-600 mt-0.5 animate-spin shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">
              Verification In Progress
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
              Your information is being verified. This usually takes a few minutes.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default: Not started
  return (
    <Card className="border-yellow-500/50 bg-yellow-500/10" data-testid="status-not-started">
      <CardContent className="p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
            Complete Stripe Onboarding
          </h3>
          <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
            Set up your Stripe account to start receiving tips.
          </p>
          {onCompleteOnboarding && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={onCompleteOnboarding}
              disabled={isLoadingSession}
              data-testid="button-start-onboarding"
            >
              {isLoadingSession ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                "Start Onboarding"
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
