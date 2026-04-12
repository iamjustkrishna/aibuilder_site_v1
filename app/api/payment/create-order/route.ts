import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createRazorpayOrder, createStripePaymentIntent, getPaymentGateway } from '@/lib/payment'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { resourceId, currency = 'INR' } = body

    if (!resourceId) {
      return NextResponse.json({ error: 'Resource ID is required' }, { status: 400 })
    }

    // Get resource details
    const { data: resource, error: resourceError } = await supabase
      .from('resources')
      .select('*')
      .eq('id', resourceId)
      .single()

    if (resourceError || !resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
    }

    if (!resource.is_purchasable) {
      return NextResponse.json({ error: 'Resource is not purchasable' }, { status: 400 })
    }

    // Check if already purchased
    const { data: existingPurchase } = await supabase
      .from('purchased_resources')
      .select('*')
      .eq('user_id', user.id)
      .eq('resource_id', resourceId)
      .eq('payment_status', 'completed')
      .single()

    if (existingPurchase) {
      return NextResponse.json({ error: 'Already purchased' }, { status: 400 })
    }

    // Get price based on currency
    const amount = currency === 'INR' ? resource.price_inr : resource.price_usd

    if (!amount) {
      return NextResponse.json({ error: 'Price not available for this currency' }, { status: 400 })
    }

    // Determine payment gateway
    const gateway = getPaymentGateway(currency)

    let orderData: any

    if (gateway === 'razorpay') {
      // Create Razorpay order
      const order = await createRazorpayOrder(amount, currency, resourceId, user.id)

      orderData = {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        gateway: 'razorpay',
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      }

      // Store payment in database
      await supabase.from('payments').insert({
        user_id: user.id,
        resource_id: resourceId,
        amount,
        currency,
        payment_gateway: 'razorpay',
        gateway_order_id: order.id,
        status: 'created',
      })

    } else {
      // Create Stripe payment intent
      const paymentIntent = await createStripePaymentIntent(amount, currency.toLowerCase(), resourceId, user.id)

      orderData = {
        clientSecret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        gateway: 'stripe',
        publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      }

      // Store payment in database
      await supabase.from('payments').insert({
        user_id: user.id,
        resource_id: resourceId,
        amount,
        currency,
        payment_gateway: 'stripe',
        gateway_order_id: paymentIntent.id,
        status: 'created',
      })
    }

    return NextResponse.json({
      success: true,
      order: orderData,
      resource: {
        id: resource.id,
        title: resource.title,
        description: resource.description,
      },
    })

  } catch (error: any) {
    console.error('Create order error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    )
  }
}
