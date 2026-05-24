import { createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const revalidate = 60 // Cache for 60 seconds

export async function GET() {
  try {
    const serviceClient = createServiceClient()

    // Fetch all active showcases
    const { data: showcases, error } = await serviceClient
      .from("cohort_showcases")
      .select(`
        id,
        slug,
        title,
        is_active,
        cohort:cohorts (
          id,
          code,
          name
        )
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) {
      // Return empty array if the table doesn't exist yet, instead of throwing a 500 error
      if (error.code === "P0001" || error.message.includes("does not exist") || error.code === "42P01") {
        return NextResponse.json([])
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(showcases || [])
  } catch (error: any) {
    console.error("GET public showcases error:", error)
    return NextResponse.json({ error: error.message || "Failed to load showcases" }, { status: 500 })
  }
}
