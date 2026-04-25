import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { isAdminEmail } from "@/lib/admin"

async function checkAdminAccess() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) {
    return { authorized: false, error: "Not authenticated" }
  }

  const isAdmin = await isAdminEmail(user.email)
  if (!isAdmin) {
    return { authorized: false, error: "Not authorized" }
  }

  return { authorized: true, user }
}

async function loadSessions(serviceClient: ReturnType<typeof createServiceClient>) {
  const [{ data: sessions, error: sessionsError }, { data: audienceUsers, error: audienceUsersError }] = await Promise.all([
    serviceClient
      .from("upcoming_sessions")
      .select("*")
      .order("session_at", { ascending: true }),
    serviceClient
      .from("upcoming_session_users")
      .select("session_id, user_id"),
  ])

  if (sessionsError) {
    throw new Error(sessionsError.message)
  }

  if (audienceUsersError) {
    throw new Error(audienceUsersError.message)
  }

  const selectedUsersBySession = new Map<string, string[]>()
  for (const row of audienceUsers || []) {
    const existing = selectedUsersBySession.get(row.session_id) || []
    existing.push(row.user_id)
    selectedUsersBySession.set(row.session_id, existing)
  }

  return (sessions || []).map((session) => ({
    ...session,
    selected_user_ids: selectedUsersBySession.get(session.id) || [],
  }))
}

export async function GET() {
  const { authorized, error } = await checkAdminAccess()
  if (!authorized) {
    return NextResponse.json({ error }, { status: 401 })
  }

  const serviceClient = createServiceClient()
  try {
    const sessions = await loadSessions(serviceClient)
    return NextResponse.json(sessions)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to load sessions" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const { authorized, error, user } = await checkAdminAccess()
  if (!authorized) {
    return NextResponse.json({ error }, { status: 401 })
  }

  const body = await request.json()
  const title = typeof body.title === "string" ? body.title.trim() : ""
  const description = typeof body.description === "string" ? body.description.trim() : ""
  const meetLink = typeof body.meet_link === "string" ? body.meet_link.trim() : ""
  const sessionAt = typeof body.session_at === "string" ? body.session_at.trim() : ""
  const visibilityScope = typeof body.visibility_scope === "string" ? body.visibility_scope.trim() : "all"
  const audienceTiers = Array.isArray(body.audience_tiers) ? body.audience_tiers.filter((tier) => typeof tier === "string") : []
  const selectedUserIds = Array.isArray(body.selected_user_ids) ? body.selected_user_ids.filter((id) => typeof id === "string") : []
  const isActive = body.is_active !== false

  if (!title || !meetLink || !sessionAt) {
    return NextResponse.json({ error: "Title, meet link, and session date are required" }, { status: 400 })
  }

  if (!["all", "tiers", "users"].includes(visibilityScope)) {
    return NextResponse.json({ error: "Invalid visibility scope" }, { status: 400 })
  }

  if (visibilityScope === "tiers" && audienceTiers.length === 0) {
    return NextResponse.json({ error: "Select at least one tier" }, { status: 400 })
  }

  if (visibilityScope === "users" && selectedUserIds.length === 0) {
    return NextResponse.json({ error: "Select at least one user" }, { status: 400 })
  }

  const serviceClient = createServiceClient()
  const { data: session, error: insertError } = await serviceClient
    .from("upcoming_sessions")
    .insert({
      title,
      description: description || null,
      meet_link: meetLink,
      session_at: sessionAt,
      visibility_scope: visibilityScope,
      audience_tiers: visibilityScope === "tiers" ? audienceTiers : [],
      is_active: isActive,
      created_by: user?.id,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (insertError || !session) {
    return NextResponse.json({ error: insertError?.message || "Failed to create session" }, { status: 500 })
  }

  if (visibilityScope === "users" && selectedUserIds.length > 0) {
    const audienceRows = selectedUserIds.map((userId) => ({ session_id: session.id, user_id: userId }))
    const { error: audienceError } = await serviceClient
      .from("upcoming_session_users")
      .insert(audienceRows)

    if (audienceError) {
      return NextResponse.json({ error: audienceError.message }, { status: 500 })
    }
  }

  return NextResponse.json({ session })
}

export async function PUT(request: Request) {
  const { authorized, error } = await checkAdminAccess()
  if (!authorized) {
    return NextResponse.json({ error }, { status: 401 })
  }

  const body = await request.json()
  const id = typeof body.id === "string" ? body.id.trim() : ""
  const title = typeof body.title === "string" ? body.title.trim() : ""
  const description = typeof body.description === "string" ? body.description.trim() : ""
  const meetLink = typeof body.meet_link === "string" ? body.meet_link.trim() : ""
  const sessionAt = typeof body.session_at === "string" ? body.session_at.trim() : ""
  const visibilityScope = typeof body.visibility_scope === "string" ? body.visibility_scope.trim() : "all"
  const audienceTiers = Array.isArray(body.audience_tiers) ? body.audience_tiers.filter((tier) => typeof tier === "string") : []
  const selectedUserIds = Array.isArray(body.selected_user_ids) ? body.selected_user_ids.filter((uid) => typeof uid === "string") : []
  const isActive = body.is_active !== false

  if (!id || !title || !meetLink || !sessionAt) {
    return NextResponse.json({ error: "Session ID, title, meet link, and session date are required" }, { status: 400 })
  }

  if (!["all", "tiers", "users"].includes(visibilityScope)) {
    return NextResponse.json({ error: "Invalid visibility scope" }, { status: 400 })
  }

  if (visibilityScope === "tiers" && audienceTiers.length === 0) {
    return NextResponse.json({ error: "Select at least one tier" }, { status: 400 })
  }

  if (visibilityScope === "users" && selectedUserIds.length === 0) {
    return NextResponse.json({ error: "Select at least one user" }, { status: 400 })
  }

  const serviceClient = createServiceClient()
  const { data: updatedSession, error: updateError } = await serviceClient
    .from("upcoming_sessions")
    .update({
      title,
      description: description || null,
      meet_link: meetLink,
      session_at: sessionAt,
      visibility_scope: visibilityScope,
      audience_tiers: visibilityScope === "tiers" ? audienceTiers : [],
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (updateError || !updatedSession) {
    return NextResponse.json({ error: updateError?.message || "Failed to update session" }, { status: 500 })
  }

  const { error: deleteAudienceError } = await serviceClient
    .from("upcoming_session_users")
    .delete()
    .eq("session_id", id)

  if (deleteAudienceError) {
    return NextResponse.json({ error: deleteAudienceError.message }, { status: 500 })
  }

  if (visibilityScope === "users" && selectedUserIds.length > 0) {
    const audienceRows = selectedUserIds.map((userId) => ({ session_id: id, user_id: userId }))
    const { error: audienceError } = await serviceClient
      .from("upcoming_session_users")
      .insert(audienceRows)

    if (audienceError) {
      return NextResponse.json({ error: audienceError.message }, { status: 500 })
    }
  }

  return NextResponse.json({ session: updatedSession })
}

export async function DELETE(request: Request) {
  const { authorized, error } = await checkAdminAccess()
  if (!authorized) {
    return NextResponse.json({ error }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
  }

  const serviceClient = createServiceClient()
  const { error: deleteError } = await serviceClient
    .from("upcoming_sessions")
    .delete()
    .eq("id", id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
