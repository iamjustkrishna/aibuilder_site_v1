"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Trophy, ClipboardList, ArrowRight, X, Sparkles, Users } from "lucide-react"

type QuizQuestion = {
  id: string
  question_text: string
  rubric: string
  focus: string
}

type LeaderboardEntry = {
  rank: number
  user_id: string
  full_name: string
  avatar_url: string | null
  score_points: number
  score_percent: number
  attempted_at: string
  project_title: string | null
  is_current_user: boolean
}

interface EndQuizLeaderboardProps {
  currentCohortName?: string | null
  showQuizCard?: boolean
}

export function EndQuizLeaderboard({ currentCohortName, showQuizCard = true }: EndQuizLeaderboardProps) {
  const [leaderboardLoading, setLeaderboardLoading] = useState(true)
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([])
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null)
  const [quizLoading, setQuizLoading] = useState(false)
  const [quizSubmitting, setQuizSubmitting] = useState(false)
  const [quizOpen, setQuizOpen] = useState(false)
  const [quizId, setQuizId] = useState<string | null>(null)
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({})
  const [quizResult, setQuizResult] = useState<string | null>(null)
  const [quizMeta, setQuizMeta] = useState<{ project_title?: string | null; cohort_name?: string | null } | null>(null)
  const [quizError, setQuizError] = useState<string | null>(null)

  const topEntries = useMemo(() => leaderboardEntries.slice(0, 5), [leaderboardEntries])
  const cohortLabel = currentCohortName || "Cohort 1"

  async function loadLeaderboard() {
    setLeaderboardLoading(true)
    try {
      const res = await fetch("/api/learning/leaderboard")
      const data = await res.json()
      if (!res.ok) {
        setQuizError(data?.error || "Failed to load leaderboard")
        setLeaderboardEntries([])
        setCurrentUserRank(null)
        return
      }
      setLeaderboardEntries(data.entries || [])
      setCurrentUserRank(data.current_user_rank || null)
    } catch (error) {
      setQuizError(error instanceof Error ? error.message : "Failed to load leaderboard")
      setLeaderboardEntries([])
      setCurrentUserRank(null)
    } finally {
      setLeaderboardLoading(false)
    }
  }

  useEffect(() => {
    loadLeaderboard()
  }, [])

  async function openQuiz() {
    setQuizError(null)
    setQuizResult(null)
    setQuizLoading(true)
    try {
      const res = await fetch("/api/learning/end-quiz")
      const data = await res.json()
      if (!res.ok) {
        setQuizError(data?.error || "Unable to open quiz")
        return
      }
      setQuizId(data.quiz_id)
      setQuizQuestions(data.questions || [])
      setQuizMeta({ project_title: data.project?.title || null, cohort_name: data.cohort?.name || currentCohortName || null })
      setQuizAnswers({})
      setQuizOpen(true)
    } catch (error) {
      setQuizError(error instanceof Error ? error.message : "Unable to open quiz")
    } finally {
      setQuizLoading(false)
    }
  }

  async function submitQuiz() {
    if (!quizId) {
      setQuizError("Quiz is not ready yet")
      return
    }
    setQuizSubmitting(true)
    setQuizError(null)
    try {
      const res = await fetch("/api/learning/end-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quiz_id: quizId,
          answers: quizQuestions.map((question) => ({
            question_id: question.id,
            answer_text: quizAnswers[question.id] || "",
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setQuizError(data?.error || "Failed to submit quiz")
        return
      }

      setQuizResult(`Score: ${data.score_percent}% (${data.score_points} points)`)
      setQuizOpen(false)
      await loadLeaderboard()
    } catch (error) {
      setQuizError(error instanceof Error ? error.message : "Failed to submit quiz")
    } finally {
      setQuizSubmitting(false)
    }
  }

  return (
    <section id="leaderboard" className="mb-8">
      <div className={showQuizCard ? "grid lg:grid-cols-[1.1fr_0.9fr] gap-6" : "space-y-6"}>
        {showQuizCard && (
          <div className="rounded-3xl border border-[#E8E3F3] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-2xl bg-[#492B8C] text-white flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-[#6B5B9E] uppercase tracking-wider">{cohortLabel} Final Assessment</p>
              <h2 className="text-2xl font-bold text-[#1A0A3D]" style={{ fontFamily: "var(--font-cal-sans)" }}>
                End Quiz
              </h2>
            </div>
          </div>

          <p className="text-sm text-[#1A0A3D] leading-relaxed mb-4">
            Submit your project first, then take the cohort-end quiz. Your questions are generated from your project and the cohort content, so each answer is personal to your work.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={openQuiz}
              disabled={quizLoading}
              className="rounded-full bg-[#492B8C] text-white hover:bg-[#2D1A69]"
            >
              {quizLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading quiz...
                </>
              ) : (
                <>
                  Take End Quiz
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
            <Badge variant="outline" className="rounded-full border-[#E8E3F3] text-[#492B8C]">
              Current cohort only
            </Badge>
          </div>

          {quizError && (
            <div className="mt-4 rounded-2xl border border-[#FFC9B0] bg-white px-4 py-3 text-sm text-[#1A0A3D]">
              {quizError}
            </div>
          )}

          {quizResult && (
            <div className="mt-4 rounded-2xl border border-[#E8E3F3] bg-white px-4 py-3 text-sm text-[#1A0A3D]">
              {quizResult}
            </div>
          )}

          {quizMeta?.project_title && (
            <div className="mt-4 rounded-2xl border border-[#E8E3F3] bg-white px-4 py-3 text-sm text-[#1A0A3D]">
              Using project: <span className="font-semibold text-[#492B8C]">{quizMeta.project_title}</span>
            </div>
          )}
          </div>
        )}

        <div className="rounded-3xl border border-[#E8E3F3] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#FF6B34] text-white flex items-center justify-center">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-[#6B5B9E] uppercase tracking-wider">Live standings</p>
                <h3 className="text-xl font-bold text-[#1A0A3D]" style={{ fontFamily: "var(--font-cal-sans)" }}>
                  Leaderboard
                </h3>
              </div>
            </div>
            {currentUserRank ? (
              <Badge className="rounded-full bg-[#492B8C] text-white hover:bg-[#492B8C]">Your rank: #{currentUserRank}</Badge>
            ) : null}
          </div>

          {leaderboardLoading ? (
            <div className="py-10 text-center text-[#6B5B9E]">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
              Loading leaderboard...
            </div>
          ) : topEntries.length === 0 ? (
            <div className="py-10 text-center text-[#1A0A3D]">
              <Users className="w-10 h-10 mx-auto mb-3 text-[#492B8C]" />
              No quiz submissions yet.
            </div>
          ) : (
            <div className="space-y-3">
              {topEntries.map((entry) => (
                <div
                  key={entry.user_id}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
                    entry.is_current_user ? "border-[#492B8C] bg-[#FFF8F2]" : "border-[#E8E3F3] bg-white"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-white border border-[#E8E3F3] flex items-center justify-center text-xs font-bold text-[#492B8C]">
                    #{entry.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#1A0A3D] truncate">
                      {entry.full_name} {entry.is_current_user ? "(You)" : ""}
                    </p>
                    <p className="text-xs text-[#6B5B9E] truncate">
                      {entry.project_title || "Project submitted"} · {entry.score_percent}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[#1A0A3D]">{entry.score_points}</p>
                    <p className="text-xs text-[#6B5B9E]">pts</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showQuizCard && quizOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 p-4 flex items-center justify-center">
          <div className="w-full max-w-3xl max-h-[88vh] overflow-hidden rounded-3xl bg-white shadow-2xl flex flex-col">
            <div className="p-5 border-b border-[#E8E3F3] flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-[#6B5B9E]">{cohortLabel} end quiz</p>
                <h3 className="text-xl font-bold text-[#1A0A3D]" style={{ fontFamily: "var(--font-cal-sans)" }}>
                  Answer based on your project and the cohort content
                </h3>
                <p className="text-sm text-[#1A0A3D] mt-1">
                  Submit your responses to be scored for the leaderboard.
                </p>
              </div>
              <button
                onClick={() => setQuizOpen(false)}
                className="w-9 h-9 rounded-full border border-[#E8E3F3] flex items-center justify-center text-[#492B8C]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {quizQuestions.map((question, index) => (
                <div key={question.id} className="rounded-2xl border border-[#E8E3F3] p-4">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <p className="text-xs font-medium text-[#6B5B9E] uppercase tracking-wider">Question {index + 1}</p>
                    <Badge variant="outline" className="rounded-full border-[#E8E3F3] text-[#492B8C]">
                      {question.focus}
                    </Badge>
                  </div>
                  <p className="font-medium text-[#1A0A3D] mb-2">{question.question_text}</p>
                  <p className="text-xs text-[#6B5B9E] mb-3">{question.rubric}</p>
                  <Textarea
                    value={quizAnswers[question.id] || ""}
                    onChange={(e) => setQuizAnswers((current) => ({ ...current, [question.id]: e.target.value }))}
                    placeholder="Write your answer here..."
                    className="min-h-28 border-[#E8E3F3]"
                  />
                </div>
              ))}
            </div>

            <div className="p-5 border-t border-[#E8E3F3] flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setQuizOpen(false)}
                className="rounded-full border-[#E8E3F3] text-[#492B8C]"
              >
                Cancel
              </Button>
              <Button
                onClick={submitQuiz}
                disabled={quizSubmitting}
                className="rounded-full bg-[#492B8C] text-white hover:bg-[#2D1A69]"
              >
                {quizSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Quiz
                    <Sparkles className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
