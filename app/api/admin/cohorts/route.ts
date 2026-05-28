import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { isAdminEmail } from "@/lib/admin"

type CohortStatus = "planned" | "active" | "completed" | "archived"
type EnrollmentStatus = "active" | "completed" | "paused" | "dropped"

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

async function setCurrentCohort(serviceClient: ReturnType<typeof createServiceClient>, cohortId: string) {
  const { error: clearCurrentError } = await serviceClient
    .from("cohorts")
    .update({ is_current: false, updated_at: new Date().toISOString() })
    .eq("is_current", true)

  if (clearCurrentError) {
    throw new Error(clearCurrentError.message)
  }

  const { error: setCurrentError } = await serviceClient
    .from("cohorts")
    .update({ is_current: true, updated_at: new Date().toISOString() })
    .eq("id", cohortId)

  if (setCurrentError) {
    throw new Error(setCurrentError.message)
  }
}

export async function GET(request: Request) {
  const { authorized, error } = await checkAdminAccess()
  if (!authorized) {
    return NextResponse.json({ error }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const cohortId = searchParams.get("cohort_id")
  const resource = searchParams.get("resource") // "weeks" or "videos"

  const serviceClient = createServiceClient()

  // If fetching specific cohort weeks
  if (cohortId && resource === "weeks") {
    const { data: weeks, error: weeksError } = await serviceClient
      .from("cohort_weeks")
      .select("*")
      .eq("cohort_id", cohortId)
      .order("week_number", { ascending: true })

    if (weeksError) {
      return NextResponse.json({ error: weeksError.message }, { status: 500 })
    }

    return NextResponse.json(weeks || [])
  }

  // If fetching specific cohort videos
  if (cohortId && resource === "videos") {
    const { data: videos, error: videosError } = await serviceClient
      .from("cohort_video_configs")
      .select("*")
      .eq("cohort_id", cohortId)
      .order("sort_order", { ascending: true })

    if (videosError) {
      return NextResponse.json({ error: videosError.message }, { status: 500 })
    }

    return NextResponse.json(videos || [])
  }

  // Default: fetch all cohorts
  const [{ data: cohorts, error: cohortsError }, { data: enrollments, error: enrollmentsError }] = await Promise.all([
    serviceClient.from("cohorts").select("*").order("created_at", { ascending: false }),
    serviceClient.from("cohort_enrollments").select("cohort_id, enrollment_status"),
  ])

  if (cohortsError) {
    return NextResponse.json({ error: cohortsError.message }, { status: 500 })
  }

  if (enrollmentsError) {
    return NextResponse.json({ error: enrollmentsError.message }, { status: 500 })
  }

  const countsByCohort = new Map<
    string,
    { total: number; active: number; completed: number; paused: number; dropped: number }
  >()

  for (const row of enrollments || []) {
    const current = countsByCohort.get(row.cohort_id) || { total: 0, active: 0, completed: 0, paused: 0, dropped: 0 }
    current.total += 1
    if (row.enrollment_status === "active") current.active += 1
    if (row.enrollment_status === "completed") current.completed += 1
    if (row.enrollment_status === "paused") current.paused += 1
    if (row.enrollment_status === "dropped") current.dropped += 1
    countsByCohort.set(row.cohort_id, current)
  }

  const result = (cohorts || []).map((cohort) => ({
    ...cohort,
    enrollment_counts: countsByCohort.get(cohort.id) || { total: 0, active: 0, completed: 0, paused: 0, dropped: 0 },
  }))

  return NextResponse.json(result)
}

export async function POST(request: Request) {
  const { authorized, error, user } = await checkAdminAccess()
  if (!authorized) {
    return NextResponse.json({ error }, { status: 401 })
  }

  const body = await request.json()

  // Check if this is a video creation request
  if (body.resource === "video" || body.youtube_url || body.video_url) {
    const cohortId = typeof body.cohort_id === "string" ? body.cohort_id.trim() : ""
    const weekId = typeof body.week_id === "string" ? body.week_id.trim() : ""
    const weekNumberRaw = body.week_number !== undefined ? Number(body.week_number) : null
    const title = typeof body.title === "string" ? body.title.trim() : typeof body.video_title === "string" ? body.video_title.trim() : ""
    const youtubeUrl = typeof body.youtube_url === "string" ? body.youtube_url.trim() : typeof body.video_url === "string" ? body.video_url.trim() : ""
    const description = typeof body.description === "string" ? body.description.trim() : ""
    const sortOrder = Number(body.sort_order || 0)
    const questionCount = body.question_count !== undefined ? Number(body.question_count) : 3
    const autoGenerateQuiz = body.auto_generate_quiz !== false
    const isActive = body.is_active !== false
    const resourceId = typeof body.resource_id === "string" ? body.resource_id.trim() : ""

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

    if (!cohortId) {
      return NextResponse.json({ error: "cohort_id is required" }, { status: 400 })
    }

    if (!uuidRegex.test(cohortId)) {
      return NextResponse.json({ error: "Invalid cohort_id format" }, { status: 400 })
    }

    if (weekId && !uuidRegex.test(weekId)) {
      return NextResponse.json({ error: "Invalid week_id format" }, { status: 400 })
    }

    if (resourceId && !uuidRegex.test(resourceId)) {
      return NextResponse.json({ error: "Invalid resource_id format" }, { status: 400 })
    }

    if (!title) {
      return NextResponse.json({ error: "title/video_title is required" }, { status: 400 })
    }

    if (!weekId && (weekNumberRaw === null || Number.isNaN(weekNumberRaw))) {
      return NextResponse.json({ error: "week_id or week_number is required" }, { status: 400 })
    }

    if (weekNumberRaw !== null && (weekNumberRaw <= 0 || !Number.isInteger(weekNumberRaw))) {
      return NextResponse.json({ error: "week_number must be an integer greater than 0" }, { status: 400 })
    }

    if (questionCount < 1 || questionCount > 10 || !Number.isInteger(questionCount)) {
      return NextResponse.json({ error: "question_count must be an integer between 1 and 10" }, { status: 400 })
    }

    const serviceClient = createServiceClient()
    let weekNumber = weekNumberRaw

    if (!weekNumber && weekId) {
      const { data: cohortWeek, error: cohortWeekError } = await serviceClient
        .from("cohort_weeks")
        .select("week_number")
        .eq("id", weekId)
        .eq("cohort_id", cohortId)
        .single()

      if (cohortWeekError || !cohortWeek) {
        return NextResponse.json({ error: "Week not found for this cohort" }, { status: 404 })
      }

      weekNumber = cohortWeek.week_number
    }

    if (weekNumber !== null && weekNumber <= 0) {
      return NextResponse.json({ error: "Resolved week_number must be greater than 0" }, { status: 400 })
    }

    const { data: video, error: videoError } = await serviceClient
      .from("cohort_video_configs")
      .insert({
        cohort_id: cohortId,
        week_number: weekNumber,
        video_title: title,
        description: description || null,
        video_url: youtubeUrl || null,
        sort_order: sortOrder,
        question_count: questionCount,
        auto_generate_quiz: autoGenerateQuiz,
        is_active: isActive,
        resource_id: resourceId || null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (videoError || !video) {
      return NextResponse.json({ error: videoError?.message || "Failed to create video config" }, { status: 500 })
    }

    return NextResponse.json(video)
  }

  // Default: create cohort
  const code = typeof body.code === "string" ? body.code.trim().toLowerCase() : ""
  const name = typeof body.name === "string" ? body.name.trim() : ""
  const description = typeof body.description === "string" ? body.description.trim() : ""
  const status = (typeof body.status === "string" ? body.status.trim().toLowerCase() : "active") as CohortStatus
  const startsAt = typeof body.starts_at === "string" ? body.starts_at : null
  const endsAt = typeof body.ends_at === "string" ? body.ends_at : null
  const isCurrent = body.is_current === true
  const weekCount = Number(body.week_count || 0)

  if (!code || !name) {
    return NextResponse.json({ error: "Cohort code and name are required" }, { status: 400 })
  }

  if (!["planned", "active", "completed", "archived"].includes(status)) {
    return NextResponse.json({ error: "Invalid cohort status" }, { status: 400 })
  }

  const serviceClient = createServiceClient()

  const { data: cohort, error: createError } = await serviceClient
    .from("cohorts")
    .insert({
      code,
      name,
      description: description || null,
      status,
      starts_at: startsAt,
      ends_at: endsAt,
      is_current: false,
      created_by: user?.id,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (createError || !cohort) {
    return NextResponse.json({ error: createError?.message || "Failed to create cohort" }, { status: 500 })
  }

  if (weekCount > 0) {
    const weekRows = Array.from({ length: weekCount }, (_, index) => ({
      cohort_id: cohort.id,
      week_number: index + 1,
      title: `Week ${index + 1}`,
    }))
    const { error: weeksError } = await serviceClient.from("cohort_weeks").insert(weekRows)
    if (weeksError) {
      return NextResponse.json({ error: weeksError.message }, { status: 500 })
    }
  }

  if (isCurrent) {
    try {
      await setCurrentCohort(serviceClient, cohort.id)
    } catch (setCurrentError: any) {
      return NextResponse.json({ error: setCurrentError?.message || "Failed to set current cohort" }, { status: 500 })
    }
  }

  return NextResponse.json(cohort)
}

export async function PUT(request: Request) {
  const { authorized, error } = await checkAdminAccess()
  if (!authorized) {
    return NextResponse.json({ error }, { status: 401 })
  }

  const body = await request.json()
  const id = typeof body.id === "string" ? body.id.trim() : ""
  const code = typeof body.code === "string" ? body.code.trim().toLowerCase() : ""
  const name = typeof body.name === "string" ? body.name.trim() : ""
  const description = typeof body.description === "string" ? body.description.trim() : ""
  const status = (typeof body.status === "string" ? body.status.trim().toLowerCase() : "active") as CohortStatus
  const startsAt = typeof body.starts_at === "string" ? body.starts_at : null
  const endsAt = typeof body.ends_at === "string" ? body.ends_at : null
  const isCurrent = body.is_current === true

  if (!id || !code || !name) {
    return NextResponse.json({ error: "Cohort id, code and name are required" }, { status: 400 })
  }

  if (!["planned", "active", "completed", "archived"].includes(status)) {
    return NextResponse.json({ error: "Invalid cohort status" }, { status: 400 })
  }

  const serviceClient = createServiceClient()
  const { data: cohort, error: updateError } = await serviceClient
    .from("cohorts")
    .update({
      code,
      name,
      description: description || null,
      status,
      starts_at: startsAt,
      ends_at: endsAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (updateError || !cohort) {
    return NextResponse.json({ error: updateError?.message || "Failed to update cohort" }, { status: 500 })
  }

  if (isCurrent) {
    try {
      await setCurrentCohort(serviceClient, id)
    } catch (setCurrentError: any) {
      return NextResponse.json({ error: setCurrentError?.message || "Failed to set current cohort" }, { status: 500 })
    }
  }

  return NextResponse.json({ cohort })
}

export async function PATCH(request: Request) {
  const { authorized, error } = await checkAdminAccess()
  if (!authorized) {
    return NextResponse.json({ error }, { status: 401 })
  }

  const body = await request.json()
  const cohortId = typeof body.cohort_id === "string" ? body.cohort_id.trim() : ""
  const action = typeof body.action === "string" ? body.action.trim() : ""
  const userIds = Array.isArray(body.user_ids) ? body.user_ids.filter((id: unknown): id is string => typeof id === "string") : []
  const enrollmentStatus = (typeof body.enrollment_status === "string" ? body.enrollment_status.toLowerCase() : "active") as EnrollmentStatus

  if (action === "set-current") {
    if (!cohortId) {
      return NextResponse.json({ error: "cohort_id is required" }, { status: 400 })
    }

    const serviceClient = createServiceClient()
    const { error: clearCurrentError } = await serviceClient
      .from("cohorts")
      .update({ is_current: false, updated_at: new Date().toISOString() })
      .eq("is_current", true)

    if (clearCurrentError) {
      return NextResponse.json({ error: clearCurrentError.message }, { status: 500 })
    }

    const { data: cohort, error: setCurrentError } = await serviceClient
      .from("cohorts")
      .update({ is_current: true, updated_at: new Date().toISOString() })
      .eq("id", cohortId)
      .select()
      .single()

    if (setCurrentError) {
      return NextResponse.json({ error: setCurrentError.message }, { status: 500 })
    }

    return NextResponse.json(cohort)
  }

  if (action === "toggle-project-submission") {
    if (!cohortId) {
      return NextResponse.json({ error: "cohort_id is required" }, { status: 400 })
    }

    const projectSubmissionActive = body.project_submission_active === true
    const serviceClient = createServiceClient()

    const { data: cohort, error: updateError } = await serviceClient
      .from("cohorts")
      .update({ project_submission_active: projectSubmissionActive, updated_at: new Date().toISOString() })
      .eq("id", cohortId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json(cohort)
  }

  if (!cohortId || userIds.length === 0) {
    return NextResponse.json({ error: "cohort_id and user_ids are required" }, { status: 400 })
  }

  if (!["active", "completed", "paused", "dropped"].includes(enrollmentStatus)) {
    return NextResponse.json({ error: "Invalid enrollment status" }, { status: 400 })
  }

  const serviceClient = createServiceClient()
  const rows = userIds.map((userId: string) => ({
    cohort_id: cohortId,
    user_id: userId,
    enrollment_status: enrollmentStatus,
    updated_at: new Date().toISOString(),
    completed_at: enrollmentStatus === "completed" ? new Date().toISOString() : null,
  }))

  const { error: upsertError } = await serviceClient
    .from("cohort_enrollments")
    .upsert(rows, { onConflict: "cohort_id,user_id" })

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, updated: rows.length })
}

export async function DELETE(request: Request) {
  const { authorized, error } = await checkAdminAccess()
  if (!authorized) {
    return NextResponse.json({ error }, { status: 401 })
  }

  const body = await request.json()
  const videoId = typeof body.video_id === "string" ? body.video_id.trim() : ""
  const cohortId = typeof body.cohort_id === "string" ? body.cohort_id.trim() : ""

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  if (videoId && !uuidRegex.test(videoId)) {
    return NextResponse.json({ error: "Invalid video_id format" }, { status: 400 })
  }

  if (cohortId && !uuidRegex.test(cohortId)) {
    return NextResponse.json({ error: "Invalid cohort_id format" }, { status: 400 })
  }

  const serviceClient = createServiceClient()

  // If deleting a specific video
  if (videoId) {
    const { error: deleteVideoError } = await serviceClient
      .from("cohort_video_configs")
      .delete()
      .eq("id", videoId)

    if (deleteVideoError) {
      return NextResponse.json({ error: deleteVideoError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  }

  // If deleting a cohort
  if (!cohortId) {
    return NextResponse.json({ error: "cohort_id or video_id is required" }, { status: 400 })
  }

  // Delete related records first (enrollments, weeks, videos)
  const { error: enrollmentsError } = await serviceClient
    .from("cohort_enrollments")
    .delete()
    .eq("cohort_id", cohortId)

  if (enrollmentsError) {
    return NextResponse.json({ error: enrollmentsError.message }, { status: 500 })
  }

  const { error: videosError } = await serviceClient
    .from("cohort_video_configs")
    .delete()
    .match({ cohort_id: cohortId })

  if (videosError) {
    return NextResponse.json({ error: videosError.message }, { status: 500 })
  }

  const { error: weeksError } = await serviceClient
    .from("cohort_weeks")
    .delete()
    .eq("cohort_id", cohortId)

  if (weeksError) {
    return NextResponse.json({ error: weeksError.message }, { status: 500 })
  }

  // Finally delete the cohort
  const { error: deleteError } = await serviceClient
    .from("cohorts")
    .delete()
    .eq("id", cohortId)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}