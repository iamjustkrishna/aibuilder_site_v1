import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// Tier hierarchy - higher tiers can access lower tier resources
const tierHierarchy = {
  initial: ["initial"],
  foundational: ["initial", "foundational"],
  builder: ["initial", "foundational", "builder"],
  architect: ["initial", "foundational", "builder", "architect"],
}

// GET - Fetch resources based on user's tier
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const tier = searchParams.get("tier") || "initial"
  
  // Get allowed tiers for this user
  const allowedTiers = tierHierarchy[tier as keyof typeof tierHierarchy] || ["initial"]
  
  const { data: resources, error } = await supabase
    .from("resources")
    .select("*")
    .eq("is_active", true)
    .in("tier_required", allowedTiers)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(resources || [])
}
