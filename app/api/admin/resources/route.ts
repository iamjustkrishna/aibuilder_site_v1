import { createClient } from "@/lib/supabase/server"
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

// GET - Fetch all resources (including inactive) for admin
export async function GET() {
  const { authorized, error } = await checkAdminAccess()
  if (!authorized) {
    return NextResponse.json({ error }, { status: 401 })
  }

  const supabase = await createClient()
  const { data: resources, error: dbError } = await supabase
    .from("resources")
    .select("*")
    .order("tier_required", { ascending: true })
    .order("sort_order", { ascending: true })

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ resources })
}

// POST - Create a new resource
export async function POST(request: Request) {
  const { authorized, error, user } = await checkAdminAccess()
  if (!authorized) {
    return NextResponse.json({ error }, { status: 401 })
  }

  const body = await request.json()
  const { title, description, type, url, thumbnail_url, tier_required, category, sort_order } = body

  if (!title || !type || !url) {
    return NextResponse.json({ error: "Title, type, and URL are required" }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error: dbError } = await supabase
    .from("resources")
    .insert({
      title,
      description: description || "",
      type,
      url,
      thumbnail_url: thumbnail_url || null,
      tier_required: tier_required || "initial",
      category: category || "general",
      sort_order: sort_order || 0,
      created_by: user?.id,
    })
    .select()
    .single()

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ resource: data })
}

// PUT - Update a resource
export async function PUT(request: Request) {
  const { authorized, error } = await checkAdminAccess()
  if (!authorized) {
    return NextResponse.json({ error }, { status: 401 })
  }

  const body = await request.json()
  const { id, ...updates } = body

  if (!id) {
    return NextResponse.json({ error: "Resource ID is required" }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error: dbError } = await supabase
    .from("resources")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ resource: data })
}

// DELETE - Delete a resource
export async function DELETE(request: Request) {
  const { authorized, error } = await checkAdminAccess()
  if (!authorized) {
    return NextResponse.json({ error }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "Resource ID is required" }, { status: 400 })
  }

  const supabase = await createClient()
  const { error: dbError } = await supabase
    .from("resources")
    .delete()
    .eq("id", id)

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
