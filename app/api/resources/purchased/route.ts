import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all purchased resources with full resource details
    const { data: purchases, error } = await supabase
      .from('purchased_resources')
      .select(`
        *,
        resources (*)
      `)
      .eq('user_id', user.id)
      .eq('payment_status', 'completed')
      .order('purchased_at', { ascending: false })

    if (error) {
      throw error
    }

    // Format response
    const formattedPurchases = purchases?.map((purchase: any) => ({
      purchaseId: purchase.id,
      purchasedAt: purchase.purchased_at,
      amountPaid: purchase.amount_paid,
      currency: purchase.currency,
      resource: purchase.resources,
    })) || []

    return NextResponse.json({
      success: true,
      purchases: formattedPurchases,
      count: formattedPurchases.length,
    })

  } catch (error: any) {
    console.error('Get purchased resources error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch purchases' },
      { status: 500 }
    )
  }
}
