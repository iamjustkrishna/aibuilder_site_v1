import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getAdminEmails, isAdminEmail } from "@/lib/admin"

// Helper to check admin access
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

// GET - Fetch all users from users table
export async function GET() {
  const { authorized, error, user } = await checkAdminAccess()
  if (!authorized) {
    return NextResponse.json({ error }, { status: 401 })
  }

  // Use service client to bypass RLS and fetch ALL users
  const serviceClient = createServiceClient()

  // Fetch all users with safe fallback
  let selectColumns = "id, email, full_name, membership_tier, created_at, avatar_url, is_team_member"
  let users: any[] | null = null
  let dbError: any = null

  const mainResult = await serviceClient
    .from("users")
    .select(selectColumns)
    .order("created_at", { ascending: false })
  
  users = mainResult.data
  dbError = mainResult.error

  // Fallback if the column is_team_member is missing in SQL
  if (dbError && dbError.message.includes("is_team_member")) {
    const fallbackResult = await serviceClient
      .from("users")
      .select("id, email, full_name, membership_tier, created_at, avatar_url")
      .order("created_at", { ascending: false })
    users = fallbackResult.data
    dbError = fallbackResult.error
  }

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  let deletionRequests: Array<{ user_id: string; requested_by_email: string }> = []
  const deletionResult = await serviceClient
    .from("user_deletion_requests")
    .select("user_id, requested_by_email")

  if (!deletionResult.error) {
    deletionRequests = deletionResult.data || []
  }

  const requestMap = new Map<string, { count: number; requestedByMe: boolean }>()
  const currentAdminEmail = user?.email?.toLowerCase() || ""
  for (const request of deletionRequests || []) {
    const entry = requestMap.get(request.user_id) || { count: 0, requestedByMe: false }
    entry.count += 1
    if (request.requested_by_email?.toLowerCase() === currentAdminEmail) {
      entry.requestedByMe = true
    }
    requestMap.set(request.user_id, entry)
  }

  let activitySessions: Array<{ user_id: string; total_active_seconds: number; last_seen_at: string | null }> = []
  const activityResult = await serviceClient
    .from("website_activity_sessions")
    .select("user_id, total_active_seconds, last_seen_at")

  if (!activityResult.error) {
    activitySessions = activityResult.data || []
  }

  const activityMap = new Map<string, { totalActiveSeconds: number; sessionCount: number; lastSeenAt: string | null }>()
  for (const session of activitySessions) {
    const entry = activityMap.get(session.user_id) || { totalActiveSeconds: 0, sessionCount: 0, lastSeenAt: null }
    entry.totalActiveSeconds += session.total_active_seconds || 0
    entry.sessionCount += 1
    if (!entry.lastSeenAt || (session.last_seen_at && session.last_seen_at > entry.lastSeenAt)) {
      entry.lastSeenAt = session.last_seen_at
    }
    activityMap.set(session.user_id, entry)
  }

  // Fetch cohort enrollments to map user -> cohort relationships
  let enrollments: any[] = []
  const enrollmentsResult = await serviceClient
    .from("cohort_enrollments")
    .select("user_id, cohort_id, admin_reminders_enabled")

  if (!enrollmentsResult.error) {
    enrollments = enrollmentsResult.data || []
  }

  const enrollmentMap = new Map<string, string[]>()
  const enrollmentDetailsMap = new Map<string, Array<{ cohort_id: string; admin_reminders_enabled: boolean }>>()
  for (const enrollment of enrollments) {
    const list = enrollmentMap.get(enrollment.user_id) || []
    list.push(enrollment.cohort_id)
    enrollmentMap.set(enrollment.user_id, list)

    const detailsList = enrollmentDetailsMap.get(enrollment.user_id) || []
    detailsList.push({
      cohort_id: enrollment.cohort_id,
      admin_reminders_enabled: enrollment.admin_reminders_enabled !== false,
    })
    enrollmentDetailsMap.set(enrollment.user_id, detailsList)
  }

  const adminCount = getAdminEmails().length
  const response = (users || []).map((user) => {
    const requestState = requestMap.get(user.id) || { count: 0, requestedByMe: false }
    const activityState = activityMap.get(user.id) || { totalActiveSeconds: 0, sessionCount: 0, lastSeenAt: null }
    return {
      ...user,
      is_team_member: (user as any).is_team_member ?? false,
      cohort_ids: enrollmentMap.get(user.id) || [],
      cohort_enrollments: enrollmentDetailsMap.get(user.id) || [],
      deletion_request_count: requestState.count,
      deletion_requested_by_me: requestState.requestedByMe,
      deletion_required_count: adminCount,
      total_active_seconds: activityState.totalActiveSeconds,
      activity_session_count: activityState.sessionCount,
      last_seen_at: activityState.lastSeenAt,
    }
  })

  return NextResponse.json(response)
}

