import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { isAdminEmail } from "@/lib/admin"

// GET - List cohort participants and their showcase projects
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const isAdmin = await isAdminEmail(user.email)
    if (!isAdmin) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const cohortId = searchParams.get("cohort_id")

    if (!cohortId) {
      return NextResponse.json({ error: "Cohort ID is required" }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    // 1. Fetch cohort details
    const { data: cohort, error: cohortError } = await serviceClient
      .from("cohorts")
      .select("id, name, code")
      .eq("id", cohortId)
      .single()

    if (cohortError || !cohort) {
      return NextResponse.json({ error: "Cohort not found" }, { status: 404 })
    }

    // 2. Fetch all cohort enrollments
    const { data: enrollments, error: enrollmentsError } = await serviceClient
      .from("cohort_enrollments")
      .select("user_id, enrollment_status")
      .eq("cohort_id", cohortId)

    if (enrollmentsError) {
      return NextResponse.json({ error: enrollmentsError.message }, { status: 500 })
    }

    const participantUserIds = (enrollments || []).map((e) => e.user_id)

    // 3. Fetch user details for enrolled participants
    let usersMap = new Map<string, any>()
    if (participantUserIds.length > 0) {
      const { data: users, error: usersError } = await serviceClient
        .from("users")
        .select("id, email, full_name, avatar_url, membership_tier")
        .in("id", participantUserIds)

      if (!usersError && users) {
        users.forEach((u) => usersMap.set(u.id, u))
      }
    }

    // 4. Fetch all projects in this cohort
    const { data: projects, error: projectsError } = await serviceClient
      .from("user_projects")
      .select("*")
      .eq("cohort_id", cohortId)

    if (projectsError) {
      return NextResponse.json({ error: projectsError.message }, { status: 500 })
    }

    // Map projects by user_id to easily bind them
    const projectsByUser = new Map<string, any>()
    const manualProjects: any[] = [];

    (projects || []).forEach((proj: any) => {
      if (proj.user_id) {
        projectsByUser.set(proj.user_id, proj)
      } else {
        manualProjects.push(proj)
      }
    })

    // 5. Combine enrollments with user details and project configurations
    const participants = (enrollments || []).map((enrollment) => {
      const u = usersMap.get(enrollment.user_id) || {
        id: enrollment.user_id,
        email: "unknown@user.com",
        full_name: "Deleted User",
        avatar_url: null
      }
      return {
        user_id: enrollment.user_id,
        email: u.email,
        full_name: u.full_name,
        avatar_url: u.avatar_url,
        membership_tier: u.membership_tier,
        enrollment_status: enrollment.enrollment_status,
        project: projectsByUser.get(enrollment.user_id) || null
      }
    })

    return NextResponse.json({
      cohort,
      participants,
      manualProjects // projects not tied to any registered user (purely admin added)
    })
  } catch (error: any) {
    console.error("GET cohort projects error:", error)
    return NextResponse.json({ error: error.message || "Failed to load cohort projects" }, { status: 500 })
  }
}

// POST - Create, update, or delete a cohort project
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const isAdmin = await isAdminEmail(user.email)
    if (!isAdmin) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const body = await request.json()
    const {
      action, // "save" or "delete"
      id,
      cohort_id,
      user_id,
      title,
      description,
      project_url,
      repo_url,
      demo_url,
      thumbnail_url,
      technologies = [],
      status = "published",
      featured = false,
      developer_name,
      developer_email,
      developer_avatar_url
    } = body

    if (action === "delete") {
      if (!id) {
        return NextResponse.json({ error: "Project ID is required for delete action" }, { status: 400 })
      }

      const serviceClient = createServiceClient()
      const { error: deleteError } = await serviceClient
        .from("user_projects")
        .delete()
        .eq("id", id)

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    // Default: Save/Upsert
    if (!cohort_id || !title) {
      return NextResponse.json({ error: "Cohort ID and Project Title are required" }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    const projectPayload = {
      cohort_id,
      user_id: user_id || null, // Allow purely manual projects
      title: title.trim(),
      description: description ? description.trim() : null,
      project_url: project_url ? project_url.trim() : null,
      repo_url: repo_url ? repo_url.trim() : null,
      demo_url: demo_url ? demo_url.trim() : null,
      thumbnail_url: thumbnail_url ? thumbnail_url.trim() : null,
      technologies: Array.isArray(technologies) ? technologies : [],
      status: status || "published",
      featured: !!featured,
      developer_name: developer_name ? developer_name.trim() : null,
      developer_email: developer_email ? developer_email.trim() : null,
      developer_avatar_url: developer_avatar_url ? developer_avatar_url.trim() : null,
      updated_at: new Date().toISOString()
    }

    let result
    if (id) {
      // Update existing
      result = await serviceClient
        .from("user_projects")
        .update(projectPayload)
        .eq("id", id)
        .select()
        .single()
    } else {
      // Insert new
      result = await serviceClient
        .from("user_projects")
        .insert({
          ...projectPayload,
          created_at: new Date().toISOString()
        })
        .select()
        .single()
    }

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    return NextResponse.json(result.data)
  } catch (error: any) {
    console.error("POST cohort projects error:", error)
    return NextResponse.json({ error: error.message || "Failed to save project" }, { status: 500 })
  }
}
