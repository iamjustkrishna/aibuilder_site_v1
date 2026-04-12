import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyRazorpaySignature } from '@/lib/payment'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      orderId,
      paymentId,
      signature,
      resourceId,
      gateway = 'razorpay'
    } = body

    if (gateway === 'razorpay') {
      // Verify Razorpay signature
      const isValid = verifyRazorpaySignature(orderId, paymentId, signature)

      if (!isValid) {
        return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
      }

      // Update payment status
      await supabase
        .from('payments')
        .update({
          gateway_payment_id: paymentId,
          gateway_signature: signature,
          status: 'captured',
          updated_at: new Date().toISOString(),
        })
        .eq('gateway_order_id', orderId)

      // Get resource and payment details
      const { data: payment } = await supabase
        .from('payments')
        .select('*')
        .eq('gateway_order_id', orderId)
        .single()

      if (!payment) {
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
      }

      // Record purchase
      const { error: purchaseError } = await supabase
        .from('purchased_resources')
        .insert({
          user_id: user.id,
          resource_id: payment.resource_id,
          amount_paid: payment.amount,
          currency: payment.currency,
          payment_gateway: 'razorpay',
          transaction_id: paymentId,
          payment_status: 'completed',
        })

      if (purchaseError) {
        // Check if it's a duplicate (already purchased)
        if (purchaseError.code === '23505') {
          return NextResponse.json({
            success: true,
            message: 'Already purchased',
            resourceId: payment.resource_id
          })
        }
        throw purchaseError
      }

      return NextResponse.json({
        success: true,
        message: 'Payment verified successfully',
        resourceId: payment.resource_id,
      })

    } else if (gateway === 'stripe') {
      // For Stripe, verification happens via webhook
      // This endpoint just checks if purchase was recorded
      const { data: purchase } = await supabase
        .from('purchased_resources')
        .select('*')
        .eq('user_id', user.id)
        .eq('resource_id', resourceId)
        .eq('payment_status', 'completed')
        .single()

      if (purchase) {
        return NextResponse.json({
          success: true,
          message: 'Payment already verified',
          resourceId: purchase.resource_id,
        })
      }

      return NextResponse.json({ error: 'Payment not yet verified' }, { status: 400 })
    }

    return NextResponse.json({ error: 'Invalid gateway' }, { status: 400 })

  } catch (error: any) {
    console.error('Verify payment error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to verify payment' },
      { status: 500 }
    )
  }
}
