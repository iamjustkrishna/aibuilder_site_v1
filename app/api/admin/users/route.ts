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
