import Image from "next/image"
import { extractYouTubeId } from "@/lib/learning"

export type BlogBlock =
  | { id: string; type: "text"; text: string }
  | { id: string; type: "image"; url: string; alt?: string; caption?: string }
  | { id: string; type: "video"; url: string; caption?: string }
  | { id: string; type: "quote"; text: string; cite?: string }
  | { id: string; type: "divider" }

export interface BlogPostRecord {
  id: string
  slug: string
  title: string
  excerpt: string | null
  cover_image_url: string | null
  status: "draft" | "published" | "archived"
  content_blocks: BlogBlock[]
  published_at: string | null
  created_at: string
  updated_at: string
}

interface BlogContentProps {
  blocks: BlogBlock[]
}

export function BlogContent({ blocks }: BlogContentProps) {
  return (
    <div className="space-y-6">
      {blocks.map((block) => {
        if (block.type === "text") {
          return (
            <div key={block.id} className="text-[#1A0A3D] leading-7 whitespace-pre-line">
              {block.text}
            </div>
          )
        }

        if (block.type === "image") {
          return (
            <figure key={block.id} className="space-y-3">
              <div className="relative overflow-hidden rounded-3xl border border-[#E8E3F3] bg-[#F4F1FB] min-h-[240px]">
                <Image src={block.url} alt={block.alt || "Blog image"} fill className="object-cover" />
              </div>
              {block.caption ? <figcaption className="text-sm text-[#6B5B9E]">{block.caption}</figcaption> : null}
            </figure>
          )
        }

        if (block.type === "video") {
          const videoId = extractYouTubeId(block.url)
          return (
            <figure key={block.id} className="space-y-3">
              {videoId ? (
                <div className="relative overflow-hidden rounded-3xl border border-[#E8E3F3] bg-black aspect-video">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title={block.caption || "Blog video"}
                    className="absolute inset-0 h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              ) : (
                <a
                  href={block.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-3xl border border-[#E8E3F3] bg-[#F4F1FB] p-6 text-[#492B8C] hover:bg-white"
                >
                  Open video
                </a>
              )}
              {block.caption ? <figcaption className="text-sm text-[#6B5B9E]">{block.caption}</figcaption> : null}
            </figure>
          )
        }

        if (block.type === "quote") {
          return (
            <blockquote key={block.id} className="rounded-3xl border-l-4 border-[#492B8C] bg-[#F4F1FB] p-5">
              <p className="text-[#1A0A3D] italic leading-7">{block.text}</p>
              {block.cite ? <footer className="mt-3 text-sm font-medium text-[#6B5B9E]">— {block.cite}</footer> : null}
            </blockquote>
          )
        }

        return <hr key={block.id} className="border-[#E8E3F3]" />
      })}
    </div>
  )
}
