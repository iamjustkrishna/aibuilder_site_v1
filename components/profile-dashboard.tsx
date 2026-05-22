"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  ExternalLink,
  FileText,
  Github,
  Globe,
  Linkedin,
  Sparkles,
  UserCircle2,
  Award,
  Layers3,
  Plus,
} from "lucide-react"

type TabKey = "overview" | "projects" | "certificates"

export interface ProfileProject {
  id: string
  title: string
  description: string | null
  project_url: string | null
  repo_url: string | null
  demo_url: string | null
  thumbnail_url: string | null
  technologies: string[]
  status: "draft" | "published" | "archived"
  featured: boolean
  created_at: string
}

export interface ProfileCertificate {
  id: string
  title: string
  status: "pending" | "in_queue" | "generating" | "generated" | "failed"
  certificate_url: string | null
  visibility: "visible" | "hidden"
  generated_at: string | null
}

export interface ProfileViewModel {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  membership_tier: "initial" | "foundational" | "builder" | "architect"
  created_at: string
  slug?: string | null
  headline?: string | null
  bio?: string | null
  location?: string | null
  website_url?: string | null
  github_url?: string | null
  linkedin_url?: string | null
  is_public?: boolean | null
}

interface ProfileDashboardProps {
  profile: ProfileViewModel
  projects: ProfileProject[]
  certificates: ProfileCertificate[]
}

const tabs: { key: TabKey; label: string; icon: typeof UserCircle2 }[] = [
  { key: "overview", label: "Overview", icon: UserCircle2 },
  { key: "projects", label: "Projects", icon: Layers3 },
  { key: "certificates", label: "Certificates", icon: Award },
]

