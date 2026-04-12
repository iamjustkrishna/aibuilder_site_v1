"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sparkles,
  PlayCircle,
  FileText,
  Video,
  Lock,
  ExternalLink,
  BookOpen,
  X,
  Search,
  Copy,
  Check,
  Code,
  Star,
  Github,
  ChevronDown,
  MessageCircle,
  ArrowRight,
  Calendar,
  Play,
  CreditCard,
  IndianRupee,
  Download,
  ShoppingCart
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import type { User } from "@supabase/supabase-js"
import { PaymentModal } from "@/components/payment-modal"
import { toast } from "sonner"

interface Profile {
  membership_tier: "initial" | "foundational" | "builder" | "architect"
}

interface ResourcesHubProps {
  user: User | null
  profile: Profile | null
}

// Pricing tiers for UPI payment
const tierPricing = {
  foundational: { price: 499, label: "Foundational" },
  builder: { price: 999, label: "Builder" },
  architect: { price: 1999, label: "Architect" },
}

// Cohort Weeks - Configuration
const cohortWeeks = [
  { key: "week-1", label: "Week 1", topic: "Understanding AI", color: "from-[#492B8C] to-[#2D1A69]", tier: "foundational" },
  { key: "week-2", label: "Week 2", topic: "Building AI Apps", color: "from-[#00C8A7] to-[#009E87]", tier: "foundational" },
  { key: "week-3", label: "Week 3", topic: "AI Agents", color: "from-[#FFD13F] to-[#FF9F00]", tier: "builder" },
  { key: "week-4", label: "Week 4", topic: "Launch & Monetize", color: "from-[#FF6B34] to-[#E84C1E]", tier: "architect" },
]

const tierOrder = { initial: 0, foundational: 1, builder: 2, architect: 3 }

// Resources with types
const allResources = [
  // Week Specific Resources (Builder/Foundational) - PROMOTED TO TOP
  {
    id: "week1-1",
    title: "Week 1: Understanding AI Foundations",
    description: "Live session recording + exercises",
    type: "video",
    tier: "builder",
    url: "https://www.youtube.com/watch?v=wjZofJX0v4M", // Example link
    category: "week-1",
  },
  {
    id: "week2-1",
    title: "Week 2: Building AI Apps",
    description: "Hands-on app development workshop",
    type: "video",
    tier: "builder",
    url: "https://www.youtube.com/watch?v=mkBDpBT9ETs", // Example link
    category: "week-2",
  },
  {
    id: "week3-1",
    title: "Week 3: AI Agents Deep Dive",
    description: "Building autonomous agents that think",
    type: "video",
    tier: "builder",
    url: "https://www.youtube.com/watch?v=aywZrzNaKjs", // Example link
    category: "week-3",
  },
  {
    id: "week4-1",
    title: "Week 4: Launch & Monetize",
    description: "From code to cash - shipping your AI product",
    type: "video",
    tier: "builder",
    url: "https://www.youtube.com/watch?v=mkBDpBT9ETs", // Example link
    category: "week-4",
  },
  // Free Resources
  {
    id: "guide-1",
    title: "AI Builder Cohort Guide",
    description: "Complete program overview and curriculum",
    type: "pdf",
    tier: "free",
    url: "/ai-builder-cohort-guide.pdf",
    featured: true,
  },
  {
    id: "prompt-1",
    title: "Prompt Engineering Guide",
    description: "Master the art of writing effective prompts",
    type: "article",
    tier: "free",
    url: "https://www.promptingguide.ai/",
  },
  {
    id: "openai-1",
    title: "OpenAI API Documentation",
    description: "Official docs for GPT and other models",
    type: "article",
    tier: "free",
    url: "https://platform.openai.com/docs",
  },
  {
    id: "google-1",
    title: "Gemini API Quickstart",
    description: "Get started with Google's Gemini models",
    type: "article",
    tier: "free",
    url: "https://ai.google.dev/tutorials/python_quickstart",
  },
  // Other Resources
  {
    id: "agent-guide",
    title: "Building Agents Guide (OpenAI 2026)",
    description: "A practical guide to building AI agents",
    type: "pdf",
    tier: "builder",
    url: "#",
    featured: true,
  },
  {
    id: "langchain-1",
    title: "LangChain Masterclass",
    description: "Complete LangChain tutorial with projects",
    type: "video",
    tier: "builder",
    url: "#",
  },
  // Architect Resources
  {
    id: "store-1",
    title: "AI Store Onboarding",
    description: "How to publish and sell on our marketplace",
    type: "video",
    tier: "architect",
    url: "#",
    category: "week-4",
  },
  {
    id: "pricing-1",
    title: "Pricing Strategy Playbook",
    description: "Data-driven pricing for AI products",
    type: "pdf",
    tier: "architect",
    url: "#",
    category: "week-4",
  },
  {
    id: "marketing-1",
    title: "Marketing Your AI App",
    description: "Growth strategies that work in 2026",
    type: "pdf",
    tier: "architect",
    url: "#",
    category: "week-4",
  },
]

