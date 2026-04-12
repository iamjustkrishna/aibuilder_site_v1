import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { verifyStripeWebhook } from '@/lib/payment'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    // Verify webhook signature
    const event = verifyStripeWebhook(body, signature)

    const supabase = createServiceClient() // Using service client to bypass RLS

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as any
      const paymentIntentId = paymentIntent.id
      const metadata = paymentIntent.metadata

      // Get payment record
      const { data: paymentRecord } = await supabase
        .from('payments')
        .select('*')
        .eq('gateway_order_id', paymentIntentId)
        .single()

      if (!paymentRecord) {
        console.error('Payment record not found for:', paymentIntentId)
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
      }

      // Update payment status
      await supabase
        .from('payments')
        .update({
          gateway_payment_id: paymentIntent.id,
          status: 'captured',
          updated_at: new Date().toISOString(),
        })
        .eq('gateway_order_id', paymentIntentId)

      // Record purchase
      await supabase
        .from('purchased_resources')
        .upsert({
          user_id: paymentRecord.user_id,
          resource_id: paymentRecord.resource_id,
          amount_paid: paymentRecord.amount,
          currency: paymentRecord.currency,
          payment_gateway: 'stripe',
          transaction_id: paymentIntent.id,
          payment_status: 'completed',
        }, {
          onConflict: 'user_id,resource_id',
          ignoreDuplicates: true
        })

      console.log('Stripe payment succeeded:', paymentIntentId)

    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as any
      const paymentIntentId = paymentIntent.id

      await supabase
        .from('payments')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('gateway_order_id', paymentIntentId)

      console.log('Stripe payment failed:', paymentIntentId)
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Stripe webhook error:', error)
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
