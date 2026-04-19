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

function sanitizeFileName(fileName: string) {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
}

export async function POST(request: Request) {
  const { authorized, error } = await checkAdminAccess()
  if (!authorized) {
    return NextResponse.json({ error }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get("file")

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File is required" }, { status: 400 })
  }

  if (file.size === 0) {
    return NextResponse.json({ error: "File is empty" }, { status: 400 })
  }

  const safeName = sanitizeFileName(file.name || "document")
  const filePath = `documents/${Date.now()}-${crypto.randomUUID()}-${safeName}`
  const fileBuffer = await file.arrayBuffer()

  const serviceClient = createServiceClient()
  const { error: uploadError } = await serviceClient.storage
    .from("resources")
    .upload(filePath, fileBuffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    filePath,
    fileName: file.name,
  })
}

