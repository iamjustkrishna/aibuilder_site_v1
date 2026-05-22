import { NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { getCurrentCohortId, getUserActiveCohortIds } from "@/lib/learning"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const serviceClient = createServiceClient()
  const currentCohortId = await getCurrentCohortId(serviceClient)
  if (!currentCohortId) {
    return NextResponse.json({ error: "No current cohort found" }, { status: 404 })
  }

  const enrolledCohorts = await getUserActiveCohortIds(serviceClient, user.id)
  if (!enrolledCohorts.includes(currentCohortId)) {
    return NextResponse.json({ error: "Leaderboard is visible only to current cohort participants" }, { status: 403 })
  }

  const { data: quiz, error: quizError } = await serviceClient
    .from("cohort_quizzes")
    .select("id, title, description")
    .eq("cohort_id", currentCohortId)
    .eq("quiz_type", "end")
    .eq("week_number", 0)
    .eq("is_published", true)
    .maybeSingle()

  if (quizError) {
    return NextResponse.json({ error: quizError.message }, { status: 500 })
  }

  if (!quiz) {
    return NextResponse.json({ quiz: null, entries: [], current_user_rank: null })
  }

  const { data: attempts, error: attemptsError } = await serviceClient
    .from("cohort_quiz_attempts")
    .select("id, user_id, project_id, score_points, score_percent, attempted_at")
    .eq("quiz_id", quiz.id)
    .order("score_points", { ascending: false })
    .order("score_percent", { ascending: false })
    .order("attempted_at", { ascending: true })

  if (attemptsError) {
    return NextResponse.json({ error: attemptsError.message }, { status: 500 })
  }

  const userIds = (attempts || []).map((row) => row.user_id)
  const projectIds = (attempts || []).map((row) => row.project_id).filter(Boolean)

  const [{ data: users }, { data: projects }] = await Promise.all([
    userIds.length > 0
      ? serviceClient.from("users").select("id, full_name, avatar_url, email").in("id", userIds)
      : Promise.resolve({ data: [] as Array<{ id: string; full_name: string | null; avatar_url: string | null; email: string | null }> }),
    projectIds.length > 0
      ? serviceClient.from("user_projects").select("id, title").in("id", projectIds)
      : Promise.resolve({ data: [] as Array<{ id: string; title: string }> }),
  ])

  const userMap = new Map((users || []).map((item) => [item.id, item]))
  const projectMap = new Map((projects || []).map((item) => [item.id, item.title]))

  const entries = (attempts || []).map((attempt, index) => {
    const userRow = userMap.get(attempt.user_id)
    return {
      rank: index + 1,
      user_id: attempt.user_id,
      full_name: userRow?.full_name || userRow?.email || "Builder",
      avatar_url: userRow?.avatar_url || null,
      score_points: attempt.score_points,
      score_percent: Number(attempt.score_percent || 0),
      attempted_at: attempt.attempted_at,
      project_title: attempt.project_id ? projectMap.get(attempt.project_id) || null : null,
      is_current_user: attempt.user_id === user.id,
    }
  })

  const currentUserEntry = entries.find((entry) => entry.is_current_user) || null

  return NextResponse.json({
    quiz: {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
    },
    entries,
    current_user_rank: currentUserEntry?.rank || null,
  })
}
