"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  Video, 
  FileText, 
  BookOpen, 
  Code, 
  MoreHorizontal,
  LogOut,
  Users,
  Package,
  Eye,
  EyeOff,
  ArrowLeft,
  Search,
  ChevronDown,
  Calendar,
  Play,
  Link as LinkIcon,
} from "lucide-react"
import Link from "next/link"

interface Resource {
  id: string
  title: string
  description: string
  type: "video" | "pdf" | "article" | "code" | "other"
  url: string
  thumbnail_url: string | null
  tier_required: "initial" | "foundational" | "builder" | "architect"
  category: string
  sort_order: number
  is_active: boolean
  created_at: string
}

interface User {
  id: string
  email: string
  full_name: string
  membership_tier: string
  created_at: string
}

const typeIcons = {
  video: Video,
  pdf: FileText,
  article: BookOpen,
  code: Code,
  other: MoreHorizontal,
}

const tierConfig = {
  initial: { label: "Explorer", color: "bg-[#6B5B9E]", text: "text-[#6B5B9E]" },
  foundational: { label: "Foundational", color: "bg-[#00C8A7]", text: "text-[#00C8A7]" },
  builder: { label: "Builder", color: "bg-[#FFD13F]", text: "text-[#FFD13F]" },
  architect: { label: "Architect", color: "bg-[#FF6B34]", text: "text-[#FF6B34]" },
}

const weekConfig = [
  { key: "week-1", label: "Week 1", topic: "Understanding AI", color: "from-[#492B8C] to-[#2D1A69]", tier: "foundational" },
  { key: "week-2", label: "Week 2", topic: "Building AI Apps", color: "from-[#00C8A7] to-[#009E87]", tier: "foundational" },
  { key: "week-3", label: "Week 3", topic: "AI Agents", color: "from-[#FFD13F] to-[#FF9F00]", tier: "builder" },
  { key: "week-4", label: "Week 4", topic: "Launch & Monetize", color: "from-[#FF6B34] to-[#E84C1E]", tier: "architect" },
]

