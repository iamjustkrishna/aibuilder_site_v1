"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { BlogContent, type BlogBlock, type BlogPostRecord } from "@/components/blog-content"
import { Loader2, Plus, Save, Trash2, ArrowUp, ArrowDown, Eye, EyeOff, RefreshCw } from "lucide-react"

type EditorPost = {
  id?: string
  title: string
  slug: string
  excerpt: string
  cover_image_url: string
  status: "draft" | "published" | "archived"
  content_blocks: BlogBlock[]
}

const emptyBlock = (): BlogBlock => ({ id: crypto.randomUUID(), type: "text", text: "" })

const emptyPost = (): EditorPost => ({
  title: "",
  slug: "",
  excerpt: "",
  cover_image_url: "",
  status: "draft",
  content_blocks: [emptyBlock()],
})

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function AdminBlogManager() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [posts, setPosts] = useState<BlogPostRecord[]>([])
  const [selectedPost, setSelectedPost] = useState<EditorPost>(emptyPost())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null)

  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => {
      const aTime = a.updated_at || a.created_at
      const bTime = b.updated_at || b.created_at
      return bTime.localeCompare(aTime)
    })
  }, [posts])

  async function loadPosts() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/blog")
      const data = await res.json()
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Failed to load blog posts" })
        return
      }
      setPosts(data.posts || [])
      if (!selectedId && (data.posts || []).length > 0) {
        const first = data.posts[0]
        setSelectedId(first.id)
        setSelectedPost({
          id: first.id,
          title: first.title,
          slug: first.slug,
          excerpt: first.excerpt || "",
          cover_image_url: first.cover_image_url || "",
          status: first.status,
          content_blocks: first.content_blocks || [emptyBlock()],
        })
      }
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to load blog posts" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPosts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function startNewPost() {
    setSelectedId(null)
    setSelectedPost(emptyPost())
    setMessage(null)
  }

  function selectPost(post: BlogPostRecord) {
    setSelectedId(post.id)
    setSelectedPost({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || "",
      cover_image_url: post.cover_image_url || "",
      status: post.status,
      content_blocks: post.content_blocks?.length ? post.content_blocks : [emptyBlock()],
    })
    setMessage(null)
  }

  function updateBlock(blockId: string, patch: Partial<BlogBlock>) {
    setSelectedPost((current) => ({
      ...current,
      content_blocks: current.content_blocks.map((block) => (block.id === blockId ? { ...block, ...patch } as BlogBlock : block)),
    }))
  }

  function addBlock(type: BlogBlock["type"]) {
    const block: BlogBlock =
      type === "text"
        ? { id: crypto.randomUUID(), type, text: "" }
        : type === "image"
          ? { id: crypto.randomUUID(), type, url: "", alt: "", caption: "" }
          : type === "video"
            ? { id: crypto.randomUUID(), type, url: "", caption: "" }
            : type === "quote"
              ? { id: crypto.randomUUID(), type, text: "", cite: "" }
              : { id: crypto.randomUUID(), type: "divider" }

    setSelectedPost((current) => ({ ...current, content_blocks: [...current.content_blocks, block] }))
  }

  function removeBlock(blockId: string) {
    setSelectedPost((current) => {
      const nextBlocks = current.content_blocks.filter((block) => block.id !== blockId)
      return { ...current, content_blocks: nextBlocks.length > 0 ? nextBlocks : [emptyBlock()] }
    })
  }

  function moveBlock(blockId: string, direction: "up" | "down") {
    setSelectedPost((current) => {
      const index = current.content_blocks.findIndex((block) => block.id === blockId)
      if (index < 0) return current
      const target = direction === "up" ? index - 1 : index + 1
      if (target < 0 || target >= current.content_blocks.length) return current
      const nextBlocks = [...current.content_blocks]
      const [item] = nextBlocks.splice(index, 1)
      nextBlocks.splice(target, 0, item)
      return { ...current, content_blocks: nextBlocks }
    })
  }

  async function savePost() {
    setSaving(true)
    setMessage(null)
    try {
      const payload = {
        ...selectedPost,
        slug: selectedPost.slug || slugify(selectedPost.title),
        excerpt: selectedPost.excerpt || null,
        cover_image_url: selectedPost.cover_image_url || null,
      }

      const res = await fetch("/api/admin/blog", {
        method: selectedId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Failed to save post" })
        return
      }

      setMessage({ type: "success", text: selectedId ? "Post updated" : "Post created" })
      await loadPosts()
      selectPost(data.post)
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to save post" })
    } finally {
      setSaving(false)
    }
  }

  async function deletePost(postId: string) {
    if (!confirm("Delete this blog post?")) return
    try {
      const res = await fetch(`/api/admin/blog/${postId}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Failed to delete post" })
        return
      }
      setMessage({ type: "success", text: "Post deleted" })
      await loadPosts()
      startNewPost()
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to delete post" })
    }
  }

  return (
    <div className="grid lg:grid-cols-[300px_1fr] gap-6">
      <aside className="rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-white/50">Blog posts</p>
            <h3 className="text-lg font-bold text-white">Admin Blog</h3>
          </div>
          <Button onClick={loadPosts} variant="outline" size="icon" className="border-white/10 bg-white/5 text-white">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        <Button onClick={startNewPost} className="mb-4 w-full rounded-2xl bg-[#FF6B34] text-white hover:bg-[#E84C1E]">
          <Plus className="w-4 h-4 mr-2" />
          New Post
        </Button>

        {loading ? (
          <div className="py-10 text-center text-white/60">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
            Loading posts...
          </div>
        ) : (
          <div className="space-y-2 max-h-[68vh] overflow-y-auto pr-1">
            {sortedPosts.map((post) => (
              <button
                key={post.id}
                onClick={() => selectPost(post)}
                className={`w-full text-left rounded-2xl border p-3 transition-all ${
                  selectedId === post.id ? "border-white bg-white text-[#1A0A3D]" : "border-white/10 bg-white/5 text-white hover:bg-white/10"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{post.title}</p>
                    <p className={`text-xs truncate ${selectedId === post.id ? "text-[#6B5B9E]" : "text-white/50"}`}>/{post.slug}</p>
                  </div>
                  <Badge className="rounded-full bg-[#492B8C] text-white">{post.status}</Badge>
                </div>
              </button>
            ))}
          </div>
        )}
      </aside>

      <section className="rounded-3xl border border-[#E8E3F3] bg-white p-5 md:p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="text-xs uppercase tracking-wider text-[#6B5B9E]">Editor</p>
            <h3 className="text-2xl font-bold text-[#1A0A3D]" style={{ fontFamily: "var(--font-cal-sans)" }}>
              {selectedId ? "Edit blog post" : "Create blog post"}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="rounded-full bg-[#F4F1FB] text-[#492B8C]">{selectedPost.status}</Badge>
            {selectedPost.status === "published" ? <Eye className="w-4 h-4 text-[#00A67E]" /> : <EyeOff className="w-4 h-4 text-[#6B5B9E]" />}
          </div>
        </div>

        {message && (
          <div
            className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${
              message.type === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : message.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-blue-200 bg-blue-50 text-blue-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <input
            value={selectedPost.title}
            onChange={(e) => setSelectedPost((current) => ({ ...current, title: e.target.value, slug: current.slug || slugify(e.target.value) }))}
            placeholder="Post title"
            className="rounded-2xl border border-[#E8E3F3] bg-white px-4 py-3 text-[#1A0A3D] placeholder:text-[#6B5B9E] focus:border-[#492B8C] focus:outline-none"
          />
          <input
            value={selectedPost.slug}
            onChange={(e) => setSelectedPost((current) => ({ ...current, slug: slugify(e.target.value) }))}
            placeholder="slug-for-url"
            className="rounded-2xl border border-[#E8E3F3] bg-white px-4 py-3 text-[#1A0A3D] placeholder:text-[#6B5B9E] focus:border-[#492B8C] focus:outline-none"
          />
          <input
            value={selectedPost.cover_image_url}
            onChange={(e) => setSelectedPost((current) => ({ ...current, cover_image_url: e.target.value }))}
            placeholder="Cover image URL"
            className="rounded-2xl border border-[#E8E3F3] bg-white px-4 py-3 text-[#1A0A3D] placeholder:text-[#6B5B9E] focus:border-[#492B8C] focus:outline-none md:col-span-2"
          />
          <Textarea
            value={selectedPost.excerpt}
            onChange={(e) => setSelectedPost((current) => ({ ...current, excerpt: e.target.value }))}
            placeholder="Excerpt"
            className="min-h-24 rounded-2xl border-[#E8E3F3] bg-white text-[#1A0A3D] placeholder:text-[#6B5B9E] md:col-span-2"
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" className="rounded-full border-[#E8E3F3] text-[#492B8C]" onClick={() => addBlock("text")}>
            <Plus className="w-4 h-4 mr-2" />
            Text
          </Button>
          <Button type="button" variant="outline" className="rounded-full border-[#E8E3F3] text-[#492B8C]" onClick={() => addBlock("image")}>
            <Plus className="w-4 h-4 mr-2" />
            Image
          </Button>
          <Button type="button" variant="outline" className="rounded-full border-[#E8E3F3] text-[#492B8C]" onClick={() => addBlock("video")}>
            <Plus className="w-4 h-4 mr-2" />
            Video
          </Button>
          <Button type="button" variant="outline" className="rounded-full border-[#E8E3F3] text-[#492B8C]" onClick={() => addBlock("quote")}>
            <Plus className="w-4 h-4 mr-2" />
            Quote
          </Button>
          <Button type="button" variant="outline" className="rounded-full border-[#E8E3F3] text-[#492B8C]" onClick={() => addBlock("divider")}>
            <Plus className="w-4 h-4 mr-2" />
            Divider
          </Button>
        </div>

        <div className="mt-5 space-y-4">
          {selectedPost.content_blocks.map((block, index) => (
            <div key={block.id} className="rounded-3xl border border-[#E8E3F3] bg-[#FAF9FE] p-4">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-full border-[#E8E3F3] text-[#492B8C]">
                    {block.type}
                  </Badge>
                  <span className="text-xs text-[#6B5B9E]">Block {index + 1}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => moveBlock(block.id, "up")} className="p-2 rounded-full border border-[#E8E3F3] bg-white text-[#492B8C]">
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button onClick={() => moveBlock(block.id, "down")} className="p-2 rounded-full border border-[#E8E3F3] bg-white text-[#492B8C]">
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button onClick={() => removeBlock(block.id)} className="p-2 rounded-full border border-red-200 bg-white text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {block.type === "text" && (
                <Textarea
                  value={block.text}
                  onChange={(e) => updateBlock(block.id, { text: e.target.value } as Partial<BlogBlock>)}
                  placeholder="Write your story..."
                  className="min-h-32 rounded-2xl border-[#E8E3F3] bg-white text-[#1A0A3D]"
                />
              )}

              {block.type === "image" && (
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    value={block.url}
                    onChange={(e) => updateBlock(block.id, { url: e.target.value } as Partial<BlogBlock>)}
                    placeholder="Image URL"
                    className="rounded-2xl border border-[#E8E3F3] bg-white px-4 py-3 text-[#1A0A3D] focus:border-[#492B8C] focus:outline-none md:col-span-2"
                  />
                  <input
                    value={block.alt || ""}
                    onChange={(e) => updateBlock(block.id, { alt: e.target.value } as Partial<BlogBlock>)}
                    placeholder="Alt text"
                    className="rounded-2xl border border-[#E8E3F3] bg-white px-4 py-3 text-[#1A0A3D] focus:border-[#492B8C] focus:outline-none"
                  />
                  <input
                    value={block.caption || ""}
                    onChange={(e) => updateBlock(block.id, { caption: e.target.value } as Partial<BlogBlock>)}
                    placeholder="Caption"
                    className="rounded-2xl border border-[#E8E3F3] bg-white px-4 py-3 text-[#1A0A3D] focus:border-[#492B8C] focus:outline-none"
                  />
                </div>
              )}

              {block.type === "video" && (
                <div className="grid gap-3">
                  <input
                    value={block.url}
                    onChange={(e) => updateBlock(block.id, { url: e.target.value } as Partial<BlogBlock>)}
                    placeholder="YouTube URL"
                    className="rounded-2xl border border-[#E8E3F3] bg-white px-4 py-3 text-[#1A0A3D] focus:border-[#492B8C] focus:outline-none"
                  />
                  <input
                    value={block.caption || ""}
                    onChange={(e) => updateBlock(block.id, { caption: e.target.value } as Partial<BlogBlock>)}
                    placeholder="Caption"
                    className="rounded-2xl border border-[#E8E3F3] bg-white px-4 py-3 text-[#1A0A3D] focus:border-[#492B8C] focus:outline-none"
                  />
                </div>
              )}

              {block.type === "quote" && (
                <div className="grid gap-3">
                  <Textarea
                    value={block.text}
                    onChange={(e) => updateBlock(block.id, { text: e.target.value } as Partial<BlogBlock>)}
                    placeholder="Quote text"
                    className="min-h-24 rounded-2xl border-[#E8E3F3] bg-white text-[#1A0A3D]"
                  />
                  <input
                    value={block.cite || ""}
                    onChange={(e) => updateBlock(block.id, { cite: e.target.value } as Partial<BlogBlock>)}
                    placeholder="Attribution"
                    className="rounded-2xl border border-[#E8E3F3] bg-white px-4 py-3 text-[#1A0A3D] focus:border-[#492B8C] focus:outline-none"
                  />
                </div>
              )}

              {block.type === "divider" && <div className="text-sm text-[#6B5B9E]">Divider block</div>}
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-3xl border border-[#E8E3F3] bg-white p-4">
          <p className="text-xs uppercase tracking-wider text-[#6B5B9E] mb-3">Preview</p>
          <h4 className="text-xl font-bold text-[#1A0A3D] mb-2">{selectedPost.title || "Untitled post"}</h4>
          <p className="text-sm text-[#6B5B9E] mb-5">{selectedPost.excerpt || "Your excerpt will appear here."}</p>
          <BlogContent blocks={selectedPost.content_blocks} />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <select
              value={selectedPost.status}
              onChange={(e) => setSelectedPost((current) => ({ ...current, status: e.target.value as EditorPost["status"] }))}
              className="rounded-full border border-[#E8E3F3] bg-white px-4 py-2 text-[#1A0A3D]"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
            {selectedId ? (
              <Button type="button" variant="outline" className="rounded-full border-red-200 text-red-600" onClick={() => deletePost(selectedId)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            ) : null}
          </div>

          <Button onClick={savePost} disabled={saving} className="rounded-full bg-[#492B8C] text-white hover:bg-[#2D1A69]">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Post
              </>
            )}
          </Button>
        </div>
      </section>
    </div>
  )
}
