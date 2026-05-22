import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { extractYouTubeId } from "@/lib/learning"
import { isAdminEmail } from "@/lib/admin"

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
      const resolvedVideoUrl = video.video_url || video.youtube_url || video.url || null
      const resolvedVideoTitle = video.video_title || video.title || "Untitled video"
      const videoId = resolvedVideoUrl ? extractYouTubeId(resolvedVideoUrl) : null
      return {
        ...video,
        video_title: resolvedVideoTitle,
        video_url: resolvedVideoUrl,
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
    const { action, title, video_title, description, youtube_url, video_url, week_number, github_json_url } = body

    // Handle GitHub sync action
    if (action === "sync-github" || github_json_url) {
      if (!github_json_url) {
        return NextResponse.json(
          { error: "GitHub JSON URL is required for sync action" },
          { status: 400 }
        )
      }

      try {
        // Fetch JSON from GitHub
        const response = await fetch(github_json_url)
        if (!response.ok) {
          return NextResponse.json(
            { error: "Failed to fetch GitHub JSON file" },
            { status: 400 }
          )
        }

        const githubData = await response.json()
        let syncedCount = 0

        // Assuming the JSON has a videos array with week structure
        const serviceClient = createServiceClient()
        const { data: currentCohort } = await serviceClient
          .from("cohorts")
          .select("id")
          .eq("is_current", true)
          .limit(1)
          .single()

        if (!currentCohort) {
          return NextResponse.json(
            { error: "No current cohort found" },
            { status: 404 }
          )
        }

        // Handle different JSON structures
        if (Array.isArray(githubData)) {
          // Direct array of videos
          for (const video of githubData) {
            const videoTitle = typeof video.video_title === "string" ? video.video_title.trim() : typeof video.title === "string" ? video.title.trim() : ""
            const videoUrl = typeof video.video_url === "string" ? video.video_url.trim() : typeof video.youtube_url === "string" ? video.youtube_url.trim() : ""
            const weekNumber = Number(video.week_number)

            if (videoTitle && videoUrl && Number.isFinite(weekNumber) && weekNumber > 0) {
              const { data: lastVideo } = await serviceClient
                .from("cohort_video_configs")
                .select("sort_order")
                .eq("cohort_id", currentCohort.id)
                .eq("week_number", weekNumber)
                .order("sort_order", { ascending: false })
                .limit(1)
                .single()

              const nextSortOrder = (lastVideo?.sort_order || 0) + 1

              await serviceClient
                .from("cohort_video_configs")
                .insert({
                  cohort_id: currentCohort.id,
                  week_number: weekNumber,
                  video_title: videoTitle,
                  description: video.description || null,
                  video_url: videoUrl,
                  sort_order: nextSortOrder,
                  question_count: Number.isFinite(Number(video.question_count)) ? Number(video.question_count) : 3,
                  auto_generate_quiz: video.auto_generate_quiz !== false,
                  is_active: video.is_active !== false,
                })

              syncedCount++
            }
          }
        } else if (githubData.videos && Array.isArray(githubData.videos)) {
          // Nested videos array
          for (const video of githubData.videos) {
            const videoTitle = typeof video.video_title === "string" ? video.video_title.trim() : typeof video.title === "string" ? video.title.trim() : ""
            const videoUrl = typeof video.video_url === "string" ? video.video_url.trim() : typeof video.youtube_url === "string" ? video.youtube_url.trim() : ""
            const weekNumber = Number(video.week_number)

            if (videoTitle && videoUrl && Number.isFinite(weekNumber) && weekNumber > 0) {
              const { data: lastVideo } = await serviceClient
                .from("cohort_video_configs")
                .select("sort_order")
                .eq("cohort_id", currentCohort.id)
                .eq("week_number", weekNumber)
                .order("sort_order", { ascending: false })
                .limit(1)
                .single()

              const nextSortOrder = (lastVideo?.sort_order || 0) + 1

              await serviceClient
                .from("cohort_video_configs")
                .insert({
                  cohort_id: currentCohort.id,
                  week_number: weekNumber,
                  video_title: videoTitle,
                  description: video.description || null,
                  video_url: videoUrl,
                  sort_order: nextSortOrder,
                  question_count: Number.isFinite(Number(video.question_count)) ? Number(video.question_count) : 3,
                  auto_generate_quiz: video.auto_generate_quiz !== false,
                  is_active: video.is_active !== false,
                })

              syncedCount++
            }
          }
        }

        return NextResponse.json({ synced_count: syncedCount })
      } catch (error) {
        console.error("GitHub sync error:", error)
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Failed to sync from GitHub" },
          { status: 500 }
        )
      }
    }

    // Handle add video action (default)
    const resolvedTitle = typeof title === "string" ? title.trim() : typeof video_title === "string" ? video_title.trim() : ""
    const resolvedUrl = typeof youtube_url === "string" ? youtube_url.trim() : typeof video_url === "string" ? video_url.trim() : ""
    const resolvedWeekNumber = Number(week_number)

    if (!resolvedTitle || !resolvedUrl || !Number.isFinite(resolvedWeekNumber) || resolvedWeekNumber <= 0) {
      return NextResponse.json(
        { error: "Title/video_title, YouTube URL/video_url, and week number are required" },
        { status: 400 }
      )
    }

    const serviceClient = createServiceClient()

    // Get current cohort
    const { data: currentCohort, error: cohortError } = await serviceClient
      .from("cohorts")
      .select("id")
      .eq("is_current", true)
      .limit(1)
      .single()

    if (cohortError || !currentCohort) {
      return NextResponse.json(
        { error: "No current cohort found" },
        { status: 404 }
      )
    }

    // Get the highest sort_order for this week to auto-increment
    const { data: lastVideo } = await serviceClient
      .from("cohort_video_configs")
      .select("sort_order")
      .eq("cohort_id", currentCohort.id)
      .eq("week_number", resolvedWeekNumber)
      .order("sort_order", { ascending: false })
      .limit(1)
      .single()

    const nextSortOrder = (lastVideo?.sort_order || 0) + 1

    // Create new video
    const { data: newVideo, error: insertError } = await serviceClient
      .from("cohort_video_configs")
      .insert({
        cohort_id: currentCohort.id,
        week_number: resolvedWeekNumber,
        video_title: resolvedTitle,
        description: description || null,
        video_url: resolvedUrl,
        sort_order: nextSortOrder,
        question_count: 3,
        auto_generate_quiz: true,
        is_active: true,
      })
      .select()
      .single()

    if (insertError) {
      throw new Error(insertError.message)
    }

    return NextResponse.json(newVideo, { status: 201 })
  } catch (error) {
    console.error("POST curated videos error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create video" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
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
    const videoId = searchParams.get("id")

    if (!videoId) {
      return NextResponse.json(
        { error: "Video ID is required" },
        { status: 400 }
      )
    }

    const serviceClient = createServiceClient()

    const { error: deleteError } = await serviceClient
      .from("cohort_video_configs")
      .delete()
      .eq("id", videoId)

    if (deleteError) {
      throw new Error(deleteError.message)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE curated videos error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete video" },
      { status: 500 }
    )
  }
}
