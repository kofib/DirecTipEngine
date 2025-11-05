-- Create enums
CREATE TYPE "kyc_status" AS ENUM('pending', 'verified', 'restricted');
CREATE TYPE "tip_status" AS ENUM('succeeded', 'refunded', 'disputed', 'failed', 'pending');
CREATE TYPE "actor_type" AS ENUM('system', 'admin', 'worker');

-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" text NOT NULL UNIQUE,
  "is_admin" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now()
);

-- Create workers table
CREATE TABLE IF NOT EXISTS "workers" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "handle" text NOT NULL UNIQUE,
  "display_name" text NOT NULL,
  "photo_url" text,
  "country" text NOT NULL DEFAULT 'US',
  "currency" text NOT NULL DEFAULT 'USD',
  "connect_account_id" text,
  "kyc_status" kyc_status NOT NULL DEFAULT 'pending',
  "tips_enabled" boolean NOT NULL DEFAULT false,
  "suspended" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now()
);

-- Create tips table
CREATE TABLE IF NOT EXISTS "tips" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "worker_id" varchar NOT NULL REFERENCES "workers"("id") ON DELETE CASCADE,
  "amount_gross_cents" integer NOT NULL,
  "currency" text NOT NULL DEFAULT 'USD',
  "platform_fee_cents" integer NOT NULL,
  "processor_fee_cents" integer NOT NULL DEFAULT 0,
  "amount_net_cents" integer NOT NULL,
  "status" tip_status NOT NULL DEFAULT 'pending',
  "payer_email" text,
  "note" text,
  "payment_intent_id" text NOT NULL UNIQUE,
  "created_at" timestamp NOT NULL DEFAULT now()
);

-- Create webhook_events table
CREATE TABLE IF NOT EXISTS "webhook_events" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "type" text NOT NULL,
  "stripe_event_id" text NOT NULL UNIQUE,
  "payload_json" jsonb NOT NULL,
  "processed" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now()
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "actor_type" actor_type NOT NULL,
  "actor_id" varchar,
  "action" text NOT NULL,
  "subject_table" text,
  "subject_id" varchar,
  "meta_json" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now()
);

-- Create app_settings table
CREATE TABLE IF NOT EXISTS "app_settings" (
  "key" text PRIMARY KEY,
  "value_json" jsonb NOT NULL
);

-- Create otp_codes table
CREATE TABLE IF NOT EXISTS "otp_codes" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" text NOT NULL,
  "code" text NOT NULL,
  "expires_at" timestamp NOT NULL,
  "used" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "idx_workers_user_id" ON "workers"("user_id");
CREATE INDEX IF NOT EXISTS "idx_workers_handle" ON "workers"("handle");
CREATE INDEX IF NOT EXISTS "idx_workers_connect_account_id" ON "workers"("connect_account_id");
CREATE INDEX IF NOT EXISTS "idx_tips_worker_id" ON "tips"("worker_id");
CREATE INDEX IF NOT EXISTS "idx_tips_payment_intent_id" ON "tips"("payment_intent_id");
CREATE INDEX IF NOT EXISTS "idx_tips_created_at" ON "tips"("created_at");
CREATE INDEX IF NOT EXISTS "idx_webhook_events_stripe_event_id" ON "webhook_events"("stripe_event_id");
CREATE INDEX IF NOT EXISTS "idx_webhook_events_processed" ON "webhook_events"("processed");
CREATE INDEX IF NOT EXISTS "idx_otp_codes_email" ON "otp_codes"("email");
CREATE INDEX IF NOT EXISTS "idx_otp_codes_expires_at" ON "otp_codes"("expires_at");

-- Insert default platform fee setting (200 basis points = 2%)
INSERT INTO "app_settings" ("key", "value_json") 
VALUES ('platform_fee_bps', '200') 
ON CONFLICT ("key") DO NOTHING;
