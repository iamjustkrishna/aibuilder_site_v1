import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { isAdminEmail } from "@/lib/admin"

async function checkAdminAccess() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return { authorized: false, error: "Not authenticated" }
  }

  const isAdmin = await isAdminEmail(user.email)
  if (!isAdmin) {
    return { authorized: false, error: "Not authorized" }
  }

  return { authorized: true, user }
}

export async function GET() {
  const { authorized, error } = await checkAdminAccess()
  if (!authorized) {
    return NextResponse.json({ error }, { status: 401 })
  }

  const serviceClient = createServiceClient()

  const [{ data: registrations, error: registrationsError }, { data: cohorts, error: cohortsError }] =
    await Promise.all([
      serviceClient
        .from("cohort_registrations")
        .select("*")
        .order("created_at", { ascending: false }),
      serviceClient
        .from("cohorts")
        .select("id, code, name, is_current")
        .order("created_at", { ascending: false }),
    ])

  if (registrationsError) {
    return NextResponse.json({ error: registrationsError.message }, { status: 500 })
  }

  if (cohortsError) {
    return NextResponse.json({ error: cohortsError.message }, { status: 500 })
  }

  const cohortById = new Map((cohorts || []).map((cohort) => [cohort.id, cohort]))
  const result = (registrations || []).map((registration) => {
    const cohort = cohortById.get(registration.cohort_id)
    return {
      ...registration,
      cohort_code: cohort?.code || null,
      cohort_name: cohort?.name || null,
      cohort_is_current: cohort?.is_current || false,
    }
  })

  return NextResponse.json(result)
}
