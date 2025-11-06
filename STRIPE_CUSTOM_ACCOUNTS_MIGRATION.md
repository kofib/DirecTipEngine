# Stripe Connect Custom Accounts Migration Guide

## Overview

DirectTip has been successfully migrated from **Stripe Express accounts** to **Custom accounts** to provide full in-app onboarding and payout management without redirecting workers to Stripe dashboards.

## What Changed

### Backend Changes (server/)

#### 1. Stripe Configuration (`server/stripe.ts`)
- **Account Type**: Changed from `express` to `custom`
- **Account Sessions API**: New embedded onboarding flow using Account Sessions
- **Financial Connections**: Optional integration for instant bank verification
- **Capabilities**: Explicitly request `card_payments` and `transfers` capabilities
- **Controller Requirements**: Define ownership and business type settings
- **Environment Variables**: Added configuration flags:
  - `STRIPE_EMBEDDED_ONBOARDING=true|false` - Enable embedded onboarding (default: false)
  - `STRIPE_FINANCIAL_CONNECTIONS=true|false` - Enable Financial Connections for bank collection (default: false)

#### 2. API Routes (`server/routes.ts`)
- **POST `/api/worker/create`**: Returns `useEmbedded`, `embeddedClientSecret`, or `onboardingUrl`
- **POST `/api/worker/connect/create`**: New endpoint to create Account Session or Account Link
- **GET `/api/worker/connect/status`**: New endpoint to fetch account status with capabilities
- **POST `/api/worker/payout-method`**: New endpoint to attach bank account tokens
- **GET `/api/admin/workers`**: Returns additional Custom account fields

#### 3. Database Schema (`shared/schema.ts`)
- **New Worker Fields**:
  - `chargesEnabled: boolean` - Whether account can accept charges
  - `payoutsEnabled: boolean` - Whether account can receive payouts
  - `payoutMethodStatus: "none" | "added" | "verified"` - Bank account verification status
  - `accountType: "express" | "custom"` - Account type (always "custom" for new accounts)

#### 4. Storage Interface (`server/storage.ts`)
- Updated worker CRUD to include new Custom account fields
- Webhook handlers update `chargesEnabled`, `payoutsEnabled`, `payoutMethodStatus` based on Stripe events

### Frontend Changes (client/src/)

#### 1. New Components

**ConnectOnboarding.tsx**
- Embedded Stripe Connect onboarding component
- Uses `@stripe/react-connect-js` and `@stripe/connect-js`
- Loads Stripe Connect SDK with publishable key
- Initializes `ConnectComponentsProvider` with client secret
- Renders `ConnectAccountOnboarding` iframe
- Theming matches shadcn/ui design system
- Handles loading, error states, and exit callback

**AccountStatusBanner.tsx**
- Dynamic status banners showing account state
- States: Enabled, Needs Payout, Needs Info, Restricted, Pending, Not Started
- Displays requirements count and disabled reasons
- Action buttons to complete onboarding or add payout method
- Loading states during session creation

#### 2. Updated Pages

**Onboarding.tsx**
- Checks `data.useEmbedded` from API response
- Shows embedded `ConnectOnboarding` if `embeddedClientSecret` provided
- Falls back to redirect if `onboardingUrl` provided
- Handles onboarding exit callback to navigate to dashboard
- Maintains existing profile creation form

**Dashboard.tsx**
- Added Settings tab link in navigation
- Uses `AccountStatusBanner` for real-time status updates
- Polls `/api/worker/connect/status` every 10 seconds until tips enabled
- Navigates to `/dashboard/settings` when "Complete Onboarding" clicked
- Removed old static alert in favor of dynamic banner

**PayoutSettings.tsx** (New)
- Dedicated settings page for payout management
- Navigation bar with Dashboard, QR, Settings tabs
- Fetches account status via `/api/worker/connect/status`
- Shows `AccountStatusBanner` with current state
- Displays account details (handle, name, currency, type)
- Shows capability flags (chargesEnabled, payoutsEnabled, hasExternalAccount, tipsEnabled)
- Lists outstanding requirements if any
- Creates onboarding sessions via `/api/worker/connect/create`
- Supports embedded onboarding within the page
- Save & Exit button during onboarding
- Invalidates queries after onboarding exit

