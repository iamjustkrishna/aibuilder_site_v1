import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const [{ data: currentCohort, error: currentCohortError }, { data: enrollments, error: enrollmentsError }] = await Promise.all([
    supabase.from("cohorts").select("*").eq("is_current", true).maybeSingle(),
    supabase
      .from("cohort_enrollments")
      .select("cohort_id, enrollment_status")
      .eq("user_id", user.id)
      .in("enrollment_status", ["active", "completed", "paused"]),
  ])

  if (currentCohortError) {
    return NextResponse.json({ error: currentCohortError.message }, { status: 500 })
  }

  if (enrollmentsError) {
    return NextResponse.json({ error: enrollmentsError.message }, { status: 500 })
  }

  const enrolledCohortIds = (enrollments || []).map((entry) => entry.cohort_id)
  let cohorts: any[] = []

  if (enrolledCohortIds.length > 0) {
    const [{ data: cohortRows, error: cohortRowsError }, { data: weekRows, error: weekRowsError }] = await Promise.all([
      supabase.from("cohorts").select("*").in("id", enrolledCohortIds).order("created_at", { ascending: false }),
      supabase
        .from("cohort_weeks")
        .select("*")
        .in("cohort_id", enrolledCohortIds)
        .eq("is_active", true)
        .order("week_number", { ascending: true }),
    ])

    if (cohortRowsError) {
      return NextResponse.json({ error: cohortRowsError.message }, { status: 500 })
    }

    if (weekRowsError) {
      return NextResponse.json({ error: weekRowsError.message }, { status: 500 })
    }

    const weeksByCohort = new Map<string, any[]>()
    for (const week of weekRows || []) {
      const current = weeksByCohort.get(week.cohort_id) || []
      current.push(week)
      weeksByCohort.set(week.cohort_id, current)
    }

    cohorts = (cohortRows || []).map((cohort) => ({
      ...cohort,
      weeks: weeksByCohort.get(cohort.id) || [],
      enrollment_status: (enrollments || []).find((entry) => entry.cohort_id === cohort.id)?.enrollment_status || "active",
    }))
  }

  return NextResponse.json({
    current_cohort: currentCohort || null,
    enrolled_cohorts: cohorts,
  })
}

