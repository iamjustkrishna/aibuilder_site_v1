"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
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
  Mail
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"

interface Profile {
  id: string
  email: string
  full_name: string
  avatar_url: string
  membership_tier: "initial" | "standard" | "contributor"
  created_at: string
}

interface DashboardContentProps {
  user: User
  profile: Profile | null
}

// Resources available for each tier
const initialResources = [
  {
    title: "Getting Started with AI",
    description: "Introduction to AI tools and concepts",
    type: "video",
    icon: PlayCircle,
    url: "#",
  },
  {
    title: "AI Builder Cohort Overview",
    description: "What you'll learn in the program",
    type: "pdf",
    icon: FileText,
    url: "#",
  },
  {
    title: "Free AI Tools Guide",
    description: "Best free AI tools to get started",
    type: "pdf",
    icon: FileText,
    url: "#",
  },
]

const standardResources = [
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
  {
    title: "Prompt Engineering Templates",
    description: "50+ battle-tested prompts",
    type: "pdf",
    icon: FileText,
    url: "#",
  },
  {
    title: "AI App Architecture Guide",
    description: "Best practices for AI apps",
    type: "pdf",
    icon: FileText,
    url: "#",
  },
]

const contributorResources = [
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

const tierInfo = {
  initial: {
    label: "Explorer",
    color: "bg-[#6B5B9E]",
    textColor: "text-[#6B5B9E]",
    description: "You have access to free introductory resources. Upgrade to unlock the full curriculum!",
  },
  standard: {
    label: "Standard",
    color: "bg-[#00C8A7]",
    textColor: "text-[#00C8A7]",
    description: "You have full access to the curriculum, live classes, and recorded sessions.",
  },
  contributor: {
    label: "Contributor",
    color: "bg-[#FF6B34]",
    textColor: "text-[#FF6B34]",
    description: "You have full curriculum access plus AI Store access to publish and earn 100% of your AI app sales!",
  },
}

export function DashboardContent({ user, profile }: DashboardContentProps) {
  const router = useRouter()
  const tier = profile?.membership_tier || "initial"
  const tierData = tierInfo[tier]

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const getResources = () => {
    if (tier === "contributor") {
      return [...initialResources, ...standardResources, ...contributorResources]
    }
    if (tier === "standard") {
      return [...initialResources, ...standardResources]
    }
    return initialResources
  }

  const resources = getResources()

  return (
    <div className="min-h-screen bg-background">
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
            <div className="flex items-center gap-3">
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.full_name || "User"}
                  width={36}
                  height={36}
                  className="rounded-full"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#F4F1FB] flex items-center justify-center">
                  <span className="text-sm font-medium text-[#492B8C]">
                    {(profile?.full_name || user.email || "U").charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-[#1A0A3D]">{profile?.full_name || "User"}</p>
                <p className="text-xs text-[#6B5B9E]">{user.email}</p>
              </div>
            </div>
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

        {/* Membership Tier Card */}
        <div className="mb-8 p-6 rounded-2xl bg-[#F4F1FB] border border-[#E8E3F3]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1 rounded-full ${tierData.color} text-white text-sm font-medium flex items-center gap-1`}>
                {tier === "contributor" && <Crown className="w-3 h-3" />}
                {tier === "standard" && <Star className="w-3 h-3" />}
                {tierData.label}
              </div>
              <span className="text-sm text-[#6B5B9E]">Current Membership</span>
            </div>
            
            {tier === "initial" && (
              <Button
                asChild
                className="bg-[#FF6B34] text-white hover:bg-[#FF6B34]/90 rounded-full"
              >
                <a 
                  href="https://docs.google.com/forms/d/e/1FAIpQLSelAKQrkxz97RxCo7B8K-xNOAe3-wXhtmnxyW6qx-WNA_82ZA/viewform?usp=header" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Upgrade to Standard or Contributor
                  <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
            )}
            
            {tier === "standard" && (
              <Button
                asChild
                variant="outline"
                className="border-[#FF6B34] text-[#FF6B34] hover:bg-[#FF6B34] hover:text-white rounded-full"
              >
                <a href="mailto:support@aibuilder.space">
                  Contact to Upgrade to Contributor
                  <Mail className="w-4 h-4 ml-2" />
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Resources Grid */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-[#1A0A3D] mb-4" style={{ fontFamily: "var(--font-cal-sans)" }}>
            Your Resources
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((resource, index) => (
            <a
              key={index}
              href={resource.url}
              target={resource.url.startsWith("http") || resource.url.startsWith("mailto") ? "_blank" : undefined}
              rel={resource.url.startsWith("http") ? "noopener noreferrer" : undefined}
              className="group p-5 rounded-xl bg-white border border-[#E8E3F3] hover:border-[#492B8C] hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-[#F4F1FB] group-hover:bg-[#492B8C] transition-colors">
                  <resource.icon className="w-5 h-5 text-[#492B8C] group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-[#1A0A3D] mb-1 group-hover:text-[#492B8C] transition-colors">
                    {resource.title}
                  </h3>
                  <p className="text-sm text-[#6B5B9E]">{resource.description}</p>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Locked Resources Preview */}
        {tier !== "contributor" && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-[#1A0A3D] mb-4" style={{ fontFamily: "var(--font-cal-sans)" }}>
              {tier === "initial" ? "Unlock with Standard or Contributor" : "Unlock with Contributor"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(tier === "initial" ? [...standardResources.slice(0, 3), ...contributorResources.slice(0, 1)] : contributorResources).map((resource, index) => (
                <div
                  key={index}
                  className="relative p-5 rounded-xl bg-[#F4F1FB]/50 border border-[#E8E3F3] opacity-60"
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="p-2 rounded-full bg-white shadow-md">
                      <Lock className="w-4 h-4 text-[#6B5B9E]" />
                    </div>
                  </div>
                  <div className="flex items-start gap-4 blur-[2px]">
                    <div className="p-2 rounded-lg bg-[#F4F1FB]">
                      <resource.icon className="w-5 h-5 text-[#492B8C]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-[#1A0A3D] mb-1">{resource.title}</h3>
                      <p className="text-sm text-[#6B5B9E]">{resource.description}</p>
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
          <Button
            asChild
            className="bg-white text-[#2D1A69] hover:bg-[#F4F1FB] rounded-full"
          >
            <a href="mailto:support@aibuilder.space">
              Contact Support
              <Mail className="w-4 h-4 ml-2" />
            </a>
          </Button>
        </div>
      </main>
    </div>
  )
}