**AdminPanel.tsx**
- Added badges for `chargesEnabled` (Charges OK/No Charges)
- Added badges for `payoutsEnabled` (Payouts OK/No Payouts)
- Added badge for `payoutMethodStatus` (Bank Verified/Bank Added)
- Displays account type ("Custom") and KYC status
- All badges have proper test IDs
- Responsive flex-wrap layout for mobile

#### 3. API Client Updates (`client/src/lib/api.ts`)
- Added `chargesEnabled`, `payoutsEnabled`, `payoutMethodStatus` to Worker interface
- New `ConnectStatus` interface matching backend response
- Updated `worker.create` to return `useEmbedded` flag and optional secrets/URLs
- Added `createConnectSession()` - POST `/api/worker/connect/create`
- Added `getConnectStatus()` - GET `/api/worker/connect/status`
- Added `attachPayoutMethod(bankToken)` - POST `/api/worker/payout-method`
- Updated `refreshConnectLink()` to return both embedded and redirect options

#### 4. Router Updates (`client/src/App.tsx`)
- New route `/dashboard/settings` with `RequireAuth` wrapper
- Imported `PayoutSettings` component

#### 5. Package Installations
- `@stripe/react-connect-js` - React components for embedded onboarding
- `@stripe/connect-js` - Stripe Connect SDK (loaded dynamically)

## Configuration

### Environment Variables

#### Required (Already Set)
```bash
# Stripe API keys (already configured)
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLIC_KEY=pk_test_...

# Database (already configured)
DATABASE_URL=postgresql://...
```

#### New Configuration Flags
```bash
# Enable embedded onboarding (recommended)
STRIPE_EMBEDDED_ONBOARDING=true

# Enable Financial Connections for instant bank verification (optional)
STRIPE_FINANCIAL_CONNECTIONS=false

# App URL for return/refresh links (already set)
APP_URL=https://your-domain.replit.app
```

### Configuration Behavior

**When `STRIPE_EMBEDDED_ONBOARDING=true`:**
- Workers complete onboarding in embedded iframe
- No redirect to Stripe dashboard
- Seamless in-app experience
- Backend returns `embeddedClientSecret` for Account Sessions

**When `STRIPE_EMBEDDED_ONBOARDING=false`:**
- Workers redirected to Stripe-hosted onboarding
- Traditional Account Links flow
- Backend returns `onboardingUrl`

**When `STRIPE_FINANCIAL_CONNECTIONS=true`:**
- Workers can use instant bank verification
- Powered by Stripe Financial Connections
- Faster payout setup

**When `STRIPE_FINANCIAL_CONNECTIONS=false`:**
- Workers manually enter bank details
- Traditional bank account collection

## Testing Guide

### Prerequisites
1. Ensure environment variables are set (see Configuration above)
2. Application is running: `npm run dev`
3. Database is synced: `npm run db:push`

### Test Scenarios

#### Scenario 1: New Worker Onboarding (Embedded)
1. Navigate to home page
2. Click "Sign Up as Worker" or similar
3. Enter email and request OTP
4. Verify OTP code (check server logs if email not configured)
5. Fill out worker profile (name, handle, photo)
6. **Expected**: Embedded Stripe Connect iframe appears
7. Complete onboarding in iframe:
   - Personal information
   - Business details (if applicable)
   - Bank account information
8. **Expected**: After completion, redirected to dashboard
9. **Expected**: Status banner shows "Tips Enabled" or "Needs Payout Method"

#### Scenario 2: New Worker Onboarding (Redirect Fallback)
1. Set `STRIPE_EMBEDDED_ONBOARDING=false`
2. Follow steps 1-5 from Scenario 1
3. **Expected**: Redirected to Stripe-hosted onboarding page
4. Complete onboarding on Stripe
5. **Expected**: Redirected back to dashboard
6. **Expected**: Status banner shows account state

