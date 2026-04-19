import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"

const tierRank: Record<string, number> = {
  initial: 0,
  foundational: 1,
  builder: 2,
  architect: 3,
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient()
    const resourceId = (await params).id

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: resource, error: resourceError } = await supabase
      .from("resources")
      .select("*")
      .eq("id", resourceId)
      .single()

    if (resourceError || !resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 })
    }

    if (!resource.file_storage_path) {
      if (resource.url) {
        return NextResponse.redirect(resource.url)
      }
      return NextResponse.json({ error: "No file available for this resource" }, { status: 400 })
    }

    const isPurchasable = Boolean(resource.is_purchasable)
    if (isPurchasable) {
      const { data: purchase } = await supabase
        .from("purchased_resources")
        .select("id")
        .eq("user_id", user.id)
        .eq("resource_id", resourceId)
        .eq("payment_status", "completed")
        .single()

      if (!purchase) {
        return NextResponse.json({ error: "Resource not purchased" }, { status: 403 })
      }
    } else {
      const { data: profile } = await supabase
        .from("users")
        .select("membership_tier")
        .eq("id", user.id)
        .single()

      const userTier = profile?.membership_tier || "initial"
      const requiredTier = resource.tier_required || "initial"
      if ((tierRank[userTier] ?? 0) < (tierRank[requiredTier] ?? 0)) {
        return NextResponse.json({ error: "Access denied for your current tier" }, { status: 403 })
      }
    }

    const serviceClient = createServiceClient()
    const { data: signedUrlData, error: signedUrlError } = await serviceClient.storage
      .from("resources")
      .createSignedUrl(resource.file_storage_path, 300)

    if (signedUrlError || !signedUrlData?.signedUrl) {
      return NextResponse.json(
        { error: signedUrlError?.message || "Failed to generate resource link" },
        { status: 500 },
      )
    }

    return NextResponse.redirect(signedUrlData.signedUrl)
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to load resource" },
      { status: 500 },
    )
  }
}

