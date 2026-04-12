import Razorpay from 'razorpay'
import Stripe from 'stripe'
import crypto from 'crypto'

// =====================================================
// RAZORPAY SETUP
// =====================================================
export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

// =====================================================
// STRIPE SETUP
// =====================================================
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

// =====================================================
// RAZORPAY HELPERS
// =====================================================

export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const body = orderId + '|' + paymentId
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest('hex')

  return expectedSignature === signature
}

export async function createRazorpayOrder(
  amount: number, // in paise
  currency: string,
  resourceId: string,
  userId: string
) {
  const options = {
    amount,
    currency,
    receipt: `rcpt_${Date.now()}`,
    notes: {
      resource_id: resourceId,
      user_id: userId,
    },
  }

  return await razorpay.orders.create(options)
}

// =====================================================
// STRIPE HELPERS
// =====================================================

export async function createStripePaymentIntent(
  amount: number, // in cents
  currency: string,
  resourceId: string,
  userId: string
) {
  return await stripe.paymentIntents.create({
    amount,
    currency,
    metadata: {
      resource_id: resourceId,
      user_id: userId,
    },
    automatic_payment_methods: {
      enabled: true,
    },
  })
}

export function verifyStripeWebhook(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  )
}

// =====================================================
// CURRENCY DETECTION
// =====================================================

export function detectCurrency(country?: string): 'INR' | 'USD' {
  // Simple detection - can be enhanced with IP geolocation
  if (country === 'IN' || country === 'India') {
    return 'INR'
  }
  return 'USD'
}

export function getPaymentGateway(currency: string): 'razorpay' | 'stripe' {
  // Use Razorpay for INR, Stripe for others
  return currency === 'INR' ? 'razorpay' : 'stripe'
}

// =====================================================
// PRICE CONVERSION
// =====================================================

export function convertToSmallestUnit(amount: number, currency: string): number {
  // Convert to paise for INR, cents for USD
  return Math.round(amount * 100)
}

export function convertFromSmallestUnit(amount: number, currency: string): number {
  // Convert from paise/cents to rupees/dollars
  return amount / 100
}