#### Scenario 3: Worker Settings Management
1. Login as existing worker
2. Navigate to Dashboard
3. Click "Settings" tab
4. **Expected**: See account status banner
5. **Expected**: See account details (handle, name, currency)
6. **Expected**: See capability flags (charges, payouts, etc.)
7. If onboarding incomplete:
   - Click "Complete Onboarding" or "Add Payout Method"
   - **Expected**: Embedded iframe appears (if enabled)
   - Complete required steps
   - Click "Save & Exit"
   - **Expected**: Status updates automatically

#### Scenario 4: Status Polling
1. Login as worker with incomplete onboarding
2. Navigate to Dashboard
3. **Expected**: Status banner shows pending state
4. Open browser DevTools Network tab
5. **Expected**: See `/api/worker/connect/status` requests every 10 seconds
6. Complete onboarding in another tab
7. **Expected**: Dashboard status updates within 10 seconds

#### Scenario 5: Admin Panel Review
1. Login as admin user
2. Navigate to Admin Panel
3. **Expected**: See all workers with badges:
   - Tips Enabled/Pending
   - Charges OK/No Charges
   - Payouts OK/No Payouts
   - Bank Verified/Bank Added (if applicable)
4. **Expected**: See "Account: Custom • KYC: [status]" for each worker