// POST - Create a new user and profile
export async function POST(request: Request) {
  const { authorized, error } = await checkAdminAccess()
  if (!authorized) {
    return NextResponse.json({ error }, { status: 401 })
  }

  const body = await request.json()
  const fullName = typeof body.full_name === "string" ? body.full_name.trim() : ""
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
  const membershipTier = typeof body.membership_tier === "string" ? body.membership_tier.trim() : ""
  const avatarUrl = typeof body.avatar_url === "string" ? body.avatar_url.trim() : ""

  const validTiers = ["initial", "foundational", "builder", "architect"]
  if (!fullName || !email || !membershipTier) {
    return NextResponse.json({ error: "Name, email, and membership tier are required" }, { status: 400 })
  }

  if (!validTiers.includes(membershipTier)) {
    return NextResponse.json({ error: "Invalid membership tier" }, { status: 400 })
  }

  const serviceClient = createServiceClient()

  const { data: existingProfile } = await serviceClient
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle()

  if (existingProfile) {
    return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 })
  }

  const origin = new URL(request.url).origin
  const { data: inviteData, error: inviteError } = await serviceClient.auth.admin.inviteUserByEmail(email, {
    data: {
      full_name: fullName,
      avatar_url: avatarUrl || undefined,
    },
    redirectTo: `${origin}/auth/callback`,
  })

  if (inviteError || !inviteData?.user) {
    return NextResponse.json({ error: inviteError?.message || "Failed to create user" }, { status: 500 })
  }

  const { error: profileError } = await serviceClient
    .from("users")
    .insert({
      id: inviteData.user.id,
      email,
      full_name: fullName,
      avatar_url: avatarUrl || null,
      membership_tier: membershipTier,
    })

  if (profileError) {
    await serviceClient.auth.admin.deleteUser(inviteData.user.id)
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  const { data: createdProfile } = await serviceClient
    .from("users")
    .select("id, email, full_name, membership_tier, created_at, avatar_url")
    .eq("id", inviteData.user.id)
    .single()

  return NextResponse.json({
    user: createdProfile || {
      id: inviteData.user.id,
      email,
      full_name: fullName,
      membership_tier: membershipTier,
      avatar_url: avatarUrl || null,
    },
    invited: true,
  })
}

// DELETE - Staged deletion for a non-admin user
export async function DELETE(request: Request) {
  const { authorized, error, user } = await checkAdminAccess()
  if (!authorized) {
    return NextResponse.json({ error }, { status: 401 })
  }

  const body = await request.json()
  const targetUserId = typeof body.id === "string" ? body.id : typeof body.userId === "string" ? body.userId : ""
  if (!targetUserId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 })
  }

  const serviceClient = createServiceClient()

  const { data: targetUser, error: targetUserError } = await serviceClient
    .from("users")
    .select("id, email, full_name")
    .eq("id", targetUserId)
    .single()

  if (targetUserError || !targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  if (targetUser.email && (await isAdminEmail(targetUser.email))) {
    return NextResponse.json({ error: "Admin users cannot be deleted" }, { status: 403 })
  }

  const adminEmails = getAdminEmails()
  if (adminEmails.length === 0) {
    return NextResponse.json({ error: "No admins configured" }, { status: 500 })
  }

  const currentAdminEmail = user?.email?.toLowerCase() || ""
  const { error: upsertError } = await serviceClient
    .from("user_deletion_requests")
    .upsert({
      user_id: targetUserId,
      requested_by_user_id: user?.id,
      requested_by_email: currentAdminEmail,
      requested_at: new Date().toISOString(),
    }, { onConflict: "user_id,requested_by_email" })

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 })
  }

  const { data: requests, error: countError } = await serviceClient
    .from("user_deletion_requests")
    .select("requested_by_email")
    .eq("user_id", targetUserId)

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 })
  }

  const uniqueApprovals = new Set((requests || []).map((row) => row.requested_by_email.toLowerCase()))

  if (uniqueApprovals.size >= adminEmails.length) {
    const { error: deleteAuthError } = await serviceClient.auth.admin.deleteUser(targetUserId)
    if (deleteAuthError) {
      return NextResponse.json({ error: deleteAuthError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, deleted: true })
  }

  return NextResponse.json({
    success: true,
    pending: true,
    approvedCount: uniqueApprovals.size,
    requiredCount: adminEmails.length,
  })
}

