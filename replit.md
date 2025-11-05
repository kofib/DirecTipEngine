# DirectTip - Production Tipping Platform

## Overview

DirectTip is a production-ready tipping platform that enables customers to scan QR codes and send tips directly to workers' Stripe Connect accounts. The platform handles the complete payment flow from worker onboarding through Stripe Express accounts to real-time payment processing with platform fees, while providing dashboards for workers and administrators.

The application follows a monorepo structure with a React frontend (using Wouter for routing) and an Express.js backend, communicating through RESTful APIs. Payment processing is handled entirely through Stripe, with webhook-based event processing for payment status updates.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React with TypeScript for type safety
- Wouter for lightweight client-side routing (Next.js-style patterns)
- Tailwind CSS with Shadcn UI components for consistent design
- React Query for server state management and caching
- Stripe Elements for PCI-compliant payment forms

**Key Design Decisions:**
- **Component-based architecture**: Reusable UI components in `/client/src/components` with example implementations in `/components/examples`
- **Route-based code splitting**: Pages organized in `/client/src/pages` (Home, Login, Dashboard, TipPage, etc.)
- **Design system**: Custom Tailwind configuration with design tokens for consistent spacing, colors, and typography (defined in `tailwind.config.ts` and `design_guidelines.md`)
- **PWA support**: Manifest and service worker configuration for installable mobile experience
- **Authentication state**: Context-based auth provider (`useAuth` hook) with JWT token management via cookies

**Routing Strategy:**
- Public routes: Home (`/`), Tip pages (`/:handle`), Login (`/login`)
- Protected routes: Dashboard (`/dashboard`), QR page (`/dashboard/qr`), Onboarding (`/onboarding`)
- Admin-only routes: Admin panel (`/admin`)
- Route guards: `RequireAuth` and `RequireAdmin` wrapper components

### Backend Architecture

**Technology Stack:**
- Express.js with TypeScript for type-safe server logic
- Drizzle ORM for database operations (PostgreSQL-compatible)
- JWT for stateless authentication (stored in HTTP-only cookies)
- Nodemailer for OTP email delivery

**Key Design Decisions:**
- **Storage abstraction layer**: `server/storage.ts` provides interface for all database operations, enabling easier testing and migration
- **Encryption at rest**: PII fields (email, payment details) encrypted using AES-256-GCM before storage
- **Rate limiting**: Global limiter (100 req/15min) with strict limiter for sensitive endpoints (10 req/15min)
- **Webhook signature verification**: Raw body parsing specifically for `/api/webhooks/stripe` to verify Stripe signatures
- **Audit logging**: All significant actions (OTP sent, payments, account changes) logged to `audit_logs` table
- **Middleware architecture**: Cookie parsing, JSON parsing (conditional on route), CORS, request logging

**Authentication Flow:**
1. User requests OTP via email
2. 6-digit code stored with 10-minute expiration
3. Code verification creates/retrieves user account
4. JWT token issued with 7-day expiration, stored in HTTP-only cookie
5. Subsequent requests validated via `requireAuth` middleware

**Database Schema** (via Drizzle ORM):
- `users`: Basic account info (email, admin flag)
- `workers`: Worker profiles with Stripe Connect account IDs, handles, KYC status
- `tips`: Payment records with gross/net amounts, fees, status, notes
- `webhook_events`: Stripe webhook event log for idempotency and debugging
- `audit_logs`: System activity tracking
- `app_settings`: Platform configuration (fee percentages, etc.)
- `otp_codes`: Temporary verification codes

### Payment Processing Architecture

**Stripe Integration:**
- **Connect Express accounts**: Workers onboarded through Stripe Express for simplified KYC
- **PaymentIntents with transfers**: Platform receives payments, automatically transfers to worker accounts
- **Fee structure**: Configurable platform fee (basis points) + Stripe processing fees (~2.9% + 30¢)
- **Account links**: Dynamic onboarding/refresh URLs for workers to complete Stripe setup

**Payment Flow:**
1. Customer selects tip amount and enters payment details (Stripe Elements)
2. Frontend creates PaymentIntent via `/api/tips` endpoint with amount, worker handle, optional note
3. Backend calculates fees, creates PaymentIntent with `transfer_data` pointing to worker's Connect account
4. Stripe confirms payment and triggers webhook
5. Webhook handler updates tip status in database
6. Worker sees updated balance in dashboard

**Webhook Events Processed:**
- `payment_intent.succeeded`: Mark tip as successful
- `payment_intent.payment_failed`: Mark tip as failed
- `charge.refunded`: Update tip status to refunded
- `charge.dispute.created`: Update tip status to disputed
- `account.updated`: Update worker KYC status based on Stripe verification

### External Dependencies

**Third-Party Services:**
- **Stripe**: Payment processing, Connect accounts, webhooks
  - Secret key: `STRIPE_SECRET_KEY`
  - Public key: `VITE_STRIPE_PUBLIC_KEY` (client-side)
  - Webhook secret: `STRIPE_WEBHOOK_SECRET`
- **SMTP Email Service**: OTP delivery (Gmail, SendGrid, etc.)
  - Credentials: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
  - Fallback: Console-only mode if credentials missing
- **PostgreSQL Database**: Neon serverless or compatible PostgreSQL
  - Connection: `DATABASE_URL`
  - WebSocket support via `@neondatabase/serverless`

**Critical Environment Variables:**
- `DATABASE_URL`: PostgreSQL connection string (required)
- `STRIPE_SECRET_KEY`: Stripe API key (required)
- `STRIPE_WEBHOOK_SECRET`: Webhook signature verification (required)
- `SESSION_SECRET`: JWT signing key (defaults to insecure value, must override in production)
- `ENCRYPTION_KEY`: 32-byte key for PII encryption (defaults to insecure value, must override)
- `APP_URL`: Base URL for return/refresh links (defaults to localhost:5000)
- SMTP credentials (optional, falls back to console logging)

**NPM Dependencies:**
- **Core**: express, react, drizzle-orm, stripe, jsonwebtoken
- **UI**: @radix-ui components, tailwindcss, class-variance-authority
- **Utilities**: zod (validation), nanoid (ID generation), qrcode, date-fns
- **Development**: vite, tsx, esbuild, drizzle-kit

**Build & Deployment:**
- Development: `npm run dev` (Vite dev server + tsx watch mode)
- Production build: `npm run build` (Vite for client, esbuild for server)
- Production start: `npm start` (Node.js serving bundled code)
- Database migrations: `npm run db:push` (Drizzle Kit schema push)