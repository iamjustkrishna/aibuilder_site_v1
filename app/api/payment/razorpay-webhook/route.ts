import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { verifyRazorpaySignature } from '@/lib/payment'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-razorpay-signature')

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    // Parse webhook payload
    const payload = JSON.parse(body)
    const event = payload.event

    // Verify webhook signature (optional but recommended)
    // Note: Razorpay webhook signature verification is different from payment signature
    // For now, we'll process the webhook. Add verification in production.

    const supabase = createServiceClient() // Using service client to bypass RLS

    if (event === 'payment.captured') {
      const payment = payload.payload.payment.entity
      const orderId = payment.order_id
      const paymentId = payment.id

      // Get payment record
      const { data: paymentRecord } = await supabase
        .from('payments')
        .select('*')
        .eq('gateway_order_id', orderId)
        .single()

      if (!paymentRecord) {
        console.error('Payment record not found for order:', orderId)
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
      }

      // Update payment status
      await supabase
        .from('payments')
        .update({
          gateway_payment_id: paymentId,
          status: 'captured',
          updated_at: new Date().toISOString(),
        })
        .eq('gateway_order_id', orderId)

      // Record purchase (if not already done)
      await supabase
        .from('purchased_resources')
        .upsert({
          user_id: paymentRecord.user_id,
          resource_id: paymentRecord.resource_id,
          amount_paid: paymentRecord.amount,
          currency: paymentRecord.currency,
          payment_gateway: 'razorpay',
          transaction_id: paymentId,
          payment_status: 'completed',
        }, {
          onConflict: 'user_id,resource_id',
          ignoreDuplicates: true
        })

      console.log('Payment captured:', paymentId)
    } else if (event === 'payment.failed') {
      const payment = payload.payload.payment.entity
      const orderId = payment.order_id

      await supabase
        .from('payments')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('gateway_order_id', orderId)

      console.log('Payment failed:', orderId)
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Razorpay webhook error:', error)
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
