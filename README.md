# DirectTip

A production-ready tipping platform where customers scan QR codes to send tips directly to workers' Stripe Connect accounts.

## Features

- **Worker Onboarding**: Email OTP authentication (passwordless), unique handle creation, Stripe Connect Express integration
- **Public Tip Pages**: QR code scanning, amount selection ($2/$5/$10/Custom), optional notes, Stripe Payment Element with Apple/Google Pay support
- **Real-Time Payments**: PaymentIntent creation with platform fees and direct transfers to worker Connect accounts
- **Webhook Processing**: Signature-verified webhooks for payment status, refunds, disputes, and account updates
- **Worker Dashboard**: Real-time stats (Today/7/30 days), tip history with notes, QR code generation and download
- **Admin Panel**: Worker management, platform fee adjustments, suspension controls, webhook event viewing
- **Security**: Rate limiting, CORS, input validation (Zod), PII encryption (AES-GCM), audit logging
- **PWA Support**: Installable on iOS/Android with offline capabilities

## Tech Stack

**Frontend:**
- Next.js-style React with Wouter routing
- TypeScript
- Tailwind CSS + Shadcn UI
- Stripe Elements for payments
- React Query for data fetching
- QR Code generation

**Backend:**
- Express.js
- TypeScript
- Drizzle ORM + PostgreSQL
- Stripe Node SDK
- JWT authentication
- Nodemailer for OTP emails

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

**Required Variables:**
- `DATABASE_URL`: PostgreSQL connection string
- `STRIPE_SECRET_KEY`: Your Stripe secret key (test mode)
- `VITE_STRIPE_PUBLIC_KEY`: Your Stripe publishable key (test mode)
- `STRIPE_WEBHOOK_SECRET`: Webhook signing secret (see Stripe dashboard setup)
- `SESSION_SECRET`: Random string for JWT signing
- `ENCRYPTION_KEY`: 32-byte key for PII encryption

**Optional (Email):**
- SMTP credentials for OTP delivery (defaults to console logging if not provided)

### 3. Database Setup

Run migrations:

```bash
tsx server/migrate.ts
```

This creates all required tables: users, workers, tips, webhook_events, audit_logs, app_settings, otp_codes.

### 4. Stripe Dashboard Configuration

#### A. Enable Stripe Connect

1. Go to Stripe Dashboard → Connect → Settings
2. Enable "Express" account type
3. Configure branding (optional)

#### B. Set Up Webhooks

1. Go to Developers → Webhooks → Add endpoint
2. Endpoint URL: `https://your-domain.com/api/webhooks/stripe`
3. Select events to listen to:
   - `payment_intent.succeeded`
   - `charge.refunded`
   - `charge.dispute.created`
   - `account.updated`
4. Copy the **Signing secret** to `STRIPE_WEBHOOK_SECRET` in `.env`

#### C. Apple Pay Domain Verification (Optional)

For Apple Pay support:
1. Download domain verification file from Stripe Dashboard
2. Place it in `/public/.well-known/apple-developer-merchantid-domain-association`
3. Access it at `https://your-domain/.well-known/apple-developer-merchantid-domain-association`

### 5. Run the Application

**Development:**
```bash
npm run dev
```

The app runs on `http://localhost:5000` (both frontend and backend).

**Production:**
```bash
npm run build
npm start
```

## Usage

### For Workers

1. **Sign Up**: Visit `/login` and enter your email
2. **Verify**: Enter the 6-digit OTP code sent to your email
3. **Create Profile**: Choose a unique handle (e.g., `@sarah`)
4. **Connect Stripe**: Complete Stripe Express onboarding
5. **Get QR Code**: Visit `/dashboard/qr` to download your QR code
6. **Track Tips**: Monitor earnings in `/dashboard`

### For Customers

1. **Scan QR**: Scan the worker's QR code or visit `/{handle}`
2. **Choose Amount**: Select preset ($2/$5/$10) or enter custom amount
3. **Add Note** (optional): Leave a message for the worker
4. **Pay**: Complete payment via Stripe (supports Apple/Google Pay)
5. **Done**: Instant confirmation, tip goes directly to worker

