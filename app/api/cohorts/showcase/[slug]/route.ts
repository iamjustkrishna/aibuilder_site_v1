import { createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const slug = (await params).slug

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    // 1. Fetch the showcase by slug
    const { data: showcase, error: showcaseError } = await serviceClient
      .from("cohort_showcases")
      .select(`
        *,
        cohort:cohorts (
          id,
          code,
          name,
          description,
          starts_at,
          ends_at
        )
      `)
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle()

    if (showcaseError) {
      return NextResponse.json({ error: showcaseError.message }, { status: 500 })
    }

    if (!showcase) {
      return NextResponse.json({ error: "Cohort showcase not found" }, { status: 404 })
    }

    // 2. Fetch all published projects for this cohort
    const { data: projects, error: projectsError } = await serviceClient
      .from("user_projects")
      .select("*")
      .eq("cohort_id", showcase.cohort_id)
      .eq("status", "published")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })

    if (projectsError) {
      return NextResponse.json({ error: projectsError.message }, { status: 500 })
    }

    const userIds = (projects || []).map((p) => p.user_id).filter(Boolean) as string[]

    // 3. Fetch user details for users associated with projects to get default avatar/name
    let usersMap = new Map<string, any>()
    if (userIds.length > 0) {
      const { data: users, error: usersError } = await serviceClient
        .from("users")
        .select("id, email, full_name, avatar_url")
        .in("id", userIds)

      if (!usersError && users) {
        users.forEach((u) => usersMap.set(u.id, u))
      }
    }

    // 4. Combine project details with developer profile (preferring manual overrides if present)
    const combinedProjects = (projects || []).map((project) => {
      const dbUser = project.user_id ? usersMap.get(project.user_id) : null

      const developerName = project.developer_name || dbUser?.full_name || "AI Builder"
      const developerEmail = project.developer_email || dbUser?.email || ""
      const developerAvatar = project.developer_avatar_url || dbUser?.avatar_url || null

      return {
        id: project.id,
        title: project.title,
        description: project.description,
        project_url: project.project_url,
        repo_url: project.repo_url,
        demo_url: project.demo_url,
        thumbnail_url: project.thumbnail_url,
        technologies: project.technologies || [],
        featured: project.featured || false,
        developer: {
          name: developerName,
          email: developerEmail,
          avatar_url: developerAvatar
        }
      }
    })

    return NextResponse.json({
      showcase,
      projects: combinedProjects
    })
  } catch (error: any) {
    console.error("GET cohort showcase by slug error:", error)
    return NextResponse.json({ error: error.message || "Failed to load showcase" }, { status: 500 })
  }
}
