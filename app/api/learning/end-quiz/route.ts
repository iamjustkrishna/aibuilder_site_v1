import { NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { getCurrentCohortId, getUserActiveCohortIds } from "@/lib/learning"

type QuizQuestion = {
  id: string
  question_text: string
  rubric: string
  focus: string
}

type ProjectSnapshot = {
  id: string
  title: string
  description: string | null
  technologies: string[]
  project_url: string | null
  repo_url: string | null
  demo_url: string | null
}

function buildContentSummary(weeks: Array<{ week_number: number; title: string }>, videos: Array<{ week_number: number; video_title: string }>) {
  const weekLines = weeks.slice(0, 4).map((week) => `Week ${week.week_number}: ${week.title}`)
  const videoLines = videos.slice(0, 8).map((video) => `- ${video.video_title}`)
  return [...weekLines, ...videoLines].join("\n")
}

function buildQuestions(project: ProjectSnapshot, contentSummary: string, cohortName: string): QuizQuestion[] {
  const projectFocus = project.title || "your project"
  const techStack = project.technologies.length > 0 ? project.technologies.join(", ") : "your chosen stack"

  return [
    {
      id: "q1",
      question_text: `How did ${projectFocus} apply the main ideas from ${cohortName}?`,
      rubric: "Explain at least one cohort concept and how it appears in the project.",
      focus: "cohort concepts",
    },
    {
      id: "q2",
      question_text: `What part of ${projectFocus} best shows your understanding of the content and why did you build it that way?`,
      rubric: "Mention a specific feature, your reasoning, and the learning outcome.",
      focus: "implementation reasoning",
    },
    {
      id: "q3",
      question_text: `Looking at ${techStack}, what would you improve next if you were shipping ${projectFocus} to real users?`,
      rubric: "Talk about product improvements, user value, and practical shipping considerations.",
      focus: "product thinking",
    },
    {
      id: "q4",
      question_text: `Which cohort lesson or video idea from the finished content summary influenced ${projectFocus} the most?`,
      rubric: "Connect a lesson/video topic to a decision in the project.",
      focus: "content reflection",
    },
    {
      id: "q5",
      question_text: `If you had one more week, how would you extend ${projectFocus} based on what you learned here?`,
      rubric: "Describe a realistic next step that uses cohort learnings.",
      focus: "future planning",
    },
  ]
}

async function gradeWithGemini(input: {
  cohortName: string
  contentSummary: string
  project: ProjectSnapshot
  questions: QuizQuestion[]
  answers: Array<{ question_id: string; answer_text: string }>
}) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null

  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash"
  const prompt = `You are grading subjective end-of-cohort answers for AI Builder.

Return strict JSON:
{
  "scores": [
    { "question_id": "q1", "score": 0-10, "feedback": "short feedback" }
  ],
  "overall_feedback": "short feedback"
}

Scoring rules:
- Reward specificity, accurate reflection of cohort content, and project understanding.
- Penalize vague answers and answers that do not relate to the user's project.
- Be fair and concise.

Cohort: ${input.cohortName}
Content summary:
${input.contentSummary}

Project:
${JSON.stringify(input.project, null, 2)}

Questions:
${JSON.stringify(input.questions, null, 2)}

Answers:
${JSON.stringify(input.answers, null, 2)}
`

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 1400, responseMimeType: "application/json" },
    }),
  })

  if (!response.ok) return null
  const data = await response.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) return null

  try {
    const parsed = JSON.parse(text)
    if (!Array.isArray(parsed?.scores)) return null
    return {
      scores: parsed.scores
        .filter((item: any) => typeof item?.question_id === "string" && Number.isFinite(item?.score))
        .map((item: any) => ({
          question_id: item.question_id,
          score: Math.max(0, Math.min(10, Math.round(Number(item.score)))),
          feedback: typeof item.feedback === "string" ? item.feedback : "",
        })),
      overall_feedback: typeof parsed.overall_feedback === "string" ? parsed.overall_feedback : "",
    }
  } catch {
    return null
  }
}

