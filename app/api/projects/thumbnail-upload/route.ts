import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const BUCKET_NAME = "project-screenshots"
const MAX_FILE_SIZE_BYTES = 6 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])

function sanitizeFileName(fileName: string) {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
}

async function ensurePublicBucket() {
  const serviceClient = createServiceClient()
  const { data: bucket, error: getBucketError } = await serviceClient.storage.getBucket(BUCKET_NAME)

  if (bucket) {
    if (!bucket.public) {
      await serviceClient.storage.updateBucket(BUCKET_NAME, { public: true })
    }
    return serviceClient
  }

  if (getBucketError && getBucketError.message.toLowerCase().includes("not found")) {
    const { error: createBucketError } = await serviceClient.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: MAX_FILE_SIZE_BYTES,
      allowedMimeTypes: Array.from(ALLOWED_IMAGE_TYPES),
    })

    if (createBucketError) {
      throw createBucketError
    }

    return serviceClient
  }

  if (getBucketError) {
    throw getBucketError
  }

  return serviceClient
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get("file")

  if (!file || typeof (file as any).arrayBuffer !== "function") {
    return NextResponse.json({ error: "Image file is required" }, { status: 400 })
  }

  const uploadFile = file as File
  if (uploadFile.size === 0) {
    return NextResponse.json({ error: "Image file is empty" }, { status: 400 })
  }

  if (uploadFile.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: "Image must be 6 MB or smaller" }, { status: 400 })
  }

  if (!ALLOWED_IMAGE_TYPES.has(uploadFile.type)) {
    return NextResponse.json({ error: "Only JPG, PNG, WebP, or GIF images are supported" }, { status: 400 })
  }

  try {
    const serviceClient = await ensurePublicBucket()
    const safeName = sanitizeFileName(uploadFile.name || "project-screenshot")
    const filePath = `${user.id}/${Date.now()}-${crypto.randomUUID()}-${safeName}`
    const fileBuffer = await uploadFile.arrayBuffer()

    const { error: uploadError } = await serviceClient.storage.from(BUCKET_NAME).upload(filePath, fileBuffer, {
      contentType: uploadFile.type || "image/jpeg",
      upsert: false,
    })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data } = serviceClient.storage.from(BUCKET_NAME).getPublicUrl(filePath)

    return NextResponse.json({
      success: true,
      url: data.publicUrl,
      filePath,
      fileName: uploadFile.name,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to upload image" }, { status: 500 })
  }
}
