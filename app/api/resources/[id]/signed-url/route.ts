import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const resourceId = (await params).id

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    if (!resource.file_storage_path) {
      return NextResponse.json({ error: 'No file available for this resource' }, { status: 400 })
    }

    // Check if resource is free or user has purchased it
    const isFree = !resource.is_purchasable || resource.tier === 'free'

    if (!isFree) {
      const { data: purchase } = await supabase
        .from('purchased_resources')
        .select('*')
        .eq('user_id', user.id)
        .eq('resource_id', resourceId)
        .eq('payment_status', 'completed')
        .single()

      if (!purchase) {
        return NextResponse.json({ error: 'Resource not purchased' }, { status: 403 })
      }
    }

    // Generate signed URL (valid for 5 minutes = 300 seconds)
    const { data: signedUrlData, error: signedUrlError } = await supabase
      .storage
      .from('resources')
      .createSignedUrl(resource.file_storage_path, 300)

    if (signedUrlError || !signedUrlData) {
      console.error('Signed URL error:', signedUrlError)
      return NextResponse.json({ error: 'Failed to generate download link' }, { status: 500 })
    }

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + 300 * 1000).toISOString()

    return NextResponse.json({
      success: true,
      signedUrl: signedUrlData.signedUrl,
      expiresIn: 300, // seconds
      expiresAt,
      resource: {
        id: resource.id,
        title: resource.title,
        type: resource.type,
      },
    })

  } catch (error: any) {
    console.error('Signed URL API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate signed URL' },
      { status: 500 }
    )
  }
}
