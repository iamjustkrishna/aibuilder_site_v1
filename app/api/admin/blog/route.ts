import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { isAdminEmail } from "@/lib/admin"

type BlogBlock = {
  id: string
  type: "text" | "image" | "video" | "quote" | "divider"
  [key: string]: unknown
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

async function checkAdminAccess() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return { authorized: false, error: "Not authenticated" }
  }

  const isAdmin = await isAdminEmail(user.email)
  if (!isAdmin) {
    return { authorized: false, error: "Not authorized" }
  }

  return { authorized: true, user }
}

async function makeUniqueSlug(serviceClient: ReturnType<typeof createServiceClient>, baseSlug: string, excludeId?: string) {
  let candidate = baseSlug || "blog-post"
  let suffix = 2

  while (true) {
    let query = serviceClient.from("blog_posts").select("id").eq("slug", candidate)
    if (excludeId) {
      query = query.neq("id", excludeId)
    }

    const { data, error } = await query.maybeSingle()
    if (error && error.code !== "PGRST116" && error.code !== "406") {
      throw new Error(error.message)
    }

    if (!data) {
      return candidate
    }

    candidate = `${baseSlug}-${suffix}`
    suffix += 1
  }
}

export async function GET() {
  const { authorized, error } = await checkAdminAccess()
  if (!authorized) {
    return NextResponse.json({ error }, { status: 401 })
  }

  const serviceClient = createServiceClient()
  const { data: posts, error: postsError } = await serviceClient
    .from("blog_posts")
    .select("*")
    .order("updated_at", { ascending: false })

  if (postsError) {
    return NextResponse.json({ error: postsError.message }, { status: 500 })
  }

  return NextResponse.json({ posts: posts || [] })
}

export async function POST(request: Request) {
  const { authorized, error, user } = await checkAdminAccess()
  if (!authorized) {
    return NextResponse.json({ error }, { status: 401 })
  }

  const body = await request.json()
  const title = typeof body.title === "string" ? body.title.trim() : ""
  const excerpt = typeof body.excerpt === "string" ? body.excerpt.trim() : ""
  const coverImageUrl = typeof body.cover_image_url === "string" ? body.cover_image_url.trim() : ""
  const status = typeof body.status === "string" ? body.status.trim().toLowerCase() : "draft"
  const contentBlocks = Array.isArray(body.content_blocks) ? body.content_blocks : []
  const inputSlug = typeof body.slug === "string" ? body.slug.trim() : ""

  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 })
  }

  if (!["draft", "published", "archived"].includes(status)) {
    return NextResponse.json({ error: "Invalid blog status" }, { status: 400 })
  }

  const serviceClient = createServiceClient()
  const baseSlug = slugify(inputSlug || title)
  const slug = await makeUniqueSlug(serviceClient, baseSlug)

  const { data: post, error: insertError } = await serviceClient
    .from("blog_posts")
    .insert({
      slug,
      title,
      excerpt: excerpt || null,
      cover_image_url: coverImageUrl || null,
      status,
      content_blocks: contentBlocks as BlogBlock[],
      published_at: status === "published" ? new Date().toISOString() : null,
      created_by: user?.id,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single()

  if (insertError || !post) {
    return NextResponse.json({ error: insertError?.message || "Failed to create blog post" }, { status: 500 })
  }

  return NextResponse.json({ post }, { status: 201 })
}

export async function PUT(request: Request) {
  const { authorized, error } = await checkAdminAccess()
  if (!authorized) {
    return NextResponse.json({ error }, { status: 401 })
  }

  const body = await request.json()
  const id = typeof body.id === "string" ? body.id.trim() : ""
  const title = typeof body.title === "string" ? body.title.trim() : ""
  const excerpt = typeof body.excerpt === "string" ? body.excerpt.trim() : ""
  const coverImageUrl = typeof body.cover_image_url === "string" ? body.cover_image_url.trim() : ""
  const status = typeof body.status === "string" ? body.status.trim().toLowerCase() : "draft"
  const contentBlocks = Array.isArray(body.content_blocks) ? body.content_blocks : []
  const inputSlug = typeof body.slug === "string" ? body.slug.trim() : ""

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 })
  }

  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 })
  }

  if (!["draft", "published", "archived"].includes(status)) {
    return NextResponse.json({ error: "Invalid blog status" }, { status: 400 })
  }

  const serviceClient = createServiceClient()
  const { data: existingPost, error: existingError } = await serviceClient
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 })
  }

  if (!existingPost) {
    return NextResponse.json({ error: "Blog post not found" }, { status: 404 })
  }

  const baseSlug = slugify(inputSlug || title)
  const slug = await makeUniqueSlug(serviceClient, baseSlug, id)
  const wasPublished = existingPost.status === "published"
  const publishedAt = status === "published" ? existingPost.published_at || new Date().toISOString() : existingPost.published_at

  const { data: post, error: updateError } = await serviceClient
    .from("blog_posts")
    .update({
      slug,
      title,
      excerpt: excerpt || null,
      cover_image_url: coverImageUrl || null,
      status,
      content_blocks: contentBlocks as BlogBlock[],
      published_at: publishedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single()

  if (updateError || !post) {
    return NextResponse.json({ error: updateError?.message || "Failed to update blog post" }, { status: 500 })
  }

  return NextResponse.json({ post, was_published: wasPublished })
}
