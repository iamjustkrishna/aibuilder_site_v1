import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getAdminEmails, isAdminEmail } from "@/lib/admin"
import { sendGmailMessage } from "@/lib/gmail-smtp"

export const runtime = "nodejs"

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

function replaceTemplate(value: string, recipient: { full_name: string | null; email: string; membership_tier: string }) {
  return value
    .replace(/\{\{name\}\}/gi, recipient.full_name || "there")
    .replace(/\{\{full_name\}\}/gi, recipient.full_name || "there")
    .replace(/\{\{email\}\}/gi, recipient.email)
    .replace(/\{\{tier\}\}/gi, recipient.membership_tier || "initial")
}

async function pause(ms: number) {
  if (ms <= 0) return
  await new Promise((resolve) => setTimeout(resolve, ms))
}

export async function POST(request: Request) {
  const { authorized, error, user } = await checkAdminAccess()
  if (!authorized) {
    return NextResponse.json({ error }, { status: 401 })
  }

  const body = await request.json()
  const senderEmail = typeof body.senderEmail === "string" ? body.senderEmail.trim().toLowerCase() : ""
  const appPassword = typeof body.appPassword === "string" ? body.appPassword.replace(/\s+/g, "").trim() : ""
  const subject = typeof body.subject === "string" ? body.subject.trim() : ""
  const subtitle = typeof body.subtitle === "string" ? body.subtitle.trim() : ""
  const emailBody = typeof body.body === "string" ? body.body.trim() : ""
  const intervalSeconds = Number(body.intervalSeconds || 0)
  const recipientIds = Array.isArray(body.recipientIds) ? body.recipientIds.filter((id) => typeof id === "string" && id.trim()) : []

  if (!senderEmail || !appPassword || !subject || !emailBody || recipientIds.length === 0) {
    return NextResponse.json({ error: "Sender email, app password, subject, body, and recipients are required" }, { status: 400 })
  }

  if (user.email?.toLowerCase() !== senderEmail) {
    return NextResponse.json({ error: "Sender email must match the signed-in admin email" }, { status: 400 })
  }

  if (!Number.isFinite(intervalSeconds) || intervalSeconds < 0) {
    return NextResponse.json({ error: "Invalid interval" }, { status: 400 })
  }

  const serviceClient = createServiceClient()
  const { data: recipients, error: recipientsError } = await serviceClient
    .from("users")
    .select("id, email, full_name, membership_tier")
    .in("id", recipientIds)

  if (recipientsError) {
    return NextResponse.json({ error: recipientsError.message }, { status: 500 })
  }

  const adminEmailSet = new Set(getAdminEmails())
  const recipientList = (recipients || []).filter((recipient) => recipient.email && !adminEmailSet.has(recipient.email.toLowerCase()))
  if (recipientList.length === 0) {
    return NextResponse.json({ error: "No valid non-admin recipients selected" }, { status: 400 })
  }

  const sent: Array<{ email: string; name: string }> = []
  const failed: Array<{ email: string; error: string }> = []

  for (let index = 0; index < recipientList.length; index += 1) {
    const recipient = recipientList[index]
    try {
      await sendGmailMessage({
        senderEmail,
        appPassword,
        recipientEmail: recipient.email,
        subject: replaceTemplate(subject, recipient),
        subtitle: subtitle ? replaceTemplate(subtitle, recipient) : undefined,
        body: replaceTemplate(emailBody, recipient),
      })
      sent.push({ email: recipient.email, name: recipient.full_name || recipient.email })
    } catch (mailError: any) {
      failed.push({ email: recipient.email, error: mailError?.message || "Failed to send" })
    }

    if (index < recipientList.length - 1) {
      await pause(intervalSeconds * 1000)
    }
  }

  return NextResponse.json({
    success: true,
    sentCount: sent.length,
    failedCount: failed.length,
    sent,
    failed,
  })
}

