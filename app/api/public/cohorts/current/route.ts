import { createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const serviceClient = createServiceClient()

  const { data: currentCohort, error } = await serviceClient
    .from("cohorts")
    .select("id, code, name, description, status, starts_at, ends_at, is_current")
    .eq("is_current", true)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ current_cohort: currentCohort || null })
}
