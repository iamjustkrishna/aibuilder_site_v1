import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const body = await request.json()
  const sessionKey = typeof body.sessionKey === "string" ? body.sessionKey.trim() : ""
  const pagePath = typeof body.pagePath === "string" ? body.pagePath.trim() || "/" : "/"
  const userAgent = typeof body.userAgent === "string" ? body.userAgent.trim() : ""
  const activeSeconds = Number.isFinite(Number(body.activeSeconds)) ? Math.max(0, Math.floor(Number(body.activeSeconds))) : 0
  const ended = Boolean(body.ended)

  if (!sessionKey) {
    return NextResponse.json({ error: "Session key is required" }, { status: 400 })
  }

  const serviceClient = createServiceClient()
  const now = new Date().toISOString()

  const { data: existingSession } = await serviceClient
    .from("website_activity_sessions")
    .select("id, total_active_seconds, user_id")
    .eq("session_key", sessionKey)
    .maybeSingle()

  if (existingSession && existingSession.user_id !== user.id) {
    return NextResponse.json({ error: "Session ownership mismatch" }, { status: 403 })
  }

  if (!existingSession) {
    const { error: insertError } = await serviceClient
      .from("website_activity_sessions")
      .insert({
        session_key: sessionKey,
        user_id: user.id,
        page_path: pagePath,
        user_agent: userAgent || null,
        started_at: now,
        last_seen_at: now,
        ended_at: ended ? now : null,
        total_active_seconds: activeSeconds,
      })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  }

  const { error: updateError } = await serviceClient
    .from("website_activity_sessions")
    .update({
      page_path: pagePath,
      user_agent: userAgent || null,
      last_seen_at: now,
      ended_at: ended ? now : null,
      total_active_seconds: (existingSession.total_active_seconds || 0) + activeSeconds,
    })
    .eq("id", existingSession.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
