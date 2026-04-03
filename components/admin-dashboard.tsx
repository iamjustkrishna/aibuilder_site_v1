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
  ArrowLeft
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

const tierColors = {
  initial: "bg-gray-500",
  foundational: "bg-[#00C8A7]",
  builder: "bg-[#FFD13F]",
  architect: "bg-[#FF6B34]",
}

export function AdminDashboard({ userEmail }: { userEmail: string | null }) {
  const [activeTab, setActiveTab] = useState<"resources" | "users">("resources")
  const [resources, setResources] = useState<Resource[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
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
    fetchData()
  }, [activeTab])

  async function fetchData() {
    setLoading(true)
    if (activeTab === "resources") {
      const res = await fetch("/api/admin/resources")
      if (res.ok) {
        const data = await res.json()
        setResources(data)
      }
    } else {
      const { data } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false })
      setUsers(data || [])
    }
    setLoading(false)
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
    if (!confirm("Are you sure you want to delete this resource?")) return
    const res = await fetch(`/api/admin/resources?id=${id}`, {
      method: "DELETE",
    })
    if (res.ok) {
      fetchData()
    }
  }

  async function handleToggleActive(id: string, currentActive: boolean) {
    const res = await fetch("/api/admin/resources", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_active: !currentActive }),
    })
    if (res.ok) {
      fetchData()
    }
  }

  async function handleUpdateUserTier(userId: string, newTier: string) {
    const { error } = await supabase
      .from("users")
      .update({ membership_tier: newTier, updated_at: new Date().toISOString() })
      .eq("id", userId)
    if (!error) {
      fetchData()
    }
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

  return (
    <div className="min-h-screen bg-[#F4F1FB]">
      {/* Header */}
      <header className="bg-[#2D1A69] text-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-[#C3AFFF]">{userEmail}</p>
            </div>
          </div>
          <Button variant="ghost" onClick={handleSignOut} className="text-white hover:bg-white/10">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("resources")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === "resources"
                ? "bg-[#2D1A69] text-white"
                : "bg-white text-[#1A0A3D] hover:bg-[#E8E3F3]"
            }`}
          >
            <Package className="w-4 h-4" />
            Resources ({resources.length})
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === "users"
                ? "bg-[#2D1A69] text-white"
                : "bg-white text-[#1A0A3D] hover:bg-[#E8E3F3]"
            }`}
          >
            <Users className="w-4 h-4" />
            Users ({users.length})
          </button>
        </div>

        {/* Resources Tab */}
        {activeTab === "resources" && (
          <div>
            {/* Add Resource Button */}
            <div className="mb-4">
              <Button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-[#FF6B34] hover:bg-[#FF6B34]/90 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Resource
              </Button>
            </div>

            {/* Add Form */}
            {showAddForm && (
              <div className="bg-white rounded-xl p-6 mb-6 border border-[#E8E3F3]">
                <h3 className="font-bold text-[#1A0A3D] mb-4">Add New Resource</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1A0A3D] mb-1">Title</label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Resource title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1A0A3D] mb-1">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as Resource["type"] })}
                      className="w-full px-3 py-2 border border-[#E8E3F3] rounded-lg"
                    >
                      <option value="video">Video</option>
                      <option value="pdf">PDF</option>
                      <option value="article">Article</option>
                      <option value="code">Code</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-[#1A0A3D] mb-1">Description</label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1A0A3D] mb-1">URL</label>
                    <Input
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1A0A3D] mb-1">Thumbnail URL (optional)</label>
                    <Input
                      value={formData.thumbnail_url}
                      onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1A0A3D] mb-1">Tier Required</label>
                    <select
                      value={formData.tier_required}
                      onChange={(e) => setFormData({ ...formData, tier_required: e.target.value as Resource["tier_required"] })}
                      className="w-full px-3 py-2 border border-[#E8E3F3] rounded-lg"
                    >
                      <option value="initial">Initial (Free)</option>
                      <option value="foundational">Foundational</option>
                      <option value="builder">Builder</option>
                      <option value="architect">Architect</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1A0A3D] mb-1">Category</label>
                    <Input
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g., Week 1, Tools, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1A0A3D] mb-1">Sort Order</label>
                    <Input
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleAddResource} className="bg-[#00C8A7] hover:bg-[#00C8A7]/90">
                    <Save className="w-4 h-4 mr-2" />
                    Save Resource
                  </Button>
                  <Button variant="outline" onClick={() => { setShowAddForm(false); resetForm(); }}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Resources List */}
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <div className="bg-white rounded-xl border border-[#E8E3F3] overflow-hidden">
                <table className="w-full">
                  <thead className="bg-[#F4F1FB]">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-[#1A0A3D]">Resource</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-[#1A0A3D]">Type</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-[#1A0A3D]">Tier</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-[#1A0A3D]">Status</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-[#1A0A3D]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E3F3]">
                    {resources.map((resource) => {
                      const Icon = typeIcons[resource.type] || MoreHorizontal
                      const isEditing = editingId === resource.id

                      if (isEditing) {
                        return (
                          <tr key={resource.id} className="bg-[#F4F1FB]">
                            <td colSpan={5} className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                  value={formData.title}
                                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                  placeholder="Title"
                                />
                                <Input
                                  value={formData.url}
                                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                  placeholder="URL"
                                />
                                <Input
                                  value={formData.description}
                                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                  placeholder="Description"
                                />
                                <select
                                  value={formData.tier_required}
                                  onChange={(e) => setFormData({ ...formData, tier_required: e.target.value as Resource["tier_required"] })}
                                  className="px-3 py-2 border border-[#E8E3F3] rounded-lg"
                                >
                                  <option value="initial">Initial</option>
                                  <option value="foundational">Foundational</option>
                                  <option value="builder">Builder</option>
                                  <option value="architect">Architect</option>
                                </select>
                              </div>
                              <div className="flex gap-2 mt-4">
                                <Button size="sm" onClick={() => handleUpdateResource(resource.id)} className="bg-[#00C8A7]">
                                  <Save className="w-4 h-4 mr-1" /> Save
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => { setEditingId(null); resetForm(); }}>
                                  <X className="w-4 h-4 mr-1" /> Cancel
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      }

                      return (
                        <tr key={resource.id} className={!resource.is_active ? "opacity-50" : ""}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Icon className="w-5 h-5 text-[#492B8C]" />
                              <div>
                                <p className="font-medium text-[#1A0A3D]">{resource.title}</p>
                                <p className="text-xs text-[#6B5B9E] truncate max-w-xs">{resource.description}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-[#6B5B9E] capitalize">{resource.type}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs text-white ${tierColors[resource.tier_required]}`}>
                              {resource.tier_required}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleToggleActive(resource.id, resource.is_active)}
                              className={`flex items-center gap-1 text-xs ${resource.is_active ? "text-[#00C8A7]" : "text-[#6B5B9E]"}`}
                            >
                              {resource.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                              {resource.is_active ? "Active" : "Hidden"}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => startEdit(resource)}
                                className="p-2 hover:bg-[#F4F1FB] rounded-lg text-[#492B8C]"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteResource(resource.id)}
                                className="p-2 hover:bg-red-50 rounded-lg text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {resources.length === 0 && (
                  <div className="text-center py-8 text-[#6B5B9E]">
                    No resources yet. Add your first resource above.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="bg-white rounded-xl border border-[#E8E3F3] overflow-hidden">
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <table className="w-full">
                <thead className="bg-[#F4F1FB]">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-[#1A0A3D]">User</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-[#1A0A3D]">Membership</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-[#1A0A3D]">Joined</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-[#1A0A3D]">Change Tier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E3F3]">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-[#1A0A3D]">{user.full_name || "No name"}</p>
                          <p className="text-xs text-[#6B5B9E]">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs text-white ${tierColors[user.membership_tier as keyof typeof tierColors] || "bg-gray-500"}`}>
                          {user.membership_tier}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#6B5B9E]">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <select
                          value={user.membership_tier}
                          onChange={(e) => handleUpdateUserTier(user.id, e.target.value)}
                          className="px-3 py-1 text-sm border border-[#E8E3F3] rounded-lg"
                        >
                          <option value="initial">Initial</option>
                          <option value="foundational">Foundational</option>
                          <option value="builder">Builder</option>
                          <option value="architect">Architect</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {users.length === 0 && !loading && (
              <div className="text-center py-8 text-[#6B5B9E]">
                No users yet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
