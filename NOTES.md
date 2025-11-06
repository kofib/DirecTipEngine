# DirectTip: Stripe Connect Express → Custom Refactor Notes

## Overview

This document tracks the refactor from Stripe Connect Express to Custom accounts, completed on **November 6, 2025**.

---

## Changes Summary

### 1. Account Type: Express → Custom

**Before:** Express accounts (Stripe-hosted onboarding dashboard)  
**After:** Custom accounts (in-app onboarding via embedded components or account links)

**Why:** Custom accounts give us full control over the worker experience. Workers never leave our app to complete onboarding or manage payouts.

---

### 2. Database Schema Updates

Added to `workers` table:
- `charges_enabled` (boolean): Tracks if Stripe account can accept charges
- `payouts_enabled` (boolean): Tracks if Stripe account can receive payouts
- `payout_method_status` (enum): 'none' | 'added' | 'verified'

**Migration:** Applied via `execute_sql_tool` to avoid interactive prompts from `drizzle-kit push`.

```sql
CREATE TYPE payout_method_status AS ENUM ('none', 'added', 'verified');

ALTER TABLE workers 
ADD COLUMN charges_enabled BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN payouts_enabled BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN payout_method_status payout_method_status NOT NULL DEFAULT 'none';
```

---

### 3. Stripe Integration Changes (`server/stripe.ts`)

#### Account Creation
```typescript
// OLD (Express)
stripe.accounts.create({ type: 'express', ... })

// NEW (Custom)
stripe.accounts.create({
  type: 'custom',
  country,
  email,
  business_type: 'individual',
  capabilities: {
    card_payments: { requested: true },
    transfers: { requested: true }
  }
})
```

#### Onboarding Flow

**Embedded (Preferred):**
- Uses Account Sessions API (`stripe.accountSessions.create`)
- Returns `client_secret` for frontend to initialize Stripe Connect components
- Workers complete onboarding in an embedded iframe/component

**Fallback (Account Links):**
- Uses Account Links API (`stripe.accountLinks.create`)
- Returns `account_link_url` for redirect-based onboarding
- Workers get redirected to Stripe-hosted pages

**Toggle:** Controlled by `STRIPE_EMBEDDED_ONBOARDING` env var.

#### Bank Account Collection

**Option 1: Financial Connections (Recommended)**
- Instant bank verification via Plaid/MX integration
- No manual entry of routing/account numbers
- Toggle: `STRIPE_FINANCIAL_CONNECTIONS=true`

**Option 2: Manual Token Flow**
- Frontend creates bank account token via Stripe.js: `stripe.createToken('bank_account', {...})`
- Server attaches token to Connect account
- Fallback when Financial Connections is disabled

---

### 4. New API Endpoints

#### `POST /api/worker` (Updated)
Now returns either:
```json
{
  "worker": {...},
  "embeddedClientSecret": "cas_xxx", 
  "useEmbedded": true
}
```
or
```json
{
  "worker": {...},
  "onboardingUrl": "https://connect.stripe.com/...",
  "useEmbedded": false
}
```

#### `POST /api/worker/connect/create`
Create or refresh onboarding session/link for existing worker.

#### `GET /api/worker/connect/status`
Returns:
```json
{
  "accountCreated": true,
  "chargesEnabled": true,
  "payoutsEnabled": true,
  "tipsEnabled": true,
  "requirementsCurrentlyDue": ["individual.id_number"],
  "requirementsPendingVerification": [],
  "disabledReason": null,
  "hasExternalAccount": true
}
```

#### `POST /api/worker/payout-method`
Attach bank account token to worker's Connect account.

Request:
```json
{
  "bankToken": "btok_xxxxx"
}
```

#### `POST /api/worker/connect/financial-connections`
Create Financial Connections session for bank linking.

Response:
```json
{
  "clientSecret": "fcsess_xxxxx_secret_xxxxx"
}
```

---

### 5. Enhanced Webhook Handling

Updated `account.updated` webhook to track:
- `charges_enabled` → Mirror to `workers.charges_enabled`
- `payouts_enabled` → Mirror to `workers.payouts_enabled`
- Enable tips only when: `charges_enabled=true AND suspended=false`
- Set `kyc_status` based on `requirements.disabled_reason` and capabilities
- Update `payout_method_status` based on `external_accounts.data`

**New Logic:**
```typescript
const tipsEnabled = account.charges_enabled && !worker.suspended;
const kycStatus = account.requirements?.disabled_reason 
  ? "restricted" 
  : (chargesEnabled && payoutsEnabled ? "verified" : "pending");
```

---

### 6. Payment Flow (Unchanged)

**Important:** The payment flow remains exactly the same.

- PaymentIntent created with `application_fee_amount` and `transfer_data`
- Stripe handles platform fees and transfers to worker Connect accounts
- Webhooks update tip status (`payment_intent.succeeded`, `charge.refunded`, etc.)

**Validation:** Now checks `worker.chargesEnabled` before allowing payment:
```typescript
if (!worker.chargesEnabled) {
  return res.status(400).json({
    error: "Worker has not completed onboarding. Please complete your Stripe account setup to receive tips."
  });
}
```

---

### 7. Frontend Changes (Planned)

**Required:**
1. Install `@stripe/connect-js` (✅ Done)
2. Update Onboarding page to use embedded components or account links
3. Add "Payout Settings" tab to worker dashboard
4. Show account status (Pending / Needs Info / Enabled)
5. Implement bank account collection UI

**Components Needed:**
- `ConnectAccountOnboarding` from `@stripe/react-connect-js`
- Bank account token creation form (if not using Financial Connections)
- Status banners for incomplete onboarding

