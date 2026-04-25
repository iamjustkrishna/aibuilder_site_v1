import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const serviceClient = createServiceClient()
  const { data: sessions, error } = await serviceClient
    .from("website_activity_sessions")
    .select("total_active_seconds, last_seen_at, ended_at")
    .eq("user_id", user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const totalActiveSeconds = (sessions || []).reduce((sum, session) => sum + (session.total_active_seconds || 0), 0)
  const lastSeenAt = (sessions || [])
    .map((session) => session.last_seen_at)
    .filter(Boolean)
    .sort()
    .at(-1) || null

  return NextResponse.json({
    total_active_seconds: totalActiveSeconds,
    session_count: sessions?.length || 0,
    last_seen_at: lastSeenAt,
  })
}
