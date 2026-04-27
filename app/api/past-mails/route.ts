import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { isAdminEmail } from "@/lib/admin"

async function checkAdminAccess() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return { authorized: false, error: "Not authenticated" }
  }

  const isAdmin = await isAdminEmail(user.email)
  if (!isAdmin) {
    return { authorized: false, error: "Not authorized" }
  }

  return { authorized: true, user }
}

export async function GET(request: Request) {
  const { authorized, error } = await checkAdminAccess()
  if (!authorized) {
    return NextResponse.json({ error }, { status: 401 })
  }

  const serviceClient = createServiceClient()
  
  const { data: mailHistory, error: mailError } = await serviceClient
    .from("admin_mail_history")
    .select("*")
    .order("sent_at", { ascending: false })
    .limit(100)

  if (mailError) {
    return NextResponse.json({ error: mailError.message }, { status: 500 })
  }

  // Group by send batch (same admin, subject, and sent_at within 5 seconds)
  const grouped: Record<string, any> = {}
  
  mailHistory?.forEach((mail) => {
    const key = `${mail.sent_by_admin_id}_${mail.title}_${new Date(mail.sent_at).getTime() - (new Date(mail.sent_at).getTime() % 5000)}`
    
    if (!grouped[key]) {
      grouped[key] = {
        id: mail.id,
        sent_by_admin_email: mail.sent_by_admin_email,
        subject: mail.title,
        subtitle: mail.subtitle,
        body: mail.body,
        is_html: mail.is_html,
        sent_at: mail.sent_at,
        recipients: [],
      }
    }
    
    grouped[key].recipients.push({
      email: mail.recipient_email,
      name: mail.recipient_name,
      status: mail.status,
      error: mail.error_message,
    })
  })

  const batchedMails = Object.values(grouped).map((batch) => ({
    ...batch,
    recipient_count: batch.recipients.length,
  }))

  return NextResponse.json(batchedMails)
}