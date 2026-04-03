"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { AdminDashboard } from "@/components/admin-dashboard"

export default function AdminPage() {
  const [isAdminUser, setIsAdminUser] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push("/login")
        return
      }

      setUserEmail(user.email || null)

      // Check admin status via API (server-side check for security)
      const res = await fetch("/api/admin/check")
      const { isAdmin } = await res.json()

      if (!isAdmin) {
        // Silently redirect to dashboard - don't reveal admin exists
        router.push("/dashboard")
        return
      }

      setIsAdminUser(true)
      setLoading(false)
    }

    checkAdmin()
  }, [router, supabase.auth])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F1FB] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2D1A69]"></div>
      </div>
    )
  }

  if (!isAdminUser) {
    return null
  }

  return <AdminDashboard userEmail={userEmail} />
}
