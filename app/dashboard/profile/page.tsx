import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProfileDashboard, type ProfileCertificate, type ProfileProject, type ProfileViewModel } from "@/components/profile-dashboard"

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const [{ data: userRecord }, { data: profileRecord }, { data: projects }, { data: currentCohort }, { data: certificateRows }] = await Promise.all([
    supabase
      .from("users")
      .select("id, email, full_name, avatar_url, membership_tier, created_at")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("user_profiles")
      .select("user_id, slug, headline, bio, website_url, github_url, linkedin_url, is_public")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("user_projects")
      .select("id, title, description, project_url, repo_url, demo_url, thumbnail_url, technologies, status, featured, created_at")
      .eq("user_id", user.id)
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("cohorts")
      .select("id")
      .eq("is_current", true)
      .maybeSingle(),
    supabase
      .from("certificates")
      .select("id, cohort_id, status, certificate_url, visibility, generated_at, created_at")
      .eq("user_email", user.email || "")
      .order("created_at", { ascending: false }),
  ])

  const profile: ProfileViewModel = {
    id: userRecord?.id || user.id,
    email: userRecord?.email || user.email || "",
    full_name: userRecord?.full_name || user.email?.split("@")[0] || "Builder",
    avatar_url: userRecord?.avatar_url || null,
    membership_tier: userRecord?.membership_tier || "initial",
    created_at: userRecord?.created_at || new Date().toISOString(),
    slug: profileRecord?.slug || null,
    headline: profileRecord?.headline || null,
    bio: profileRecord?.bio || null,
    website_url: profileRecord?.website_url || null,
    github_url: profileRecord?.github_url || null,
    linkedin_url: profileRecord?.linkedin_url || null,
    is_public: profileRecord?.is_public ?? true,
  }

  const projectList: ProfileProject[] = (projects || []).map((project) => ({
    id: project.id,
    title: project.title,
    description: project.description,
    project_url: project.project_url,
    repo_url: project.repo_url,
    demo_url: project.demo_url,
    thumbnail_url: project.thumbnail_url,
    technologies: project.technologies || [],
    status: project.status,
    featured: project.featured,
    created_at: project.created_at,
  }))

  const certificates: ProfileCertificate[] = (certificateRows || []).map((certificate) => ({
    id: certificate.id,
    title: certificate.cohort_id ? "Cohort Certificate" : "AI Builder Certificate",
    status: certificate.status,
    certificate_url: certificate.certificate_url,
    visibility: certificate.visibility,
    generated_at: certificate.generated_at,
  }))

  return <ProfileDashboard profile={profile} projects={projectList} certificates={certificates} currentCohortId={currentCohort?.id || null} />
}
