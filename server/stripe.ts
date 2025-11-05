import Stripe from "stripe";
import { storage } from "./storage";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY environment variable is required");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function createConnectAccount(email: string, country: string = "US") {
  const account = await stripe.accounts.create({
    type: "express",
    country,
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });

  return account;
}

export async function createAccountLink(accountId: string, refreshUrl: string, returnUrl: string) {
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: "account_onboarding",
  });

  return accountLink;
}

export async function getAccount(accountId: string) {
  return await stripe.accounts.retrieve(accountId);
}

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

export async function getPlatformFeeBps(): Promise<number> {
  const setting = await storage.getAppSetting("platform_fee_bps");
  if (!setting) {
    return parseInt(process.env.PLATFORM_FEE_BPS || "200");
  }
  return parseInt(setting.valueJson as string);
}

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
