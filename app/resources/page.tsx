import { createClient } from "@/lib/supabase/server"
import { ResourcesHub } from "@/components/resources-hub"

export default async function ResourcesPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single()
    profile = data
  }

  return <ResourcesHub user={user} profile={profile} />
}
