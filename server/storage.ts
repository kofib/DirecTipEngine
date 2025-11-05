import { db } from "./db";
import { 
  users, workers, tips, webhookEvents, auditLogs, appSettings, otpCodes,
  type User, type InsertUser,
  type Worker, type InsertWorker,
  type Tip,
  type WebhookEvent, type InsertWebhookEvent,
  type AuditLog, type InsertAuditLog,
  type AppSetting, type InsertAppSetting
} from "@shared/schema";
import { eq, and, gte, desc, sql } from "drizzle-orm";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default-key-please-change-in-production-32bytes";
const ALGORITHM = "aes-256-gcm";

function encrypt(text: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.slice(0, 32)), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

function decrypt(text: string): string {
  const parts = text.split(":");
  const iv = Buffer.from(parts[0], "hex");
  const authTag = Buffer.from(parts[1], "hex");
  const encrypted = parts[2];
  const decipher = createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.slice(0, 32)), iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export interface IStorage {
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUserById(id: string): Promise<User | undefined>;
  
  getWorkerByUserId(userId: string): Promise<Worker | undefined>;
  getWorkerByHandle(handle: string): Promise<Worker | undefined>;
  getWorkerByConnectAccountId(connectAccountId: string): Promise<Worker | undefined>;
  createWorker(worker: Omit<InsertWorker, "userId"> & { userId: string }): Promise<Worker>;
  updateWorker(id: string, data: Partial<Worker>): Promise<Worker | undefined>;
  
  createTip(tip: Omit<Tip, "id" | "createdAt">): Promise<Tip>;
  getTipsByWorkerId(workerId: string, limit?: number, offset?: number): Promise<Tip[]>;
  getTipByPaymentIntentId(paymentIntentId: string): Promise<Tip | undefined>;
  updateTipStatus(paymentIntentId: string, status: Tip["status"]): Promise<void>;
  
  getWorkerStats(workerId: string, fromDate: Date): Promise<{ totalCents: number; count: number }>;
  
  createWebhookEvent(event: InsertWebhookEvent): Promise<WebhookEvent>;
  getWebhookEventByStripeId(stripeEventId: string): Promise<WebhookEvent | undefined>;
  markWebhookProcessed(id: string): Promise<void>;
  
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  
  getAppSetting(key: string): Promise<AppSetting | undefined>;
  setAppSetting(setting: InsertAppSetting): Promise<AppSetting>;
  
  createOTP(email: string, code: string, expiresAt: Date): Promise<void>;
  getValidOTP(email: string, code: string): Promise<boolean>;
  markOTPUsed(email: string, code: string): Promise<void>;
  
  getAllWorkers(): Promise<Worker[]>;
}

