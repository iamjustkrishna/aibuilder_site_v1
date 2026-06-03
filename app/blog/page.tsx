import Link from "next/link"
import Image from "next/image"
import { createServiceClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import type { BlogPostRecord } from "@/components/blog-content"

function formatDate(value: string | null) {
  if (!value) return "Coming soon"
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(value))
}

export default async function BlogPage() {
  const serviceClient = createServiceClient()
  const { data: posts } = await serviceClient
    .from("blog_posts")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .order("updated_at", { ascending: false })

  const blogPosts = (posts || []) as BlogPostRecord[]

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <section className="px-4 pt-28 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mb-10">
            <Badge className="rounded-full bg-[#F4F1FB] text-[#492B8C] mb-4">AI Builder Space Blog</Badge>
            <h1 className="text-4xl sm:text-5xl font-bold text-[#1A0A3D] mb-4" style={{ fontFamily: "var(--font-cal-sans)" }}>
              Stories, lessons, and launch notes from the AI Builder community.
            </h1>
            <p className="text-lg text-[#6B5B9E]">
              Read published posts from the admin blog — tutorials, cohort notes, launch stories, and anything else we want to share.
            </p>
          </div>

          {blogPosts.length === 0 ? (
            <div className="rounded-3xl border border-[#E8E3F3] bg-[#FAF9FE] p-10 text-center">
              <p className="text-[#1A0A3D] font-medium">No published posts yet.</p>
              <p className="text-sm text-[#6B5B9E] mt-2">Check back soon for updates from the AI Builder team.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {blogPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group rounded-3xl border border-[#E8E3F3] bg-white overflow-hidden hover:shadow-lg transition-all"
                >
                  <div className="relative aspect-[16/9] bg-[#F4F1FB]">
                    {post.cover_image_url ? (
                      <Image src={post.cover_image_url} alt={post.title} fill className="object-cover group-hover:scale-[1.02] transition-transform" />
                    ) : null}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <Badge className="rounded-full bg-[#F4F1FB] text-[#492B8C]">{formatDate(post.published_at)}</Badge>
                      <span className="text-xs uppercase tracking-wider text-[#6B5B9E]">{post.status}</span>
                    </div>
                    <h2 className="text-2xl font-bold text-[#1A0A3D] mb-2 group-hover:text-[#492B8C] transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-[#6B5B9E] line-clamp-3">{post.excerpt || "Open the post to read more."}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </main>
  )
}
