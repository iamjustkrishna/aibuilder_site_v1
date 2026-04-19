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

  return NextResponse.json(resources || [])
}

// POST - Create a new resource
export async function POST(request: Request) {
  const { authorized, error, user } = await checkAdminAccess()
  if (!authorized) {
    return NextResponse.json({ error }, { status: 401 })
  }

  const body = await request.json()
  const { title, description, type, url, file_storage_path, thumbnail_url, tier_required, category, sort_order } = body

  const normalizedUrl = typeof url === "string" ? url.trim() : ""
  const normalizedStoragePath = typeof file_storage_path === "string" ? file_storage_path.trim() : ""

  if (!title || !type || (!normalizedUrl && !normalizedStoragePath)) {
    return NextResponse.json({ error: "Title, type, and either URL or uploaded file are required" }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error: dbError } = await supabase
    .from("resources")
    .insert({
      title,
      description: description || "",
      type,
      url: normalizedUrl || "#",
      file_storage_path: normalizedStoragePath || null,
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

  if (!normalizedUrl && normalizedStoragePath) {
    const generatedUrl = `/api/resources/${data.id}/view`
    const { data: updatedResource, error: updateError } = await supabase
      .from("resources")
      .update({
        url: generatedUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ resource: updatedResource })
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

  const normalizedStoragePath = typeof updates.file_storage_path === "string" ? updates.file_storage_path.trim() : updates.file_storage_path
  const normalizedUrl = typeof updates.url === "string" ? updates.url.trim() : updates.url

  if (typeof normalizedStoragePath === "string" && normalizedStoragePath && (!normalizedUrl || normalizedUrl === "#")) {
    updates.url = `/api/resources/${id}/view`
  } else if (typeof normalizedUrl === "string") {
    updates.url = normalizedUrl
  }

  if (typeof normalizedStoragePath === "string") {
    updates.file_storage_path = normalizedStoragePath || null
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
