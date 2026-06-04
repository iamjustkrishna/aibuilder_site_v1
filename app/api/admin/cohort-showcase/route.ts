import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { isAdminEmail } from "@/lib/admin"

function canonicalShowcaseSlug(slug: string) {
  return slug === "cohort-0" ? "cohort-1" : slug
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const isAdmin = await isAdminEmail(user.email)
    if (!isAdmin) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const cohortId = searchParams.get("cohort_id")

    if (!cohortId) {
      return NextResponse.json({ error: "Cohort ID is required" }, { status: 400 })
    }

    const serviceClient = createServiceClient()
    const { data: showcase, error } = await serviceClient
      .from("cohort_showcases")
      .select("*")
      .eq("cohort_id", cohortId)
      .maybeSingle()

    if (error) {
      // Check if table does not exist
      if (error.code === "P0001" || error.message.includes("does not exist") || error.code === "42P01") {
        return NextResponse.json({
          error: "Database table 'cohort_showcases' does not exist yet. Please run migration 013 or execute the SQL statement in your Supabase SQL Editor.",
          needsMigration: true
        }, { status: 200 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(showcase || null)
  } catch (error: any) {
    console.error("GET cohort showcase error:", error)
    return NextResponse.json({ error: error.message || "Failed to load showcase" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const isAdmin = await isAdminEmail(user.email)
    if (!isAdmin) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const body = await request.json()
    const {
      cohort_id,
      slug: rawSlug,
      title,
      hero_title,
      hero_subtitle,
      summary,
      highlight_video_url,
      is_active,
      settings = {}
    } = body

    const slug = canonicalShowcaseSlug(String(rawSlug || "").trim())

    if (!cohort_id || !slug || !title) {
      return NextResponse.json({ error: "cohort_id, slug, and title are required" }, { status: 400 })
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
    if (!slugRegex.test(slug)) {
      return NextResponse.json({ error: "Slug must be lowercase alphanumeric characters separated by hyphens (e.g. cohort-1)" }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    // Upsert showcase settings
    const { data: showcase, error } = await serviceClient
      .from("cohort_showcases")
      .upsert({
        cohort_id,
        slug,
        title,
        hero_title: hero_title || null,
        hero_subtitle: hero_subtitle || null,
        summary: summary || null,
        highlight_video_url: highlight_video_url || null,
        is_active: is_active || false,
        settings,
        updated_at: new Date().toISOString()
      }, {
        onConflict: "cohort_id"
      })
      .select()
      .single()

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "This URL slug is already taken by another cohort showcase page. Please choose a unique slug." }, { status: 400 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(showcase)
  } catch (error: any) {
    console.error("POST cohort showcase error:", error)
    return NextResponse.json({ error: error.message || "Failed to save showcase" }, { status: 500 })
  }
}
