import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET - Fetch all purchasable resources (publicly visible, but locked until purchased)
export async function GET() {
  const supabase = await createClient()
  
  const { data: resources, error } = await supabase
    .from("resources")
    .select("*")
    .eq("is_active", true)
    .eq("is_purchasable", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(resources || [])
}
