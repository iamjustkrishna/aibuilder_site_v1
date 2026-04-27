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

  const [{ data: profile, error: profileError }, { data: sessions, error: sessionsError }, { data: sessionUsers, error: sessionUsersError }] = await Promise.all([
    supabase
      .from("users")
      .select("id, membership_tier")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("upcoming_sessions")
      .select("*")
      .eq("is_active", true)
      .gte("session_at", new Date().toISOString())
      .order("session_at", { ascending: true }),
    supabase
      .from("upcoming_session_users")
      .select("session_id, user_id")
      .eq("user_id", user.id),
  ])

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  if (sessionsError) {
    return NextResponse.json({ error: sessionsError.message }, { status: 500 })
  }

  if (sessionUsersError) {
    return NextResponse.json({ error: sessionUsersError.message }, { status: 500 })
  }

  const selectedSessionUsers = new Map<string, string[]>()
  for (const row of sessionUsers || []) {
    const current = selectedSessionUsers.get(row.session_id) || []
    current.push(row.user_id)
    selectedSessionUsers.set(row.session_id, current)
  }

  const userTier = profile?.membership_tier || "initial"
  const visibleSessions = (sessions || []).filter((session) => {
    if (session.visibility_scope === "all") {
      return true
    }

    if (session.visibility_scope === "tiers") {
      return Array.isArray(session.audience_tiers) && session.audience_tiers.includes(userTier)
    }

    if (session.visibility_scope === "users") {
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