#### Scenario 6: Customer Tipping Flow (Unchanged)
1. Navigate to `/:handle` (worker's tip page)
2. Enter tip amount and payment details
3. Submit tip
4. **Expected**: Payment processed successfully
5. **Expected**: Worker sees tip in dashboard
6. **Expected**: Payout transferred to worker's bank account

### Troubleshooting

**Issue: Embedded onboarding not appearing**
- Check `STRIPE_EMBEDDED_ONBOARDING=true` is set
- Verify `VITE_STRIPE_PUBLIC_KEY` is correctly set
- Check browser console for errors
- Verify Account Sessions API is enabled in Stripe Dashboard

**Issue: "Account Session creation failed"**
- Check Stripe API keys are correct
- Verify Stripe Connect is enabled
- Check server logs for detailed error messages
- Ensure account has required capabilities enabled

**Issue: Bank account not showing as verified**
- Allow time for Stripe verification (can take 1-2 business days)
- Check Stripe Dashboard for account status
- Verify webhook events are being processed
- Check `webhook_events` table for `account.updated` events

**Issue: Status polling not working**
- Check `/api/worker/connect/status` endpoint returns data
- Verify React Query is configured correctly
- Check browser console for errors
- Ensure worker is authenticated

## Migration Path for Existing Express Accounts

### Important Notes
- **Backward Compatibility**: Existing Express accounts continue to work
- **No Data Migration Required**: Database schema supports both account types
- **Gradual Migration**: New workers automatically use Custom accounts
- **Existing Workers**: Can continue using Express accounts or be migrated manually

### Manual Migration Steps (If Needed)
1. Export existing Express account data
2. Create new Custom account via Stripe API
3. Update worker record with new `stripeConnectAccountId`
4. Set `accountType = "custom"`
5. Trigger onboarding for new account
6. Migrate historical data if needed

## API Reference

### Worker Endpoints

#### POST `/api/worker/create`
Creates worker profile and initiates Stripe Connect onboarding.

**Request:**
```json
{
  "email": "worker@example.com",
  "displayName": "John Doe",
  "handle": "johndoe",
  "photoUrl": "https://...",
  "bio": "Professional server"
}
```

**Response (Embedded):**
```json
{
  "worker": { ... },
  "useEmbedded": true,
  "embeddedClientSecret": "cas_...",
  "onboardingUrl": null
}
```

**Response (Redirect):**
```json
{
  "worker": { ... },
  "useEmbedded": false,
  "embeddedClientSecret": null,
  "onboardingUrl": "https://connect.stripe.com/..."
}
```

#### POST `/api/worker/connect/create`
Creates Account Session or Account Link for onboarding continuation.

**Request:**
```json
{
  "preferEmbedded": true
}
```

**Response:**
```json
{
  "useEmbedded": true,
  "clientSecret": "cas_...",
  "accountLinkUrl": null
}
```

#### GET `/api/worker/connect/status`
Fetches current account status and capabilities.

**Response:**
```json
{
  "stripeConnectAccountId": "acct_...",
  "chargesEnabled": true,
  "payoutsEnabled": true,
  "hasExternalAccount": true,
  "requirements": [],
  "disabledReason": null,
  "tipsEnabled": true,
  "accountType": "custom",
  "kycStatus": "verified",
  "payoutMethodStatus": "verified"
}
```

#### POST `/api/worker/payout-method`
Attaches bank account token to Connect account.

**Request:**
```json
{
  "bankToken": "btok_..."
}
```

**Response:**
```json
{
  "success": true
}
```

## Architecture Decisions

### Why Custom Accounts?

**Pros:**
- ✅ Full in-app onboarding control
- ✅ Embedded bank account collection
- ✅ Better UX - no external redirects
- ✅ Customizable onboarding flow
- ✅ Real-time status updates
- ✅ Financial Connections support

**Cons:**
- ⚠️ More complex implementation
- ⚠️ Requires Account Sessions API
- ⚠️ More webhook events to handle

### Why Account Sessions API?

**Benefits:**
- Embedded onboarding components
- No redirect friction
- Consistent branding
- Mobile-optimized
- Automatic state management

### Why Status Polling?

**Rationale:**
- Real-time feedback without page refresh
- Handles async Stripe verification
- Better UX during onboarding
- Stops polling when enabled

## Security Considerations

### Client Secrets
- Account Session client secrets are short-lived (default: 30 minutes)
- Secrets are fetched on-demand from backend
- Never stored in frontend state
- Invalidated after onboarding completion

### Webhook Verification
- All webhook events verified with `STRIPE_WEBHOOK_SECRET`
- Idempotency handled via `webhook_events` table
- Raw body parsing for signature verification

### Data Access
- Workers can only access their own account data
- Admin endpoints require admin privileges
- JWT authentication for all protected routes

## Performance Optimizations

### Frontend
- Lazy loading of Stripe Connect SDK
- Query caching with React Query
- Conditional status polling (stops when enabled)
- Optimistic UI updates

### Backend
- Database connection pooling
- Webhook idempotency checks
- Efficient query patterns
- Rate limiting on sensitive endpoints

## Monitoring & Debugging

### Key Metrics to Track
- Worker onboarding completion rate
- Average time to complete onboarding
- Payout method verification success rate
- API error rates
- Webhook processing delays

### Logs to Monitor
- Account Session creation failures
- Webhook processing errors
- Bank account attachment failures
- Capability requirement changes

### Stripe Dashboard
- Monitor Connect accounts
- Review onboarding progress
- Check capability statuses
- Review payout schedules

## Next Steps

### Recommended
1. **Set environment flags**: Enable `STRIPE_EMBEDDED_ONBOARDING=true`
2. **Test onboarding flow**: Complete full worker onboarding
3. **Verify webhooks**: Ensure Stripe webhooks are configured and processing
4. **Monitor logs**: Check for any errors during onboarding
5. **Test tip flow**: Verify end-to-end payment processing

### Optional Enhancements
1. **Financial Connections**: Enable for instant bank verification
2. **Custom theming**: Adjust embedded component appearance
3. **Analytics**: Track onboarding funnel metrics
4. **Email notifications**: Alert workers of verification status
5. **Mobile PWA**: Test embedded flow on mobile devices

## Support Resources

- **Stripe Account Sessions API**: https://stripe.com/docs/connect/get-started-connect-embedded-components
- **Stripe Connect Custom**: https://stripe.com/docs/connect/custom-accounts
- **Stripe Financial Connections**: https://stripe.com/docs/financial-connections
- **DirectTip Documentation**: See `replit.md` for architecture details

## Summary

The migration to Custom accounts with embedded onboarding provides:
- ✅ Seamless in-app worker onboarding
- ✅ Better UX with no external redirects
- ✅ Real-time status updates
- ✅ Comprehensive admin visibility
- ✅ Backward compatibility with Express accounts
- ✅ Production-ready implementation

All backend and frontend changes have been architect-approved and are ready for testing and deployment.
