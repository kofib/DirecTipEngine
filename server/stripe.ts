import Stripe from "stripe";
import { storage } from "./storage";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY environment variable is required");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Environment toggles for Connect Custom onboarding
const USE_EMBEDDED_ONBOARDING = process.env.STRIPE_EMBEDDED_ONBOARDING === "true";
const USE_FINANCIAL_CONNECTIONS = process.env.STRIPE_FINANCIAL_CONNECTIONS === "true";

/**
 * Create a Stripe Connect Custom account
 * Custom accounts give us full control over onboarding and allow embedded components
 */
export async function createConnectAccount(email: string, country: string = "US") {
  const account = await stripe.accounts.create({
    type: "custom",
    country,
    email,
    business_type: "individual",
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });

  return account;
}

/**
 * Create an Account Session for embedded onboarding components
 * Returns a client secret that the frontend uses to initialize Stripe Connect components
 */
export async function createAccountSession(accountId: string) {
  if (!USE_EMBEDDED_ONBOARDING) {
    throw new Error("Embedded onboarding is not enabled. Use account links instead.");
  }

  const accountSession = await stripe.accountSessions.create({
    account: accountId,
    components: {
      account_onboarding: {
        enabled: true,
      },
      account_management: {
        enabled: true,
      },
      payments: {
        enabled: true,
      },
      payouts: {
        enabled: true,
      },
    },
  } as Stripe.AccountSessionCreateParams);

  return accountSession;
}

/**
 * Create an Account Link for fallback onboarding (redirect-based)
 * Used when STRIPE_EMBEDDED_ONBOARDING=false
 */
export async function createAccountLink(accountId: string, refreshUrl: string, returnUrl: string) {
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: "account_onboarding",
  });

  return accountLink;
}

/**
 * Create a Financial Connections Session for bank account collection
 * Returns a client secret that the frontend uses to launch the bank linking flow
 */
export async function createFinancialConnectionsSession(accountId: string) {
  if (!USE_FINANCIAL_CONNECTIONS) {
    throw new Error("Financial Connections is not enabled.");
  }

  const session = await stripe.financialConnections.sessions.create({
    account_holder: {
      type: "account",
      account: accountId,
    },
    permissions: ["payment_method", "ownership"],
    filters: {
      countries: ["US"],
    },
  });

  return session;
}

/**
 * Attach a bank account token to a Connect Custom account
 * The token can come from Financial Connections or Stripe.js createToken
 */
export async function attachBankAccount(accountId: string, bankToken: string) {
  const externalAccount = await stripe.accounts.createExternalAccount(accountId, {
    external_account: bankToken,
  });

  return externalAccount;
}

/**
 * Get Connect account details including capabilities and requirements
 */
export async function getAccount(accountId: string) {
  return await stripe.accounts.retrieve(accountId);
}

/**
 * Get Connect account status with processed fields for our app
 */
export async function getAccountStatus(accountId: string) {
  const account = await stripe.accounts.retrieve(accountId);
  
  return {
    chargesEnabled: account.charges_enabled || false,
    payoutsEnabled: account.payouts_enabled || false,
    detailsSubmitted: account.details_submitted || false,
    requirementsCurrentlyDue: account.requirements?.currently_due || [],
    requirementsPendingVerification: account.requirements?.pending_verification || [],
    requirementsEventuallyDue: account.requirements?.eventually_due || [],
    disabledReason: account.requirements?.disabled_reason || null,
    capabilities: {
      cardPayments: account.capabilities?.card_payments,
      transfers: account.capabilities?.transfers,
    },
    externalAccounts: account.external_accounts?.data || [],
  };
}

/**
 * Create a PaymentIntent with platform fee and transfer to worker
 * This is unchanged from Express - payment flow stays the same
 */
export async function createPaymentIntent(params: {
  amountCents: number;
  currency: string;
  platformFeeCents: number;
  destinationAccountId: string;
  metadata?: Record<string, string>;
  idempotencyKey: string;
}) {
  const paymentIntent = await stripe.paymentIntents.create(
    {
      amount: params.amountCents,
      currency: params.currency.toLowerCase(),
      application_fee_amount: params.platformFeeCents,
      transfer_data: {
        destination: params.destinationAccountId,
      },
      metadata: params.metadata || {},
      automatic_payment_methods: {
        enabled: true,
      },
    },
    {
      idempotencyKey: params.idempotencyKey,
    }
  );

  return paymentIntent;
}

/**
 * Verify webhook signature and construct event
 */
export async function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Promise<Stripe.Event> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET not configured");
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    throw new Error(`Webhook signature verification failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Get platform fee in basis points
 */
export async function getPlatformFeeBps(): Promise<number> {
  const setting = await storage.getAppSetting("platform_fee_bps");
  if (!setting) {
    return parseInt(process.env.PLATFORM_FEE_BPS || "200");
  }
  return parseInt(setting.valueJson as string);
}

/**
 * Calculate platform fee and processor fees
 * Stripe fees: 2.9% + $0.30 per transaction
 */
export function calculateFees(amountCents: number, platformFeeBps: number) {
  const platformFeeCents = Math.round((amountCents * platformFeeBps) / 10000);
  const stripeFeePercent = 0.029;
  const stripeFeeFixed = 30;
  const processorFeeCents = Math.round(amountCents * stripeFeePercent + stripeFeeFixed);
  const amountNetCents = amountCents - platformFeeCents - processorFeeCents;

  return {
    platformFeeCents,
    processorFeeCents,
    amountNetCents: Math.max(0, amountNetCents),
  };
}

/**
 * Check if embedded onboarding is enabled
 */
export function isEmbeddedOnboardingEnabled(): boolean {
  return USE_EMBEDDED_ONBOARDING;
}

/**
 * Check if Financial Connections is enabled
 */
export function isFinancialConnectionsEnabled(): boolean {
  return USE_FINANCIAL_CONNECTIONS;
}
