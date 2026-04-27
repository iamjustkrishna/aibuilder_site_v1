import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

async function getAuthenticatedUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function GET() {
  const supabase = await createClient()
  const user = await getAuthenticatedUser()
  if (!user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const [{ data: profile }, { data: sessions, error: sessionsError }, { data: sessionUsers }] = await Promise.all([
    supabase
      .from("users")
      .select("id, membership_tier")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("upcoming_sessions")
      .select("*")
      .eq("is_active", true)
      .order("session_at", { ascending: true }),
    supabase
      .from("upcoming_session_users")
      .select("session_id, user_id")
      .eq("user_id", user.id),
  ])

  if (sessionsError) {
    return NextResponse.json({ error: sessionsError.message }, { status: 500 })
  }

  const selectedSessionUsers = new Map<string, string[]>()
  for (const row of sessionUsers || []) {
    const current = selectedSessionUsers.get(row.session_id) || []
    current.push(row.user_id)
    selectedSessionUsers.set(row.session_id, current)
  }

  const userTier = (profile?.membership_tier || "initial").toLowerCase()
  const now = Date.now()
  const visibleSessions = (sessions || []).filter((session) => {
    const sessionAt = new Date(session.session_at).getTime()
    const isUpcoming = Number.isFinite(sessionAt) ? sessionAt >= now - 24 * 60 * 60 * 1000 : true
    if (!isUpcoming) {
      return false
    }

    const visibilityScope = typeof session.visibility_scope === "string" ? session.visibility_scope : "all"
    if (visibilityScope === "all") {
      return true
    }

    if (visibilityScope === "tiers") {
      const audienceTiers = Array.isArray(session.audience_tiers)
        ? session.audience_tiers.map((tier: string) => tier.toLowerCase())
        : []
      return audienceTiers.includes(userTier)
    }

    if (visibilityScope === "users") {
      return (selectedSessionUsers.get(session.id) || []).includes(user.id)
    }

    return true
  })

  return NextResponse.json(
    visibleSessions.map((session) => ({
      ...session,
      selected_user_ids: selectedSessionUsers.get(session.id) || [],
    })),
  )
}
