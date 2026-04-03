"use client"

import { useState, useRef } from "react"
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
  Zap,
  TrendingUp,
  Users,
  Star,
  Github,
  ChevronDown,
  Filter,
  Rocket,
  MessageCircle,
  ArrowRight
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import type { User } from "@supabase/supabase-js"

interface Profile {
  membership_tier: "initial" | "foundational" | "builder" | "architect"
}

interface ResourcesHubProps {
  user: User | null
  profile: Profile | null
}

// AI Model Status - Updated for 2026
const aiModelStatus = [
  { name: "GPT-5", provider: "OpenAI", status: "trending", score: 98 },
  { name: "Claude 4", provider: "Anthropic", status: "stable", score: 96 },
  { name: "Gemini 3 Flash", provider: "Google", status: "rising", score: 94 },
  { name: "Llama 3.3 70B", provider: "Meta", status: "stable", score: 91 },
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

// Community Showcases
const communityShowcases = [
  {
    title: "Persona AI",
    description: "AI-powered personal brand builder",
    author: "Chitranshu",
    type: "Reference Architecture",
    url: "#",
    stars: 124,
    image: "/professional-headshot-1.png",
  },
  {
    title: "CreatorKit",
    description: "Content automation for creators",
    author: "Chitranshu",
    type: "Reference Architecture",
    url: "#",
    stars: 89,
    image: "/professional-headshot-2.png",
  },
]

// Resources with types
const allResources = [
  // Free Resources
  {
    title: "AI Builder Cohort Guide",
    description: "Complete program overview and curriculum",
    type: "pdf",
    tier: "free",
    url: "/ai-builder-cohort-guide.pdf",
    featured: true,
  },
  {
    title: "Prompt Engineering Guide",
    description: "Master the art of writing effective prompts",
    type: "article",
    tier: "free",
    url: "https://www.promptingguide.ai/",
  },
  {
    title: "OpenAI API Documentation",
    description: "Official docs for GPT and other models",
    type: "article",
    tier: "free",
    url: "https://platform.openai.com/docs",
  },
  {
    title: "Gemini API Quickstart",
    description: "Get started with Google's Gemini models",
    type: "article",
    tier: "free",
    url: "https://ai.google.dev/tutorials/python_quickstart",
  },
  // Builder Resources
  {
    title: "Building Agents Guide (OpenAI 2026)",
    description: "A practical guide to building AI agents",
    type: "pdf",
    tier: "builder",
    url: "#",
    featured: true,
  },
  {
    title: "Week 1: Understanding AI Foundations",
    description: "Live session recording + exercises",
    type: "video",
    tier: "builder",
    url: "#",
  },
  {
    title: "Week 2: Building AI Apps",
    description: "Hands-on app development workshop",
    type: "video",
    tier: "builder",
    url: "#",
  },
  {
    title: "Week 3: AI Agents Deep Dive",
    description: "Building autonomous agents that think",
    type: "video",
    tier: "builder",
    url: "#",
  },
  {
    title: "Week 4: Launch & Monetize",
    description: "From code to cash - shipping your AI product",
    type: "video",
    tier: "builder",
    url: "#",
  },
  {
    title: "LangChain Masterclass",
    description: "Complete LangChain tutorial with projects",
    type: "video",
    tier: "builder",
    url: "#",
  },
  // Architect Resources
  {
    title: "AI Store Onboarding",
    description: "How to publish and sell on our marketplace",
    type: "video",
    tier: "architect",
    url: "#",
  },
  {
    title: "Pricing Strategy Playbook",
    description: "Data-driven pricing for AI products",
    type: "pdf",
    tier: "architect",
    url: "#",
  },
  {
    title: "Marketing Your AI App",
    description: "Growth strategies that work in 2026",
    type: "pdf",
    tier: "architect",
    url: "#",
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
  const [showPdfViewer, setShowPdfViewer] = useState(false)
  const [promptInput, setPromptInput] = useState("")
  const [playgroundResponse, setPlaygroundResponse] = useState("")
  const [playgroundLoading, setPlaygroundLoading] = useState(false)
  const playgroundRef = useRef<HTMLDivElement>(null)

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

  const handlePlaygroundSubmit = async () => {
    if (!promptInput.trim()) return
    setPlaygroundLoading(true)
    setPlaygroundResponse("")

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: promptInput,
          sessionId: "playground-" + Date.now(),
        }),
      })

      const data = await response.json()
      setPlaygroundResponse(data.response || "No response received")
    } catch (error) {
      setPlaygroundResponse("Error: Could not connect to AI. Try again!")
    } finally {
      setPlaygroundLoading(false)
    }
  }

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
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedType === type
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

        {/* Live AI Status Dashboard */}
        <div className="mb-12 p-6 rounded-2xl bg-gradient-to-r from-[#2D1A69] to-[#492B8C] text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#00C8A7]" />
              Live AI Model Status - 2026
            </h2>
            <span className="text-xs text-[#C3AFFF] animate-pulse">Updated live</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {aiModelStatus.map((model, i) => (
              <div key={i} className="p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2 h-2 rounded-full ${
                    model.status === "trending" ? "bg-[#FF6B34] animate-pulse" :
                    model.status === "rising" ? "bg-[#00C8A7]" : "bg-[#6B5B9E]"
                  }`} />
                  <span className="text-xs text-[#C3AFFF]">{model.status}</span>
                </div>
                <h3 className="font-bold text-white">{model.name}</h3>
                <p className="text-xs text-[#C3AFFF]">{model.provider}</p>
                <div className="mt-2 h-1 bg-white/20 rounded-full">
                  <div 
                    className="h-full bg-[#00C8A7] rounded-full transition-all"
                    style={{ width: `${model.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive Prompt Playground */}
        <div ref={playgroundRef} className="mb-12 p-6 rounded-2xl bg-[#F4F1FB] border border-[#E8E3F3]">
          <h2 className="text-xl font-bold text-[#1A0A3D] mb-2 flex items-center gap-2" style={{ fontFamily: "var(--font-cal-sans)" }}>
            <Zap className="w-5 h-5 text-[#FF6B34]" />
            Try AI Right Now
          </h2>
          <p className="text-[#6B5B9E] mb-4 text-sm">
            Test a prompt instantly. No signup needed for basic queries!
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Ask anything... e.g., 'Explain transformers in one sentence'"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handlePlaygroundSubmit()}
              className="flex-1 border-[#E8E3F3] focus:border-[#492B8C]"
            />
            <Button
              onClick={handlePlaygroundSubmit}
              disabled={playgroundLoading || !promptInput.trim()}
              className="bg-[#FF6B34] text-white hover:bg-[#FF6B34]/90 rounded-full"
            >
              {playgroundLoading ? "Thinking..." : "Run"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
          {playgroundResponse && (
            <div className="mt-4 p-4 rounded-xl bg-white border border-[#E8E3F3]">
              <p className="text-xs text-[#6B5B9E] mb-2">AI Response:</p>
              <p className="text-[#1A0A3D] whitespace-pre-wrap">{playgroundResponse}</p>
            </div>
          )}
        </div>

        {/* One-Click Clone Section */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-[#1A0A3D] mb-4 flex items-center gap-2" style={{ fontFamily: "var(--font-cal-sans)" }}>
            <Code className="w-5 h-5 text-[#492B8C]" />
            Starter Code - Copy & Run
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {starterSnippets.map((snippet, i) => {
              const isLocked = !canAccess(snippet.tier)
              return (
                <div
                  key={i}
                  className={`relative rounded-xl border overflow-hidden ${
                    isLocked ? "border-[#E8E3F3]" : "border-[#492B8C]"
                  }`}
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
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                        <div className="p-3 rounded-full bg-[#F4F1FB] mb-3 animate-bounce">
                          <Lock className="w-5 h-5 text-[#6B5B9E]" />
                        </div>
                        <p className="text-sm font-medium text-[#1A0A3D] mb-2">Builder Tier Required</p>
                        <Button asChild size="sm" className="bg-[#FF6B34] text-white hover:bg-[#FF6B34]/90 rounded-full">
                          <Link href="/login">Join to Unlock</Link>
                        </Button>
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

        {/* Community Showcases */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-[#1A0A3D] mb-4 flex items-center gap-2" style={{ fontFamily: "var(--font-cal-sans)" }}>
            <Users className="w-5 h-5 text-[#00C8A7]" />
            Member Showcases - Reference Architectures
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {communityShowcases.map((showcase, i) => (
              <div
                key={i}
                className="group p-5 rounded-xl bg-white border border-[#E8E3F3] hover:border-[#492B8C] hover:shadow-lg transition-all"
              >
                <div className="flex items-start gap-4">
                  <Image
                    src={showcase.image}
                    alt={showcase.author}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-full bg-[#FF6B34]/10 text-[#FF6B34] text-xs font-medium">
                        {showcase.type}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-[#6B5B9E]">
                        <Star className="w-3 h-3 fill-[#FFD13F] text-[#FFD13F]" />
                        {showcase.stars}
                      </span>
                    </div>
                    <h3 className="font-bold text-[#1A0A3D] group-hover:text-[#492B8C] transition-colors">
                      {showcase.title}
                    </h3>
                    <p className="text-sm text-[#6B5B9E] mb-2">{showcase.description}</p>
                    <p className="text-xs text-[#6B5B9E]">by {showcase.author}</p>
                  </div>
                </div>
              </div>
            ))}
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
                  className={`group relative p-5 rounded-xl border transition-all ${
                    isLocked 
                      ? "bg-[#F4F1FB]/50 border-[#E8E3F3]" 
                      : "bg-white border-[#E8E3F3] hover:border-[#492B8C] hover:shadow-md cursor-pointer"
                  }`}
                  onClick={() => {
                    if (!isLocked) {
                      if (resource.type === "pdf" && resource.url === "/ai-builder-cohort-guide.pdf") {
                        setShowPdfViewer(true)
                      } else if (resource.url !== "#") {
                        window.open(resource.url, "_blank")
                      }
                    }
                  }}
                >
                  {/* Locked Overlay */}
                  {isLocked && (
                    <div className="absolute inset-0 rounded-xl bg-white/60 backdrop-blur-[8px] z-10 flex flex-col items-center justify-center">
                      <div className="p-2 rounded-full bg-[#F4F1FB] mb-2 animate-[wiggle_1s_ease-in-out_infinite] hover:animate-none">
                        <Lock className="w-4 h-4 text-[#6B5B9E]" />
                      </div>
                      <p className="text-xs font-medium text-[#1A0A3D] mb-2">
                        {resource.tier === "architect" ? "Architect" : "Builder"} Exclusive
                      </p>
                      <Button asChild size="sm" className="bg-[#FF6B34] text-white hover:bg-[#FF6B34]/90 rounded-full text-xs">
                        <Link href="/login">Join Cohort to Unlock</Link>
                      </Button>
                    </div>
                  )}

                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${isLocked ? "bg-[#F4F1FB]" : "bg-[#F4F1FB] group-hover:bg-[#492B8C]"} transition-colors`}>
                      <IconComponent className={`w-5 h-5 ${isLocked ? "text-[#6B5B9E]" : "text-[#492B8C] group-hover:text-white"} transition-colors`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          resource.tier === "free" ? "bg-[#00C8A7]/10 text-[#00C8A7]" :
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
                      <h3 className={`font-medium mb-1 ${isLocked ? "text-[#6B5B9E]" : "text-[#1A0A3D] group-hover:text-[#492B8C]"} transition-colors`}>
                        {resource.title}
                      </h3>
                      <p className="text-sm text-[#6B5B9E]">{resource.description}</p>
                    </div>
                    {!isLocked && <ExternalLink className="w-4 h-4 text-[#6B5B9E] opacity-0 group-hover:opacity-100 transition-opacity" />}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

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
