import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { extractYouTubeId } from "@/lib/learning"
import { isAdminEmail } from "@/lib/admin"

function normalizeJsonVideos(githubData: any, cohortId: string): any[] {
  const normalized: any[] = []
  let videosArray: any[] = []

  if (Array.isArray(githubData)) {
    videosArray = githubData
  } else if (githubData && typeof githubData === "object" && Array.isArray(githubData.videos)) {
    videosArray = githubData.videos
  }

  videosArray.forEach((video, index) => {
    const videoTitle = typeof video.video_title === "string" ? video.video_title.trim() : typeof video.title === "string" ? video.title.trim() : ""
    const videoUrl = typeof video.video_url === "string" ? video.video_url.trim() : typeof video.youtube_url === "string" ? video.youtube_url.trim() : ""
    const weekNumber = Number(video.week_number)

    if (videoTitle && videoUrl && Number.isFinite(weekNumber) && weekNumber > 0) {
      normalized.push({
        id: `json-${cohortId}-${weekNumber}-${index}`,
        cohort_id: cohortId,
        week_number: weekNumber,
        title: videoTitle,
        video_title: videoTitle,
        description: video.description || null,
        youtube_url: videoUrl,
        video_url: videoUrl,
        url: videoUrl,
        tier_required: video.tier_required || "foundational",
        sort_order: Number.isFinite(Number(video.sort_order)) ? Number(video.sort_order) : index,
        is_active: video.is_active !== false,
      })
    }
  })

  return normalized
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  // Get week and cohort parameters
  const { searchParams } = new URL(request.url)
  const weekParam = searchParams.get("week")
  const weekNumber = weekParam ? parseInt(weekParam.replace("week-", "")) : null
  const queryCohortId = searchParams.get("cohort_id")

  const serviceClient = createServiceClient()

  const { data: enrollments, error: enrollmentsError } = await serviceClient
    .from("cohort_enrollments")
    .select("cohort_id, enrollment_status")
    .eq("user_id", user.id)
    .in("enrollment_status", ["active", "completed", "paused"])

  if (enrollmentsError) {
    return NextResponse.json({ error: enrollmentsError.message }, { status: 500 })
  }

  let cohortIds = (enrollments || []).map((entry) => entry.cohort_id)

  if (queryCohortId) {
    cohortIds = [queryCohortId]
  }

  // 1. Get current cohort or fall back to any cohort, and automatically enroll user if not enrolled
  if (cohortIds.length === 0) {
    let currentCohort = null
    const { data: existingCurrentCohort } = await serviceClient
      .from("cohorts")
      .select("id")
      .eq("is_current", true)
      .limit(1)
      .maybeSingle()

    if (existingCurrentCohort) {
      currentCohort = existingCurrentCohort
    } else {
      const { data: anyCohort } = await serviceClient
        .from("cohorts")
        .select("id")
        .limit(1)
        .maybeSingle()

      if (anyCohort) {
        await serviceClient.from("cohorts").update({ is_current: true }).eq("id", anyCohort.id)
        currentCohort = { id: anyCohort.id }
      } else {
        const { data: newCohort, error: createError } = await serviceClient
          .from("cohorts")
          .insert({
            code: "DEFAULT-COHORT",
            name: "Default Cohort",
            status: "active",
            is_current: true,
          })
          .select("id")
          .single()

        if (!createError && newCohort) {
          currentCohort = newCohort
        }
      }
    }

    if (currentCohort) {
      // Auto-enroll the user
      await serviceClient
        .from("cohort_enrollments")
        .insert({
          cohort_id: currentCohort.id,
          user_id: user.id,
          enrollment_status: "active",
        })
      cohortIds = [currentCohort.id]
    }
  }

  if (cohortIds.length === 0) {
    return NextResponse.json([])
  }

  const nowIso = new Date().toISOString()
  const [
    { data: cohorts, error: cohortsError },
    { data: weeks, error: weeksError },
    { data: dbVideos, error: dbVideosError },
    { data: progress, error: progressError },
    { data: attempts, error: attemptsError },
  ] = await Promise.all([
    serviceClient.from("cohorts").select("*").in("id", cohortIds),
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

  if (cohortsError || weeksError || dbVideosError || progressError || attemptsError) {
    return NextResponse.json(
      {
        error:
          cohortsError?.message ||
          weeksError?.message ||
          dbVideosError?.message ||
          progressError?.message ||
          attemptsError?.message ||
          "Failed to load curated learning content",
      },
      { status: 500 },
    )
  }

  // Fetch JSON videos in parallel for cohorts that have curated_videos_source_url
  const jsonVideosPromises = (cohorts || [])
    .filter(cohort => cohort.curated_videos_source_url)
    .map(async (cohort) => {
      try {
        // Append cache-busting timestamp parameter to bypass GitHub Raw CDN caching and Next.js caching
        const cacheBusterUrl = `${cohort.curated_videos_source_url}?t=${Date.now()}`
        const response = await fetch(cacheBusterUrl, { cache: "no-store" })
        if (!response.ok) {
          console.error(`Failed to fetch JSON videos from ${cohort.curated_videos_source_url}`)
          return []
        }
        const githubData = await response.json()
        return normalizeJsonVideos(githubData, cohort.id)
      } catch (err) {
        console.error(`Error fetching JSON videos for cohort ${cohort.id}:`, err)
        return []
      }
    })

  const jsonVideosArrays = await Promise.all(jsonVideosPromises)
  const allJsonVideos = jsonVideosArrays.flat()

  // Combine database manual videos and dynamically fetched JSON videos
  const combinedVideos = [...(dbVideos || []), ...allJsonVideos]

  const progressByVideo = new Map((progress || []).map((row) => [row.cohort_video_config_id, row]))
  const latestAttemptByVideo = new Map<string, { score_percent: number; attempted_at: string }>()
  for (const row of attempts || []) {
    if (!latestAttemptByVideo.has(row.cohort_video_config_id)) {
      latestAttemptByVideo.set(row.cohort_video_config_id, row)
    }
  }

  let visibleVideos = combinedVideos.map((video) => {
    const p = progressByVideo.get(video.id)
    const a = latestAttemptByVideo.get(video.id)
    const resolvedVideoUrl = video.video_url || video.youtube_url || video.url || null
    const resolvedVideoTitle = video.video_title || video.title || "Untitled video"
    const videoId = resolvedVideoUrl ? extractYouTubeId(resolvedVideoUrl) : null
    return {
      ...video,
      title: resolvedVideoTitle,
      url: resolvedVideoUrl,
      youtube_url: resolvedVideoUrl,
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

  // Sort within each week by sort_order
  visibleVideos.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))

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
    const { action, title, video_title, description, youtube_url, video_url, week_number, github_json_url, cohort_id } = body

    const serviceClient = createServiceClient()

    // 1. Get target cohort, or fallback to current
    let currentCohort = null
    if (cohort_id) {
      const { data: specificCohort } = await serviceClient
        .from("cohorts")
        .select("*")
        .eq("id", cohort_id)
        .maybeSingle()
      if (specificCohort) currentCohort = specificCohort
    }

    if (!currentCohort) {
      const { data: existingCurrentCohort } = await serviceClient
        .from("cohorts")
        .select("*")
        .eq("is_current", true)
        .limit(1)
        .maybeSingle()

      if (existingCurrentCohort) {
        currentCohort = existingCurrentCohort
      } else {
        // Find any cohort
        const { data: anyCohort } = await serviceClient
        .from("cohorts")
        .select("*")
        .limit(1)
        .maybeSingle()

      if (anyCohort) {
        await serviceClient.from("cohorts").update({ is_current: true }).eq("id", anyCohort.id)
        currentCohort = { ...anyCohort, is_current: true }
      } else {
        // Create default cohort
        const { data: newCohort, error: createError } = await serviceClient
          .from("cohorts")
          .insert({
            code: "DEFAULT-COHORT",
            name: "Default Cohort",
            status: "active",
            is_current: true,
          })
          .select("*")
          .single()

          if (createError) {
            console.error("Failed to create default cohort in POST:", createError)
            return NextResponse.json(
              { error: "Failed to locate or create cohort: " + createError.message },
              { status: 500 }
            )
          }
          currentCohort = newCohort
        }
      }
    }

    // Handle GitHub sync action / URL saving
    if (action === "sync-github" || github_json_url) {
      try {
        const effectiveGithubJsonUrl = github_json_url || currentCohort.curated_videos_source_url
        if (!effectiveGithubJsonUrl) {
          return NextResponse.json(
            { error: "GitHub JSON URL is required for sync action" },
            { status: 400 }
          )
        }

        // Fetch JSON from GitHub to validate format
        const response = await fetch(effectiveGithubJsonUrl)
        if (!response.ok) {
          return NextResponse.json(
            { error: "Failed to fetch GitHub JSON file from URL" },
            { status: 400 }
          )
        }

        const githubData = await response.json()
        const parsedVideos = normalizeJsonVideos(githubData, currentCohort.id)

        // Save the URL and synced timestamp in cohorts table
        const { error: updateError } = await serviceClient
          .from("cohorts")
          .update({
            curated_videos_source_url: effectiveGithubJsonUrl,
            curated_videos_synced_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", currentCohort.id)

        if (updateError) {
          if (updateError.message.includes("curated_videos_source_url") || updateError.code === "42703") {
            return NextResponse.json(
              {
                error: "The database column 'curated_videos_source_url' does not exist in your 'cohorts' table. " +
                  "Please execute the following SQL statement in your Supabase Dashboard SQL Editor to update your schema:\n\n" +
                  "ALTER TABLE public.cohorts ADD COLUMN IF NOT EXISTS curated_videos_source_url text, ADD COLUMN IF NOT EXISTS curated_videos_synced_at timestamptz;"
              },
              { status: 400 }
            )
          }
          throw new Error(updateError.message)
        }

        return NextResponse.json({
          synced_count: parsedVideos.length,
          source_url: effectiveGithubJsonUrl,
        })
      } catch (error) {
        console.error("GitHub sync error:", error)
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Failed to sync from GitHub" },
          { status: 500 }
        )
      }
    }

    // Handle add video action (default manual add)
    const resolvedTitle = typeof title === "string" ? title.trim() : typeof video_title === "string" ? video_title.trim() : ""
    const resolvedUrl = typeof youtube_url === "string" ? youtube_url.trim() : typeof video_url === "string" ? video_url.trim() : ""
    const resolvedWeekNumber = Number(week_number)
    const questionCount = body.question_count !== undefined ? Number(body.question_count) : 3
    const autoGenerateQuiz = body.auto_generate_quiz !== false
    const isActive = body.is_active !== false
    const resourceId = typeof body.resource_id === "string" ? body.resource_id.trim() : ""

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

    if (!resolvedTitle) {
      return NextResponse.json({ error: "title/video_title is required" }, { status: 400 })
    }

    if (!resolvedUrl) {
      return NextResponse.json({ error: "video_url/youtube_url is required" }, { status: 400 })
    }

    if (Number.isNaN(resolvedWeekNumber) || resolvedWeekNumber <= 0 || !Number.isInteger(resolvedWeekNumber)) {
      return NextResponse.json({ error: "week_number must be an integer greater than 0" }, { status: 400 })
    }

    if (questionCount < 1 || questionCount > 10 || !Number.isInteger(questionCount)) {
      return NextResponse.json({ error: "question_count must be an integer between 1 and 10" }, { status: 400 })
    }

    if (resourceId && !uuidRegex.test(resourceId)) {
      return NextResponse.json({ error: "Invalid resource_id format" }, { status: 400 })
    }

    // Get the highest sort_order for this week to auto-increment
    const { data: lastVideo } = await serviceClient
      .from("cohort_video_configs")
      .select("sort_order")
      .eq("cohort_id", currentCohort.id)
      .eq("week_number", resolvedWeekNumber)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextSortOrder = (lastVideo?.sort_order || 0) + 1

    // Create new video manually
    const { data: newVideo, error: insertError } = await serviceClient
      .from("cohort_video_configs")
      .insert({
        cohort_id: currentCohort.id,
        week_number: resolvedWeekNumber,
        video_title: resolvedTitle,
        description: description || null,
        video_url: resolvedUrl,
        sort_order: nextSortOrder,
        question_count: questionCount,
        auto_generate_quiz: autoGenerateQuiz,
        is_active: isActive,
        resource_id: resourceId || null,
        updated_at: new Date().toISOString(),
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

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(videoId)) {
      return NextResponse.json({ error: "Invalid video_id format" }, { status: 400 })
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
