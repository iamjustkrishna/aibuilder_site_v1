import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { isAdminEmail } from "@/lib/admin"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.email) {
    return NextResponse.json({ isAdmin: false })
  }

  const adminStatus = await isAdminEmail(user.email)
  return NextResponse.json({ isAdmin: adminStatus })
}