### For Admins

1. **Access Admin Panel**: Visit `/admin` (requires admin flag in database)
2. **Manage Workers**: View all workers, suspend/unsuspend accounts
3. **Adjust Platform Fee**: Change fee in basis points (e.g., 200 = 2%)
4. **Monitor Activity**: View webhook events and audit logs

## API Endpoints

### Authentication
- `POST /api/auth/otp/send` - Send OTP code to email
- `POST /api/auth/otp/verify` - Verify OTP and create session
- `POST /api/auth/logout` - Clear session

### User & Worker
- `GET /api/me` - Get current user and worker profile
- `POST /api/worker` - Create worker profile and Connect account
- `GET /api/worker` - Get worker details with Stripe status
- `POST /api/worker/connect/refresh` - Generate new onboarding link
- `GET /api/qr/:handle` - Get public worker info for tip page

### Tips
- `POST /api/tip-intent` - Create PaymentIntent with transfer to worker
- `GET /api/me/tips` - Get worker's tip history (paginated)
- `GET /api/me/stats` - Get earnings stats (today/week/month)

### Webhooks
- `POST /api/webhooks/stripe` - Process Stripe webhook events

### Admin
- `GET /api/admin/workers` - List all workers
- `PATCH /api/admin/workers/:id` - Suspend/unsuspend worker
- `GET /api/admin/settings` - Get platform fee
- `PATCH /api/admin/settings` - Update platform fee

## Database Schema

**users**: id, email, is_admin, created_at  
**workers**: id, user_id, handle (unique), display_name, photo_url, country, currency, connect_account_id, kyc_status, tips_enabled, suspended, created_at  
**tips**: id, worker_id, amount_gross_cents, currency, platform_fee_cents, processor_fee_cents, amount_net_cents, status, payer_email, note, payment_intent_id (unique), created_at  
**webhook_events**: id, type, stripe_event_id (unique), payload_json, processed, created_at  
**audit_logs**: id, actor_type, actor_id, action, subject_table, subject_id, meta_json, created_at  
**app_settings**: key (PK), value_json  
**otp_codes**: id, email, code, expires_at, used, created_at

## Security Features

- **Rate Limiting**: 100 req/15min (general), 10 req/15min (OTP endpoints)
- **Input Validation**: Zod schemas on all API endpoints
- **PII Encryption**: AES-256-GCM for display_name and payer_email
- **Idempotency**: Keys for payment intent creation
- **Webhook Verification**: Stripe signature validation
- **Audit Logging**: All critical actions logged
- **HttpOnly Cookies**: JWT stored securely
- **CORS**: Restricted to app origin

## Testing

### Manual Testing with Stripe Test Mode

1. Use test cards from https://stripe.com/docs/testing
2. Test successful payment: `4242 4242 4242 4242`
3. Test declined payment: `4000 0000 0000 0002`
4. Test 3D Secure: `4000 0025 0000 3155`

### Webhook Testing

Use Stripe CLI to forward webhooks locally:

```bash
stripe listen --forward-to localhost:5000/api/webhooks/stripe
stripe trigger payment_intent.succeeded
```

## Deployment

DirectTip is designed to run on Replit but can be deployed anywhere Node.js is supported.

**Environment Variables to Set:**
- All `.env` variables
- Set `NODE_ENV=production`
- Update `APP_URL` to your production domain

**Build:**
```bash
npm run build
```

**Run:**
```bash
npm start
```

## Architecture Decisions

- **Monolithic**: Single Express server serves both API and frontend (Vite in dev, static in prod)
- **Database**: PostgreSQL via Drizzle ORM for strong typing and migrations
- **Auth**: OTP email instead of passwords for simpler, more secure worker login
- **Payments**: Stripe Connect Express for compliance and instant onboarding
- **Webhooks**: Signature-verified async processing with idempotency
- **Encryption**: AES-GCM for PII at rest, minimal data collection
- **PWA**: Installable for better mobile UX

## License

MIT

## Support

For issues or questions, please file a GitHub issue or contact support.
