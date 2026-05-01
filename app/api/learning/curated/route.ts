import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { extractYouTubeId } from "@/lib/learning"

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  // Get week parameter - defaults to all weeks if not specified
  const { searchParams } = new URL(request.url)
  const weekParam = searchParams.get("week")
  const weekNumber = weekParam ? parseInt(weekParam.replace("week-", "")) : null

  const serviceClient = createServiceClient()

  const { data: enrollments, error: enrollmentsError } = await serviceClient
    .from("cohort_enrollments")
    .select("cohort_id, enrollment_status")
    .eq("user_id", user.id)
    .in("enrollment_status", ["active", "completed", "paused"])

  if (enrollmentsError) {
    return NextResponse.json({ error: enrollmentsError.message }, { status: 500 })
  }

  const cohortIds = (enrollments || []).map((entry) => entry.cohort_id)
  if (cohortIds.length === 0) {
    return NextResponse.json([])
  }

  const nowIso = new Date().toISOString()
  const [
    { data: cohorts, error: cohortsError },
    { data: weeks, error: weeksError },
    { data: videos, error: videosError },
    { data: progress, error: progressError },
    { data: attempts, error: attemptsError },
  ] = await Promise.all([
    serviceClient.from("cohorts").select("id, code, name, is_current").in("id", cohortIds),
    serviceClient
      .from("cohort_weeks")
      .select("*")
      .in("cohort_id", cohortIds)
      .eq("is_active", true)
      .or(`unlock_at.is.null,unlock_at.lte.${nowIso}`)
      .order("week_number", { ascending: true }),
    serviceClient
      .from("cohort_video_configs")
      .select("*")
      .in("cohort_id", cohortIds)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    serviceClient.from("learning_video_progress").select("*").eq("user_id", user.id),
    serviceClient
      .from("learning_video_quiz_attempts")
      .select("cohort_video_config_id, score_percent, attempted_at")
      .eq("user_id", user.id)
      .order("attempted_at", { ascending: false }),
  ])

  if (cohortsError || weeksError || videosError || progressError || attemptsError) {
    return NextResponse.json(
      {
        error:
          cohortsError?.message ||
          weeksError?.message ||
          videosError?.message ||
          progressError?.message ||
          attemptsError?.message ||
          "Failed to load curated learning content",
      },
      { status: 500 },
    )
  }

  const weekKeySet = new Set((weeks || []).map((week) => `${week.cohort_id}:${week.week_number}`))
  const progressByVideo = new Map((progress || []).map((row) => [row.cohort_video_config_id, row]))
  const latestAttemptByVideo = new Map<string, { score_percent: number; attempted_at: string }>()
  for (const row of attempts || []) {
    if (!latestAttemptByVideo.has(row.cohort_video_config_id)) {
      latestAttemptByVideo.set(row.cohort_video_config_id, row)
    }
  }

  let visibleVideos = (videos || [])
    .filter((video) => weekKeySet.has(`${video.cohort_id}:${video.week_number}`))
    .map((video) => {
      const p = progressByVideo.get(video.id)
      const a = latestAttemptByVideo.get(video.id)
      const videoId = video.video_url ? extractYouTubeId(video.video_url) : null
      return {
        ...video,
        youtube_video_id: videoId,
        progress: p
          ? {
              watched_seconds: p.watched_seconds,
              max_progress_percent: Number(p.max_progress_percent || 0),
              ended_once: p.ended_once,
              completed_at: p.completed_at,
            }
          : null,
        latest_quiz_attempt: a || null,
      }
    })

  // Filter by week number if specified
  if (weekNumber !== null) {
    visibleVideos = visibleVideos.filter((video) => video.week_number === weekNumber)
  }

  // If week parameter was provided, return just the array of videos
  if (weekParam) {
    return NextResponse.json(visibleVideos)
  }

  // Otherwise return the full structure for backward compatibility
  return NextResponse.json({
    cohorts: cohorts || [],
    weeks: weeks || [],
    videos: visibleVideos,
  })
}