export function ProfileDashboard({ profile, projects, certificates }: ProfileDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview")

  const initials = useMemo(() => {
    const source = profile.full_name || profile.email || "U"
    return source
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
  }, [profile.full_name, profile.email])

  const tierLabel = {
    initial: "Explorer",
    foundational: "Foundational",
    builder: "Builder",
    architect: "Architect",
  }[profile.membership_tier]

  return (
    <div className="min-h-screen bg-[#F4F1FB]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#492B8C] hover:text-[#2D1A69] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to dashboard
          </Link>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#E8E3F3] text-xs font-medium text-[#6B5B9E] shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#FF6B34]" />
            Profile
          </div>
        </div>

        <section className="bg-white rounded-3xl border border-[#E8E3F3] shadow-sm overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-[#E8E3F3] bg-gradient-to-br from-white to-[#F4F1FB]">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-start gap-4">
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    width={84}
                    height={84}
                    className="rounded-2xl ring-4 ring-white shadow-sm"
                  />
                ) : (
                  <div className="w-21 h-21 rounded-2xl bg-[#492B8C] text-white flex items-center justify-center text-2xl font-bold shadow-sm">
                    {initials}
                  </div>
                )}

                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#1A0A3D]" style={{ fontFamily: "var(--font-cal-sans)" }}>
                      {profile.full_name}
                    </h1>
                    <Badge className="rounded-full bg-[#492B8C] text-white hover:bg-[#492B8C]">
                      {tierLabel}
                    </Badge>
                    {profile.is_public ? (
                      <Badge variant="outline" className="rounded-full border-[#00C8A7] text-[#00C8A7]">
                        Public profile
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="rounded-full border-[#6B5B9E] text-[#6B5B9E]">
                        Private profile
                      </Badge>
                    )}
                  </div>
                  <p className="text-[#6B5B9E] mb-3">{profile.email}</p>
                  <p className="text-[#1A0A3D] max-w-2xl leading-relaxed">
                    {profile.headline || profile.bio || "This is your AI Builder profile space. Add your project work, credentials, and certificates here."}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div className="p-3 rounded-2xl bg-[#F4F1FB]">
                  <p className="text-[#6B5B9E] text-xs">Projects</p>
                  <p className="font-semibold text-[#1A0A3D]">{projects.length}</p>
                </div>
                <div className="p-3 rounded-2xl bg-[#F4F1FB]">
                  <p className="text-[#6B5B9E] text-xs">Certificates</p>
                  <p className="font-semibold text-[#1A0A3D]">{certificates.length}</p>
                </div>
                <div className="p-3 rounded-2xl bg-[#F4F1FB]">
                  <p className="text-[#6B5B9E] text-xs">Location</p>
                  <p className="font-semibold text-[#1A0A3D]">{profile.location || "—"}</p>
                </div>
                <div className="p-3 rounded-2xl bg-[#F4F1FB]">
                  <p className="text-[#6B5B9E] text-xs">Member since</p>
                  <p className="font-semibold text-[#1A0A3D]">{new Date(profile.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-6">
              {profile.website_url && (
                <Button asChild variant="outline" size="sm" className="rounded-full border-[#E8E3F3]">
                  <a href={profile.website_url} target="_blank" rel="noopener noreferrer">
                    <Globe className="w-4 h-4 mr-2" />
                    Website
                  </a>
                </Button>
              )}
              {profile.github_url && (
                <Button asChild variant="outline" size="sm" className="rounded-full border-[#E8E3F3]">
                  <a href={profile.github_url} target="_blank" rel="noopener noreferrer">
                    <Github className="w-4 h-4 mr-2" />
                    GitHub
                  </a>
                </Button>
              )}
              {profile.linkedin_url && (
                <Button asChild variant="outline" size="sm" className="rounded-full border-[#E8E3F3]">
                  <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">
                    <Linkedin className="w-4 h-4 mr-2" />
                    LinkedIn
                  </a>
                </Button>
              )}
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div className="flex flex-wrap gap-2 mb-6">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const active = activeTab === tab.key
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      active
                        ? "bg-[#492B8C] text-white shadow-sm"
                        : "bg-[#F4F1FB] text-[#6B5B9E] hover:bg-[#E8E3F3] hover:text-[#1A0A3D]"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {activeTab === "overview" && (
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <div className="p-5 rounded-2xl border border-[#E8E3F3] bg-white">
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen className="w-4 h-4 text-[#492B8C]" />
                      <h2 className="font-semibold text-[#1A0A3D]">About</h2>
                    </div>
                    <p className="text-sm text-[#6B5B9E] leading-relaxed">
                      {profile.bio || "Add a short bio, what you are building, and your AI Builder goals. This section will be public when you share your profile."}
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl border border-[#E8E3F3] bg-white">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="w-4 h-4 text-[#492B8C]" />
                      <h2 className="font-semibold text-[#1A0A3D]">Profile details</h2>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-[#6B5B9E] text-xs mb-1">Slug</p>
                        <p className="text-[#1A0A3D] font-medium">{profile.slug || "Not set yet"}</p>
                      </div>
                      <div>
                        <p className="text-[#6B5B9E] text-xs mb-1">Visibility</p>
                        <p className="text-[#1A0A3D] font-medium">{profile.is_public ? "Public" : "Private"}</p>
                      </div>
                      <div>
                        <p className="text-[#6B5B9E] text-xs mb-1">Email</p>
                        <p className="text-[#1A0A3D] font-medium">{profile.email}</p>
                      </div>
                      <div>
                        <p className="text-[#6B5B9E] text-xs mb-1">Membership</p>
                        <p className="text-[#1A0A3D] font-medium">{tierLabel}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-5 rounded-2xl border border-[#E8E3F3] bg-[#F4F1FB]">
                    <h3 className="font-semibold text-[#1A0A3D] mb-2">Quick actions</h3>
                    <p className="text-sm text-[#6B5B9E] mb-4">Show off what you built in the cohort.</p>
                    <Button className="w-full rounded-full bg-[#492B8C] text-white hover:bg-[#2D1A69]">
                      <Plus className="w-4 h-4 mr-2" />
                      Add project
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "projects" && (
              <div className="space-y-4">
                {projects.length === 0 ? (
                  <div className="p-8 rounded-2xl border border-dashed border-[#E8E3F3] bg-[#F4F1FB] text-center">
                    <Layers3 className="w-10 h-10 mx-auto text-[#6B5B9E] mb-3" />
                    <p className="font-semibold text-[#1A0A3D] mb-1">No projects added yet</p>
                    <p className="text-sm text-[#6B5B9E]">Add your cohort builds, demos, links, and descriptions here.</p>
                  </div>
                ) : (
                  projects.map((project) => (
                    <div key={project.id} className="p-5 rounded-2xl border border-[#E8E3F3] bg-white">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-[#1A0A3D]">{project.title}</h3>
                            {project.featured && <Badge className="rounded-full bg-[#FF6B34] text-white hover:bg-[#FF6B34]">Featured</Badge>}
                            <Badge variant="outline" className="rounded-full border-[#E8E3F3] text-[#6B5B9E]">
                              {project.status}
                            </Badge>
                          </div>
                          {project.description && <p className="text-sm text-[#6B5B9E] leading-relaxed">{project.description}</p>}
                          {project.technologies.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {project.technologies.map((tech) => (
                                <span key={tech} className="px-2.5 py-1 rounded-full bg-[#F4F1FB] text-xs text-[#492B8C]">
                                  {tech}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {project.project_url && (
                            <Button asChild variant="outline" size="sm" className="rounded-full">
                              <a href={project.project_url} target="_blank" rel="noopener noreferrer">
                                Open
                                <ExternalLink className="w-4 h-4 ml-2" />
                              </a>
                            </Button>
                          )}
                          {project.demo_url && (
                            <Button asChild variant="outline" size="sm" className="rounded-full">
                              <a href={project.demo_url} target="_blank" rel="noopener noreferrer">
                                Demo
                                <ExternalLink className="w-4 h-4 ml-2" />
                              </a>
                            </Button>
                          )}
                          {project.repo_url && (
                            <Button asChild variant="outline" size="sm" className="rounded-full">
                              <a href={project.repo_url} target="_blank" rel="noopener noreferrer">
                                Repo
                                <ExternalLink className="w-4 h-4 ml-2" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "certificates" && (
              <div className="space-y-4">
                {certificates.length === 0 ? (
                  <div className="p-8 rounded-2xl border border-dashed border-[#E8E3F3] bg-[#F4F1FB] text-center">
                    <Award className="w-10 h-10 mx-auto text-[#6B5B9E] mb-3" />
                    <p className="font-semibold text-[#1A0A3D] mb-1">Certificates will show here</p>
                    <p className="text-sm text-[#6B5B9E]">Once certificates are generated and visible, they will appear in this section.</p>
                  </div>
                ) : (
                  certificates.map((certificate) => (
                    <div key={certificate.id} className="p-5 rounded-2xl border border-[#E8E3F3] bg-white flex items-center justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-[#1A0A3D]">{certificate.title}</h3>
                        <p className="text-sm text-[#6B5B9E]">
                          {certificate.status} · {certificate.visibility}
                        </p>
                      </div>
                      {certificate.certificate_url && (
                        <Button asChild variant="outline" size="sm" className="rounded-full">
                          <a href={certificate.certificate_url} target="_blank" rel="noopener noreferrer">
                            View
                            <ExternalLink className="w-4 h-4 ml-2" />
                          </a>
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