// PUT - Update user's details (membership tier, team member status, cohorts)
export async function PUT(request: Request) {
  const { authorized, error } = await checkAdminAccess()
  if (!authorized) {
    return NextResponse.json({ error }, { status: 401 })
  }

  const body = await request.json()
  const { userId, id, membership_tier, is_team_member, cohort_ids, cohort_id, admin_reminders_enabled } = body
  const targetUserId = userId || id

  if (!targetUserId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 })
  }

  const updates: any = {}

  if (membership_tier !== undefined) {
    const validTiers = ["initial", "foundational", "builder", "architect"]
    if (!validTiers.includes(membership_tier)) {
      return NextResponse.json({ error: "Invalid membership tier" }, { status: 400 })
    }
    updates.membership_tier = membership_tier
  }

  if (is_team_member !== undefined) {
    updates.is_team_member = is_team_member
  }

  // Use service client to bypass RLS for all operations
  const serviceClient = createServiceClient()
  
  // Get user email to check if they're an admin
  const { data: userData } = await serviceClient
    .from("users")
    .select("email")
    .eq("id", targetUserId)
    .single()

  if (userData?.email) {
    const userIsAdmin = await isAdminEmail(userData.email)
    if (userIsAdmin && membership_tier !== undefined) {
      return NextResponse.json({ error: "Cannot modify admin user tier" }, { status: 403 })
    }
  }

  let updatedUser = null
  if (Object.keys(updates).length > 0) {
    const { data, error: dbError } = await serviceClient
      .from("users")
      .update(updates)
      .eq("id", targetUserId)
      .select()
      .single()

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }
    updatedUser = data
  } else {
    // Fetch existing user details if no users fields are updated
    const { data } = await serviceClient
      .from("users")
      .select("*")
      .eq("id", targetUserId)
      .single()
    updatedUser = data
  }

  // Handle cohort enrollments synchronization if cohort_ids provided
  if (cohort_ids !== undefined && Array.isArray(cohort_ids)) {
    // Delete existing enrollments for this user
    const { error: deleteError } = await serviceClient
      .from("cohort_enrollments")
      .delete()
      .eq("user_id", targetUserId)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // Insert new enrollments
    if (cohort_ids.length > 0) {
      const toInsert = cohort_ids.map((cohortId: string) => ({
        user_id: targetUserId,
        cohort_id: cohortId,
        enrollment_status: "active"
      }))

      const { error: insertError } = await serviceClient
        .from("cohort_enrollments")
        .insert(toInsert)

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
    }
  }

  // Handle cohort reminder status update if cohort_id and admin_reminders_enabled provided
  if (cohort_id !== undefined && admin_reminders_enabled !== undefined) {
    const { error: updateEnrollmentError } = await serviceClient
      .from("cohort_enrollments")
      .update({ admin_reminders_enabled: admin_reminders_enabled === true })
      .match({ user_id: targetUserId, cohort_id })

    if (updateEnrollmentError) {
      return NextResponse.json({ error: updateEnrollmentError.message }, { status: 500 })
    }
  }

  // Fetch latest cohort enrollments
  const { data: latestEnrollments } = await serviceClient
    .from("cohort_enrollments")
    .select("cohort_id, admin_reminders_enabled")
    .eq("user_id", targetUserId)

  const mappedEnrollments = (latestEnrollments || []).map((e) => ({
    cohort_id: e.cohort_id,
    admin_reminders_enabled: e.admin_reminders_enabled !== false
  }))

  return NextResponse.json({ 
    user: {
      ...updatedUser,
      cohort_ids: mappedEnrollments.map(e => e.cohort_id),
      cohort_enrollments: mappedEnrollments
    } 
  })
}
