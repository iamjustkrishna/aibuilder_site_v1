import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { isAdminEmail } from "@/lib/admin"

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
  const { authorized, error } = await checkAdminAccess()
  if (!authorized) {
    return NextResponse.json({ error }, { status: 401 })
  }

  // Use service client to bypass RLS and fetch ALL users
  const serviceClient = createServiceClient()
  const { data: users, error: dbError } = await serviceClient
    .from("users")
    .select("id, email, full_name, membership_tier, created_at, avatar_url")
    .order("created_at", { ascending: false })

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json(users || [])
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

// PUT - Update user's membership tier
export async function PUT(request: Request) {
  const { authorized, error } = await checkAdminAccess()
  if (!authorized) {
    return NextResponse.json({ error }, { status: 401 })
  }

  const body = await request.json()
  const { userId, id, membership_tier } = body
  const targetUserId = userId || id

  if (!targetUserId || !membership_tier) {
    return NextResponse.json({ error: "User ID and membership tier are required" }, { status: 400 })
  }

  // Validate tier value
  const validTiers = ["initial", "foundational", "builder", "architect"]
  if (!validTiers.includes(membership_tier)) {
    return NextResponse.json({ error: "Invalid membership tier" }, { status: 400 })
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
    if (userIsAdmin) {
      return NextResponse.json({ error: "Cannot modify admin user tier" }, { status: 403 })
    }
  }

  const { data, error: dbError } = await serviceClient
    .from("users")
    .update({ membership_tier })
    .eq("id", targetUserId)
    .select()
    .single()

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ user: data })
}
