const fs = require('fs');
const path = require('path');

const baseDir = 'C:\\Users\\krish\\Downloads\\AIBuilder\\Website\\aibuilder_site_v1\\app\\api\\admin\\curated-videos';
const idDir = path.join(baseDir, '[id]');

// Create directories
if (!fs.existsSync(baseDir)) {
  fs.mkdirSync(baseDir, { recursive: true });
  console.log('Created directory:', baseDir);
}

if (!fs.existsSync(idDir)) {
  fs.mkdirSync(idDir, { recursive: true });
  console.log('Created directory:', idDir);
}

// Main route.ts content
const mainRouteContent = `import { createClient, createServiceClient } from "@/lib/supabase/server"
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

export async function GET(request: Request) {
  const { authorized, error } = await checkAdminAccess()
  if (!authorized) {
    return NextResponse.json({ error }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const cohortId = searchParams.get("cohort_id")
  const weekNumber = searchParams.get("week_number")

  if (!cohortId) {
    return NextResponse.json({ error: "cohort_id is required" }, { status: 400 })
  }

  const serviceClient = createServiceClient()
  let query = serviceClient
    .from("cohort_video_configs")
    .select("*")
    .eq("cohort_id", cohortId)

  if (weekNumber) {
    const week = parseInt(weekNumber)
    if (isNaN(week) || week <= 0) {
      return NextResponse.json({ error: "Invalid week_number" }, { status: 400 })
    }
    query = query.eq("week_number", week)
  }

  const { data: videos, error: videosError } = await query.order("week_number", { ascending: true }).order("sort_order", { ascending: true })

  if (videosError) {
    return NextResponse.json({ error: videosError.message }, { status: 500 })
  }

  return NextResponse.json(videos || [])
}

export async function POST(request: Request) {
  const { authorized, error, user } = await checkAdminAccess()
  if (!authorized) {
    return NextResponse.json({ error }, { status: 401 })
  }

  const body = await request.json()
  const cohortId = typeof body.cohort_id === "string" ? body.cohort_id.trim() : ""
  const weekNumber = body.week_number !== undefined ? parseInt(body.week_number) : null
  const videoUrl = typeof body.video_url === "string" ? body.video_url.trim() : ""
  const videoTitle = typeof body.video_title === "string" ? body.video_title.trim() : ""
  const resourceId = typeof body.resource_id === "string" ? body.resource_id.trim() : null
  const sortOrder = body.sort_order !== undefined ? parseInt(body.sort_order) : 0
  const questionCount = body.question_count !== undefined ? parseInt(body.question_count) : 3
  const autoGenerateQuiz = body.auto_generate_quiz !== false
  const isActive = body.is_active !== false

  // Validation
  if (!cohortId) {
    return NextResponse.json({ error: "cohort_id is required" }, { status: 400 })
  }

  if (!weekNumber || weekNumber <= 0) {
    return NextResponse.json({ error: "Valid week_number is required" }, { status: 400 })
  }

  if (!videoTitle) {
    return NextResponse.json({ error: "video_title is required" }, { status: 400 })
  }

  if (!videoUrl && !resourceId) {
    return NextResponse.json({ error: "Either video_url or resource_id is required" }, { status: 400 })
  }

  if (questionCount < 1 || questionCount > 10) {
    return NextResponse.json({ error: "question_count must be between 1 and 10" }, { status: 400 })
  }

  const serviceClient = createServiceClient()

  // Verify cohort exists
  const { data: cohort, error: cohortError } = await serviceClient
    .from("cohorts")
    .select("id")
    .eq("id", cohortId)
    .single()

  if (cohortError || !cohort) {
    return NextResponse.json({ error: "Cohort not found" }, { status: 404 })
  }

  // Create the video config
  const { data: video, error: insertError } = await serviceClient
    .from("cohort_video_configs")
    .insert({
      cohort_id: cohortId,
      week_number: weekNumber,
      video_url: videoUrl || null,
      video_title: videoTitle,
      resource_id: resourceId || null,
      sort_order: sortOrder,
      question_count: questionCount,
      auto_generate_quiz: autoGenerateQuiz,
      is_active: isActive,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (insertError || !video) {
    return NextResponse.json({ error: insertError?.message || "Failed to create curated video" }, { status: 500 })
  }

  return NextResponse.json({ video }, { status: 201 })
}

export async function PUT(request: Request) {
  const { authorized, error } = await checkAdminAccess()
  if (!authorized) {
    return NextResponse.json({ error }, { status: 401 })
  }

  const body = await request.json()
  const id = typeof body.id === "string" ? body.id.trim() : ""
  const videoUrl = typeof body.video_url === "string" ? body.video_url.trim() : ""
  const videoTitle = typeof body.video_title === "string" ? body.video_title.trim() : ""
  const resourceId = typeof body.resource_id === "string" ? body.resource_id.trim() : null
  const sortOrder = body.sort_order !== undefined ? parseInt(body.sort_order) : undefined
  const questionCount = body.question_count !== undefined ? parseInt(body.question_count) : undefined
  const autoGenerateQuiz = body.auto_generate_quiz !== undefined ? body.auto_generate_quiz : undefined
  const isActive = body.is_active !== undefined ? body.is_active : undefined

  // Validation
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 })
  }

  if (!videoTitle) {
    return NextResponse.json({ error: "video_title is required" }, { status: 400 })
  }

  if (!videoUrl && !resourceId) {
    return NextResponse.json({ error: "Either video_url or resource_id is required" }, { status: 400 })
  }

  if (questionCount !== undefined && (questionCount < 1 || questionCount > 10)) {
    return NextResponse.json({ error: "question_count must be between 1 and 10" }, { status: 400 })
  }

  const serviceClient = createServiceClient()

  // Build update object with only provided fields
  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  }

  if (videoTitle) updateData.video_title = videoTitle
  if (videoUrl) updateData.video_url = videoUrl
  if (resourceId) updateData.resource_id = resourceId
  if (sortOrder !== undefined) updateData.sort_order = sortOrder
  if (questionCount !== undefined) updateData.question_count = questionCount
  if (autoGenerateQuiz !== undefined) updateData.auto_generate_quiz = autoGenerateQuiz
  if (isActive !== undefined) updateData.is_active = isActive

  const { data: video, error: updateError } = await serviceClient
    .from("cohort_video_configs")
    .update(updateData)
    .eq("id", id)
    .select()
    .single()

  if (updateError || !video) {
    return NextResponse.json({ error: updateError?.message || "Failed to update curated video" }, { status: 500 })
  }

  return NextResponse.json({ video })
}
`;

// [id]/route.ts content
const idRouteContent = `import { createServiceClient, createClient } from "@/lib/supabase/server"
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

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { authorized, error } = await checkAdminAccess()
  if (!authorized) {
    return NextResponse.json({ error }, { status: 401 })
  }

  const id = params.id

  if (!id) {
    return NextResponse.json({ error: "Video ID is required" }, { status: 400 })
  }

  const serviceClient = createServiceClient()

  // First, verify the video exists
  const { data: video, error: fetchError } = await serviceClient
    .from("cohort_video_configs")
    .select("id")
    .eq("id", id)
    .single()

  if (fetchError || !video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 })
  }

  // Delete the video
  const { error: deleteError } = await serviceClient
    .from("cohort_video_configs")
    .delete()
    .eq("id", id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
`;

// Write files
fs.writeFileSync(path.join(baseDir, 'route.ts'), mainRouteContent);
console.log('Created file:', path.join(baseDir, 'route.ts'));

fs.writeFileSync(path.join(idDir, 'route.ts'), idRouteContent);
console.log('Created file:', path.join(idDir, 'route.ts'));

console.log('\n✅ All files created successfully!');
