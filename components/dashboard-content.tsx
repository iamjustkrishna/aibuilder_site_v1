"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { EndQuizLeaderboard } from "@/components/end-quiz-leaderboard"
import {
  Sparkles,
  LogOut,
  PlayCircle,
  FileText,
  Video,
  Lock,
  Crown,
  Star,
  ExternalLink,
  Mail,
  MessageCircle,
  BookOpen,
  X,
  Wrench,
  Zap,
  Gift,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Play,
  Calendar,
  Users,
  Check,
  Share2,
  Trophy,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import type { User } from "@supabase/supabase-js"

interface Profile {
  id: string
  email: string
  full_name: string
  avatar_url: string
  membership_tier: "initial" | "foundational" | "builder" | "architect"
  created_at: string
}

interface DashboardContentProps {
  user: User
  profile: Profile | null
}

interface DBResource {
  id: string
  title: string
  description: string
  type: "video" | "pdf" | "article" | "code" | "other"
  url: string
  thumbnail_url: string | null
  tier_required: "initial" | "foundational" | "builder" | "architect"
  category: string
  sort_order: number
}

interface UpcomingSession {
  id: string
  title: string
  description: string | null
  meet_link: string
  session_at: string
  visibility_scope: "all" | "tiers" | "users"
  audience_tiers: string[] | null
}

interface CohortSummary {
  id: string
  code: string
  name: string
  is_current: boolean
}

// Best AI Tools to use - compact list for dashboard
const aiTools = [
  {
    name: "v0.app",
    description: "Build full-stack apps with AI. We provide free credits for every sign up!",
    url: "https://v0.app/ref/RAIJ6R",
    highlight: true,
  },
  {
    name: "Cursor",
    description: "AI-powered code editor",
    url: "https://cursor.sh",
  },
  {
    name: "Claude",
    description: "Advanced AI assistant",
    url: "https://claude.ai",
  },
]

// YouTube videos for learning
const youtubeVideos = [
  {
    title: "But what is a GPT? Visual intro to Transformers",
    channel: "3Blue1Brown",
    videoId: "wjZofJX0v4M",
    description: "Visual explanation of how GPT and transformer models work"
  },
  {
    title: "Let's build GPT: from scratch, in code",
    channel: "Andrej Karpathy",
    videoId: "kCc8FmEb1nY",
    description: "Build a GPT model from scratch - perfect for understanding LLMs"
  },
  {
    title: "Intro to Large Language Models",
    channel: "Andrej Karpathy",
    videoId: "zjkBMFhNj_g",
    description: "One hour intro to LLMs - what they are, how they work"
  },
  {
    title: "But what is a neural network?",
    channel: "3Blue1Brown",
    videoId: "aircAruvnKk",
    description: "Deep learning chapter 1 - the foundation of AI"
  },
  {
    title: "Building AI Agents with LangChain",
    channel: "freeCodeCamp",
    videoId: "aywZrzNaKjs",
    description: "Complete tutorial on building AI agents"
  },
  {
    title: "Full Stack AI App Tutorial",
    channel: "Fireship",
    videoId: "mkBDpBT9ETs",
    description: "Build a full stack AI app in under 15 minutes"
  },
]

// Resources available for each tier
const initialResources = [
  {
    title: "AI Builder Cohort Guide",
    description: "Complete program overview and curriculum",
    type: "pdf",
    icon: FileText,
    url: "/ai-builder-cohort-guide.pdf",
    isPdfViewer: true,
  },
  {
    title: "Getting Started with ChatGPT",
    description: "Introduction to using ChatGPT effectively",
    type: "article",
    icon: BookOpen,
    url: "https://platform.openai.com/docs/guides/text-generation",
  },
  {
    title: "Prompt Engineering Guide",
    description: "Learn to write effective prompts",
    type: "article",
    icon: BookOpen,
    url: "https://www.promptingguide.ai/",
  },
]

const foundationalResources = [
  {
    title: "Week 1: Understanding AI",
    description: "Foundation concepts and prompt engineering",
    type: "video",
    icon: Video,
    url: "#",
  },
  {
    title: "Week 2: Building AI Apps",
    description: "Hands-on app development",
    type: "video",
    icon: Video,
    url: "#",
  },
  {
    title: "Week 3: AI Agents",
    description: "Building autonomous agents",
    type: "video",
    icon: Video,
    url: "#",
  },
  {
    title: "Week 4: Launch & Monetize",
    description: "Preparing for launch",
    type: "video",
    icon: Video,
    url: "#",
  },
]

const builderResources = [
  {
    title: "1-on-1 Mentor Sessions",
    description: "Schedule personal guidance with mentors",
    type: "video",
    icon: Video,
    url: "#",
  },
  {
    title: "Code Review Sessions",
    description: "Get feedback on your AI projects",
    type: "video",
    icon: Video,
    url: "#",
  },
  {
    title: "LangChain Documentation",
    description: "Official LangChain docs for building AI apps",
    type: "article",
    icon: BookOpen,
    url: "https://python.langchain.com/docs/get_started/introduction",
  },
  {
    title: "Vercel AI SDK Guide",
    description: "Build AI-powered apps with Next.js",
    type: "article",
    icon: BookOpen,
    url: "https://sdk.vercel.ai/docs",
  },
]

const architectResources = [
  {
    title: "AI Store Onboarding",
    description: "How to publish and sell on our store",
    type: "video",
    icon: Crown,
    url: "#",
  },
  {
    title: "Pricing Strategy Guide",
    description: "How to price your AI products",
    type: "pdf",
    icon: FileText,
    url: "#",
  },
  {
    title: "Marketing Your AI App",
    description: "Get users for your product",
    type: "pdf",
    icon: FileText,
    url: "#",
  },
  {
    title: "Direct Support Channel",
    description: "Priority support from mentors",
    type: "link",
    icon: Mail,
    url: "mailto:support@aibuilder.space",
  },
]

const cohortWeeks = [
  { key: "week-1", label: "Week 1", topic: "Understanding AI", color: "from-[#492B8C] to-[#2D1A69]", tier: "foundational" },
  { key: "week-2", label: "Week 2", topic: "Building AI Apps", color: "from-[#00C8A7] to-[#009E87]", tier: "foundational" },
  { key: "week-3", label: "Week 3", topic: "AI Agents", color: "from-[#FFD13F] to-[#FF9F00]", tier: "foundational" },
  { key: "week-4", label: "Week 4", topic: "Launch & Monetize", color: "from-[#FF6B34] to-[#E84C1E]", tier: "foundational" },
]

const tierOrder = { initial: 0, foundational: 1, builder: 2, architect: 3 }

const tierInfo = {
  initial: {
    label: "Explorer",
    color: "bg-[#6B5B9E]",
    textColor: "text-[#6B5B9E]",
    description: "You have access to free introductory resources. Upgrade to unlock the full curriculum!",
  },
  foundational: {
    label: "Foundational",
    color: "bg-[#00C8A7]",
    textColor: "text-[#00C8A7]",
    description: "You have access to all live sessions, recordings, and free resources.",
  },
  builder: {
    label: "Builder",
    color: "bg-[#FFD13F]",
    textColor: "text-[#FFD13F]",
    description: "You have everything in Foundational plus 1-on-1 mentor support and code reviews.",
  },
  architect: {
    label: "Architect",
    color: "bg-[#FF6B34]",
    textColor: "text-[#FF6B34]",
    description: "You have full access plus AI Store access to publish and earn 100% of your AI app sales!",
  },
}

// Pricing tiers for UPI payment
export function DashboardContent({ user, profile }: DashboardContentProps) {
  const router = useRouter()
  const tier = profile?.membership_tier || "initial"
  const tierData = tierInfo[tier]
  const [showPdfViewer, setShowPdfViewer] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)
  const [selectedVideoTitle, setSelectedVideoTitle] = useState<string>("")
  const [dbResources, setDbResources] = useState<DBResource[]>([])
  const [loadingResources, setLoadingResources] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null)
  const [selectedPdfTitle, setSelectedPdfTitle] = useState<string>("")
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null)
  const [showMentorModal, setShowMentorModal] = useState(false)
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false)
  const [showSetupModal, setShowSetupModal] = useState(false)
  const [setupCheckedItems, setSetupCheckedItems] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ai_builder_setup_checklist")
      return saved ? JSON.parse(saved) : {}
    }
    return {}
  })

  const toggleSetupChecklist = (key: string) => {
    setSetupCheckedItems((prev) => {
      const updated = { ...prev, [key]: !prev[key] }
      if (typeof window !== "undefined") {
        localStorage.setItem("ai_builder_setup_checklist", JSON.stringify(updated))
      }
      return updated
    })
  }

  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([])
  const [currentCohort, setCurrentCohort] = useState<CohortSummary | null>(null)
  const [isCurrentCohortParticipant, setIsCurrentCohortParticipant] = useState(false)
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({})
  const [curatedVideos, setCuratedVideos] = useState<any[]>([])
  const [activeWeek, setActiveWeek] = useState<string>("week-1")
  const [loadingCuratedVideos, setLoadingCuratedVideos] = useState(true)
  const curatedScrollRef = useRef<HTMLDivElement>(null)

  // Check if user is admin
  useEffect(() => {
    async function checkAdmin() {
      try {
        const res = await fetch("/api/admin/check")
        if (res.ok) {
          const data = await res.json()
          setIsAdmin(data.isAdmin)
        }
      } catch (error) {
        console.error("Failed to check admin status:", error)
      }
    }
    checkAdmin()
  }, [])

  // Fetch resources from database based on user's tier
  useEffect(() => {
    async function fetchResources() {
      try {
        const res = await fetch(`/api/resources?tier=${tier}`)
        if (res.ok) {
          const data = await res.json()
          setDbResources(data)
        }
      } catch (error) {
        console.error("Failed to fetch resources:", error)
      } finally {
        setLoadingResources(false)
      }
    }
    fetchResources()
  }, [tier])

  useEffect(() => {
    async function fetchUpcomingSessions() {
      try {
        const res = await fetch("/api/sessions")
        if (res.ok) {
          const data = await res.json()
          setUpcomingSessions(data || [])
        }
      } catch (error) {
        console.error("Failed to fetch upcoming sessions:", error)
      }
    }

    fetchUpcomingSessions()
  }, [user.id, tier])

  useEffect(() => {
    async function fetchCohortContext() {
      try {
        const res = await fetch("/api/cohorts/current")
        if (!res.ok) return
        const data = await res.json()
        setCurrentCohort(data.current_cohort || null)
        setIsCurrentCohortParticipant(Boolean(data.current_cohort && Array.isArray(data.enrolled_cohorts) && data.enrolled_cohorts.some((cohort: CohortSummary) => cohort.id === data.current_cohort.id)))
      } catch (error) {
        console.error("Failed to fetch cohort context:", error)
      }
    }

    fetchCohortContext()
  }, [])

  useEffect(() => {
    async function fetchCuratedVideos() {
      setLoadingCuratedVideos(true)
      try {
        const res = await fetch(`/api/learning/curated?week=${activeWeek}`)
        if (!res.ok) {
          console.error("Failed to fetch curated videos")
          return
        }
        const data = await res.json()
        setCuratedVideos((data || []).map((video: any) => ({
          ...video,
          title: video.title || video.video_title || "Untitled video",
          youtube_url: video.youtube_url || video.video_url || video.url || "",
          url: video.url || video.video_url || video.youtube_url || "",
        })))
      } catch (error) {
        console.error("Failed to fetch curated videos:", error)
      } finally {
        setLoadingCuratedVideos(false)
      }
    }

    fetchCuratedVideos()
  }, [activeWeek])

  function extractYouTubeId(url: string): string | null {
    const match = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/)
    return match?.[1] || null
  }

  function getWeekVideos(weekKey: string): DBResource[] {
    return dbResources.filter(r => r.category === weekKey && r.type === "video")
  }

  function formatSessionTime(sessionAt: string) {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(sessionAt))
  }

  function toggleDescription(key: string) {
    setExpandedDescriptions((current) => ({ ...current, [key]: !current[key] }))
  }

  const scrollCurated = (direction: "left" | "right") => {
    if (curatedScrollRef.current) {
      const { scrollLeft, clientWidth } = curatedScrollRef.current
      const scrollTo = direction === "left" 
        ? scrollLeft - clientWidth * 0.75 
        : scrollLeft + clientWidth * 0.75
      curatedScrollRef.current.scrollTo({ left: scrollTo, behavior: "smooth" })
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const getResources = () => {
    if (tier === "architect") {
      return [...initialResources, ...foundationalResources, ...builderResources, ...architectResources]
    }
    if (tier === "builder") {
      return [...initialResources, ...foundationalResources, ...builderResources]
    }
    if (tier === "foundational") {
      return [...initialResources, ...foundationalResources]
    }
    return initialResources
  }

  const resources = getResources()
  const quickResources = resources.filter((resource) => !/^Week [1-4]:/i.test(resource.title))

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-[#E8E3F3] bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#2D1A69] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-[#1A0A3D]" style={{ fontFamily: "var(--font-cal-sans)" }}>
              AI Builder
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {/* Community Button */}
            <Button
              asChild
              variant="outline"
              size="sm"
              className="!bg-white border-[#00C8A7] text-[#00C8A7] hover:!bg-[#00C8A7] hover:!text-white rounded-full hidden sm:flex shadow-sm"
            >
              <a
                href="https://whatsapp.com/channel/0029VbCJ26365yDAn7xmbq2R"
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Community
              </a>
            </Button>

            <Link
              href="/dashboard/profile"
              className="group flex items-center gap-3 rounded-2xl px-3 py-2 transition-all duration-200 hover:bg-[#F4F1FB] hover:shadow-sm hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#492B8C]/20"
              aria-label="Open profile"
            >
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.full_name || "User"}
                  width={36}
                  height={36}
                  className="rounded-full ring-2 ring-transparent group-hover:ring-[#492B8C]/15 transition-all"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#F4F1FB] flex items-center justify-center ring-2 ring-transparent group-hover:ring-[#492B8C]/15 transition-all">
                  <span className="text-sm font-medium text-[#492B8C]">
                    {(profile?.full_name || user.email || "U").charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-[#1A0A3D] group-hover:text-[#492B8C] transition-colors">
                  {profile?.full_name || "User"}
                </p>
                <p className="text-xs text-[#6B5B9E]">{user.email}</p>
              </div>
              <ChevronRight className="hidden sm:block w-4 h-4 text-[#6B5B9E] transition-transform group-hover:translate-x-0.5 group-hover:text-[#492B8C]" />
            </Link>
            {isAdmin && (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-[#FF6B34] hover:text-[#FF6B34] hover:bg-[#FF6B34]/10"
              >
                <Link href="/admin">
                  Admin
                </Link>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-[#6B5B9E] hover:text-[#1A0A3D] hover:bg-[#F4F1FB]"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1A0A3D] mb-2" style={{ fontFamily: "var(--font-cal-sans)" }}>
            Welcome back, {profile?.full_name?.split(" ")[0] || "Builder"}!
          </h1>
          <p className="text-[#6B5B9E]">{tierData.description}</p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 flex flex-wrap gap-3">
          {currentCohort && isCurrentCohortParticipant && tier !== "initial" && (
            <Button
              type="button"
              onClick={() => setShowLeaderboardModal(true)}
              variant="ghost"
              className="rounded-full !bg-white !text-[#2D1A69] border border-[#E8E3F3] hover:!bg-[#FFF8F2] shadow-sm"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Leaderboard
            </Button>
          )}

          <Button
            asChild
            className="bg-[#00C8A7] text-white hover:bg-[#00C8A7]/90 rounded-full"
          >
            <a
              href="https://whatsapp.com/channel/0029VbCJ26365yDAn7xmbq2R"
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Join Community
            </a>
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowPdfViewer(true)}
            className="!bg-white border-[#492B8C] text-[#492B8C] hover:!bg-[#492B8C] hover:!text-white rounded-full shadow-sm"
          >
            <FileText className="w-4 h-4 mr-2" />
            View Program Guide
          </Button>
          {tier !== "initial" && (
            <Button
              variant="outline"
              onClick={() => setShowSetupModal(true)}
              className="!bg-white border-[#FF6B34] text-[#FF6B34] hover:!bg-[#FF6B34] hover:!text-white rounded-full shadow-sm"
            >
              <Wrench className="w-4 h-4 mr-2" />
              System Setup & AI Tools
            </Button>
          )}
        </div>

        {showLeaderboardModal && (
          <div className="fixed inset-0 z-50 bg-black/70 p-4 flex items-center justify-center">
            <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl flex flex-col">
              <div className="p-4 border-b border-[#E8E3F3] flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-[#6B5B9E]">Current cohort</p>
                  <h3 className="text-xl font-bold text-[#1A0A3D]" style={{ fontFamily: "var(--font-cal-sans)" }}>
                    Leaderboard
                  </h3>
                </div>
                <button
                  onClick={() => setShowLeaderboardModal(false)}
                  className="w-9 h-9 rounded-full border border-[#E8E3F3] flex items-center justify-center text-[#492B8C] bg-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="overflow-y-auto p-4 md:p-6">
                <EndQuizLeaderboard currentCohortName={currentCohort?.name || null} showQuizCard={false} />
              </div>
            </div>
          </div>
        )}

        {/* Cohort Weeks - shown for foundational and above */}
        {tierOrder[tier] >= tierOrder["foundational"] && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#1A0A3D] mb-4 flex items-center gap-2" style={{ fontFamily: "var(--font-cal-sans)" }}>
              <Calendar className="w-5 h-5 text-[#492B8C]" />
              Cohort Sessions
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {cohortWeeks.map((week) => {
                const videos = getWeekVideos(week.key)
                const isLocked = tierOrder[tier] < tierOrder[week.tier as keyof typeof tierOrder]
                return (
                  <button
                    key={week.key}
                    onClick={() => !isLocked && setSelectedWeek(week.key)}
                    disabled={isLocked}
                    className={`relative group text-left rounded-2xl p-5 bg-gradient-to-br ${week.color} transition-all ${isLocked ? "opacity-50 cursor-not-allowed" : "hover:shadow-lg hover:scale-[1.02] cursor-pointer"
                      }`}
                  >
                    {isLocked && (
                      <div className="absolute top-3 right-3">
                        <Lock className="w-4 h-4 text-white/80" />
                      </div>
                    )}
                    <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1">{week.label}</p>
                    <h3 className="text-white font-bold text-base leading-snug mb-3">{week.topic}</h3>
                    <div className="flex items-center gap-1.5">
                      <Play className="w-3.5 h-3.5 text-white/80" />
                      <span className="text-white/80 text-xs">
                        {videos.length > 0 ? `${videos.length} video${videos.length !== 1 ? "s" : ""}` : "Coming soon"}
                      </span>
                    </div>
                    {!isLocked && videos.length > 0 && (
                      <div className="absolute bottom-3 right-3 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                        <ChevronRight className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Week Videos Popup */}
        {selectedWeek && (
          <div
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
            onClick={() => setSelectedWeek(null)}
          >
            <div
              className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              {(() => {
                const week = cohortWeeks.find(w => w.key === selectedWeek)!
                const videos = getWeekVideos(selectedWeek)
                return (
                  <>
                    <div className={`bg-gradient-to-r ${week.color} px-6 py-5 flex items-center justify-between`}>
                      <div>
                        <p className="text-white/70 text-xs uppercase tracking-wider">{week.label}</p>
                        <h3 className="text-white font-bold text-xl" style={{ fontFamily: "var(--font-cal-sans)" }}>
                          {week.topic}
                        </h3>
                      </div>
                      <button
                        onClick={() => setSelectedWeek(null)}
                        className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                    <div className="overflow-y-auto flex-1 p-4">
                      {videos.length === 0 ? (
                        <div className="text-center py-12 text-[#6B5B9E]">
                          <Video className="w-10 h-10 mx-auto mb-3 opacity-40" />
                          <p className="font-medium text-[#1A0A3D]">Videos coming soon</p>
                          <p className="text-sm mt-1">Session recordings will appear here after each live class.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {videos.map((video) => {
                            const videoId = extractYouTubeId(video.url)
                            return (
                              <button
                                key={video.id}
                                onClick={() => {
                                  if (videoId) {
                                    setSelectedVideoTitle(video.title)
                                    setSelectedVideo(videoId)
                                    setSelectedWeek(null)
                                  }
                                }}
                                className="w-full group flex items-center gap-4 p-3 rounded-xl hover:bg-[#F4F1FB] transition-colors text-left border border-transparent hover:border-[#E8E3F3]"
                              >
                                <div className="relative flex-shrink-0 w-28 aspect-video rounded-lg overflow-hidden bg-[#1A0A3D]">
                                  {videoId ? (
                                    <Image
                                      src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                                      alt={video.title}
                                      fill
                                      className="object-cover group-hover:opacity-80 transition-opacity"
                                    />
                                  ) : null}
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-8 h-8 rounded-full bg-[#FF6B34] flex items-center justify-center shadow group-hover:scale-110 transition-transform">
                                      <Play className="w-4 h-4 text-white ml-0.5" />
                                    </div>
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-[#1A0A3D] group-hover:text-[#492B8C] transition-colors line-clamp-2">
                                    {video.title}
                                  </h4>
                                  {video.description && (
                                    <p className="text-sm text-[#6B5B9E] mt-0.5 line-clamp-2">{video.description}</p>
                                  )}
                                </div>
                                <ChevronRight className="w-4 h-4 text-[#6B5B9E] flex-shrink-0 group-hover:text-[#492B8C] transition-colors" />
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        )}

        {/* Membership Tier Card */}
        <div className="mb-8 p-6 rounded-2xl bg-white border border-[#E8E3F3] shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1 rounded-full ${tierData.color} text-white text-sm font-medium flex items-center gap-1`}>
                {tier === "architect" && <Crown className="w-3 h-3" />}
                {tier === "builder" && <Star className="w-3 h-3" />}
                {tier === "foundational" && <Star className="w-3 h-3" />}
                {tierData.label}
              </div>
              <span className="text-sm text-[#6B5B9E]">Current Membership</span>
            </div>

            {tier !== "architect" && <p className="text-sm text-[#6B5B9E]">Contact to upgrade your tier.</p>}
          </div>
        </div>



        {upcomingSessions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#1A0A3D] mb-4" style={{ fontFamily: "var(--font-cal-sans)" }}>
              <Calendar className="w-5 h-5 inline-block mr-2 text-[#492B8C]" />
              Upcoming Sessions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingSessions.map((session) => (
                <div key={session.id} className="p-5 rounded-2xl bg-white border border-[#E8E3F3] shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-[#1A0A3D]">{session.title}</h3>
                      {session.description && <p className="text-sm text-[#6B5B9E] mt-1 line-clamp-2">{session.description}</p>}
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-white border border-[#E8E3F3] text-[#6B5B9E] uppercase tracking-wider">
                      {session.visibility_scope === "all" ? "All" : session.visibility_scope}
                    </span>
                  </div>
                  <p className="text-sm text-[#492B8C] mt-3">{formatSessionTime(session.session_at)}</p>
                  {session.audience_tiers?.length ? (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {session.audience_tiers.map((tierName) => (
                        <span key={tierName} className="px-2 py-1 rounded-full bg-white border border-[#E8E3F3] text-[#6B5B9E] text-xs capitalize">
                          {tierName}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <div className="mt-4 flex gap-2">
                    <Button asChild className="bg-[#492B8C] text-white hover:bg-[#2D1A69] rounded-full flex-1">
                      <a href={session.meet_link} target="_blank" rel="noopener noreferrer">
                        Join Meet
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </a>
                    </Button>
                    <Button
                      onClick={() => {
                        const shareText = `📚 AI Learning Session

🎯 ${session.title}
${session.description ? `📝 ${session.description}` : ""}

🎥 Join: ${session.meet_link}
🕐 ${formatSessionTime(session.session_at)}

Register on AIBuilder 🚀`
                        
                        if (navigator.share) {
                          navigator.share({ title: session.title, text: shareText })
                        } else {
                          navigator.clipboard.writeText(shareText)
                          alert("Session details copied to clipboard!")
                        }
                      }}
                      className="bg-[#00C8A7] text-white hover:bg-[#00C8A7]/90 rounded-full"
                      title="Share session"
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}



        {/* Learning Videos Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-[#1A0A3D] mb-4" style={{ fontFamily: "var(--font-cal-sans)" }}>
            <PlayCircle className="w-5 h-5 inline-block mr-2 text-[#FF6B34]" />
            Learn AI - Curated Videos
          </h2>
          {currentCohort && (
            <p className="text-sm text-[#6B5B9E] mb-3">
              Showing curated learning content for <span className="font-semibold text-[#492B8C]">{currentCohort.name}</span> ({currentCohort.code})
            </p>
          )}
          
          {/* Week Selector */}
          <div className="mb-4 flex flex-wrap gap-2">
            {cohortWeeks.map((week) => {
              const isActive = activeWeek === week.key
              return (
                <button
                  key={week.key}
                  onClick={() => setActiveWeek(week.key)}
                  className={`px-4 py-2 rounded-full font-medium text-sm transition-colors border ${
                    isActive
                      ? `bg-gradient-to-br ${week.color} text-white border-transparent shadow-md`
                      : "bg-white text-[#6B5B9E] border-[#E8E3F3] hover:bg-[#F4F1FB]"
                  }`}
                >
                  {week.label}
                </button>
              )
            })}
          </div>

          <div className="w-full">
            {loadingCuratedVideos ? (
              <div className="text-center py-12 text-[#6B5B9E] bg-white border border-[#E8E3F3] rounded-2xl shadow-sm">
                <span className="inline-block animate-pulse">Loading curated videos...</span>
              </div>
            ) : curatedVideos.length === 0 ? (
              <div className="text-center py-12 bg-white border border-dashed border-[#E8E3F3] rounded-2xl shadow-sm">
                <Video className="w-12 h-12 mx-auto mb-3 opacity-40 text-[#6B5B9E]" />
                <p className="font-semibold text-[#1A0A3D]">No videos yet for this week</p>
                <p className="text-sm text-[#6B5B9E] mt-1">Videos will be added as the week progresses</p>
              </div>
            ) : (
              <div className="relative group/carousel px-2">
                {/* Scroll Container */}
                <div 
                  ref={curatedScrollRef}
                  className="flex gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 no-scrollbar [&::-webkit-scrollbar]:hidden"
                  style={{
                    msOverflowStyle: 'none',
                    scrollbarWidth: 'none',
                  }}
                >
                  {curatedVideos.map((video) => {
                    const videoUrl = video.youtube_url || video.video_url || video.url || ""
                    const videoId = extractYouTubeId(videoUrl)
                    return (
                      <div
                        key={video.id}
                        className="flex-none w-[280px] sm:w-[320px] snap-start group rounded-2xl bg-white border border-[#E8E3F3] hover:border-[#492B8C] hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer flex flex-col transform hover:-translate-y-1"
                        onClick={() => {
                          if (videoId) {
                            setSelectedVideoTitle(video.title || video.video_title || "Untitled video")
                            setSelectedVideo(videoId)
                          }
                        }}
                      >
                        <div className="relative aspect-video bg-[#1A0A3D] overflow-hidden">
                          {videoId && (
                            <Image
                              src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                              alt={video.title || video.video_title || "Video"}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500 group-hover:opacity-90"
                            />
                          )}
                          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-[#FF6B34] flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:bg-[#ff8454] transition-all duration-300">
                              <PlayCircle className="w-6 h-6 text-white" />
                            </div>
                          </div>
                        </div>
                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="font-semibold text-[#1A0A3D] mb-2 line-clamp-2 group-hover:text-[#492B8C] transition-colors duration-300 text-sm sm:text-base leading-snug">
                              {video.title || video.video_title || "Untitled video"}
                            </h3>
                            {video.description && (
                              <p className="text-xs sm:text-sm text-[#6B5B9E] line-clamp-2 leading-relaxed">{video.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Navigation Arrows */}
                {curatedVideos.length > 0 && (
                  <>
                    <button
                      onClick={() => scrollCurated("left")}
                      className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-[#E8E3F3] shadow-md flex items-center justify-center text-[#492B8C] hover:bg-[#492B8C] hover:text-white transition-all duration-300 opacity-0 group-hover/carousel:opacity-100 focus:outline-none z-10 hover:scale-110"
                      aria-label="Scroll left"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => scrollCurated("right")}
                      className="absolute right-[-12px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-[#E8E3F3] shadow-md flex items-center justify-center text-[#492B8C] hover:bg-[#492B8C] hover:text-white transition-all duration-300 opacity-0 group-hover/carousel:opacity-100 focus:outline-none z-10 hover:scale-110"
                      aria-label="Scroll right"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Database Resources (from Admin) */}
        {dbResources.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#1A0A3D] mb-4" style={{ fontFamily: "var(--font-cal-sans)" }}>
              <BookOpen className="w-5 h-5 inline-block mr-2 text-[#492B8C]" />
              Cohort Resources
            </h2>
            {loadingResources ? (
              <div className="text-center py-8 text-[#6B5B9E]">Loading resources...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {dbResources.map((resource) => {
                  const IconComponent = resource.type === "video" ? Video : resource.type === "pdf" ? FileText : BookOpen
                  const descriptionKey = resource.id
                  const isExpanded = Boolean(expandedDescriptions[descriptionKey])
                  return (
                    <div
                      key={resource.id}
                      onClick={() => {
                        if (resource.type === "video" && resource.url.includes("youtube")) {
                          const videoId = resource.url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/)?.[1]
                          if (videoId) {
                            setSelectedVideoTitle(resource.title)
                            setSelectedVideo(videoId)
                          }
                        } else if (resource.type === "pdf" && resource.url !== "#") {
                          setSelectedPdfUrl(resource.url)
                          setSelectedPdfTitle(resource.title)
                        } else if (resource.url !== "#") {
                          window.open(resource.url, "_blank")
                        }
                      }}
                      className="group p-5 rounded-xl bg-white border border-[#E8E3F3] hover:border-[#492B8C] hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-white border border-[#E8E3F3] group-hover:bg-[#492B8C] transition-colors">
                          <IconComponent className="w-5 h-5 text-[#492B8C] group-hover:text-white transition-colors" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start gap-2 mb-1">
                            <h3 className="font-medium text-[#1A0A3D] group-hover:text-[#492B8C] transition-colors">
                              {resource.title}
                            </h3>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleDescription(descriptionKey)
                              }}
                              className="p-1 rounded-full text-[#6B5B9E] hover:text-[#492B8C] hover:bg-[#F4F1FB] transition-colors"
                              aria-label={isExpanded ? "Collapse description" : "Expand description"}
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                            <span className={`px-2 py-0.5 rounded-full text-xs text-white ${resource.tier_required === "architect" ? "bg-[#FF6B34]" :
                              resource.tier_required === "builder" ? "bg-[#FFD13F]" :
                                resource.tier_required === "foundational" ? "bg-[#00C8A7]" : "bg-[#6B5B9E]"
                              }`}>
                              {resource.tier_required}
                            </span>
                          </div>
                          <p className={`text-sm text-[#6B5B9E] ${isExpanded ? "" : "line-clamp-2"}`}>{resource.description}</p>
                          {resource.category && resource.category !== "general" && (
                            <p className="text-xs text-[#FF6B34] mt-1">{resource.category}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Static Resources Grid */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-[#1A0A3D] mb-4" style={{ fontFamily: "var(--font-cal-sans)" }}>
            <BookOpen className="w-5 h-5 inline-block mr-2 text-[#492B8C]" />
            Quick Resources
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickResources.map((resource, index) => {
            const isComingSoon = resource.url === "#" && resource.title !== "1-on-1 Mentor Sessions"
            const descriptionKey = `quick-${index}-${resource.title}`
            const isExpanded = Boolean(expandedDescriptions[descriptionKey])
            return (
              <div
                key={index}
                onClick={() => {
                  if (resource.title === "1-on-1 Mentor Sessions") {
                    setShowMentorModal(true)
                  } else if ("isPdfViewer" in resource && resource.isPdfViewer) {
                    setShowPdfViewer(true)
                  } else if (resource.url !== "#") {
                    window.open(resource.url, "_blank")
                  }
                }}
                className={`group p-5 rounded-xl bg-white border border-[#E8E3F3] hover:border-[#492B8C] hover:shadow-md transition-all cursor-pointer ${isComingSoon ? "opacity-70" : ""}`}
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-white border border-[#E8E3F3] group-hover:bg-[#492B8C] transition-colors relative">
                    <resource.icon className="w-5 h-5 text-[#492B8C] group-hover:text-white transition-colors" />
                    {isComingSoon && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#FF6B34] rounded-full ring-2 ring-white animate-pulse" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-medium text-[#1A0A3D] group-hover:text-[#492B8C] transition-colors">
                        {resource.title}
                      </h3>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleDescription(descriptionKey)
                        }}
                        className="p-1 rounded-full text-[#6B5B9E] hover:text-[#492B8C] hover:bg-[#F4F1FB] transition-colors"
                        aria-label={isExpanded ? "Collapse description" : "Expand description"}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      {isComingSoon && (
                        <span className="text-[10px] font-bold text-[#FF6B34] uppercase tracking-wider">Coming Soon</span>
                      )}
                    </div>
                    <p className={`text-sm text-[#6B5B9E] ${isExpanded ? "" : "line-clamp-2"}`}>{resource.description}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Locked Resources Preview */}
        {tier !== "architect" && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-[#1A0A3D] mb-4" style={{ fontFamily: "var(--font-cal-sans)" }}>
              <Lock className="w-5 h-5 inline-block mr-2 text-[#6B5B9E]" />
              {tier === "initial" && "Unlock with Foundational, Builder, or Architect"}
              {tier === "foundational" && "Unlock with Builder or Architect"}
              {tier === "builder" && "Unlock with Architect"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(tier === "initial"
                ? [...foundationalResources.slice(0, 2), ...architectResources.slice(0, 1)]
                : tier === "foundational"
                  ? [...builderResources.slice(0, 2), ...architectResources.slice(0, 1)]
                  : architectResources
              ).map((resource, index) => (
                <div
                  key={index}
                  className="relative p-5 rounded-xl bg-white border border-[#E8E3F3] opacity-60 shadow-sm"
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="p-2 rounded-full bg-white shadow-md">
                      <Lock className="w-4 h-4 text-[#6B5B9E]" />
                    </div>
                  </div>
                    <div className="flex items-start gap-4 blur-[2px]">
                      <div className="p-2 rounded-lg bg-white border border-[#E8E3F3]">
                        <resource.icon className="w-5 h-5 text-[#492B8C]" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-[#1A0A3D] mb-1">{resource.title}</h3>
                        <p className="text-sm text-[#6B5B9E] line-clamp-2">{resource.description}</p>
                      </div>
                    </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact Support */}
        <div className="mt-12 p-6 rounded-2xl bg-[#2D1A69] text-center">
          <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-cal-sans)" }}>
            Need Help?
          </h3>
          <p className="text-[#C3AFFF] mb-4">
            Have questions about your membership or need support?
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              className="bg-white text-[#2D1A69] hover:bg-[#F4F1FB] rounded-full"
            >
              <a href="mailto:support@aibuilder.space">
                Contact Support
                <Mail className="w-4 h-4 ml-2" />
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-[#2D1A69] rounded-full"
            >
              <a
                href="https://whatsapp.com/channel/0029VbCJ26365yDAn7xmbq2R"
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp Community
              </a>
            </Button>
          </div>
        </div>
      </main>

      {/* PDF Viewer Modal */}
      {showPdfViewer && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#E8E3F3]">
              <h3 className="font-bold text-[#1A0A3D]" style={{ fontFamily: "var(--font-cal-sans)" }}>
                AI Builder Cohort - Program Guide
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="border-[#492B8C] text-[#492B8C] hover:bg-[#492B8C] hover:text-white rounded-full"
                >
                  <a href="/ai-builder-cohort-guide.pdf" download>
                    Download PDF
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPdfViewer(false)}
                  className="text-[#6B5B9E] hover:text-[#1A0A3D]"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
            <div className="flex-1 bg-[#F4F1FB]">
              <iframe
                src="/ai-builder-cohort-guide.pdf"
                className="w-full h-full"
                title="AI Builder Cohort Guide"
              />
            </div>
          </div>
        </div>
      )}

      {/* System Setup & AI Tools Checklist Modal */}
      {showSetupModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowSetupModal(false)}>
          <div className="bg-white rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            {/* Header with Progress Bar */}
            <div className="p-6 border-b border-[#E8E3F3] bg-white flex-shrink-0">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 text-xs font-semibold bg-[#FF6B34]/10 text-[#FF6B34] rounded-full uppercase tracking-wider">Cohort Preparation</span>
                    <span className="px-2 py-0.5 text-xs font-semibold bg-[#492B8C]/10 text-[#492B8C] rounded-full">Interactive Setup</span>
                  </div>
                  <h3 className="text-2xl font-bold text-[#1A0A3D]" style={{ fontFamily: "var(--font-cal-sans)" }}>
                    System Prerequisites & AI Tools Setup
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSetupModal(false)}
                  className="text-[#6B5B9E] hover:text-[#1A0A3D] hover:bg-[#F4F1FB] rounded-full w-9 h-9 p-0 flex items-center justify-center border border-[#E8E3F3]"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Progress Tracker */}
              {(() => {
                const total = 8
                const completed = Object.values(setupCheckedItems).filter(Boolean).length
                const percent = Math.round((completed / total) * 100)
                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#6B5B9E] font-medium flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-[#FF6B34] animate-pulse" />
                        Cohort Readiness Tracker
                      </span>
                      <span className="font-semibold text-[#492B8C]">{completed} / {total} Setup Tasks Completed ({percent}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-white rounded-full overflow-hidden border border-[#E8E3F3]">
                      <div 
                        className="h-full bg-gradient-to-r from-[#492B8C] to-[#FF6B34] transition-all duration-500 ease-out rounded-full" 
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* Modal Body / Checklist Grid */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-white space-y-6">
              {/* Dev Essentials Section */}
              <div>
                <h4 className="text-sm font-bold text-[#492B8C] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#492B8C]" />
                  1. Development Essentials (Required)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      id: "v0",
                      title: "v0.app (Highly Recommended)",
                      desc: "The ultimate AI-powered frontend generation tool. Build stunning user interfaces and deploy working React components in seconds.",
                      link: "https://v0.app/ref/RAIJ6R"
                    },
                    {
                      id: "git",
                      title: "Git & GitHub account",
                      desc: "Required for tracking changes, managing branches, and pushing cohort project assignments.",
                      link: "https://git-scm.com/"
                    },
                    {
                      id: "languages",
                      title: "Node.js (v18+) & Python (3.10+)",
                      desc: "Required core runtimes to run Next.js apps, local APIs, and local python-based AI SDK tools.",
                      link: "https://nodejs.org/"
                    }
                  ].map((item) => {
                    const isChecked = Boolean(setupCheckedItems[item.id])
                    return (
                      <div 
                        key={item.id}
                        onClick={() => toggleSetupChecklist(item.id)}
                        className={`group relative p-4 rounded-xl border transition-all duration-300 cursor-pointer flex flex-col justify-between select-none ${
                          isChecked 
                            ? "bg-white border-[#492B8C] shadow-md shadow-[#492B8C]/5" 
                            : "bg-white border-[#E8E3F3] hover:border-[#6B5B9E] hover:shadow-sm"
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="font-semibold text-[#1A0A3D] group-hover:text-[#492B8C] transition-colors">{item.title}</span>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                              isChecked 
                                ? "bg-[#492B8C] border-[#492B8C] text-white scale-110" 
                                : "border-[#E8E3F3] bg-white group-hover:border-[#6B5B9E]"
                            }`}>
                              {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                          </div>
                          <p className="text-xs text-[#6B5B9E] leading-relaxed mb-4">{item.desc}</p>
                        </div>
                        <a 
                          href={item.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center text-xs font-semibold text-[#FF6B34] hover:underline gap-1 mt-auto"
                        >
                          Official Download <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Local AI & Model Servers Section */}
              <div>
                <h4 className="text-sm font-bold text-[#FF6B34] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#FF6B34]" />
                  2. Local AI & Model Servers (Highly Recommended)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      id: "ollama",
                      title: "Ollama Local Engine",
                      desc: "The easiest way to run local open-source models (like Llama 3, Mistral, and Phi-3) on your laptop. Integrates seamlessly with custom tools.",
                      link: "https://ollama.com/"
                    },
                    {
                      id: "lmstudio",
                      title: "LM Studio GUI",
                      desc: "A beautiful, premium graphic interface to download, test, chat with, and serve local LLM models over mock-OpenAI endpoints.",
                      link: "https://lmstudio.ai/"
                    }
                  ].map((item) => {
                    const isChecked = Boolean(setupCheckedItems[item.id])
                    return (
                      <div 
                        key={item.id}
                        onClick={() => toggleSetupChecklist(item.id)}
                        className={`group relative p-4 rounded-xl border transition-all duration-300 cursor-pointer flex flex-col justify-between select-none ${
                          isChecked 
                            ? "bg-white border-[#FF6B34] shadow-md shadow-[#FF6B34]/5" 
                            : "bg-white border-[#E8E3F3] hover:border-[#6B5B9E] hover:shadow-sm"
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="font-semibold text-[#1A0A3D] group-hover:text-[#FF6B34] transition-colors">{item.title}</span>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                              isChecked 
                                ? "bg-[#FF6B34] border-[#FF6B34] text-white scale-110" 
                                : "border-[#E8E3F3] bg-white group-hover:border-[#6B5B9E]"
                            }`}>
                              {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                          </div>
                          <p className="text-xs text-[#6B5B9E] leading-relaxed mb-4">{item.desc}</p>
                        </div>
                        <a 
                          href={item.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center text-xs font-semibold text-[#492B8C] hover:underline gap-1 mt-auto"
                        >
                          Download Client <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Cloud API Keys Section */}
              <div>
                <h4 className="text-sm font-bold text-[#6B5B9E] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#6B5B9E]" />
                  3. Cloud AI API Keys (Essential)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      id: "openai_key",
                      title: "OpenAI Developer API",
                      desc: "For access to GPT-4o, GPT-3.5, Text Embeddings, and structured JSON schema validations.",
                      link: "https://platform.openai.com/"
                    },
                    {
                      id: "gemini_key",
                      title: "Google AI Studio API",
                      desc: "For free access to Gemini 2.5 Flash / Pro. Offers massive 1M token contexts completely free!",
                      link: "https://aistudio.google.com/"
                    },
                    {
                      id: "claude_key",
                      title: "Anthropic Console API",
                      desc: "For accessing Claude 3.5 Sonnet, widely recognized as the best coding and reasoning engine.",
                      link: "https://console.anthropic.com/"
                    }
                  ].map((item) => {
                    const isChecked = Boolean(setupCheckedItems[item.id])
                    return (
                      <div 
                        key={item.id}
                        onClick={() => toggleSetupChecklist(item.id)}
                        className={`group relative p-4 rounded-xl border transition-all duration-300 cursor-pointer flex flex-col justify-between select-none ${
                          isChecked 
                            ? "bg-white border-[#6B5B9E] shadow-md" 
                            : "bg-white border-[#E8E3F3] hover:border-[#6B5B9E] hover:shadow-sm"
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="font-semibold text-[#1A0A3D] group-hover:text-[#6B5B9E] transition-colors">{item.title}</span>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                              isChecked 
                                ? "bg-[#6B5B9E] border-[#6B5B9E] text-white scale-110" 
                                : "border-[#E8E3F3] bg-white group-hover:border-[#6B5B9E]"
                            }`}>
                              {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                          </div>
                          <p className="text-xs text-[#6B5B9E] leading-relaxed mb-4">{item.desc}</p>
                        </div>
                        <a 
                          href={item.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center text-xs font-semibold text-[#FF6B34] hover:underline gap-1 mt-auto"
                        >
                          Get API Key <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#E8E3F3] bg-white flex items-center justify-end gap-2 flex-shrink-0">
              <Button
                onClick={() => setShowSetupModal(false)}
                className="bg-[#492B8C] hover:bg-[#3D2174] text-white rounded-full px-6 py-2 shadow-lg shadow-[#492B8C]/15"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4" onClick={() => setSelectedVideo(null)}>
          <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-white font-medium truncate max-w-[80%]">{selectedVideoTitle || "Video"}</p>
              <button
                onClick={() => setSelectedVideo(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
              >
                <X className="w-4 h-4" />
                Close
              </button>
            </div>
            <div className="aspect-video w-full rounded-2xl overflow-hidden">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${selectedVideo}?autoplay=1&rel=0`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={selectedVideoTitle || "Video"}
              />
            </div>
          </div>
        </div>
      )}

      {/* Dynamic PDF Viewer Modal */}
      {selectedPdfUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setSelectedPdfUrl(null)}>
          <div className="bg-white rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-[#E8E3F3]">
              <h3 className="font-bold text-[#1A0A3D] truncate" style={{ fontFamily: "var(--font-cal-sans)" }}>
                {selectedPdfTitle || "Document"}
              </h3>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="border-[#492B8C] text-[#492B8C] hover:bg-[#492B8C] hover:text-white rounded-full"
                >
                  <a href={selectedPdfUrl} download target="_blank" rel="noopener noreferrer">
                    Download
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPdfUrl(null)}
                  className="text-[#6B5B9E] hover:text-[#1A0A3D]"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
            <div className="flex-1 bg-[#F4F1FB]">
              <iframe
                src={selectedPdfUrl}
                className="w-full h-full"
                title={selectedPdfTitle}
              />
            </div>
          </div>
        </div>
      )}
      {/* 1-on-1 Mentor Session Modal */}
      {showMentorModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setShowMentorModal(false)}>
          <div className="bg-white rounded-3xl w-full max-w-md p-8 text-center relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF6B34]/5 rounded-full -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#492B8C]/5 rounded-full -ml-12 -mb-12" />

            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#492B8C] to-[#2D1A69] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[#2D1A69]/20 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
              <Users className="w-10 h-10 text-white" />
            </div>

            <h3 className="text-2xl font-bold text-[#1A0A3D] mb-3" style={{ fontFamily: "var(--font-cal-sans)" }}>
              1-on-1 Mentor Session
            </h3>

            <div className="space-y-4 mb-8">
              <p className="text-[#6B5B9E] leading-relaxed">
                Unlock personalized guidance and project feedback directed by our expert mentors.
              </p>

              <div className="p-4 rounded-2xl bg-white border border-[#E8E3F3] text-sm shadow-sm">
                <p className="font-semibold text-[#1A0A3D] mb-1">How to schedule:</p>
                <p className="text-[#6B5B9E]">Mail to <span className="text-[#492B8C] font-bold">support@aibuilder.space</span> for one on one session.</p>
              </div>

              <p className="text-sm font-medium text-[#00C8A7] flex items-center justify-center gap-2">
                <Check className="w-4 h-4" />
                We will contact you shortly!
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                asChild
                className="bg-[#2D1A69] text-white hover:bg-[#492B8C] rounded-full py-6 text-lg"
              >
                <a href="mailto:support@aibuilder.space">
                  <Mail className="w-5 h-5 mr-3" />
                  Email Support
                </a>
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowMentorModal(false)}
                className="text-[#6B5B9E] hover:text-[#1A0A3D] rounded-full"
              >
                Maybe Later
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
