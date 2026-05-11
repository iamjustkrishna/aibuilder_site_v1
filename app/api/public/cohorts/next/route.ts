import { createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

function extractCohortNumber(code: string | null | undefined): number {
  const match = typeof code === "string" ? code.match(/(\d+)\s*$/) : null
  return match ? Number(match[1]) : Number.POSITIVE_INFINITY
}

export async function GET() {
  const serviceClient = createServiceClient()

  const { data: cohorts, error } = await serviceClient
    .from("cohorts")
    .select("id, code, name, description, status, starts_at, ends_at, is_current, created_at")
    .order("created_at", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const orderedCohorts = (cohorts || []).slice().sort((a, b) => {
    const aNumber = extractCohortNumber(a.code)
    const bNumber = extractCohortNumber(b.code)

    if (aNumber !== bNumber) {
      return aNumber - bNumber
    }

    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })

  const currentCohort = orderedCohorts.find((cohort) => cohort.is_current)
  const currentNumber = extractCohortNumber(currentCohort?.code)
  const nextCohort = orderedCohorts.find((cohort) => extractCohortNumber(cohort.code) > currentNumber)

  return NextResponse.json({ next_cohort: nextCohort || null })
}
