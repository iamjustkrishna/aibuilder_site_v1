"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  ExternalLink,
  Github,
  Globe,
  Linkedin,
  Loader2,
  Pencil,
  Sparkles,
  UserCircle2,
  Award,
  Layers3,
  Plus,
  X,
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

type ProjectFormState = {
  title: string
  description: string
  project_url: string
  repo_url: string
  demo_url: string
  technologies: string
  featured: boolean
}

type ProfileDraftState = {
  slug: string
  bio: string
  is_public: boolean
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
  website_url?: string | null
  github_url?: string | null
  linkedin_url?: string | null
  is_public?: boolean | null
}

interface UserCohortInfo {
  id: string
  name: string
  code: string
}

interface ProfileDashboardProps {
  profile: ProfileViewModel
  projects: ProfileProject[]
  certificates: ProfileCertificate[]
  currentCohortId?: string | null
  userCohorts?: UserCohortInfo[]
}

const tabs: { key: TabKey; label: string; icon: typeof UserCircle2 }[] = [
  { key: "overview", label: "Overview", icon: UserCircle2 },
  { key: "projects", label: "Projects", icon: Layers3 },
  { key: "certificates", label: "Certificates", icon: Award },
]

export function ProfileDashboard({ profile, projects, certificates, currentCohortId = null, userCohorts = [] }: ProfileDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview")
  const [currentProfile, setCurrentProfile] = useState(profile)
  const [projectList, setProjectList] = useState(projects)
  const [certificateList, setCertificateList] = useState(certificates)
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [editingField, setEditingField] = useState<"bio" | "slug" | null>(null)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingProject, setIsSavingProject] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [profileDraft, setProfileDraft] = useState<ProfileDraftState>({
    slug: profile.slug || slugify(profile.full_name),
    bio: profile.bio || "",
    is_public: profile.is_public ?? true,
  })
  const [projectDraft, setProjectDraft] = useState<ProjectFormState>({
    title: "",
    description: "",
    project_url: "",
    repo_url: "",
    demo_url: "",
    technologies: "",
    featured: false,
  })

  useEffect(() => {
    setCurrentProfile(profile)
  }, [profile])

  useEffect(() => {
    setProjectList(projects)
  }, [projects])

  useEffect(() => {
    setCertificateList(certificates)
  }, [certificates])

  useEffect(() => {
    if (!statusMessage) return
    const timer = setTimeout(() => setStatusMessage(null), 3000)
    return () => clearTimeout(timer)
  }, [statusMessage])

  const initials = useMemo(() => {
    const source = currentProfile.full_name || currentProfile.email || "U"
    return source
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
  }, [currentProfile.full_name, currentProfile.email])

  function slugify(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
  }

  const normalizeProject = (project: ProjectFormState) => ({
    title: project.title.trim(),
    description: project.description.trim() || null,
    project_url: project.project_url.trim() || null,
    repo_url: project.repo_url.trim() || null,
    demo_url: project.demo_url.trim() || null,
    technologies: project.technologies
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    featured: project.featured,
    status: "draft" as const,
  })

  async function handleSaveProfile() {
    setIsSavingProfile(true)
    setStatusMessage(null)
    const supabase = createClient()

    const { error } = await supabase.from("user_profiles").upsert({
      user_id: currentProfile.id,
      slug: slugify(profileDraft.slug || currentProfile.full_name),
      bio: profileDraft.bio.trim() || null,
      is_public: profileDraft.is_public,
    })

    setIsSavingProfile(false)

    if (error) {
      setStatusMessage(error.message)
      return
    }

    setCurrentProfile((current) => ({
      ...current,
      slug: slugify(profileDraft.slug || current.full_name),
      bio: profileDraft.bio.trim() || null,
      is_public: profileDraft.is_public,
    }))
    setProfileDraft((current) => ({
      ...current,
      slug: slugify(profileDraft.slug || currentProfile.full_name),
    }))
    setStatusMessage("Profile updated")
  }

  async function handleCreateProject() {
    if (!projectDraft.title.trim()) {
      setStatusMessage("Project title is required")
      return
    }

    setIsSavingProject(true)
    setStatusMessage(null)
    const supabase = createClient()

    const { data, error } = await supabase
      .from("user_projects")
      .insert({
        user_id: currentProfile.id,
        cohort_id: currentCohortId,
        ...normalizeProject(projectDraft),
      })
      .select("id, title, description, project_url, repo_url, demo_url, thumbnail_url, technologies, status, featured, created_at")
      .single()

    setIsSavingProject(false)

    if (error) {
      setStatusMessage(error.message)
      return
    }

    if (data) {
      setProjectList((current) => [
        {
          id: data.id,
          title: data.title,
          description: data.description,
          project_url: data.project_url,
          repo_url: data.repo_url,
          demo_url: data.demo_url,
          thumbnail_url: data.thumbnail_url,
          technologies: data.technologies || [],
          status: data.status,
          featured: data.featured,
          created_at: data.created_at,
        },
        ...current,
      ])
    }

    setProjectDraft({
      title: "",
      description: "",
      project_url: "",
      repo_url: "",
      demo_url: "",
      technologies: "",
      featured: false,
    })
    setShowProjectForm(false)
    setStatusMessage("Project added")
  }

  const tierLabel = {
    initial: "Explorer",
    foundational: "Foundational",
    builder: "Builder",
    architect: "Architect",
  }[currentProfile.membership_tier]

  const isEditingBio = editingField === "bio"
  const isEditingSlug = editingField === "slug"

  return (
    <div className="min-h-screen bg-white">
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
          <div className="p-6 sm:p-8 border-b border-[#E8E3F3] bg-white">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-start gap-4">
                {currentProfile.avatar_url ? (
                  <Image
                    src={currentProfile.avatar_url}
                    alt={currentProfile.full_name}
                    width={84}
                    height={84}
                    className="rounded-2xl ring-4 ring-white shadow-sm"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-[#492B8C] text-white flex items-center justify-center text-2xl font-bold shadow-sm">
                    {initials}
                  </div>
                )}

                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#1A0A3D]" style={{ fontFamily: "var(--font-cal-sans)" }}>
                      {currentProfile.full_name}
                    </h1>
                    <Badge className="rounded-full bg-[#492B8C] text-white hover:bg-[#492B8C]">
                      {tierLabel}
                    </Badge>
                    {currentProfile.is_public ? (
                      <Badge variant="outline" className="rounded-full border-[#00C8A7] text-[#00C8A7]">
                        Public profile
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="rounded-full border-[#6B5B9E] text-[#6B5B9E]">
                        Private profile
                      </Badge>
                    )}
                    {userCohorts.map((cohort) => (
                      <Badge key={cohort.id} variant="secondary" className="rounded-full bg-[#FFF8F2] border border-[#FFC9B0] text-[#FF6B34]">
                        {cohort.name || cohort.code} part
                      </Badge>
                    ))}
                  </div>
                  <p className="text-[#6B5B9E] mb-3">{currentProfile.email}</p>
                  <p className="text-[#1A0A3D] max-w-2xl leading-relaxed">
                    {currentProfile.headline || currentProfile.bio || "This is your AI Builder profile space. Add your project work, credentials, and certificates here."}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <div className="p-3 rounded-2xl bg-white border border-[#E8E3F3]">
                  <p className="text-[#6B5B9E] text-xs">Projects</p>
                  <p className="font-semibold text-[#1A0A3D]">{projectList.length}</p>
                </div>
              <div className="p-3 rounded-2xl bg-white border border-[#E8E3F3]">
                  <p className="text-[#6B5B9E] text-xs">Certificates</p>
                  <p className="font-semibold text-[#1A0A3D]">{certificateList.length}</p>
                </div>
              <div className="p-3 rounded-2xl bg-white border border-[#E8E3F3]">
                  <p className="text-[#6B5B9E] text-xs">Member since</p>
                  <p className="font-semibold text-[#1A0A3D]">{new Date(currentProfile.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-6">
              {currentProfile.website_url && (
                <Button asChild variant="outline" size="sm" className="rounded-full border-[#E8E3F3]">
                  <a href={currentProfile.website_url} target="_blank" rel="noopener noreferrer">
                    <Globe className="w-4 h-4 mr-2" />
                    Website
                  </a>
                </Button>
              )}
              {currentProfile.github_url && (
                <Button asChild variant="outline" size="sm" className="rounded-full border-[#E8E3F3]">
                  <a href={currentProfile.github_url} target="_blank" rel="noopener noreferrer">
                    <Github className="w-4 h-4 mr-2" />
                    GitHub
                  </a>
                </Button>
              )}
              {currentProfile.linkedin_url && (
                <Button asChild variant="outline" size="sm" className="rounded-full border-[#E8E3F3]">
                  <a href={currentProfile.linkedin_url} target="_blank" rel="noopener noreferrer">
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
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                      active
                        ? "bg-[#492B8C] text-white border-[#492B8C] shadow-sm"
                        : "bg-white text-[#492B8C] border-[#E8E3F3] hover:bg-[#FFF8F2] hover:border-[#FFC9B0]"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {statusMessage && (
              <div className="mb-4 rounded-2xl border border-[#E8E3F3] bg-white px-4 py-3 text-sm text-[#1A0A3D]">
                {statusMessage}
              </div>
            )}

            {activeTab === "overview" && (
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <div className="p-5 rounded-2xl border border-[#E8E3F3] bg-white">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-[#492B8C]" />
                        <h2 className="font-semibold text-[#1A0A3D]">About</h2>
                      </div>
                      <button
                        onClick={() => setEditingField((current) => (current === "bio" ? null : "bio"))}
                        className="inline-flex items-center gap-1 text-sm font-medium text-[#492B8C] hover:text-[#2D1A69]"
                      >
                        <Pencil className="w-4 h-4" />
                        Edit
                      </button>
                    </div>
                    {isEditingBio ? (
                      <div className="space-y-3">
                        <Textarea
                          value={profileDraft.bio}
                          onChange={(e) => setProfileDraft((current) => ({ ...current, bio: e.target.value }))}
                          placeholder="Tell people about your cohort journey..."
                          className="min-h-28 border-[#E8E3F3] bg-white !bg-white"
                        />
                        <div className="flex items-center gap-3">
                          <Button
                            onClick={handleSaveProfile}
                            disabled={isSavingProfile}
                            className="rounded-full bg-[#492B8C] text-white hover:bg-[#2D1A69]"
                          >
                            {isSavingProfile ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              "Save about"
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setEditingField(null)}
                            className="rounded-full border-[#E8E3F3] text-[#492B8C]"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-[#1A0A3D] leading-relaxed">
                        {currentProfile.bio || "Add a short bio, what you are building, and your AI Builder goals. This section will be public when you share your profile."}
                      </p>
                    )}
                  </div>

                  <div className="p-5 rounded-2xl border border-[#E8E3F3] bg-white">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="w-4 h-4 text-[#492B8C]" />
                      <h2 className="font-semibold text-[#1A0A3D]">Profile details</h2>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4 text-sm">
                      <div className="sm:col-span-2">
                        <div className="flex items-center justify-between gap-3 mb-1">
                          <p className="text-[#6B5B9E] text-xs">Slug</p>
                          <button
                            onClick={() => setEditingField((current) => (current === "slug" ? null : "slug"))}
                            className="inline-flex items-center gap-1 text-xs font-medium text-[#492B8C] hover:text-[#2D1A69]"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit slug
                          </button>
                        </div>
                        {isEditingSlug ? (
                          <div className="space-y-3">
                            <Input
                              value={profileDraft.slug}
                              onChange={(e) => setProfileDraft((current) => ({ ...current, slug: e.target.value }))}
                              placeholder="your-name"
                              className="border-[#E8E3F3] bg-white !bg-white"
                            />
                            <div className="flex items-center gap-3">
                              <Button
                                onClick={handleSaveProfile}
                                disabled={isSavingProfile}
                                className="rounded-full bg-[#492B8C] text-white hover:bg-[#2D1A69]"
                              >
                                {isSavingProfile ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  "Save slug"
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => setEditingField(null)}
                                className="rounded-full border-[#E8E3F3] text-[#492B8C]"
                              >
                                Cancel
                              </Button>
                            </div>
                            <p className="text-xs text-[#6B5B9E]">Auto-generated from your name, but you can change it.</p>
                          </div>
                        ) : (
                          <p className="text-[#1A0A3D] font-medium">{currentProfile.slug || "Not set yet"}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-[#6B5B9E] text-xs mb-1">Visibility</p>
                        <p className="text-[#1A0A3D] font-medium">{currentProfile.is_public ? "Public" : "Private"}</p>
                      </div>
                      <div>
                        <p className="text-[#6B5B9E] text-xs mb-1">Email</p>
                        <p className="text-[#1A0A3D] font-medium">{currentProfile.email}</p>
                      </div>
                      <div>
                        <p className="text-[#6B5B9E] text-xs mb-1">Membership</p>
                        <p className="text-[#1A0A3D] font-medium">{tierLabel}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-5 rounded-2xl border border-[#E8E3F3] bg-white">
                    <h3 className="font-semibold text-[#1A0A3D] mb-2">Quick actions</h3>
                    <p className="text-sm text-[#1A0A3D] mb-4">Show off what you built in the cohort.</p>
                    <Button
                      className="w-full rounded-full bg-[#492B8C] text-white hover:bg-[#2D1A69]"
                      onClick={() => setShowProjectForm(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add project
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "projects" && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button
                    onClick={() => setShowProjectForm(true)}
                    className="rounded-full bg-[#492B8C] text-white hover:bg-[#2D1A69]"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add project
                  </Button>
                </div>
                {projectList.length === 0 ? (
                  <div className="p-8 rounded-2xl border border-dashed border-[#E8E3F3] bg-white text-center">
                    <Layers3 className="w-10 h-10 mx-auto text-[#492B8C] mb-3" />
                    <p className="font-semibold text-[#1A0A3D] mb-1">No projects added yet</p>
                    <p className="text-sm text-[#1A0A3D]">Add your cohort builds, demos, links, and descriptions here.</p>
                  </div>
                ) : (
                  projectList.map((project) => (
                    <div key={project.id} className="p-5 rounded-2xl border border-[#E8E3F3] bg-white">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-[#1A0A3D]">{project.title}</h3>
                            {project.featured && <Badge className="rounded-full bg-[#FF6B34] text-white hover:bg-[#FF6B34]">Featured</Badge>}
                            <Badge variant="outline" className="rounded-full border-[#E8E3F3] text-[#492B8C]">
                              {project.status}
                            </Badge>
                          </div>
                          {project.description && <p className="text-sm text-[#1A0A3D] leading-relaxed">{project.description}</p>}
                          {project.technologies.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {project.technologies.map((tech) => (
                                <span key={tech} className="px-2.5 py-1 rounded-full bg-white border border-[#E8E3F3] text-xs text-[#492B8C]">
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
                {certificateList.length === 0 ? (
                  <div className="p-8 rounded-2xl border border-dashed border-[#E8E3F3] bg-white text-center">
                    <Award className="w-10 h-10 mx-auto text-[#492B8C] mb-3" />
                    <p className="font-semibold text-[#1A0A3D] mb-1">Certificates will show here</p>
                    <p className="text-sm text-[#1A0A3D]">Once certificates are generated and visible, they will appear in this section.</p>
                  </div>
                ) : (
                  certificateList.map((certificate) => (
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

        {showProjectForm && (
          <div className="fixed inset-0 z-50 bg-black/60 px-4 py-6 flex items-center justify-center">
            <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-[#E8E3F3] flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[#1A0A3D]">Add project</h2>
                  <p className="text-sm text-[#6B5B9E]">Save your cohort work and share it on your profile.</p>
                </div>
                <button
                  onClick={() => setShowProjectForm(false)}
                  className="w-9 h-9 rounded-full bg-white border border-[#E8E3F3] flex items-center justify-center text-[#492B8C] hover:text-[#1A0A3D]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 grid gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1A0A3D] mb-2">Project name</label>
                  <Input
                    value={projectDraft.title}
                    onChange={(e) => setProjectDraft((current) => ({ ...current, title: e.target.value }))}
                    placeholder="My AI product"
                    className="bg-white !bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A0A3D] mb-2">Description</label>
                  <Textarea
                    value={projectDraft.description}
                    onChange={(e) => setProjectDraft((current) => ({ ...current, description: e.target.value }))}
                    placeholder="What does it do?"
                    className="min-h-24 bg-white !bg-white"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1A0A3D] mb-2">Project link</label>
                    <Input
                      value={projectDraft.project_url}
                      onChange={(e) => setProjectDraft((current) => ({ ...current, project_url: e.target.value }))}
                      placeholder="https://..."
                      className="bg-white !bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1A0A3D] mb-2">Repository link</label>
                    <Input
                      value={projectDraft.repo_url}
                      onChange={(e) => setProjectDraft((current) => ({ ...current, repo_url: e.target.value }))}
                      placeholder="https://github.com/..."
                      className="bg-white !bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1A0A3D] mb-2">Demo video link</label>
                    <Input
                      value={projectDraft.demo_url}
                      onChange={(e) => setProjectDraft((current) => ({ ...current, demo_url: e.target.value }))}
                      placeholder="https://youtube.com/..."
                      className="bg-white !bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1A0A3D] mb-2">Technologies</label>
                    <Input
                      value={projectDraft.technologies}
                      onChange={(e) => setProjectDraft((current) => ({ ...current, technologies: e.target.value }))}
                      placeholder="Next.js, Supabase, OpenAI"
                      className="bg-white !bg-white"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-3 text-sm text-[#1A0A3D]">
                  <input
                    type="checkbox"
                    checked={projectDraft.featured}
                    onChange={(e) => setProjectDraft((current) => ({ ...current, featured: e.target.checked }))}
                    className="w-4 h-4 rounded border-[#E8E3F3] text-[#492B8C] focus:ring-[#492B8C]"
                  />
                  Feature this project on my profile
                </label>
              </div>

              <div className="p-5 border-t border-[#E8E3F3] flex items-center justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowProjectForm(false)}
                  className="rounded-full border-[#E8E3F3] text-[#492B8C]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateProject}
                  disabled={isSavingProject}
                  className="rounded-full bg-[#492B8C] text-white hover:bg-[#2D1A69]"
                >
                  {isSavingProject ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save project"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