// Starter Code Snippets - One Click Clone
const starterSnippets = [
  {
    title: "Hello Gemini - Your First AI Call",
    description: "10 lines to talk to Gemini AI. Copy, paste, run!",
    language: "python",
    code: `# Install: pip install google-generativeai
import google.generativeai as genai

genai.configure(api_key="YOUR_API_KEY")
model = genai.GenerativeModel('gemini-1.5-flash')

response = model.generate_content("Explain AI in one sentence")
print(response.text)

# Run: python hello_gemini.py`,
    tier: "free",
  },
  {
    title: "AI Chatbot in 15 Lines",
    description: "Build a conversational AI with memory",
    language: "python",
    code: `# Install: pip install groq
from groq import Groq

client = Groq(api_key="YOUR_KEY")
messages = []

while True:
    user_input = input("You: ")
    messages.append({"role": "user", "content": user_input})
    
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages
    )
    
    assistant_msg = response.choices[0].message.content
    messages.append({"role": "assistant", "content": assistant_msg})
    print(f"AI: {assistant_msg}")`,
    tier: "free",
  },
  {
    title: "AI Agent with Tools",
    description: "Build an agent that can search the web and run code",
    language: "python",
    code: `# Full agent tutorial available in Builder tier
from langchain.agents import initialize_agent
from langchain.tools import DuckDuckGoSearchRun
from langchain_groq import ChatGroq

llm = ChatGroq(model="llama-3.3-70b-versatile")
tools = [DuckDuckGoSearchRun()]

agent = initialize_agent(
    tools, llm, 
    agent="zero-shot-react-description",
    verbose=True
)

agent.run("What's the latest news about AI?")`,
    tier: "builder",
  },
]

// YouTube Videos - Embedded
const youtubeVideos = [
  {
    title: "But what is a GPT?",
    channel: "3Blue1Brown",
    videoId: "wjZofJX0v4M",
    description: "Visual intro to transformers",
    tier: "free",
  },
  {
    title: "Let's build GPT from scratch",
    channel: "Andrej Karpathy",
    videoId: "kCc8FmEb1nY",
    description: "Code a GPT model step by step",
    tier: "free",
  },
  {
    title: "Intro to Large Language Models",
    channel: "Andrej Karpathy",
    videoId: "zjkBMFhNj_g",
    description: "1 hour deep dive into LLMs",
    tier: "free",
  },
  {
    title: "Neural Networks Explained",
    channel: "3Blue1Brown",
    videoId: "aircAruvnKk",
    description: "The foundation of all AI",
    tier: "free",
  },
]

// GitHub Repos to feature
const githubRepos = [
  {
    name: "langchain-ai/langchain",
    description: "Build context-aware reasoning applications",
    stars: "89.5k",
    language: "Python",
  },
  {
    name: "openai/openai-cookbook",
    description: "Examples and guides for using the OpenAI API",
    stars: "57.8k",
    language: "Jupyter",
  },
  {
    name: "vercel/ai",
    description: "Build AI-powered apps with React, Svelte, Vue",
    stars: "8.9k",
    language: "TypeScript",
  },
]

