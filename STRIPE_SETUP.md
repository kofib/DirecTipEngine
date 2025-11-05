# Stripe Connect Setup Guide

DirectTip requires **Stripe Connect** to be enabled on your Stripe account before it can create worker accounts and process tips. Follow these steps to set it up:

## Step 1: Enable Stripe Connect

1. **Log into your Stripe Dashboard**: https://dashboard.stripe.com/
2. **Navigate to Connect Settings**: 
   - Click "Connect" in the left sidebar
   - Or visit: https://dashboard.stripe.com/settings/connect
3. **Enable Connect**: If this is your first time, you'll see a button to "Get Started" or "Enable Connect"
4. **Complete Business Profile**: 
   - Fill out your business information
   - Provide required details about your platform
   - This is required by Stripe for compliance

## Step 2: Configure Express Accounts

1. **In Connect Settings**, find "Account types"
2. **Enable "Express" accounts** (should be enabled by default)
3. **Configure branding** (optional):
   - Upload your logo
   - Set brand colors
   - These will appear in the worker onboarding flow

## Step 3: Set Up Webhooks

1. **Navigate to Webhooks**: https://dashboard.stripe.com/webhooks
2. **Click "Add endpoint"**
3. **Enter your endpoint URL**: 
   - Development: `https://your-replit-url.replit.dev/api/webhooks/stripe`
   - Production: `https://your-domain.com/api/webhooks/stripe`
4. **Select events to listen to**:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
   - `charge.dispute.created`
   - `account.updated`
5. **Copy the webhook signing secret** and add it to your environment variables as `STRIPE_WEBHOOK_SECRET`

## Step 4: Update Environment Variables

Add these to your `.env` file or Replit Secrets:

```bash
# Production Stripe Keys
STRIPE_SECRET_KEY=sk_live_...  # or sk_test_... for testing
VITE_STRIPE_PUBLIC_KEY=pk_live_...  # or pk_test_... for testing
STRIPE_WEBHOOK_SECRET=whsec_...

# Testing Stripe Keys (for run_test tool)
TESTING_STRIPE_SECRET_KEY=sk_test_...
TESTING_VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

**Important**: 
- Use **test mode keys** (`sk_test_...` and `pk_test_...`) during development
- Switch to **live mode keys** (`sk_live_...` and `pk_live_...`) only when ready for production
- Test mode and live mode are completely separate - test payments won't affect real money

## Step 5: Test the Integration

1. **Restart your application** to load the new environment variables
2. **Create a test worker**:
   - Visit `/login`
   - Enter an email and verify OTP
   - Complete the onboarding form
   - You should be redirected to Stripe's onboarding flow
3. **Complete Stripe onboarding** (in test mode, you can use test data)
4. **Test a payment**:
   - Visit your worker's tip page (e.g., `/yourhandle`)
   - Select an amount
   - Use test card: `4242 4242 4242 4242`
   - Complete the payment
5. **Verify webhook delivery**:
   - Check the Stripe Dashboard → Webhooks to see if events are being received
   - Check your application logs for webhook processing

## Troubleshooting

### Error: "You can only create new accounts if you've signed up for Connect"

This means Stripe Connect is not enabled on your account. Complete Step 1 above.

### Webhooks Not Receiving Events

1. Check that the webhook URL is correct and publicly accessible
2. Verify the webhook secret matches your environment variable
3. Check Stripe Dashboard → Webhooks for delivery attempts and errors
4. Ensure you selected the correct events (see Step 3)

### Worker Stuck on "Pending" Status

1. Check if the worker completed the Stripe Express onboarding
2. Look for `account.updated` webhook events in Stripe Dashboard
3. Manually trigger an `account.updated` event in test mode to update status

### Payments Failing

1. Verify `STRIPE_SECRET_KEY` and `VITE_STRIPE_PUBLIC_KEY` match (both test or both live)
2. Check that the worker's Stripe account is fully onboarded
3. Look for `payment_intent.payment_failed` events in Stripe Dashboard
4. Check application logs for errors during payment intent creation

## Platform Fees

DirectTip takes a small platform fee on each tip. By default, this is set to **2% (200 basis points)**.

To change the platform fee:
1. Log in as an admin user
2. Visit `/admin`
3. Update the "Platform Fee" setting
4. Click "Save Fee"

**Note**: Stripe also charges processing fees (~2.9% + 30¢ per transaction). These are separate from your platform fee.

## Production Checklist

Before going live with real payments:

- [ ] Enable Stripe Connect (completed Steps 1-3 above)
- [ ] Switch to live mode Stripe keys
- [ ] Update webhook endpoint URL to production domain
- [ ] Test worker onboarding with real data
- [ ] Test payment flow with live mode test cards
- [ ] Verify webhooks are being delivered to production
- [ ] Set up SMTP for real OTP email delivery (not console)
- [ ] Update `APP_URL` to production domain
- [ ] Generate secure `SESSION_SECRET` and `ENCRYPTION_KEY`
- [ ] Review and adjust platform fee if needed
- [ ] Set up monitoring for failed payments and webhook errors

## Additional Resources

- **Stripe Connect Docs**: https://stripe.com/docs/connect
- **Express Accounts**: https://stripe.com/docs/connect/express-accounts
- **Webhooks Guide**: https://stripe.com/docs/webhooks
- **Test Cards**: https://stripe.com/docs/testing
- **Connect Onboarding**: https://stripe.com/docs/connect/onboarding

## Support

If you encounter issues:
1. Check the Stripe Dashboard for error messages
2. Review application logs for detailed error information
3. Consult Stripe's documentation
4. Contact Stripe Support for Connect-specific issues