---

### 8. Admin Panel Updates (Planned)

Show in `/admin`:
- Account type: "custom"
- `charges_enabled` / `payouts_enabled` / `tips_enabled` flags
- "Resend Onboarding Link" action → calls `/api/worker/connect/refresh`

---

## Feature Flags

### `STRIPE_EMBEDDED_ONBOARDING`
- **Default:** `false` (currently using account links)
- **Recommended:** `true` (embedded components provide better UX)
- **When to enable:** After completing frontend implementation of Stripe Connect components

### `STRIPE_FINANCIAL_CONNECTIONS`
- **Default:** `false`
- **When to enable:** If you want instant bank verification (requires Stripe Dashboard configuration)
- **Fallback:** Manual bank token flow via Stripe.js

---

## How to Switch Between Express and Custom

**To Revert to Express** (not recommended):
1. Change `server/stripe.ts:createConnectAccount`:
   ```typescript
   type: "express" // instead of "custom"
   ```
2. Remove Account Sessions logic from routes
3. Always use Account Links for onboarding

**Why Custom is Better:**
- No redirects to Stripe-hosted pages
- Full branding control
- Embedded onboarding completes faster
- Better mobile UX
- Access to advanced features (embedded components, Financial Connections)

---

## Testing Strategy

### Unit Tests
- ✅ Account status mapper from Stripe API response
- ⏳ Webhook `account.updated` toggles worker from pending → enabled

### Integration Tests  
- ⏳ Webhook delivery updates `charges_enabled` and `payouts_enabled`
- ⏳ Worker can't receive tips until `charges_enabled=true`

### E2E Tests (Happy Path)
1. ⏳ Create worker → Onboarding session created
2. ⏳ Complete embedded onboarding → `charges_enabled=true`
3. ⏳ Attach payout method → `payout_method_status='added'`
4. ⏳ Tip flow succeeds → Payment recorded with correct fees
5. ⏳ Admin sees Custom account status

---

## Known Limitations

1. **Financial Connections:** Only works in supported regions (US, Canada, some EU countries). Check Stripe docs for full list.

2. **Embedded Components:** Require modern browsers. Fallback to account links for webviews or old browsers.

3. **Custom Account Liability:** Platform assumes liability for negative balances on Custom accounts (unlike Express).

4. **Account Links Expiration:** Account links expire after 5 minutes. Always generate fresh links.

---

## Migration Path (If Needed)

**Existing Express Accounts:**
- Cannot be converted to Custom accounts
- Must create new Custom accounts for new workers
- Existing workers keep Express accounts (grandfathered)

**Database Compatibility:**
- Schema supports both Express and Custom
- Frontend should check `useEmbedded` flag in API responses

---

## Security Considerations

1. **No Raw Bank Data:** Never store raw account/routing numbers. Always use Stripe tokens (`btok_xxxxx`).

2. **Account Session Secrets:** Single-use, short-lived. Secure like API keys.

3. **Financial Connections:** Only request needed permissions (`payment_method`, `ownership` minimum).

4. **Webhook Verification:** Always verify `stripe-signature` header before processing events.

5. **PII Encryption:** Display names and emails remain AES-256-GCM encrypted at rest.

---

## Assumptions Made

1. **Embedded Onboarding Preferred:** Set `STRIPE_EMBEDDED_ONBOARDING=true` by default after frontend implementation.

2. **Individual Business Type:** All workers are individuals (not companies). Update if supporting businesses.

3. **US-Only Initially:** Financial Connections configured for US. Expand `filters.countries` as needed.

4. **Single Payout Method:** Workers have one bank account. Update if supporting multiple payout methods.

---

## Dependencies

**NPM Packages Added:**
- `@stripe/connect-js@^4.0.0` (frontend embedded components)

**Stripe API Version:**
- Using account default (latest stable)
- Account Sessions API available since 2023-10-16

---

## Next Steps

1. ✅ Backend refactor complete
2. ⏳ Frontend embedded onboarding implementation
3. ⏳ Bank account collection UI
4. ⏳ Admin panel updates
5. ⏳ E2E testing with test Stripe accounts
6. ⏳ Update user-facing documentation (README.md, STRIPE_SETUP.md)

---

## Rollback Plan

**If Issues Arise:**
1. Set `STRIPE_EMBEDDED_ONBOARDING=false` to use account links
2. Set `STRIPE_FINANCIAL_CONNECTIONS=false` to use manual token flow
3. Revert `server/stripe.ts:createConnectAccount` to Express type
4. Revert webhook changes to ignore `payouts_enabled`

**Data Impact:** Minimal. New fields default to safe values (`false` for booleans, `'none'` for status).

---

## Documentation Updates Needed

### README.md
- [ ] Update architecture section for Custom accounts
- [ ] Add embedded onboarding flow diagram
- [ ] Document new API endpoints
- [ ] Update environment variables section

### STRIPE_SETUP.md
- [ ] Enabling Connect Custom (instead of Express)
- [ ] Embedded onboarding configuration in Stripe Dashboard
- [ ] Financial Connections setup (optional)
- [ ] Troubleshooting Custom account issues

---

## Contact & Support

**Implementation:** DirectTip Development Team  
**Date Completed:** November 6, 2025  
**Stripe Connect Docs:** https://docs.stripe.com/connect/custom-accounts  
**Account Sessions API:** https://docs.stripe.com/api/account_sessions  
**Financial Connections:** https://docs.stripe.com/financial-connections

---

*This document serves as both a changelog and a reference for the Custom accounts refactor. Update as implementation progresses.*
