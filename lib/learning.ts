import { createServiceClient } from "@/lib/supabase/server"

export function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/)
  return match?.[1] || null
}

export async function getCurrentCohortId(serviceClient: ReturnType<typeof createServiceClient>): Promise<string | null> {
  const { data, error } = await serviceClient.from("cohorts").select("id").eq("is_current", true).maybeSingle()
  if (error) {
    throw new Error(error.message)
  }
  return data?.id || null
}

export async function getUserActiveCohortIds(
  serviceClient: ReturnType<typeof createServiceClient>,
  userId: string,
): Promise<string[]> {
  const { data, error } = await serviceClient
    .from("cohort_enrollments")
    .select("cohort_id")
    .eq("user_id", userId)
    .in("enrollment_status", ["active", "completed", "paused"])
  if (error) {
    throw new Error(error.message)
  }
  return (data || []).map((row) => row.cohort_id)
}

