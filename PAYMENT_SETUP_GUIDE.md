# 💳 Payment System Setup Guide

Complete guide to set up Razorpay + Stripe payment integration for resource purchases.

---

## 📋 Table of Contents

1. [Database Setup](#1-database-setup)
2. [Supabase Storage Setup](#2-supabase-storage-setup)
3. [Razorpay Setup](#3-razorpay-setup)
4. [Stripe Setup](#4-stripe-setup)
5. [Environment Variables](#5-environment-variables)
6. [Adding Purchasable Resources](#6-adding-purchasable-resources)
7. [Testing Payments](#7-testing-payments)
8. [Going Live](#8-going-live)

---

## 1. Database Setup

### Step 1: Run Migration

Execute the SQL migration file in your Supabase SQL Editor:

```bash
# Navigate to Supabase Dashboard → SQL Editor
# Copy content from: supabase/migrations/001_resources_payment.sql
# Run the migration
```

This creates:
- `purchased_resources` table
- `resource_downloads` table
- `payments` table
- Helper functions for checking purchases

### Step 2: Verify Tables

Check that these tables exist in your database:
- ✅ `resources` (updated with payment fields)
- ✅ `purchased_resources`
- ✅ `resource_downloads`
- ✅ `payments`

---

## 2. Supabase Storage Setup

### Step 1: Create Storage Bucket

1. Go to **Supabase Dashboard → Storage**
2. Click **"New bucket"**
3. Name: `resources`
4. **Make it PRIVATE** (uncheck "Public bucket")
5. Click **Create bucket**

### Step 2: Upload Resources

Upload your PDF/video files:

```
resources/
├── books/
│   ├── become-ai-architect.pdf
│   ├── agent-guide-2026.pdf
│   └── pricing-playbook.pdf
├── videos/
│   └── langchain-masterclass.mp4
└── templates/
    └── ai-chatbot-starter.zip
```

### Step 3: Set Storage Policies (Already done via migration)

RLS policies ensure only authenticated users with valid purchases can access files.

---

## 3. Razorpay Setup (for India)

### Step 1: Create Razorpay Account

1. Visit [https://razorpay.com](https://razorpay.com)
2. Sign up and complete KYC verification
3. Go to **Settings → API Keys**

### Step 2: Get API Keys

**Test Mode Keys** (for development):
```
Key ID: rzp_test_xxxxxxxxxxxxx
Key Secret: xxxxxxxxxxxxxxxxxxxxxxxx
```

**Live Mode Keys** (after KYC approval):
```
Key ID: rzp_live_xxxxxxxxxxxxx
Key Secret: xxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 3: Configure Webhook

1. Go to **Settings → Webhooks**
2. Add webhook URL:
   ```
   https://your-domain.com/api/payment/razorpay-webhook
   ```
3. Select events:
   - ✅ `payment.captured`
   - ✅ `payment.failed`
4. Copy **Webhook Secret** (optional, for verification)

---

## 4. Stripe Setup (for International)

### Step 1: Create Stripe Account

1. Visit [https://stripe.com](https://stripe.com)
2. Sign up and complete verification
3. Go to **Developers → API keys**

### Step 2: Get API Keys

**Test Mode Keys** (for development):
```
Publishable Key: pk_test_xxxxxxxxxxxxx
Secret Key: sk_test_xxxxxxxxxxxxx
```

**Live Mode Keys** (after verification):
```
Publishable Key: pk_live_xxxxxxxxxxxxx
Secret Key: sk_live_xxxxxxxxxxxxx
```

### Step 3: Configure Webhook

1. Go to **Developers → Webhooks**
2. Add endpoint:
   ```
   https://your-domain.com/api/payment/stripe-webhook
   ```
3. Select events:
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
4. Copy **Webhook Signing Secret**: `whsec_xxxxxxxxxxxxx`

---

## 5. Environment Variables

Create/update `.env.local` file:

```bash
# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Security Note**: Never commit `.env.local` to git!

---

## 6. Adding Purchasable Resources

### Method 1: Via Supabase Dashboard

1. Go to **Supabase → Table Editor → resources**
2. Insert or update a row:

```sql
INSERT INTO resources (
  title,
  description,
  type,
  tier,
  is_purchasable,
  price_inr,
  price_usd,
  file_storage_path,
  category
) VALUES (
  'Become an AI Architect',
  'Complete guide to AI architecture patterns',
  'pdf',
  'free', -- or 'builder', 'architect'
  true,
  49900, -- ₹499 in paise
  799,   -- $7.99 in cents
  'books/become-ai-architect.pdf',
  'week-4'
);
```

### Method 2: Via SQL Editor

```sql
-- Example: Add purchasable resource
INSERT INTO resources (
  id,
  title,
  description,
  type,
  tier,
  is_purchasable,
  price_inr,
  price_usd,
  file_storage_path
) VALUES (
  gen_random_uuid(),
  'Agent Building Masterclass',
  'Build production-ready AI agents',
  'video',
  'builder',
  true,
  199900, -- ₹1999
  2999,   -- $29.99
  'videos/agent-masterclass.mp4'
);
```

### Pricing Guidelines

**PDFs/Books**: ₹299-999 ($5-15)
**Video Courses**: ₹999-2999 ($15-50)
**Code Templates**: ₹499-1499 ($7-25)

---

## 7. Testing Payments

### Test with Razorpay

**Test Cards:**
```
Card Number: 4111 1111 1111 1111
CVV: Any 3 digits
Expiry: Any future date
```

**Test UPI:**
```
UPI ID: success@razorpay
```

### Test with Stripe

**Test Cards:**
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
```

### Testing Flow

1. Start dev server: `npm run dev`
2. Go to `/resources`
3. Click "Buy Now" on a purchasable resource
4. Complete payment with test credentials
5. Check:
   - ✅ Payment record in `payments` table
   - ✅ Purchase record in `purchased_resources` table
   - ✅ "Download" button appears
   - ✅ Clicking downloads the file

---

## 8. Going Live

### Checklist Before Production

- [ ] Complete Razorpay KYC verification
- [ ] Complete Stripe account verification
- [ ] Switch to **live API keys** in `.env.local`
- [ ] Update webhook URLs to production domain
- [ ] Test one real payment (small amount)
- [ ] Set up GST/tax collection (if applicable)
- [ ] Add refund policy page
- [ ] Set up email notifications for purchases
- [ ] Monitor webhook logs for failures

### Switch to Live Keys

```bash
# Update in production environment variables
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
# etc...
```

### Monitor Payments

**Razorpay**: Dashboard → Payments → View transactions
**Stripe**: Dashboard → Payments → View all payments

---

## 🔧 Troubleshooting

### Payment Not Completing

1. Check browser console for errors
2. Verify webhook is receiving events (check payment gateway dashboard)
3. Check Supabase logs for API errors
4. Ensure RLS policies allow inserts

### Download Not Working

1. Verify file exists in Supabase Storage
2. Check `file_storage_path` matches actual path
3. Ensure user has purchase record in database
4. Check signed URL generation (5-minute expiry)

### Webhook Failures

1. Verify webhook URL is publicly accessible
2. Check webhook signature verification
3. Look at webhook logs in payment gateway dashboard
4. Test webhook locally with tools like ngrok

---

## 📚 How Users Experience It

### Purchase Flow:

1. **Browse** → User sees resource with "Buy Now" button
2. **Click** → Payment modal opens with INR/USD toggle
3. **Pay** → Razorpay/Stripe checkout
4. **Success** → "Download" button appears
5. **Download** → Temporary signed URL (5 min expiry)
6. **Re-download** → Can re-download anytime from Dashboard

### Security Features:

- ✅ Private storage bucket (no direct access)
- ✅ Signed URLs expire after 5 minutes
- ✅ RLS policies verify ownership
- ✅ Download tracking for analytics
- ✅ Payment verification via webhooks
- ✅ One-time purchase (no duplicate charges)

---

## 🎯 Next Steps

1. **Run the database migration**
2. **Set up Supabase Storage bucket**
3. **Get Razorpay/Stripe API keys**
4. **Configure environment variables**
5. **Upload test resource files**
6. **Test a purchase flow**
7. **Go live!**

---

## 📞 Support

- Razorpay Docs: https://razorpay.com/docs
- Stripe Docs: https://stripe.com/docs
- Supabase Storage: https://supabase.com/docs/guides/storage

Need help? Check logs in:
- Browser DevTools Console
- Supabase Dashboard → Logs
- Payment Gateway Dashboard → Webhooks

---

**Happy Building! 🚀**