function gradeHeuristically(input: {
  cohortName: string
  contentSummary: string
  project: ProjectSnapshot
  questions: QuizQuestion[]
  answers: Array<{ question_id: string; answer_text: string }>
}) {
  const keywords = [
    ...input.project.title.toLowerCase().split(/\s+/).filter(Boolean),
    ...input.project.technologies.flatMap((item) => item.toLowerCase().split(/\s+/).filter(Boolean)),
    ...input.contentSummary.toLowerCase().split(/[^a-z0-9]+/).filter((item) => item.length > 3),
  ].filter(Boolean)

  const scores = input.questions.map((question) => {
    const answer = input.answers.find((item) => item.question_id === question.id)?.answer_text || ""
    let score = 0
    const normalized = answer.toLowerCase()
    if (answer.trim().length > 40) score += 3
    if (answer.trim().length > 120) score += 2
    if (answer.trim().length > 220) score += 1
    if (normalized.includes(input.project.title.toLowerCase())) score += 2
    if (keywords.some((word) => word.length > 4 && normalized.includes(word))) score += 2
    if (/user|launch|build|ship|learn|improve|solve|problem|ai|model|feature/.test(normalized)) score += 2
    return {
      question_id: question.id,
      score: Math.max(0, Math.min(10, score)),
      feedback: score >= 7 ? "Strong reflection." : "Add more project-specific detail next time.",
    }
  })

  return { scores, overall_feedback: "Heuristic scoring used because AI grading was unavailable." }
}

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
    return NextResponse.json({ error: "This quiz is only available to current cohort participants" }, { status: 403 })
  }

  const { data: project, error: projectError } = await serviceClient
    .from("user_projects")
    .select("id, title, description, technologies, project_url, repo_url, demo_url, created_at")
    .eq("user_id", user.id)
    .eq("cohort_id", currentCohortId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (projectError) {
    return NextResponse.json({ error: projectError.message }, { status: 500 })
  }

  if (!project) {
    return NextResponse.json(
      { error: "Submit your project first to unlock the end quiz." },
      { status: 409 },
    )
  }

  const { data: cohort, error: cohortError } = await serviceClient
    .from("cohorts")
    .select("id, name, code")
    .eq("id", currentCohortId)
    .maybeSingle()

  if (cohortError || !cohort) {
    return NextResponse.json({ error: cohortError?.message || "Cohort not found" }, { status: 404 })
  }

  const [{ data: weeks }, { data: videos }] = await Promise.all([
    serviceClient.from("cohort_weeks").select("week_number, title").eq("cohort_id", currentCohortId).order("week_number", { ascending: true }),
    serviceClient.from("cohort_video_configs").select("week_number, video_title").eq("cohort_id", currentCohortId).eq("is_active", true).order("week_number", { ascending: true }),
  ])

  const contentSummary = buildContentSummary(weeks || [], videos || [])
  const projectSnapshot: ProjectSnapshot = {
    id: project.id,
    title: project.title,
    description: project.description,
    technologies: project.technologies || [],
    project_url: project.project_url,
    repo_url: project.repo_url,
    demo_url: project.demo_url,
  }
  const questions = buildQuestions(projectSnapshot, contentSummary, cohort.name || cohort.code)

  const { data: quiz } = await serviceClient
    .from("cohort_quizzes")
    .select("id, is_published, title, description")
    .eq("cohort_id", currentCohortId)
    .eq("quiz_type", "end")
    .eq("week_number", 0)
    .maybeSingle()

  let quizId = quiz?.id || null
  if (!quizId) {
    const { data: createdQuiz, error: createQuizError } = await serviceClient
      .from("cohort_quizzes")
      .insert({
        cohort_id: currentCohortId,
        quiz_type: "end",
        week_number: 0,
        title: `${cohort.name || cohort.code} End Quiz`,
        description: "Subjective cohort-end assessment based on completed content and project work.",
        publish_mode: "manual",
        is_published: true,
        published_at: new Date().toISOString(),
      })
      .select("id")
      .single()

    if (createQuizError || !createdQuiz) {
      return NextResponse.json({ error: createQuizError?.message || "Failed to create quiz" }, { status: 500 })
    }
    quizId = createdQuiz.id
  }

  const { data: existingAttempt } = await serviceClient
    .from("cohort_quiz_attempts")
    .select("id, score_points, score_percent, attempted_at")
    .eq("quiz_id", quizId)
    .eq("user_id", user.id)
    .maybeSingle()

  return NextResponse.json({
    quiz_id: quizId,
    cohort: cohort,
    project: projectSnapshot,
    content_summary: contentSummary,
    questions,
    can_submit: true,
    existing_attempt: existingAttempt || null,
  })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const body = await request.json()
  const quizId = typeof body.quiz_id === "string" ? body.quiz_id : ""
  const answersInput = Array.isArray(body.answers) ? body.answers : []

  if (!quizId) {
    return NextResponse.json({ error: "quiz_id is required" }, { status: 400 })
  }

  const serviceClient = createServiceClient()
  const currentCohortId = await getCurrentCohortId(serviceClient)
  if (!currentCohortId) {
    return NextResponse.json({ error: "No current cohort found" }, { status: 404 })
  }

  const enrolledCohorts = await getUserActiveCohortIds(serviceClient, user.id)
  if (!enrolledCohorts.includes(currentCohortId)) {
    return NextResponse.json({ error: "This quiz is only available to current cohort participants" }, { status: 403 })
  }

  const { data: project, error: projectError } = await serviceClient
    .from("user_projects")
    .select("id, title, description, technologies, project_url, repo_url, demo_url, created_at")
    .eq("user_id", user.id)
    .eq("cohort_id", currentCohortId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (projectError) {
    return NextResponse.json({ error: projectError.message }, { status: 500 })
  }

  if (!project) {
    return NextResponse.json({ error: "Submit your project first to unlock the end quiz." }, { status: 409 })
  }

  const { data: cohort, error: cohortError } = await serviceClient
    .from("cohorts")
    .select("id, name, code")
    .eq("id", currentCohortId)
    .maybeSingle()

  if (cohortError || !cohort) {
    return NextResponse.json({ error: cohortError?.message || "Cohort not found" }, { status: 404 })
  }

  const [{ data: weeks }, { data: videos }] = await Promise.all([
    serviceClient.from("cohort_weeks").select("week_number, title").eq("cohort_id", currentCohortId).order("week_number", { ascending: true }),
    serviceClient.from("cohort_video_configs").select("week_number, video_title").eq("cohort_id", currentCohortId).eq("is_active", true).order("week_number", { ascending: true }),
  ])

  const contentSummary = buildContentSummary(weeks || [], videos || [])
  const projectSnapshot: ProjectSnapshot = {
    id: project.id,
    title: project.title,
    description: project.description,
    technologies: project.technologies || [],
    project_url: project.project_url,
    repo_url: project.repo_url,
    demo_url: project.demo_url,
  }
  const questions = buildQuestions(projectSnapshot, contentSummary, cohort.name || cohort.code)

  const answers = questions.map((question) => {
    const provided = answersInput.find((item: any) => item?.question_id === question.id || item?.id === question.id)
    return {
      question_id: question.id,
      answer_text: typeof provided?.answer_text === "string" ? provided.answer_text : typeof provided?.answer === "string" ? provided.answer : "",
    }
  })

  const graders = await gradeWithGemini({
    cohortName: cohort.name || cohort.code,
    contentSummary,
    project: projectSnapshot,
    questions,
    answers,
  })

  const scored = graders || gradeHeuristically({
    cohortName: cohort.name || cohort.code,
    contentSummary,
    project: projectSnapshot,
    questions,
    answers,
  })

  const totalScore = scored.scores.reduce((sum: number, item: { score: number }) => sum + item.score, 0)
  const scorePercent = Number(((totalScore / (questions.length * 10)) * 100).toFixed(2))
  const scorePoints = Math.round(scorePercent)

  const { data: existingAttempt } = await serviceClient
    .from("cohort_quiz_attempts")
    .select("id")
    .eq("quiz_id", quizId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (existingAttempt) {
    return NextResponse.json({ error: "You have already taken this quiz" }, { status: 409 })
  }

  const { error: insertError } = await serviceClient.from("cohort_quiz_attempts").insert({
    quiz_id: quizId,
    cohort_id: currentCohortId,
    user_id: user.id,
    project_id: project.id,
    questions,
    answers,
    score_points: scorePoints,
    score_percent: scorePercent,
    feedback: scored,
  })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    score_points: scorePoints,
    score_percent: scorePercent,
    feedback: scored,
  })
}