export function ResourcesHub({ user, profile }: ResourcesHubProps) {
  const tier = profile?.membership_tier || "initial"
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [copiedCode, setCopiedCode] = useState<number | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)
  const [selectedVideoTitle, setSelectedVideoTitle] = useState<string>("")
  const [showPdfViewer, setShowPdfViewer] = useState(false)
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedTierForPayment, setSelectedTierForPayment] = useState<"foundational" | "builder" | "architect" | null>(null)
  const [copiedUPI, setCopiedUPI] = useState(false)

  const UPI_ID = "thekrishnajeena@ybl"

  const handleLockedResourceClick = (resourceTier: string) => {
    if (!user) {
      // User not signed in - redirect to login
      return
    }
    // User signed in but doesn't have access - show payment modal
    setSelectedTierForPayment(resourceTier as "foundational" | "builder" | "architect")
    setShowPaymentModal(true)
  }

  const copyUPIId = async () => {
    await navigator.clipboard.writeText(UPI_ID)
    setCopiedUPI(true)
    setTimeout(() => setCopiedUPI(false), 2000)
  }

  // Payment & Purchase State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [selectedResource, setSelectedResource] = useState<any>(null)
  const [purchasedResources, setPurchasedResources] = useState<Set<string>>(new Set())
  const [loadingPurchases, setLoadingPurchases] = useState(true)
  const [downloadingResource, setDownloadingResource] = useState<string | null>(null)
  
  // Database purchasable resources
  const [dbResources, setDbResources] = useState<any[]>([])
  const [loadingDbResources, setLoadingDbResources] = useState(true)

  // Fetch purchasable resources from database
  useEffect(() => {
    fetchDbResources()
  }, [])

  const fetchDbResources = async () => {
    try {
      const response = await fetch('/api/resources/purchasable')
      const data = await response.json()
      if (Array.isArray(data)) {
        setDbResources(data)
      }
    } catch (error) {
      console.error('Failed to fetch purchasable resources:', error)
    } finally {
      setLoadingDbResources(false)
    }
  }

  // Fetch purchased resources on mount
  useEffect(() => {
    if (user) {
      fetchPurchasedResources()
    } else {
      setLoadingPurchases(false)
    }
  }, [user])

  const fetchPurchasedResources = async () => {
    try {
      const response = await fetch('/api/resources/purchased')
      const data = await response.json()

      if (data.success) {
        const purchasedIds = new Set(data.purchases.map((p: any) => p.resource.id))
        setPurchasedResources(purchasedIds)
      }
    } catch (error) {
      console.error('Failed to fetch purchases:', error)
    } finally {
      setLoadingPurchases(false)
    }
  }

  const handlePurchase = (resource: any) => {
    if (!user) {
      toast.error('Please login to purchase')
      return
    }
    setSelectedResource(resource)
    setPaymentModalOpen(true)
  }

  const handleDownload = async (resourceId: string) => {
    if (!user) {
      toast.error('Please login to download')
      return
    }

    setDownloadingResource(resourceId)
    try {
      const response = await fetch(`/api/resources/${resourceId}/download`)
      const data = await response.json()

      if (data.success) {
        // Open download URL in new tab
        window.open(data.downloadUrl, '_blank')
        toast.success('Download started!')
      } else {
        toast.error(data.error || 'Failed to download')
      }
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download resource')
    } finally {
      setDownloadingResource(null)
    }
  }

  const isPurchased = (resourceId: string) => {
    return purchasedResources.has(resourceId)
  }

  const getWeekVideos = (weekKey: string) => {
    return allResources.filter(r => r.category === weekKey && r.type === "video")
  }

  const canAccess = (resourceTier: string) => {
    if (resourceTier === "free") return true
    if (tier === "architect") return true
    if (tier === "builder" && (resourceTier === "builder" || resourceTier === "foundational")) return true
    if (tier === "foundational" && resourceTier === "foundational") return true
    return false
  }

  const copyCode = async (code: string, index: number) => {
    await navigator.clipboard.writeText(code)
    setCopiedCode(index)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const filteredResources = allResources.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = selectedType === "all" || r.type === selectedType
    return matchesSearch && matchesType
  })

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-[#E8E3F3] bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#2D1A69] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-[#1A0A3D]" style={{ fontFamily: "var(--font-cal-sans)" }}>
              AI Builder Resources
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <Button asChild className="bg-[#2D1A69] text-white hover:bg-[#492B8C] rounded-full">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <Button asChild className="bg-[#FF6B34] text-white hover:bg-[#FF6B34]/90 rounded-full">
                <Link href="/login">Login to Unlock All</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1A0A3D] mb-4" style={{ fontFamily: "var(--font-cal-sans)" }}>
            Your AI Learning Hub
          </h1>
          <p className="text-[#6B5B9E] max-w-2xl mx-auto mb-6">
            Everything you need to master AI development. Curated resources, starter code, and a community of builders.
          </p>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-xl mx-auto">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B5B9E]" />
              <Input
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-full border-[#E8E3F3] focus:border-[#492B8C]"
              />
            </div>
            <div className="flex items-center gap-2">
              {["all", "video", "pdf", "article"].map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedType === type
                    ? "bg-[#2D1A69] text-white"
                    : "bg-[#F4F1FB] text-[#6B5B9E] hover:bg-[#E8E3F3]"
                    }`}
                >
                  {type === "all" ? "All" : type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cohort Sessions Grid */}
        <div className="mb-12">
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
                  onClick={() => {
                    if (isLocked) {
                      if (!user) {
                        // Not signed in - do nothing, let the link handle it
                        return
                      }
                      handleLockedResourceClick(week.tier)
                    } else {
                      setSelectedWeek(week.key)
                    }
                  }}
                  className={`relative group text-left rounded-2xl p-5 bg-gradient-to-br ${week.color} transition-all ${isLocked ? "opacity-70 hover:opacity-90 cursor-pointer" : "hover:shadow-lg hover:scale-[1.02] cursor-pointer"
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
                  {isLocked && !user && (
                    <Link href="/login" className="absolute inset-0 z-10" />
                  )}
                  {!isLocked && videos.length > 0 && (
                    <div className="absolute bottom-3 right-3 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                      <ChevronDown className="w-4 h-4 text-white -rotate-90" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

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
                    <div className="overflow-y-auto flex-1 p-4 custom-scrollbar">
                      {videos.length === 0 ? (
                        <div className="text-center py-12 text-[#6B5B9E]">
                          <Video className="w-10 h-10 mx-auto mb-3 opacity-40" />
                          <p className="font-medium text-[#1A0A3D]">Videos coming soon</p>
                          <p className="text-sm mt-1">Session recordings will appear here after each live class.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {videos.map((video) => {
                            const videoId = video.url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/)?.[1]
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
                                <ChevronDown className="w-4 h-4 text-[#6B5B9E] flex-shrink-0 group-hover:text-[#492B8C] transition-colors -rotate-90" />
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

        {/* One-Click Clone Section */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-[#1A0A3D] mb-4 flex items-center gap-2" style={{ fontFamily: "var(--font-cal-sans)" }}>
            <Code className="w-5 h-5 text-[#492B8C]" />
            Starter Code - Build Something Fast
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {starterSnippets.map((snippet, i) => {
              const isLocked = !canAccess(snippet.tier)
              return (
                <div
                  key={i}
                  className={`relative rounded-xl border overflow-hidden ${isLocked ? "border-[#E8E3F3]" : "border-[#492B8C]"}`}
                >
                  {/* Header */}
                  <div className="p-4 bg-[#1A0A3D] text-white flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm">{snippet.title}</h3>
                      <p className="text-xs text-[#C3AFFF]">{snippet.description}</p>
                    </div>
                    {isLocked ? (
                      <Lock className="w-5 h-5 text-[#6B5B9E]" />
                    ) : (
                      <button
                        onClick={() => copyCode(snippet.code, i)}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                      >
                        {copiedCode === i ? (
                          <Check className="w-4 h-4 text-[#00C8A7]" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                  {/* Code */}
                  <div className={`relative ${isLocked ? "" : ""}`}>
                    {isLocked && (
                      <div 
                        className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center cursor-pointer"
                        onClick={() => {
                          if (!user) return // Let the Link handle navigation
                          handleLockedResourceClick(snippet.tier)
                        }}
                      >
                        <div className="p-3 rounded-full bg-[#F4F1FB] mb-3">
                          <Lock className="w-5 h-5 text-[#6B5B9E]" />
                        </div>
                        <p className="text-sm font-medium text-[#1A0A3D] mb-2">
                          {snippet.tier === "architect" ? "Architect" : "Builder"} Tier Required
                        </p>
                        {!user ? (
                          <Button asChild size="sm" className="bg-[#FF6B34] text-white hover:bg-[#FF6B34]/90 rounded-full">
                            <Link href="/login">Sign In to Access</Link>
                          </Button>
                        ) : (
                          <Button size="sm" className="bg-[#FF6B34] text-white hover:bg-[#FF6B34]/90 rounded-full">
                            <IndianRupee className="w-3 h-3 mr-1" />
                            Unlock Access
                          </Button>
                        )}
                      </div>
                    )}
                    <pre className={`p-4 bg-[#0d0d0d] text-[#00ff00] text-xs overflow-x-auto max-h-48 ${isLocked ? "blur-sm" : ""}`}>
                      <code>{snippet.code}</code>
                    </pre>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* GitHub Repo Cards */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-[#1A0A3D] mb-4 flex items-center gap-2" style={{ fontFamily: "var(--font-cal-sans)" }}>
            <Github className="w-5 h-5 text-[#1A0A3D]" />
            Essential GitHub Repos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {githubRepos.map((repo, i) => (
              <a
                key={i}
                href={`https://github.com/${repo.name}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group p-5 rounded-xl bg-white border border-[#E8E3F3] hover:border-[#1A0A3D] hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Github className="w-5 h-5 text-[#1A0A3D]" />
                  <span className="font-mono text-sm text-[#492B8C] group-hover:text-[#1A0A3D] transition-colors">
                    {repo.name}
                  </span>
                </div>
                <p className="text-sm text-[#6B5B9E] mb-3">{repo.description}</p>
                <div className="flex items-center gap-3 text-xs text-[#6B5B9E]">
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-[#FFD13F] text-[#FFD13F]" />
                    {repo.stars}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#F4F1FB]">{repo.language}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    navigator.clipboard.writeText(`git clone https://github.com/${repo.name}.git`)
                  }}
                  className="mt-3 w-full py-2 rounded-lg bg-[#F4F1FB] text-[#492B8C] text-sm font-medium hover:bg-[#492B8C] hover:text-white transition-colors flex items-center justify-center gap-2"
                >
                  <Copy className="w-3 h-3" />
                  Copy Clone Command
                </button>
              </a>
            ))}
          </div>
        </div>

        {/* Curated Videos */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-[#1A0A3D] mb-4 flex items-center gap-2" style={{ fontFamily: "var(--font-cal-sans)" }}>
            <PlayCircle className="w-5 h-5 text-[#FF6B34]" />
            Learn AI - Curated Videos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {youtubeVideos.map((video, i) => (
              <div
                key={i}
                className="group rounded-xl bg-white border border-[#E8E3F3] hover:border-[#492B8C] hover:shadow-md transition-all overflow-hidden cursor-pointer"
                onClick={() => setSelectedVideo(video.videoId)}
              >
                <div className="relative aspect-video bg-[#1A0A3D]">
                  <Image
                    src={`https://img.youtube.com/vi/${video.videoId}/maxresdefault.jpg`}
                    alt={video.title}
                    fill
                    className="object-cover group-hover:opacity-80 transition-opacity"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-[#FF6B34] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <PlayCircle className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-xs text-[#FF6B34] font-medium mb-1">{video.channel}</p>
                  <h3 className="font-medium text-sm text-[#1A0A3D] line-clamp-2">{video.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* All Resources Grid */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-[#1A0A3D] mb-4 flex items-center gap-2" style={{ fontFamily: "var(--font-cal-sans)" }}>
            <BookOpen className="w-5 h-5 text-[#492B8C]" />
            All Resources
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResources.map((resource, i) => {
              const isLocked = !canAccess(resource.tier)
              const IconComponent = resource.type === "video" ? Video :
                resource.type === "pdf" ? FileText : BookOpen
              return (
                <div
                  key={i}
                  className={`group relative p-5 rounded-xl border transition-all ${isLocked
                    ? "bg-[#F4F1FB]/50 border-[#E8E3F3]"
                    : "bg-white border-[#E8E3F3] hover:border-[#492B8C] hover:shadow-md"
                    } ${resource.url === "#" && !isLocked ? "opacity-75" : ""}`}
                >
                  {/* Locked Overlay */}
                  {isLocked && (
                    <div 
                      className="absolute inset-0 rounded-xl bg-white/60 backdrop-blur-[8px] z-10 flex flex-col items-center justify-center cursor-pointer"
                      onClick={() => {
                        if (!user) return // Let the Link handle navigation
                        handleLockedResourceClick(resource.tier)
                      }}
                    >
                      <div className="p-2 rounded-full bg-[#F4F1FB] mb-2">
                        <Lock className="w-4 h-4 text-[#6B5B9E]" />
                      </div>
                      <p className="text-xs font-medium text-[#1A0A3D] mb-2">
                        {resource.tier === "architect" ? "Architect" : resource.tier === "builder" ? "Builder" : "Foundational"} Exclusive
                      </p>
                      {!user ? (
                        <Button asChild size="sm" className="bg-[#FF6B34] text-white hover:bg-[#FF6B34]/90 rounded-full text-xs">
                          <Link href="/login">Sign In to Access</Link>
                        </Button>
                      ) : (
                        <Button size="sm" className="bg-[#FF6B34] text-white hover:bg-[#FF6B34]/90 rounded-full text-xs">
                          <IndianRupee className="w-3 h-3 mr-1" />
                          Unlock Access
                        </Button>
                      )}
                    </div>
                  )}

                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${isLocked ? "bg-[#F4F1FB]" : "bg-[#F4F1FB] group-hover:bg-[#492B8C]"} transition-colors relative`}>
                      <IconComponent className={`w-5 h-5 ${isLocked ? "text-[#6B5B9E]" : "text-[#492B8C] group-hover:text-white"} transition-colors`} />
                      {resource.url === "#" && !isLocked && (
                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#FF6B34] rounded-full ring-2 ring-white animate-pulse" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${resource.tier === "free" ? "bg-[#00C8A7]/10 text-[#00C8A7]" :
                            resource.tier === "builder" ? "bg-[#492B8C]/10 text-[#492B8C]" :
                              "bg-[#FF6B34]/10 text-[#FF6B34]"
                            }`}>
                            {resource.tier === "free" ? "Free" : resource.tier.charAt(0).toUpperCase() + resource.tier.slice(1)}
                          </span>
                          {resource.featured && (
                            <span className="px-2 py-0.5 rounded-full bg-[#FFD13F]/20 text-[#FF6B34] text-xs font-medium">
                              Featured
                            </span>
                          )}
                        </div>
                        {resource.url === "#" && !isLocked && (
                          <span className="text-[10px] font-bold text-[#FF6B34] uppercase tracking-wider">Coming Soon</span>
                        )}
                      </div>
                      <h3 className={`font-medium mb-1 ${isLocked ? "text-[#6B5B9E]" : "text-[#1A0A3D] group-hover:text-[#492B8C]"} transition-colors`}>
                        {resource.title}
                      </h3>
                      <p className="text-sm text-[#6B5B9E]">{resource.description}</p>
                    </div>
                  </div>

                  {/* Purchase/Download Buttons */}
                  {!isLocked && (resource as any).is_purchasable && (
                    <div className="mt-4 pt-4 border-t border-[#E8E3F3]">
                      {isPurchased(resource.id) ? (
                        <Button
                          onClick={() => handleDownload(resource.id)}
                          disabled={downloadingResource === resource.id}
                          className="w-full bg-[#00C8A7] hover:bg-[#00C8A7]/90 text-white rounded-full"
                          size="sm"
                        >
                          {downloadingResource === resource.id ? (
                            <>
                              <Download className="w-3 h-3 mr-2 animate-bounce" />
                              Downloading...
                            </>
                          ) : (
                            <>
                              <Download className="w-3 h-3 mr-2" />
                              Download
                            </>
                          )}
                        </Button>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-[#6B5B9E]">Price:</span>
                            <div className="text-right">
                              {(resource as any).price_inr && (
                                <span className="text-sm font-semibold text-[#1A0A3D]">
                                  ₹{((resource as any).price_inr / 100).toFixed(0)}
                                </span>
                              )}
                              {(resource as any).price_inr && (resource as any).price_usd && (
                                <span className="text-xs text-[#6B5B9E] mx-1">or</span>
                              )}
                              {(resource as any).price_usd && (
                                <span className="text-sm font-semibold text-[#1A0A3D]">
                                  ${((resource as any).price_usd / 100).toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                          <Button
                            onClick={() => handlePurchase(resource)}
                            className="w-full bg-[#FF6B34] hover:bg-[#FF6B34]/90 text-white rounded-full"
                            size="sm"
                          >
                            <ShoppingCart className="w-3 h-3 mr-2" />
                            Buy Now
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {!isLocked && !(resource as any).is_purchasable && resource.url !== "#" && (
                    <div className="mt-4 pt-4 border-t border-[#E8E3F3]">
                      <Button
                        onClick={() => {
                          if (resource.type === "pdf" && resource.url === "/ai-builder-cohort-guide.pdf") {
                            setShowPdfViewer(true)
                          } else {
                            window.open(resource.url, "_blank")
                          }
                        }}
                        variant="outline"
                        className="w-full rounded-full border-[#492B8C] text-[#492B8C] hover:bg-[#492B8C] hover:text-white"
                        size="sm"
                      >
                        <ExternalLink className="w-3 h-3 mr-2" />
                        View Resource
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Paid Resources Section (from Database) */}
        {dbResources.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-bold text-[#1A0A3D] mb-4 flex items-center gap-2" style={{ fontFamily: "var(--font-cal-sans)" }}>
              <ShoppingCart className="w-5 h-5 text-[#FF6B34]" />
              Premium Resources
              <span className="ml-2 px-2 py-0.5 rounded-full bg-[#FF6B34]/10 text-[#FF6B34] text-xs font-medium">
                Paid
              </span>
            </h2>
            <p className="text-[#6B5B9E] text-sm mb-6">
              Exclusive resources to accelerate your AI journey. Purchase once, access forever.
            </p>
            
            {loadingDbResources ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-[#492B8C] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {dbResources.map((resource) => {
                  const hasPurchased = isPurchased(resource.id)
                  const needsLogin = !user
                  const IconComponent = resource.type === "video" ? Video :
                    resource.type === "pdf" ? FileText : BookOpen
                  
                  return (
                    <div
                      key={resource.id}
                      className="group relative p-5 rounded-xl border border-[#E8E3F3] bg-white hover:border-[#FF6B34] hover:shadow-md transition-all"
                    >
                      {/* Login overlay for non-authenticated users */}
                      {needsLogin && (
                        <div className="absolute inset-0 rounded-xl bg-white/80 backdrop-blur-[4px] z-10 flex flex-col items-center justify-center">
                          <div className="p-2 rounded-full bg-[#F4F1FB] mb-2">
                            <Lock className="w-4 h-4 text-[#6B5B9E]" />
                          </div>
                          <p className="text-xs font-medium text-[#1A0A3D] mb-2">Sign in to purchase</p>
                          <Button asChild size="sm" className="bg-[#FF6B34] text-white hover:bg-[#FF6B34]/90 rounded-full text-xs">
                            <Link href="/login">Sign In</Link>
                          </Button>
                        </div>
                      )}
                      
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-[#FF6B34]/10 group-hover:bg-[#FF6B34] transition-colors">
                          <IconComponent className="w-5 h-5 text-[#FF6B34] group-hover:text-white transition-colors" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded-full bg-[#FF6B34]/10 text-[#FF6B34] text-xs font-medium">
                              Premium
                            </span>
                            {hasPurchased && (
                              <span className="px-2 py-0.5 rounded-full bg-[#00C8A7]/10 text-[#00C8A7] text-xs font-medium">
                                Purchased
                              </span>
                            )}
                          </div>
                          <h3 className="font-medium text-[#1A0A3D] group-hover:text-[#FF6B34] transition-colors mb-1">
                            {resource.title}
                          </h3>
                          <p className="text-sm text-[#6B5B9E] line-clamp-2">{resource.description}</p>
                        </div>
                      </div>
                      
                      {/* Action Section */}
                      <div className="mt-4 pt-4 border-t border-[#E8E3F3]">
                        {hasPurchased ? (
                          <Button
                            onClick={() => handleDownload(resource.id)}
                            disabled={downloadingResource === resource.id}
                            className="w-full bg-[#00C8A7] hover:bg-[#00C8A7]/90 text-white rounded-full"
                            size="sm"
                          >
                            {downloadingResource === resource.id ? (
                              <>
                                <Download className="w-3 h-3 mr-2 animate-bounce" />
                                Downloading...
                              </>
                            ) : (
                              <>
                                <Download className="w-3 h-3 mr-2" />
                                Download
                              </>
                            )}
                          </Button>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-[#6B5B9E]">Price:</span>
                              <div className="text-right">
                                {resource.price_inr && (
                                  <span className="text-sm font-bold text-[#FF6B34]">
                                    ₹{(resource.price_inr / 100).toFixed(0)}
                                  </span>
                                )}
                                {resource.price_inr && resource.price_usd && (
                                  <span className="text-xs text-[#6B5B9E] mx-1">/</span>
                                )}
                                {resource.price_usd && (
                                  <span className="text-sm font-bold text-[#FF6B34]">
                                    ${(resource.price_usd / 100).toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button
                              onClick={() => handlePurchase(resource)}
                              className="w-full bg-[#FF6B34] hover:bg-[#FF6B34]/90 text-white rounded-full"
                              size="sm"
                              disabled={needsLogin}
                            >
                              <ShoppingCart className="w-3 h-3 mr-2" />
                              Buy Now
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        {!user && (
          <div className="text-center p-8 rounded-2xl bg-gradient-to-r from-[#2D1A69] to-[#492B8C] text-white">
            <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: "var(--font-cal-sans)" }}>
              Ready to Master AI Development?
            </h2>
            <p className="text-[#C3AFFF] mb-6 max-w-lg mx-auto">
              Join the cohort to unlock all resources, live sessions, mentor support, and the chance to earn from your AI apps.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button asChild className="bg-[#FF6B34] text-white hover:bg-[#FF6B34]/90 rounded-full px-8">
                <Link href="/login">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-white/30 text-white hover:bg-white/10 rounded-full">
                <a href="https://whatsapp.com/channel/0029VbCJ26365yDAn7xmbq2R" target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Join Community
                </a>
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Video Modal */}
      {selectedVideo && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedVideo(null)}
        >
          <div className="relative w-full max-w-4xl aspect-video" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute -top-12 right-0 p-2 text-white hover:text-[#FF6B34] transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${selectedVideo}?autoplay=1`}
              className="w-full h-full rounded-xl"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {showPdfViewer && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowPdfViewer(false)}
        >
          <div className="relative w-full max-w-4xl h-[80vh] bg-white rounded-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-[#E8E3F3]">
              <h3 className="font-bold text-[#1A0A3D]">AI Builder Cohort Guide</h3>
              <button
                onClick={() => setShowPdfViewer(false)}
                className="p-2 rounded-lg hover:bg-[#F4F1FB] text-[#6B5B9E] hover:text-[#1A0A3D] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <iframe
              src="/ai-builder-cohort-guide.pdf"
              className="w-full h-[calc(100%-60px)]"
            />
          </div>
        </div>
      )}

      {/* UPI Payment Modal */}
      {showPaymentModal && selectedTierForPayment && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => {
            setShowPaymentModal(false)
            setSelectedTierForPayment(null)
          }}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#2D1A69] to-[#492B8C] px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-xs uppercase tracking-wider">Unlock Access</p>
                  <h3 className="text-white font-bold text-xl" style={{ fontFamily: "var(--font-cal-sans)" }}>
                    {tierPricing[selectedTierForPayment].label} Tier
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setShowPaymentModal(false)
                    setSelectedTierForPayment(null)
                  }}
                  className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Price Display */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-1 text-4xl font-bold text-[#1A0A3D]">
                  <IndianRupee className="w-8 h-8" />
                  {tierPricing[selectedTierForPayment].price}
                </div>
                <p className="text-[#6B5B9E] text-sm mt-1">One-time payment</p>
              </div>

              {/* UPI Section */}
              <div className="bg-[#F4F1FB] rounded-xl p-4 mb-6">
                <p className="text-sm font-medium text-[#1A0A3D] mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#492B8C]" />
                  Pay via UPI
                </p>
                
                <div className="flex items-center gap-2 bg-white rounded-lg p-3 border border-[#E8E3F3]">
                  <span className="flex-1 font-mono text-[#1A0A3D] text-sm">{UPI_ID}</span>
                  <button
                    onClick={copyUPIId}
                    className="p-2 rounded-lg bg-[#F4F1FB] hover:bg-[#E8E3F3] transition-colors"
                  >
                    {copiedUPI ? (
                      <Check className="w-4 h-4 text-[#00C8A7]" />
                    ) : (
                      <Copy className="w-4 h-4 text-[#492B8C]" />
                    )}
                  </button>
                </div>

                <p className="text-xs text-[#6B5B9E] mt-3">
                  Pay using any UPI app (GPay, PhonePe, Paytm, etc.)
                </p>
              </div>

              {/* Steps */}
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#FF6B34] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">1</div>
                  <p className="text-sm text-[#1A0A3D]">Copy the UPI ID above and pay using any UPI app</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#FF6B34] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">2</div>
                  <p className="text-sm text-[#1A0A3D]">Take a screenshot of the payment confirmation</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#FF6B34] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">3</div>
                  <p className="text-sm text-[#1A0A3D]">Send the screenshot to our support email</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  asChild
                  className="w-full bg-[#2D1A69] text-white hover:bg-[#492B8C] rounded-full py-6"
                >
                  <a href={`mailto:support@aibuilder.space?subject=Payment Confirmation - ${tierPricing[selectedTierForPayment].label} Tier&body=Hi,%0A%0AI have made the payment of ₹${tierPricing[selectedTierForPayment].price} for the ${tierPricing[selectedTierForPayment].label} tier.%0A%0AMy email: ${user?.email || ""}%0A%0APlease find the payment screenshot attached.%0A%0AThank you!`}>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Send Payment Confirmation
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowPaymentModal(false)
                    setSelectedTierForPayment(null)
                  }}
                  className="w-full text-[#6B5B9E] hover:text-[#1A0A3D] rounded-full"
                >
                  Maybe Later
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {selectedResource && (
        <PaymentModal
          open={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false)
            setSelectedResource(null)
          }}
          resource={selectedResource}
          onSuccess={() => {
            fetchPurchasedResources()
            toast.success('Purchase successful! You can now download the resource.')
          }}
        />
      )}

      {/* Wiggle Animation */}
      <style jsx global>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
        }
      `}</style>
    </div>
  )
}
