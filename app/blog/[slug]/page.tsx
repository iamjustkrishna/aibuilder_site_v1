import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { createServiceClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { BlogContent, type BlogPostRecord } from "@/components/blog-content"
import { ArrowLeft, Calendar } from "lucide-react"

export const dynamic = "force-dynamic"

function formatDate(value: string | null) {
  if (!value) return "Coming soon"
  return new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date(value))
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const { slug } = params
  const serviceClient = createServiceClient()
  const { data: post } = await serviceClient
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle()

  if (!post) {
    notFound()
  }

  const blogPost = post as BlogPostRecord

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <article className="px-4 pt-28 pb-16">
        <div className="max-w-4xl mx-auto">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-[#492B8C] hover:text-[#FF6B34] mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to blog
          </Link>

          <div className="space-y-4 mb-8">
            <p className="flex items-center gap-2 text-sm text-[#6B5B9E]">
              <Calendar className="w-4 h-4" />
              {formatDate(blogPost.published_at)}
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold text-[#1A0A3D]" style={{ fontFamily: "var(--font-cal-sans)" }}>
              {blogPost.title}
            </h1>
            {blogPost.excerpt ? <p className="text-lg text-[#6B5B9E]">{blogPost.excerpt}</p> : null}
          </div>

          {blogPost.cover_image_url ? (
            <div className="relative aspect-[16/9] rounded-3xl overflow-hidden border border-[#E8E3F3] bg-[#F4F1FB] mb-8">
              <Image src={blogPost.cover_image_url} alt={blogPost.title} fill className="object-cover" />
            </div>
          ) : null}

          <div className="prose prose-neutral max-w-none">
            <BlogContent blocks={blogPost.content_blocks || []} />
          </div>
        </div>
      </article>
      <Footer />
    </main>
  )
}
