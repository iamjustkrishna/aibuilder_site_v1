import { createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const EXPERIENCE_LEVELS = new Set(["beginner", "intermediate", "advanced"])
const AVAILABILITY_VALUES = new Set(["weekdays", "weekends", "both"])
const TIMING_OPTIONS = new Set(["8:00 PM - 9:00 PM", "9:00 PM - 10:00 PM", "10:00 PM - 11:00 PM", "Other"])

function trimString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

export async function POST(request: Request) {
  const body = await request.json()

  const fullName = trimString(body.full_name)
  const phoneNumber = trimString(body.phone_number)
  const email = trimString(body.email).toLowerCase()
  const projectDescription = trimString(body.project_description)
  const experienceLevel = trimString(body.experience_level).toLowerCase()
  const preferredTimingIst = trimString(body.preferred_timing_ist)
  const preferredTimingOther = trimString(body.preferred_timing_other)
  const availability = trimString(body.availability).toLowerCase()
  const dailyTimeCommitmentHours = Number(body.daily_time_commitment_hours)
  const dailyTimeCommitmentRaw = trimString(body.daily_time_commitment_hours)

  if (
    !fullName ||
    !phoneNumber ||
    !email ||
    !projectDescription ||
    !experienceLevel ||
    !preferredTimingIst ||
    !availability ||
    !dailyTimeCommitmentRaw ||
    Number.isNaN(dailyTimeCommitmentHours) ||
    dailyTimeCommitmentHours <= 0
  ) {
    return NextResponse.json({ error: "All required fields must be provided" }, { status: 400 })
  }

  if (!EXPERIENCE_LEVELS.has(experienceLevel)) {
    return NextResponse.json({ error: "Invalid experience level" }, { status: 400 })
  }

  if (!AVAILABILITY_VALUES.has(availability)) {
    return NextResponse.json({ error: "Invalid availability option" }, { status: 400 })
  }

  if (!TIMING_OPTIONS.has(preferredTimingIst)) {
    return NextResponse.json({ error: "Invalid preferred timing option" }, { status: 400 })
  }

  if (preferredTimingIst === "Other" && !preferredTimingOther) {
    return NextResponse.json({ error: "Please specify your preferred timing when selecting Other" }, { status: 400 })
  }

  const serviceClient = createServiceClient()

  const { data: cohorts, error: cohortError } = await serviceClient
    .from("cohorts")
    .select("id, code, name, is_current, created_at")
    .order("created_at", { ascending: true })

  if (cohortError) {
    return NextResponse.json({ error: cohortError.message }, { status: 500 })
  }

  const extractCohortNumber = (code: string | null | undefined) => {
    const match = typeof code === "string" ? code.match(/(\d+)\s*$/) : null
    return match ? Number(match[1]) : Number.POSITIVE_INFINITY
  }

  const orderedCohorts = (cohorts || []).slice().sort((a, b) => {
    const aNumber = extractCohortNumber(a.code)
    const bNumber = extractCohortNumber(b.code)
    if (aNumber !== bNumber) return aNumber - bNumber
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })

  const currentCohort = orderedCohorts.find((cohort) => cohort.is_current)
  const currentNumber = extractCohortNumber(currentCohort?.code)
  const nextCohort = orderedCohorts.find((cohort) => extractCohortNumber(cohort.code) > currentNumber)

  if (!nextCohort) {
    return NextResponse.json({ error: "No upcoming cohort is currently open for registration" }, { status: 409 })
  }

  const payload = {
    cohort_id: nextCohort.id,
    full_name: fullName,
    phone_number: phoneNumber,
    email,
    project_description: projectDescription,
    experience_level: experienceLevel,
    daily_time_commitment_hours: dailyTimeCommitmentHours,
    preferred_timing_ist: preferredTimingIst,
    preferred_timing_other: preferredTimingIst === "Other" ? preferredTimingOther : null,
    availability,
    updated_at: new Date().toISOString(),
  }

  const { data: registration, error } = await serviceClient
    .from("cohort_registrations")
    .upsert(payload, { onConflict: "cohort_id,email" })
    .select()
    .single()

  if (error || !registration) {
    return NextResponse.json({ error: error?.message || "Failed to save registration" }, { status: 500 })
  }

  return NextResponse.json({
    registration,
    cohort: nextCohort,
  })
}