export function AdminDashboard({ userEmail }: { userEmail: string | null }) {
  const [activeTab, setActiveTab] = useState<"weeks" | "resources" | "users">("weeks")
  const [resources, setResources] = useState<Resource[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [adminEmails, setAdminEmails] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addingToWeek, setAddingToWeek] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [weekVideoForm, setWeekVideoForm] = useState({ title: "", description: "", url: "", tier_required: "foundational" as Resource["tier_required"] })
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "video" as Resource["type"],
    url: "",
    thumbnail_url: "",
    tier_required: "initial" as Resource["tier_required"],
    category: "general",
    sort_order: 0,
    is_active: true,
  })
  const supabase = createClient()

  useEffect(() => {
    fetchAdminEmails()
  }, [])

  useEffect(() => {
    fetchData()
  }, [activeTab])

  async function fetchAdminEmails() {
    try {
      const res = await fetch("/api/admin/emails")
      if (res.ok) {
        const data = await res.json()
        setAdminEmails(data.emails || [])
      }
    } catch (error) {
      console.error("Failed to fetch admin emails")
    }
  }

  function isUserAdmin(email: string): boolean {
    return adminEmails.map(e => e.toLowerCase()).includes(email?.toLowerCase())
  }

  async function fetchData() {
    setLoading(true)
    if (activeTab === "resources" || activeTab === "weeks") {
      const res = await fetch("/api/admin/resources")
      if (res.ok) {
        const data = await res.json()
        setResources(data)
      }
    } else {
      const res = await fetch("/api/admin/users")
      if (res.ok) {
        const data = await res.json()
        setUsers(data || [])
      }
    }
    setLoading(false)
  }

  async function handleAddWeekVideo(weekKey: string) {
    const week = weekConfig.find(w => w.key === weekKey)!
    const res = await fetch("/api/admin/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: weekVideoForm.title,
        description: weekVideoForm.description,
        type: "video",
        url: weekVideoForm.url,
        tier_required: weekVideoForm.tier_required,
        category: weekKey,
        sort_order: 0,
        is_active: true,
      }),
    })
    if (res.ok) {
      setAddingToWeek(null)
      setWeekVideoForm({ title: "", description: "", url: "", tier_required: week.tier as Resource["tier_required"] })
      fetchData()
    }
  }

  function extractYouTubeId(url: string): string | null {
    const match = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/)
    return match?.[1] || null
  }

  async function handleAddResource() {
    const res = await fetch("/api/admin/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })
    if (res.ok) {
      setShowAddForm(false)
      resetForm()
      fetchData()
    }
  }

  async function handleUpdateResource(id: string) {
    const res = await fetch("/api/admin/resources", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...formData }),
    })
    if (res.ok) {
      setEditingId(null)
      resetForm()
      fetchData()
    }
  }

  async function handleDeleteResource(id: string) {
    if (!confirm("Delete this resource?")) return
    const res = await fetch(`/api/admin/resources?id=${id}`, { method: "DELETE" })
    if (res.ok) fetchData()
  }

  async function handleToggleActive(id: string, currentActive: boolean) {
    const res = await fetch("/api/admin/resources", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_active: !currentActive }),
    })
    if (res.ok) fetchData()
  }

  async function handleUpdateUserTier(userId: string, newTier: string) {
    const res = await fetch("/api/admin/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId, membership_tier: newTier }),
    })
    if (res.ok) fetchData()
  }

  function resetForm() {
    setFormData({
      title: "",
      description: "",
      type: "video",
      url: "",
      thumbnail_url: "",
      tier_required: "initial",
      category: "general",
      sort_order: 0,
      is_active: true,
    })
  }

  function startEdit(resource: Resource) {
    setEditingId(resource.id)
    setFormData({
      title: resource.title,
      description: resource.description || "",
      type: resource.type,
      url: resource.url,
      thumbnail_url: resource.thumbnail_url || "",
      tier_required: resource.tier_required,
      category: resource.category || "general",
      sort_order: resource.sort_order || 0,
      is_active: resource.is_active,
    })
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  const filteredResources = resources.filter(r => 
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A0A3D] via-[#2D1A69] to-[#492B8C]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#1A0A3D]/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <Link 
                href="/dashboard" 
                className="p-2 hover:bg-white/10 rounded-xl transition-colors flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </Link>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-white truncate">Admin Panel</h1>
                <p className="text-xs sm:text-sm text-[#C3AFFF] truncate">{userEmail}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              onClick={handleSignOut} 
              className="text-white hover:bg-white/10 flex-shrink-0"
              size="sm"
            >
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Tabs & Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex gap-1 p-1 bg-white/10 rounded-xl backdrop-blur-sm overflow-x-auto">
            <button
              onClick={() => { setActiveTab("weeks"); setSearchQuery(""); }}
              className={`flex-shrink-0 px-3 sm:px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
                activeTab === "weeks"
                  ? "bg-white text-[#1A0A3D] shadow-lg"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Cohort Weeks</span>
            </button>
            <button
              onClick={() => { setActiveTab("resources"); setSearchQuery(""); }}
              className={`flex-shrink-0 px-3 sm:px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
                activeTab === "resources"
                  ? "bg-white text-[#1A0A3D] shadow-lg"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              <Package className="w-4 h-4" />
              <span className="text-sm">Resources</span>
              <span className="px-1.5 py-0.5 rounded-full text-xs bg-[#FF6B34] text-white">{resources.length}</span>
            </button>
            <button
              onClick={() => { setActiveTab("users"); setSearchQuery(""); }}
              className={`flex-shrink-0 px-3 sm:px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
                activeTab === "users"
                  ? "bg-white text-[#1A0A3D] shadow-lg"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="text-sm">Users</span>
              <span className="px-1.5 py-0.5 rounded-full text-xs bg-[#00C8A7] text-white">{users.length}</span>
            </button>
          </div>
          
          {activeTab !== "weeks" && (
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all"
            />
          </div>
          )}
        </div>

        {/* Cohort Weeks Tab */}
        {activeTab === "weeks" && (
          <div className="space-y-4">
            {weekConfig.map((week) => {
              const weekVideos = resources.filter(r => r.category === week.key && r.type === "video")
              const isAddingThis = addingToWeek === week.key
              return (
                <div key={week.key} className="bg-white/10 backdrop-blur rounded-2xl overflow-hidden">
                  {/* Week header */}
                  <div className={`bg-gradient-to-r ${week.color} px-5 py-4 flex items-center justify-between`}>
                    <div>
                      <p className="text-white/70 text-xs uppercase tracking-wider font-medium">{week.label}</p>
                      <h3 className="text-white font-bold text-lg">{week.topic}</h3>
                      <p className="text-white/60 text-xs mt-0.5">{weekVideos.length} video{weekVideos.length !== 1 ? "s" : ""} &middot; Requires {week.tier}</p>
                    </div>
                    <button
                      onClick={() => {
                        setAddingToWeek(isAddingThis ? null : week.key)
                        setWeekVideoForm({ title: "", description: "", url: "", tier_required: week.tier as Resource["tier_required"] })
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-colors"
                    >
                      {isAddingThis ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      {isAddingThis ? "Cancel" : "Add Video"}
                    </button>
                  </div>

                  {/* Add video form */}
                  {isAddingThis && (
                    <div className="px-5 py-4 bg-white/5 border-b border-white/10 space-y-3">
                      <p className="text-white/70 text-sm font-medium">Add YouTube video to {week.label}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          placeholder="Video title"
                          value={weekVideoForm.title}
                          onChange={e => setWeekVideoForm(p => ({ ...p, title: e.target.value }))}
                          className="px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/40 text-sm"
                        />
                        <input
                          placeholder="YouTube URL (e.g. https://youtu.be/abc123)"
                          value={weekVideoForm.url}
                          onChange={e => setWeekVideoForm(p => ({ ...p, url: e.target.value }))}
                          className="px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/40 text-sm"
                        />
                        <input
                          placeholder="Description (optional)"
                          value={weekVideoForm.description}
                          onChange={e => setWeekVideoForm(p => ({ ...p, description: e.target.value }))}
                          className="px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/40 text-sm sm:col-span-2"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <select
                            value={weekVideoForm.tier_required}
                            onChange={e => setWeekVideoForm(p => ({ ...p, tier_required: e.target.value as Resource["tier_required"] }))}
                            className="appearance-none pl-3 pr-8 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:border-white/40"
                          >
                            <option value="initial" className="text-[#1A0A3D]">Explorer</option>
                            <option value="foundational" className="text-[#1A0A3D]">Foundational</option>
                            <option value="builder" className="text-[#1A0A3D]">Builder</option>
                            <option value="architect" className="text-[#1A0A3D]">Architect</option>
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/60 pointer-events-none" />
                        </div>
                        <button
                          onClick={() => handleAddWeekVideo(week.key)}
                          disabled={!weekVideoForm.title || !weekVideoForm.url}
                          className="px-5 py-2 rounded-xl bg-[#FF6B34] text-white font-medium text-sm hover:bg-[#E84C1E] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Add Video
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Videos list */}
                  <div className="p-4 space-y-2">
                    {weekVideos.length === 0 ? (
                      <p className="text-white/40 text-sm text-center py-4">No videos yet. Click "Add Video" to get started.</p>
                    ) : (
                      weekVideos.map((video) => {
                        const videoId = extractYouTubeId(video.url)
                        return (
                          <div key={video.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
                            <div className="relative flex-shrink-0 w-20 aspect-video rounded-lg overflow-hidden bg-black/30">
                              {videoId && (
                                <img
                                  src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                                  alt={video.title}
                                  className="w-full h-full object-cover opacity-80"
                                />
                              )}
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Play className="w-4 h-4 text-white drop-shadow" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium text-sm truncate">{video.title}</p>
                              {video.description && <p className="text-white/50 text-xs truncate mt-0.5">{video.description}</p>}
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`px-1.5 py-0.5 rounded text-xs text-white ${tierConfig[video.tier_required as keyof typeof tierConfig]?.color || "bg-gray-500"}`}>
                                  {tierConfig[video.tier_required as keyof typeof tierConfig]?.label}
                                </span>
                                <a href={video.url} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white/70 transition-colors">
                                  <LinkIcon className="w-3 h-3" />
                                </a>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleToggleActive(video.id, video.is_active)}
                                className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                                title={video.is_active ? "Hide" : "Show"}
                              >
                                {video.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => handleDeleteResource(video.id)}
                                className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/60 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Resources Tab */}
        {activeTab === "resources" && (
          <div className="space-y-4">
            {/* Add Resource Button */}
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-[#FF6B34] hover:bg-[#FF6B34]/90 text-white shadow-lg shadow-[#FF6B34]/25"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Resource
            </Button>

            {/* Add Form */}
            {showAddForm && (
              <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-xl">
                <h3 className="font-bold text-[#1A0A3D] mb-4 text-lg">Add New Resource</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1A0A3D] mb-1.5">Title *</label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Resource title"
                      className="border-[#E8E3F3] focus:border-[#492B8C] focus:ring-[#492B8C]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1A0A3D] mb-1.5">Type *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as Resource["type"] })}
                      className="w-full px-3 py-2 bg-white border border-[#E8E3F3] rounded-lg text-[#1A0A3D] focus:outline-none focus:border-[#492B8C] focus:ring-1 focus:ring-[#492B8C]"
                    >
                      <option value="video">Video</option>
                      <option value="pdf">PDF</option>
                      <option value="article">Article</option>
                      <option value="code">Code</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-[#1A0A3D] mb-1.5">Description</label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description"
                      className="border-[#E8E3F3] focus:border-[#492B8C] focus:ring-[#492B8C]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-[#1A0A3D] mb-1.5">URL *</label>
                    <Input
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      placeholder="https://youtube.com/watch?v=... or PDF link"
                      className="border-[#E8E3F3] focus:border-[#492B8C] focus:ring-[#492B8C]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1A0A3D] mb-1.5">Tier Required *</label>
                    <select
                      value={formData.tier_required}
                      onChange={(e) => setFormData({ ...formData, tier_required: e.target.value as Resource["tier_required"] })}
                      className="w-full px-3 py-2 bg-white border border-[#E8E3F3] rounded-lg text-[#1A0A3D] focus:outline-none focus:border-[#492B8C] focus:ring-1 focus:ring-[#492B8C]"
                    >
                      <option value="initial">Explorer (Free)</option>
                      <option value="foundational">Foundational</option>
                      <option value="builder">Builder</option>
                      <option value="architect">Architect</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1A0A3D] mb-1.5">Category</label>
                    <Input
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g., Week 1, Tools"
                      className="border-[#E8E3F3] focus:border-[#492B8C] focus:ring-[#492B8C]"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 mt-6">
                  <Button onClick={handleAddResource} className="bg-[#00C8A7] hover:bg-[#00C8A7]/90 text-white">
                    <Save className="w-4 h-4 mr-2" />
                    Save Resource
                  </Button>
                  <Button variant="outline" onClick={() => { setShowAddForm(false); resetForm(); }} className="border-[#E8E3F3] text-[#6B5B9E]">
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Resources List */}
            {loading ? (
              <div className="text-center py-12 text-white/60">Loading resources...</div>
            ) : filteredResources.length === 0 ? (
              <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                <Package className="w-12 h-12 mx-auto text-white/30 mb-3" />
                <p className="text-white/60">{searchQuery ? "No matching resources" : "No resources yet"}</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredResources.map((resource) => {
                  const Icon = typeIcons[resource.type] || MoreHorizontal
                  const tierData = tierConfig[resource.tier_required]
                  const isEditing = editingId === resource.id

                  if (isEditing) {
                    return (
                      <div key={resource.id} className="bg-white rounded-2xl p-4 sm:p-5 shadow-xl">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Input
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Title"
                            className="border-[#E8E3F3]"
                          />
                          <Input
                            value={formData.url}
                            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                            placeholder="URL"
                            className="border-[#E8E3F3]"
                          />
                          <Input
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Description"
                            className="border-[#E8E3F3]"
                          />
                          <select
                            value={formData.tier_required}
                            onChange={(e) => setFormData({ ...formData, tier_required: e.target.value as Resource["tier_required"] })}
                            className="px-3 py-2 bg-white border border-[#E8E3F3] rounded-lg text-[#1A0A3D] focus:outline-none focus:border-[#492B8C]"
                          >
                            <option value="initial">Explorer</option>
                            <option value="foundational">Foundational</option>
                            <option value="builder">Builder</option>
                            <option value="architect">Architect</option>
                          </select>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button size="sm" onClick={() => handleUpdateResource(resource.id)} className="bg-[#00C8A7] hover:bg-[#00C8A7]/90">
                            <Save className="w-4 h-4 mr-1" /> Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { setEditingId(null); resetForm(); }} className="border-[#E8E3F3]">
                            <X className="w-4 h-4 mr-1" /> Cancel
                          </Button>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div 
                      key={resource.id} 
                      className={`bg-white/95 backdrop-blur rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 transition-all ${!resource.is_active ? "opacity-50" : ""}`}
                    >
                      <div className={`p-2.5 rounded-xl ${tierData.color}/10 flex-shrink-0 self-start`}>
                        <Icon className={`w-5 h-5 ${tierData.text}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4 className="font-medium text-[#1A0A3D] truncate">{resource.title}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-xs text-white ${tierData.color}`}>
                            {tierData.label}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-xs bg-[#F4F1FB] text-[#6B5B9E] capitalize">
                            {resource.type}
                          </span>
                        </div>
                        <p className="text-sm text-[#6B5B9E] truncate">{resource.description}</p>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => handleToggleActive(resource.id, resource.is_active)}
                          className={`p-2 rounded-lg transition-colors ${resource.is_active ? "text-[#00C8A7] hover:bg-[#00C8A7]/10" : "text-[#6B5B9E] hover:bg-[#F4F1FB]"}`}
                          title={resource.is_active ? "Hide" : "Show"}
                        >
                          {resource.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => startEdit(resource)}
                          className="p-2 hover:bg-[#F4F1FB] rounded-lg text-[#492B8C] transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteResource(resource.id)}
                          className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div>
            {loading ? (
              <div className="text-center py-12 text-white/60">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                <Users className="w-12 h-12 mx-auto text-white/30 mb-3" />
                <p className="text-white/60">{searchQuery ? "No matching users" : "No users yet"}</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredUsers.map((user) => {
                  const tierData = tierConfig[user.membership_tier as keyof typeof tierConfig] || tierConfig.initial
                  const userIsAdmin = isUserAdmin(user.email)
                  return (
                    <div key={user.id} className="bg-white/95 backdrop-blur rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className={`w-10 h-10 rounded-full ${userIsAdmin ? "bg-[#FF6B34]" : tierData.color} flex items-center justify-center text-white font-bold flex-shrink-0`}>
                        {(user.full_name?.[0] || user.email?.[0] || "?").toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-[#1A0A3D] truncate">{user.full_name || "No name"}</h4>
                          {userIsAdmin && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-[#FF6B34] text-white font-medium">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[#6B5B9E] truncate">{user.email}</p>
                        <p className="text-xs text-[#6B5B9E]/60 mt-1">
                          Joined {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs text-white ${tierData.color}`}>
                          {tierData.label}
                        </span>
                        {userIsAdmin ? (
                          <span className="px-3 py-1.5 bg-[#F4F1FB] text-[#6B5B9E] text-sm rounded-lg">
                            Protected
                          </span>
                        ) : (
                          <div className="relative">
                            <select
                              value={user.membership_tier}
                              onChange={(e) => handleUpdateUserTier(user.id, e.target.value)}
                              className="appearance-none pl-3 pr-8 py-1.5 bg-white border border-[#E8E3F3] rounded-lg text-sm text-[#1A0A3D] cursor-pointer focus:outline-none focus:border-[#492B8C] hover:border-[#492B8C] transition-colors"
                            >
                              <option value="initial">Explorer</option>
                              <option value="foundational">Foundational</option>
                              <option value="builder">Builder</option>
                              <option value="architect">Architect</option>
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B5B9E] pointer-events-none" />
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
