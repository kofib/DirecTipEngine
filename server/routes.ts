import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { nanoid } from "nanoid";
import { sendOTPEmail } from "./email";
import { generateToken, requireAuth, requireAdmin } from "./auth";
import {
  createConnectAccount,
  createAccountLink,
  createAccountSession,
  createFinancialConnectionsSession,
  attachBankAccount,
  getAccount,
  getAccountStatus,
  createPaymentIntent,
  constructWebhookEvent,
  getPlatformFeeBps,
  calculateFees,
  isEmbeddedOnboardingEnabled,
  isFinancialConnectionsEnabled,
  stripe,
} from "./stripe";
import { insertWorkerSchema } from "@shared/schema";

const APP_URL = process.env.APP_URL || "http://localhost:5000";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  app.post("/api/auth/otp/send", async (req, res) => {
    try {
      const schema = z.object({
        email: z.string().email(),
      });

      const { email } = schema.parse(req.body);

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await storage.createOTP(email, code, expiresAt);
      await sendOTPEmail(email, code);

      await storage.createAuditLog({
        actorType: "system",
        action: "otp_sent",
        subjectTable: "otp_codes",
        metaJson: { email },
      });

      res.json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).toString() });
      }
      console.error("OTP send error:", error);
      res.status(500).json({ error: "Failed to send verification code" });
    }
  });

  app.post("/api/auth/otp/verify", async (req, res) => {
    try {
      const schema = z.object({
        email: z.string().email(),
        code: z.string().length(6),
      });

      const { email, code } = schema.parse(req.body);

      const isValid = await storage.getValidOTP(email, code);
      if (!isValid) {
        return res.status(400).json({ error: "Invalid or expired code" });
      }

      await storage.markOTPUsed(email, code);

      let user = await storage.getUserByEmail(email);
      if (!user) {
        user = await storage.createUser({ email });
      }

      const token = generateToken({ userId: user.id, email: user.email });

      res.cookie("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      await storage.createAuditLog({
        actorType: "system",
        actorId: user.id,
        action: "user_login",
        subjectTable: "users",
        subjectId: user.id,
      });

      res.json({ success: true, userId: user.id });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).toString() });
      }
      console.error("OTP verify error:", error);
      res.status(500).json({ error: "Verification failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("auth_token");
    res.json({ success: true });
  });

  app.get("/api/me", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const worker = await storage.getWorkerByUserId(user.id);

      res.json({
        user,
        worker: worker || null,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to fetch user data" });
    }
  });

  app.post("/api/worker", requireAuth, async (req, res) => {
    try {
      const data = insertWorkerSchema.parse(req.body);
      const user = req.user!;

      const existingWorker = await storage.getWorkerByUserId(user.id);
      if (existingWorker) {
        return res.status(400).json({ error: "Worker profile already exists" });
      }

      const handleExists = await storage.getWorkerByHandle(data.handle);
      if (handleExists) {
        return res.status(400).json({ error: "Handle already taken" });
      }

      const account = await createConnectAccount(user.email, data.country);

      const worker = await storage.createWorker({
        userId: user.id,
        handle: data.handle.toLowerCase(),
        displayName: data.displayName,
        photoUrl: data.photoUrl,
        country: data.country,
        currency: data.currency,
      });

      await storage.updateWorker(worker.id, {
        connectAccountId: account.id,
      });

      await storage.createAuditLog({
        actorType: "worker",
        actorId: user.id,
        action: "worker_created",
        subjectTable: "workers",
        subjectId: worker.id,
        metaJson: { connectAccountId: account.id },
      });

      // Return either embedded client secret or account link URL
      if (isEmbeddedOnboardingEnabled()) {
        const accountSession = await createAccountSession(account.id);
        res.json({
          worker: { ...worker, connectAccountId: account.id },
          embeddedClientSecret: accountSession.client_secret,
          useEmbedded: true,
        });
      } else {
        const accountLink = await createAccountLink(
          account.id,
          `${APP_URL}/api/worker/connect/refresh`,
          `${APP_URL}/dashboard`
        );
        res.json({
          worker: { ...worker, connectAccountId: account.id },
          onboardingUrl: accountLink.url,
          useEmbedded: false,
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).toString() });
      }
      console.error("Worker creation error:", error);
      res.status(500).json({ error: "Failed to create worker profile" });
    }
  });

  // Create or refresh onboarding session/link for Connect Custom account
  app.post("/api/worker/connect/create", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const worker = await storage.getWorkerByUserId(user.id);

      if (!worker || !worker.connectAccountId) {
        return res.status(404).json({ error: "Worker profile not found" });
      }

      if (isEmbeddedOnboardingEnabled()) {
        const accountSession = await createAccountSession(worker.connectAccountId);
        res.json({
          embeddedClientSecret: accountSession.client_secret,
          useEmbedded: true,
        });
      } else {
        const accountLink = await createAccountLink(
          worker.connectAccountId,
          `${APP_URL}/api/worker/connect/refresh`,
          `${APP_URL}/dashboard`
        );
        res.json({
          accountLinkUrl: accountLink.url,
          useEmbedded: false,
        });
      }
    } catch (error) {
      console.error("Connect create error:", error);
      res.status(500).json({ error: "Failed to create onboarding session" });
    }
  });

  // Legacy endpoint for backwards compatibility
  app.post("/api/worker/connect/refresh", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const worker = await storage.getWorkerByUserId(user.id);

      if (!worker || !worker.connectAccountId) {
        return res.status(404).json({ error: "Worker profile not found" });
      }

      if (isEmbeddedOnboardingEnabled()) {
        const accountSession = await createAccountSession(worker.connectAccountId);
        res.json({ embeddedClientSecret: accountSession.client_secret });
      } else {
        const accountLink = await createAccountLink(
          worker.connectAccountId,
          `${APP_URL}/api/worker/connect/refresh`,
          `${APP_URL}/dashboard`
        );
        res.json({ onboardingUrl: accountLink.url });
      }
    } catch (error) {
      console.error("Connect refresh error:", error);
      res.status(500).json({ error: "Failed to refresh onboarding link" });
    }
  });

  // Get Connect account status
  app.get("/api/worker/connect/status", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const worker = await storage.getWorkerByUserId(user.id);

      if (!worker) {
        return res.status(404).json({ error: "Worker profile not found" });
      }

      if (!worker.connectAccountId) {
        return res.json({
          accountCreated: false,
          chargesEnabled: false,
          payoutsEnabled: false,
          tipsEnabled: false,
          requirementsCurrentlyDue: [],
        });
      }

      const status = await getAccountStatus(worker.connectAccountId);

      res.json({
        accountCreated: true,
        chargesEnabled: status.chargesEnabled,
        payoutsEnabled: status.payoutsEnabled,
        tipsEnabled: worker.tipsEnabled && !worker.suspended,
        requirementsCurrentlyDue: status.requirementsCurrentlyDue,
        requirementsPendingVerification: status.requirementsPendingVerification,
        disabledReason: status.disabledReason,
        hasExternalAccount: status.externalAccounts.length > 0,
      });
    } catch (error) {
      console.error("Connect status error:", error);
      res.status(500).json({ error: "Failed to fetch account status" });
    }
  });

  // Attach bank account to Connect Custom account
  app.post("/api/worker/payout-method", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        bankToken: z.string(),
      });

      const { bankToken } = schema.parse(req.body);
      const user = req.user!;
      const worker = await storage.getWorkerByUserId(user.id);

      if (!worker || !worker.connectAccountId) {
        return res.status(404).json({ error: "Worker profile not found" });
      }

      const externalAccount = await attachBankAccount(
        worker.connectAccountId,
        bankToken
      );

      await storage.updateWorker(worker.id, {
        payoutMethodStatus: "added",
      });

      await storage.createAuditLog({
        actorType: "worker",
        actorId: user.id,
        action: "payout_method_added",
        subjectTable: "workers",
        subjectId: worker.id,
        metaJson: { externalAccountId: externalAccount.id },
      });

      res.json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).toString() });
      }
      console.error("Payout method error:", error);
      res.status(500).json({ error: "Failed to add payout method" });
    }
  });

  // Create Financial Connections session for bank account collection
  app.post("/api/worker/connect/financial-connections", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const worker = await storage.getWorkerByUserId(user.id);

      if (!worker || !worker.connectAccountId) {
        return res.status(404).json({ error: "Worker profile not found" });
      }

      if (!isFinancialConnectionsEnabled()) {
        return res.status(400).json({
          error: "Financial Connections is not enabled. Use manual bank token flow.",
        });
      }

      const session = await createFinancialConnectionsSession(worker.connectAccountId);

      res.json({
        clientSecret: session.client_secret,
      });
    } catch (error) {
      console.error("Financial Connections error:", error);
      res.status(500).json({ error: "Failed to create Financial Connections session" });
    }
  });

  app.get("/api/worker", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const worker = await storage.getWorkerByUserId(user.id);

      if (!worker) {
        return res.status(404).json({ error: "Worker profile not found" });
      }

      let stripeAccountDetails = null;
      if (worker.connectAccountId) {
        try {
          const account = await getAccount(worker.connectAccountId);
          stripeAccountDetails = {
            chargesEnabled: account.charges_enabled,
            payoutsEnabled: account.payouts_enabled,
            detailsSubmitted: account.details_submitted,
          };
        } catch (error) {
          console.error("Failed to fetch Stripe account details:", error);
        }
      }

      res.json({
        worker,
        stripeAccount: stripeAccountDetails,
      });
    } catch (error) {
      console.error("Get worker error:", error);
      res.status(500).json({ error: "Failed to fetch worker data" });
    }
  });

  app.get("/api/qr/:handle", async (req, res) => {
    try {
      const { handle } = req.params;
      const worker = await storage.getWorkerByHandle(handle);

      if (!worker) {
        return res.status(404).json({ error: "Worker not found" });
      }

      res.json({
        displayName: worker.displayName,
        photoUrl: worker.photoUrl,
        currency: worker.currency,
        tipsEnabled: worker.tipsEnabled && !worker.suspended,
      });
    } catch (error) {
      console.error("Get worker by handle error:", error);
      res.status(500).json({ error: "Failed to fetch worker data" });
    }
  });

  app.post("/api/tip-intent", async (req, res) => {
    try {
      const schema = z.object({
        handle: z.string(),
        amountCents: z.number().int().min(50).max(100000),
        currency: z.string().default("USD"),
        note: z.string().max(200).optional(),
        payerEmail: z.string().email().optional(),
      });

      const { handle, amountCents, currency, note, payerEmail } = schema.parse(req.body);

      const worker = await storage.getWorkerByHandle(handle);
      if (!worker) {
        return res.status(404).json({ error: "Worker not found" });
      }

      if (!worker.chargesEnabled) {
        return res.status(400).json({
          error: "Worker has not completed onboarding. Please complete your Stripe account setup to receive tips.",
        });
      }

      if (!worker.tipsEnabled) {
        return res.status(400).json({ error: "Tips are not enabled for this worker" });
      }

      if (worker.suspended) {
        return res.status(400).json({ error: "This worker is currently suspended" });
      }

      if (!worker.connectAccountId) {
        return res.status(400).json({ error: "Worker has not completed onboarding" });
      }

      const platformFeeBps = await getPlatformFeeBps();
      const fees = calculateFees(amountCents, platformFeeBps);

      const idempotencyKey = nanoid();
      const paymentIntent = await createPaymentIntent({
        amountCents,
        currency,
        platformFeeCents: fees.platformFeeCents,
        destinationAccountId: worker.connectAccountId,
        metadata: {
          workerId: worker.id,
          handle: worker.handle,
          note: note || "",
        },
        idempotencyKey,
      });

      await storage.createTip({
        workerId: worker.id,
        amountGrossCents: amountCents,
        currency,
        platformFeeCents: fees.platformFeeCents,
        processorFeeCents: fees.processorFeeCents,
        amountNetCents: fees.amountNetCents,
        status: "pending",
        payerEmail: payerEmail || null,
        note: note || null,
        paymentIntentId: paymentIntent.id,
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).toString() });
      }
      console.error("Tip intent error:", error);
      res.status(500).json({ error: "Failed to create payment intent" });
    }
  });

  app.post("/api/webhooks/stripe", async (req, res) => {
    const signature = req.headers["stripe-signature"] as string;

    if (!signature || Array.isArray(signature)) {
      return res.status(400).json({ error: "Missing stripe-signature header" });
    }

    try {
      const event = await constructWebhookEvent(req.body, signature);

      const existingEvent = await storage.getWebhookEventByStripeId(event.id);
      if (existingEvent) {
        return res.json({ received: true, duplicate: true });
      }

      const webhookEvent = await storage.createWebhookEvent({
        type: event.type,
        stripeEventId: event.id,
        payloadJson: event as any,
      });

      switch (event.type) {
        case "payment_intent.succeeded": {
          const paymentIntent = event.data.object as any;
          const tip = await storage.getTipByPaymentIntentId(paymentIntent.id);

          if (tip) {
            await storage.updateTipStatus(paymentIntent.id, "succeeded");
            
            await storage.createAuditLog({
              actorType: "system",
              action: "tip_succeeded",
              subjectTable: "tips",
              subjectId: tip.id,
              metaJson: { paymentIntentId: paymentIntent.id },
            });
          }
          break;
        }

        case "charge.refunded": {
          const charge = event.data.object as any;
          const paymentIntentId = charge.payment_intent;
          const tip = await storage.getTipByPaymentIntentId(paymentIntentId);

          if (tip) {
            await storage.updateTipStatus(paymentIntentId, "refunded");
            
            await storage.createAuditLog({
              actorType: "system",
              action: "tip_refunded",
              subjectTable: "tips",
              subjectId: tip.id,
            });
          }
          break;
        }

        case "charge.dispute.created": {
          const dispute = event.data.object as any;
          const paymentIntentId = dispute.payment_intent;
          const tip = await storage.getTipByPaymentIntentId(paymentIntentId);

          if (tip) {
            await storage.updateTipStatus(paymentIntentId, "disputed");
            
            await storage.createAuditLog({
              actorType: "system",
              action: "tip_disputed",
              subjectTable: "tips",
              subjectId: tip.id,
            });
          }
          break;
        }

        case "account.updated": {
          const account = event.data.object as any;
          const worker = await storage.getWorkerByConnectAccountId(account.id);

          if (worker) {
            const chargesEnabled = account.charges_enabled || false;
            const payoutsEnabled = account.payouts_enabled || false;
            
            // Determine KYC status based on requirements
            let kycStatus: "pending" | "verified" | "restricted" = "pending";
            if (account.requirements?.disabled_reason) {
              kycStatus = "restricted";
            } else if (chargesEnabled && payoutsEnabled) {
              kycStatus = "verified";
            }

            // Enable tips only when charges_enabled is true AND worker is not suspended
            const tipsEnabled = chargesEnabled && !worker.suspended;

            // Update payout method status if external account exists
            const hasExternalAccount = account.external_accounts?.data?.length > 0;
            const payoutMethodStatus = hasExternalAccount ? "added" : "none";

            await storage.updateWorker(worker.id, {
              chargesEnabled,
              payoutsEnabled,
              tipsEnabled,
              kycStatus,
              payoutMethodStatus,
            });

            await storage.createAuditLog({
              actorType: "system",
              action: "worker_account_updated",
              subjectTable: "workers",
              subjectId: worker.id,
              metaJson: {
                chargesEnabled,
                payoutsEnabled,
                tipsEnabled,
                kycStatus,
                requirementsCurrentlyDue: account.requirements?.currently_due || [],
                requirementsPendingVerification: account.requirements?.pending_verification || [],
              },
            });
          }
          break;
        }

        default:
          console.log(`Unhandled webhook event type: ${event.type}`);
      }

      await storage.markWebhookProcessed(webhookEvent.id);

      res.json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error);
      return res.status(400).json({ error: "Webhook processing failed" });
    }
  });

  app.get("/api/me/tips", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const worker = await storage.getWorkerByUserId(user.id);

      if (!worker) {
        return res.status(404).json({ error: "Worker profile not found" });
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const tips = await storage.getTipsByWorkerId(worker.id, limit, offset);

      res.json({ tips });
    } catch (error) {
      console.error("Get tips error:", error);
      res.status(500).json({ error: "Failed to fetch tips" });
    }
  });

  app.get("/api/me/stats", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const worker = await storage.getWorkerByUserId(user.id);

      if (!worker) {
        return res.status(404).json({ error: "Worker profile not found" });
      }

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [today, week, month] = await Promise.all([
        storage.getWorkerStats(worker.id, todayStart),
        storage.getWorkerStats(worker.id, weekStart),
        storage.getWorkerStats(worker.id, monthStart),
      ]);

      res.json({
        today: today.totalCents,
        week: week.totalCents,
        month: month.totalCents,
      });
    } catch (error) {
      console.error("Get stats error:", error);
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  app.get("/api/admin/workers", requireAuth, requireAdmin, async (req, res) => {
    try {
      const workers = await storage.getAllWorkers();
      res.json({ workers });
    } catch (error) {
      console.error("Get workers error:", error);
      res.status(500).json({ error: "Failed to fetch workers" });
    }
  });

  app.patch("/api/admin/workers/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const schema = z.object({
        suspended: z.boolean(),
      });

      const { suspended } = schema.parse(req.body);

      const worker = await storage.updateWorker(id, { suspended });

      if (!worker) {
        return res.status(404).json({ error: "Worker not found" });
      }

      await storage.createAuditLog({
        actorType: "admin",
        actorId: req.user!.id,
        action: suspended ? "worker_suspended" : "worker_unsuspended",
        subjectTable: "workers",
        subjectId: id,
      });

      res.json({ worker });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).toString() });
      }
      console.error("Update worker error:", error);
      res.status(500).json({ error: "Failed to update worker" });
    }
  });

  app.get("/api/admin/settings", requireAuth, requireAdmin, async (req, res) => {
    try {
      const platformFee = await storage.getAppSetting("platform_fee_bps");
      res.json({
        platformFeeBps: platformFee ? parseInt(platformFee.valueJson as string) : 200,
      });
    } catch (error) {
      console.error("Get settings error:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.patch("/api/admin/settings", requireAuth, requireAdmin, async (req, res) => {
    try {
      const schema = z.object({
        platformFeeBps: z.number().int().min(0).max(10000),
      });

      const { platformFeeBps } = schema.parse(req.body);

      await storage.setAppSetting({
        key: "platform_fee_bps",
        valueJson: platformFeeBps.toString() as any,
      });

      await storage.createAuditLog({
        actorType: "admin",
        actorId: req.user!.id,
        action: "platform_fee_updated",
        subjectTable: "app_settings",
        metaJson: { platformFeeBps },
      });

      res.json({ platformFeeBps });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).toString() });
      }
      console.error("Update settings error:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  return httpServer;
}
