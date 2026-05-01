import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const body = await request.json()
  const cohortId = typeof body.cohort_id === "string" ? body.cohort_id : ""
  const cohortVideoConfigId = typeof body.cohort_video_config_id === "string" ? body.cohort_video_config_id : ""
  const watchedSeconds = Number(body.watched_seconds || 0)
  const maxProgressPercent = Number(body.max_progress_percent || 0)
  const endedOnce = body.ended_once === true

  if (!cohortId || !cohortVideoConfigId) {
    return NextResponse.json({ error: "cohort_id and cohort_video_config_id are required" }, { status: 400 })
  }

  const cappedProgress = Math.min(100, Math.max(0, maxProgressPercent))
  const safeWatched = Math.max(0, Math.floor(watchedSeconds))
  const isCompleted = endedOnce && cappedProgress >= 90

  const serviceClient = createServiceClient()
  const { data: existing, error: existingError } = await serviceClient
    .from("learning_video_progress")
    .select("id, watched_seconds, max_progress_percent, ended_once, completed_at")
    .eq("user_id", user.id)
    .eq("cohort_video_config_id", cohortVideoConfigId)
    .maybeSingle()

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 })
  }

  const nextWatched = existing ? Math.max(existing.watched_seconds || 0, safeWatched) : safeWatched
  const nextProgress = existing ? Math.max(Number(existing.max_progress_percent || 0), cappedProgress) : cappedProgress
  const nextEnded = existing ? Boolean(existing.ended_once || endedOnce) : endedOnce
  const nextCompletedAt = existing?.completed_at || (nextEnded && nextProgress >= 90 ? new Date().toISOString() : null)

  const payload = {
    user_id: user.id,
    cohort_id: cohortId,
    cohort_video_config_id: cohortVideoConfigId,
    watched_seconds: nextWatched,
    max_progress_percent: nextProgress,
    ended_once: nextEnded,
    completed_at: nextCompletedAt,
    last_watched_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const { error: upsertError } = await serviceClient
    .from("learning_video_progress")
    .upsert(payload, { onConflict: "user_id,cohort_video_config_id" })

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    should_show_quiz: Boolean(nextCompletedAt),
    completed: Boolean(nextCompletedAt),
  })
}