export class DbStorage implements IStorage {
  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async getUserById(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getWorkerByUserId(userId: string): Promise<Worker | undefined> {
    const result = await db.select().from(workers).where(eq(workers.userId, userId)).limit(1);
    return result[0];
  }

  async getWorkerByHandle(handle: string): Promise<Worker | undefined> {
    const result = await db.select().from(workers).where(eq(workers.handle, handle.toLowerCase())).limit(1);
    return result[0];
  }

  async getWorkerByConnectAccountId(connectAccountId: string): Promise<Worker | undefined> {
    const result = await db.select().from(workers).where(eq(workers.connectAccountId, connectAccountId)).limit(1);
    return result[0];
  }

  async createWorker(workerData: Omit<InsertWorker, "userId"> & { userId: string }): Promise<Worker> {
    const encryptedDisplayName = encrypt(workerData.displayName);
    
    const result = await db.insert(workers).values({
      ...workerData,
      handle: workerData.handle.toLowerCase(),
      displayName: encryptedDisplayName,
    }).returning();
    
    const worker = result[0];
    return {
      ...worker,
      displayName: decrypt(worker.displayName),
    };
  }

  async updateWorker(id: string, data: Partial<Worker>): Promise<Worker | undefined> {
    const updateData = { ...data };
    if (data.displayName) {
      updateData.displayName = encrypt(data.displayName);
    }
    
    const result = await db.update(workers).set(updateData).where(eq(workers.id, id)).returning();
    if (!result[0]) return undefined;
    
    return {
      ...result[0],
      displayName: decrypt(result[0].displayName),
    };
  }

  async createTip(tip: Omit<Tip, "id" | "createdAt">): Promise<Tip> {
    const tipData = { ...tip };
    if (tip.payerEmail) {
      tipData.payerEmail = encrypt(tip.payerEmail);
    }
    
    const result = await db.insert(tips).values(tipData).returning();
    const createdTip = result[0];
    
    return {
      ...createdTip,
      payerEmail: createdTip.payerEmail ? decrypt(createdTip.payerEmail) : null,
    };
  }

  async getTipsByWorkerId(workerId: string, limit = 50, offset = 0): Promise<Tip[]> {
    const result = await db
      .select()
      .from(tips)
      .where(eq(tips.workerId, workerId))
      .orderBy(desc(tips.createdAt))
      .limit(limit)
      .offset(offset);
    
    return result.map((tip) => ({
      ...tip,
      payerEmail: tip.payerEmail ? decrypt(tip.payerEmail) : null,
    }));
  }

  async getTipByPaymentIntentId(paymentIntentId: string): Promise<Tip | undefined> {
    const result = await db.select().from(tips).where(eq(tips.paymentIntentId, paymentIntentId)).limit(1);
    if (!result[0]) return undefined;
    
    return {
      ...result[0],
      payerEmail: result[0].payerEmail ? decrypt(result[0].payerEmail) : null,
    };
  }

  async updateTipStatus(paymentIntentId: string, status: Tip["status"]): Promise<void> {
    await db.update(tips).set({ status }).where(eq(tips.paymentIntentId, paymentIntentId));
  }

  async getWorkerStats(workerId: string, fromDate: Date): Promise<{ totalCents: number; count: number }> {
    const result = await db
      .select({
        totalCents: sql<number>`COALESCE(SUM(${tips.amountNetCents}), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(tips)
      .where(
        and(
          eq(tips.workerId, workerId),
          eq(tips.status, "succeeded"),
          gte(tips.createdAt, fromDate)
        )
      );
    
    return {
      totalCents: Number(result[0].totalCents),
      count: Number(result[0].count),
    };
  }

  async createWebhookEvent(event: InsertWebhookEvent): Promise<WebhookEvent> {
    const result = await db.insert(webhookEvents).values(event).returning();
    return result[0];
  }

  async getWebhookEventByStripeId(stripeEventId: string): Promise<WebhookEvent | undefined> {
    const result = await db.select().from(webhookEvents).where(eq(webhookEvents.stripeEventId, stripeEventId)).limit(1);
    return result[0];
  }

  async markWebhookProcessed(id: string): Promise<void> {
    await db.update(webhookEvents).set({ processed: true }).where(eq(webhookEvents.id, id));
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const result = await db.insert(auditLogs).values(log).returning();
    return result[0];
  }

  async getAppSetting(key: string): Promise<AppSetting | undefined> {
    const result = await db.select().from(appSettings).where(eq(appSettings.key, key)).limit(1);
    return result[0];
  }

  async setAppSetting(setting: InsertAppSetting): Promise<AppSetting> {
    const result = await db
      .insert(appSettings)
      .values(setting)
      .onConflictDoUpdate({
        target: appSettings.key,
        set: { valueJson: setting.valueJson },
      })
      .returning();
    return result[0];
  }

  async createOTP(email: string, code: string, expiresAt: Date): Promise<void> {
    await db.insert(otpCodes).values({ email, code, expiresAt });
  }

  async getValidOTP(email: string, code: string): Promise<boolean> {
    const result = await db
      .select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.email, email),
          eq(otpCodes.code, code),
          eq(otpCodes.used, false),
          gte(otpCodes.expiresAt, new Date())
        )
      )
      .limit(1);
    
    return result.length > 0;
  }

  async markOTPUsed(email: string, code: string): Promise<void> {
    await db
      .update(otpCodes)
      .set({ used: true })
      .where(and(eq(otpCodes.email, email), eq(otpCodes.code, code)));
  }

  async getAllWorkers(): Promise<Worker[]> {
    const result = await db.select().from(workers).orderBy(desc(workers.createdAt));
    return result.map((worker) => ({
      ...worker,
      displayName: decrypt(worker.displayName),
    }));
  }
}

export const storage = new DbStorage();
