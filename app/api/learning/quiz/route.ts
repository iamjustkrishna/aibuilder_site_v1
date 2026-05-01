import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

interface GeneratedQuestion {
  question_text: string
  options: string[]
  correct_option_index: number
  explanation?: string
}

async function generateQuizWithGemini(input: {
  title: string
  description?: string | null
  questionCount: number
}): Promise<GeneratedQuestion[] | null> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return null
  }

  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash"
  const prompt = `Generate ${input.questionCount} multiple-choice quiz questions for this learning video.
Video title: ${input.title}
Video description: ${input.description || "N/A"}

Return strict JSON array. Each item:
{
  "question_text": string,
  "options": [string, string, string, string],
  "correct_option_index": number (0..3),
  "explanation": string
}
No markdown. No extra text.`

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 1400, responseMimeType: "application/json" },
      }),
    },
  )

  if (!res.ok) {
    return null
  }

  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) {
    return null
  }

  try {
    const parsed = JSON.parse(text)
    if (!Array.isArray(parsed)) {
      return null
    }
    return parsed
      .filter(
        (q) =>
          typeof q?.question_text === "string" &&
          Array.isArray(q?.options) &&
          q.options.length >= 2 &&
          Number.isInteger(q?.correct_option_index),
      )
      .map((q) => ({
        question_text: q.question_text,
        options: q.options.slice(0, 4),
        correct_option_index: Math.max(0, Math.min(3, q.correct_option_index)),
        explanation: typeof q.explanation === "string" ? q.explanation : "",
      }))
  } catch {
    return null
  }
}

function buildFallbackQuestions(input: { title: string; description?: string | null; questionCount: number }): GeneratedQuestion[] {
  return Array.from({ length: input.questionCount }, (_, idx) => ({
    question_text: `Q${idx + 1}: Which statement best reflects the main idea from "${input.title}"?`,
    options: [
      "It focuses on foundational concepts and practical application",
      "It only discusses advanced research with no practical context",
      "It is unrelated to AI learning progression",
      "It does not contain actionable guidance",
    ],
    correct_option_index: 0,
    explanation: "The learning videos are curated to build practical AI understanding step-by-step.",
  }))
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const cohortVideoConfigId = searchParams.get("cohort_video_config_id") || ""
  if (!cohortVideoConfigId) {
    return NextResponse.json({ error: "cohort_video_config_id is required" }, { status: 400 })
  }

  const serviceClient = createServiceClient()
  const { data: existingQuiz, error: quizError } = await serviceClient
    .from("learning_video_quizzes")
    .select("id, cohort_video_config_id, question_count, is_active")
    .eq("cohort_video_config_id", cohortVideoConfigId)
    .eq("is_active", true)
    .maybeSingle()

  if (quizError) {
    return NextResponse.json({ error: quizError.message }, { status: 500 })
  }

  let quizId = existingQuiz?.id
  if (!quizId) {
    const { data: videoConfig, error: videoConfigError } = await serviceClient
      .from("cohort_video_configs")
      .select("id, video_title, question_count")
      .eq("id", cohortVideoConfigId)
      .maybeSingle()

    if (videoConfigError || !videoConfig) {
      return NextResponse.json({ error: videoConfigError?.message || "Video config not found" }, { status: 404 })
    }

    const questionCount = Math.max(1, Math.min(10, Number(videoConfig.question_count || 3)))
    const generated = (await generateQuizWithGemini({ title: videoConfig.video_title, questionCount })) || buildFallbackQuestions({ title: videoConfig.video_title, questionCount })

    const { data: createdQuiz, error: createQuizError } = await serviceClient
      .from("learning_video_quizzes")
      .insert({
        cohort_video_config_id: cohortVideoConfigId,
        generated_source: generated ? "ai" : "fallback",
        question_count: generated.length,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (createQuizError || !createdQuiz) {
      return NextResponse.json({ error: createQuizError?.message || "Failed to create quiz" }, { status: 500 })
    }
    quizId = createdQuiz.id

    const rows = generated.map((q, index) => ({
      quiz_id: quizId,
      question_order: index + 1,
      question_text: q.question_text,
      options: q.options,
      correct_option_index: q.correct_option_index,
      explanation: q.explanation || null,
      updated_at: new Date().toISOString(),
    }))

    const { error: createQuestionsError } = await serviceClient.from("learning_video_quiz_questions").insert(rows)
    if (createQuestionsError) {
      return NextResponse.json({ error: createQuestionsError.message }, { status: 500 })
    }
  }

  const { data: questions, error: questionsError } = await serviceClient
    .from("learning_video_quiz_questions")
    .select("id, question_order, question_text, options")
    .eq("quiz_id", quizId)
    .order("question_order", { ascending: true })

  if (questionsError) {
    return NextResponse.json({ error: questionsError.message }, { status: 500 })
  }

  const { data: recentAttempt } = await serviceClient
    .from("learning_video_quiz_attempts")
    .select("score_percent, attempted_at")
    .eq("quiz_id", quizId)
    .eq("user_id", user.id)
    .order("attempted_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  return NextResponse.json({
    quiz_id: quizId,
    questions: questions || [],
    recent_attempt: recentAttempt || null,
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
  const answers = Array.isArray(body.answers) ? body.answers : []
  const cohortId = typeof body.cohort_id === "string" ? body.cohort_id : ""
  const cohortVideoConfigId = typeof body.cohort_video_config_id === "string" ? body.cohort_video_config_id : ""

  if (!quizId || !cohortId || !cohortVideoConfigId) {
    return NextResponse.json({ error: "quiz_id, cohort_id and cohort_video_config_id are required" }, { status: 400 })
  }

  const answerByQuestionId = new Map<string, number>()
  for (const item of answers) {
    if (typeof item?.question_id === "string" && Number.isInteger(item?.selected_option_index)) {
      answerByQuestionId.set(item.question_id, item.selected_option_index)
    }
  }

  const serviceClient = createServiceClient()
  const { data: questions, error: questionsError } = await serviceClient
    .from("learning_video_quiz_questions")
    .select("id, correct_option_index")
    .eq("quiz_id", quizId)

  if (questionsError) {
    return NextResponse.json({ error: questionsError.message }, { status: 500 })
  }

  const totalQuestions = (questions || []).length
  if (totalQuestions === 0) {
    return NextResponse.json({ error: "Quiz has no questions" }, { status: 400 })
  }

  let correctCount = 0
  for (const question of questions || []) {
    if (answerByQuestionId.get(question.id) === question.correct_option_index) {
      correctCount += 1
    }
  }
  const scorePercent = (correctCount / totalQuestions) * 100

  const { error: insertAttemptError } = await serviceClient.from("learning_video_quiz_attempts").insert({
    quiz_id: quizId,
    user_id: user.id,
    cohort_id: cohortId,
    cohort_video_config_id: cohortVideoConfigId,
    answers,
    correct_count: correctCount,
    total_questions: totalQuestions,
    score_percent: scorePercent,
  })

  if (insertAttemptError) {
    return NextResponse.json({ error: insertAttemptError.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    correct_count: correctCount,
    total_questions: totalQuestions,
    score_percent: Number(scorePercent.toFixed(2)),
  })
}

