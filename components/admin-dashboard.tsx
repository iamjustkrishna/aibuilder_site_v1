"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
  Loader2,
  Mail,
  Clock,
  TrendingUp,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"
interface Resource {
  id: string
  title: string
  description: string
  type: "video" | "pdf" | "article" | "code" | "other"
  url: string
  file_storage_path: string | null
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
  avatar_url?: string | null
  deletion_request_count?: number
  deletion_requested_by_me?: boolean
  deletion_required_count?: number
  total_active_seconds?: number
  activity_session_count?: number
  last_seen_at?: string | null
  created_at: string
}

interface SessionRecord {
  id: string
  title: string
  description: string | null
  meet_link: string
  session_at: string
  visibility_scope: "all" | "tiers" | "users"
  audience_tiers: string[] | null
  selected_user_ids: string[]
  is_active: boolean
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
  const [activeTab, setActiveTab] = useState<"weeks" | "resources" | "users" | "mail" | "sessions" | "activity">("weeks")
  const [resources, setResources] = useState<Resource[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [adminEmails, setAdminEmails] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showAddUserForm, setShowAddUserForm] = useState(false)
  const [showSessionForm, setShowSessionForm] = useState(false)
  const [addingToWeek, setAddingToWeek] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [weekVideoForm, setWeekVideoForm] = useState({ title: "", description: "", url: "", tier_required: "foundational" as Resource["tier_required"] })
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "video" as Resource["type"],
    url: "",
    file_storage_path: "",
    thumbnail_url: "",
    tier_required: "initial" as Resource["tier_required"],
    category: "general",
    sort_order: 0,
    is_active: true,
  })
  const [resourceSource, setResourceSource] = useState<"link" | "upload">("link")
  const [selectedDocument, setSelectedDocument] = useState<File | null>(null)
  const [uploadingDocument, setUploadingDocument] = useState(false)
  const [savingResource, setSavingResource] = useState(false)
  const [resourceFormMessage, setResourceFormMessage] = useState<{ type: "error" | "success" | "info"; text: string } | null>(null)
  const [creatingUser, setCreatingUser] = useState(false)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [selectedMailRecipientIds, setSelectedMailRecipientIds] = useState<string[]>([])
  const [sendingMail, setSendingMail] = useState(false)
  const [sessionFormMessage, setSessionFormMessage] = useState<{ type: "error" | "success" | "info"; text: string } | null>(null)
  const [newUserForm, setNewUserForm] = useState({
    full_name: "",
    email: "",
    membership_tier: "initial" as Resource["tier_required"],
    avatar_url: "",
  })
  const [userFormMessage, setUserFormMessage] = useState<{ type: "error" | "success" | "info"; text: string } | null>(null)
  const [userDeleteMessage, setUserDeleteMessage] = useState<{ type: "error" | "success" | "info"; text: string } | null>(null)
  const [mailFormMessage, setMailFormMessage] = useState<{ type: "error" | "success" | "info"; text: string } | null>(null)
  const [showMailPreview, setShowMailPreview] = useState(false)
  const [sendingMailStatus, setSendingMailStatus] = useState<Array<{ email: string; status: "pending" | "sent" | "failed" }>>([])
  const [pastMails, setPastMails] = useState<any[]>([])
  const [loadingPastMails, setLoadingPastMails] = useState(false)
  const [expandedMailId, setExpandedMailId] = useState<string | null>(null)
  const [mailForm, setMailForm] = useState({
    senderEmail: userEmail || "",
    appPassword: "",
    subject: "AIBuilder Invite",
    subtitle: "Learn along with us",
    body: "Hi {{name}},\n\nYou're invited to AIBuilder.\n\nAccess resources, learn along with us, and grow with the community.\n\nThanks,\nAIBuilder Team",
    htmlTemplate: "",
    isHtml: false,
    intervalSeconds: 3,
  })
  const [sessionForm, setSessionForm] = useState({
    title: "",
    description: "",
    meet_link: "",
    session_at: "",
    visibility_scope: "all" as SessionRecord["visibility_scope"],
    audience_tiers: [] as string[],
    selected_user_ids: [] as string[],
    is_active: true,
  })
  const mailFieldClassName = "border-[#E8E3F3] bg-white text-[#1A0A3D] placeholder:text-[#6B5B9E] focus:border-[#492B8C] focus:ring-[#492B8C]"
  const sessionFieldClassName = "border-[#E8E3F3] bg-white text-[#1A0A3D] placeholder:text-[#6B5B9E] focus:border-[#492B8C] focus:ring-[#492B8C]"
  const supabase = createClient()

  useEffect(() => {
    fetchAdminEmails()
  }, [])

  useEffect(() => {
    fetchData()
  }, [activeTab])

  useEffect(() => {
    if (userEmail) {
      setMailForm((prev) => ({
        ...prev,
        senderEmail: prev.senderEmail || userEmail,
      }))
    }
  }, [userEmail])

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

  function resetUserForm() {
    setNewUserForm({
      full_name: "",
      email: "",
      membership_tier: "initial",
      avatar_url: "",
    })
    setUserFormMessage(null)
  }

  function resetSessionForm() {
    setSessionForm({
      title: "",
      description: "",
      meet_link: "",
      session_at: "",
      visibility_scope: "all",
      audience_tiers: [],
      selected_user_ids: [],
      is_active: true,
    })
    setSessionFormMessage(null)
  }

  async function fetchData() {
    setLoading(true)
    if (activeTab === "resources" || activeTab === "weeks") {
      const res = await fetch("/api/admin/resources")
      if (res.ok) {
        const data = await res.json()
        setResources(data)
      }
    } else if (activeTab === "sessions") {
      const [sessionsRes, usersRes] = await Promise.all([
        fetch("/api/admin/sessions"),
        fetch("/api/admin/users"),
      ])

      if (sessionsRes.ok) {
        const data = await sessionsRes.json()
        setSessions(data || [])
      }

      if (usersRes.ok) {
        const data = await usersRes.json()
        setUsers(data || [])
      }
    } else if (activeTab === "mail") {
      const res = await fetch("/api/admin/users")
      if (res.ok) {
        const data = await res.json()
        setUsers(data || [])
      }
      await fetchPastMails()
    } else {
      const res = await fetch("/api/admin/users")
      if (res.ok) {
        const data = await res.json()
        setUsers(data || [])
      }
    }
    setLoading(false)
  }

  async function fetchPastMails() {
    setLoadingPastMails(true)
    try {
      const res = await fetch("/api/past-mails")
      if (res.ok) {
        const data = await res.json()
        setPastMails(data || [])
      }
    } catch (error) {
      console.error("Failed to fetch past mails:", error)
    } finally {
      setLoadingPastMails(false)
    }
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

  async function uploadDocumentToStorage() {
    if (!selectedDocument) {
      setResourceFormMessage({ type: "error", text: "Please select a document first." })
      return null
    }
    setUploadingDocument(true)
    setResourceFormMessage({ type: "info", text: "Uploading document..." })
    const payload = new FormData()
    payload.append("file", selectedDocument)

    try {
      const res = await fetch("/api/admin/resources/upload", {
        method: "POST",
        body: payload,
      })

      const data = await res.json()
      if (!res.ok) {
        setResourceFormMessage({ type: "error", text: data.error || "Failed to upload document." })
        return null
      }

      setFormData((prev) => ({
        ...prev,
        type: "pdf",
        url: "",
        file_storage_path: data.filePath,
      }))
      setResourceFormMessage({ type: "success", text: "Document uploaded successfully." })
      return data.filePath as string
    } catch (error) {
      console.error("Failed to upload document:", error)
      setResourceFormMessage({ type: "error", text: "Failed to upload document. Please try again." })
      return null
    } finally {
      setUploadingDocument(false)
    }
  }

  async function handleUploadDocument() {
    await uploadDocumentToStorage()
  }

  async function handleAddResource() {
    setResourceFormMessage(null)

    if (!formData.title.trim()) {
      setResourceFormMessage({ type: "error", text: "Title is required." })
      return
    }

    setSavingResource(true)

    try {
      let fileStoragePath = formData.file_storage_path
      if (formData.type === "pdf" && resourceSource === "upload" && !fileStoragePath) {
        const uploadedPath = await uploadDocumentToStorage()
        if (!uploadedPath) return
        fileStoragePath = uploadedPath
      }

      const normalizedUrl = formData.url.trim()
      if (!normalizedUrl && !fileStoragePath) {
        setResourceFormMessage({ type: "error", text: "Add a URL or upload a document before saving." })
        return
      }

      setResourceFormMessage({ type: "info", text: "Saving resource..." })
      const payload = {
        ...formData,
        url: formData.type === "pdf" && resourceSource === "upload" ? "" : normalizedUrl,
        file_storage_path: fileStoragePath,
      }

      const res = await fetch("/api/admin/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        setResourceFormMessage({ type: "error", text: data.error || "Failed to save resource." })
        return
      }

      setResourceFormMessage({ type: "success", text: "Resource saved successfully." })
      setShowAddForm(false)
      resetForm()
      setResourceSource("link")
      setSelectedDocument(null)
      fetchData()
    } catch (error) {
      console.error("Failed to save resource:", error)
      setResourceFormMessage({ type: "error", text: "Failed to save resource. Please try again." })
    } finally {
      setSavingResource(false)
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

  async function handleAddUser() {
    setUserFormMessage(null)

    if (!newUserForm.full_name.trim() || !newUserForm.email.trim() || !newUserForm.membership_tier) {
      setUserFormMessage({ type: "error", text: "Name, email, and tier are required." })
      return
    }

    setCreatingUser(true)
    setUserFormMessage({ type: "info", text: "Creating user and sending invite..." })

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUserForm),
      })

      const data = await res.json()
      if (!res.ok) {
        setUserFormMessage({ type: "error", text: data.error || "Failed to create user." })
        return
      }

      setUserFormMessage({ type: "success", text: data.invited ? "User invited successfully." : "User created successfully." })
      resetUserForm()
      setShowAddUserForm(false)
      fetchData()
    } catch (error) {
      console.error("Failed to add user:", error)
      setUserFormMessage({ type: "error", text: "Failed to create user. Please try again." })
    } finally {
      setCreatingUser(false)
    }
  }

  function toggleSessionTier(tier: string) {
    setSessionForm((current) => ({
      ...current,
      audience_tiers: current.audience_tiers.includes(tier)
        ? current.audience_tiers.filter((item) => item !== tier)
        : [...current.audience_tiers, tier],
    }))
  }

  function toggleSessionUser(userId: string) {
    setSessionForm((current) => ({
      ...current,
      selected_user_ids: current.selected_user_ids.includes(userId)
        ? current.selected_user_ids.filter((item) => item !== userId)
        : [...current.selected_user_ids, userId],
    }))
  }

  async function handleSaveSession() {
    setSessionFormMessage(null)

    if (!sessionForm.title.trim() || !sessionForm.meet_link.trim() || !sessionForm.session_at.trim()) {
      setSessionFormMessage({ type: "error", text: "Title, meet link, and date/time are required." })
      return
    }

    if (sessionForm.visibility_scope === "tiers" && sessionForm.audience_tiers.length === 0) {
      setSessionFormMessage({ type: "error", text: "Select at least one tier." })
      return
    }

    if (sessionForm.visibility_scope === "users" && sessionForm.selected_user_ids.length === 0) {
      setSessionFormMessage({ type: "error", text: "Select at least one user." })
      return
    }

    setSessionFormMessage({ type: "info", text: editingSessionId ? "Updating session..." : "Saving session..." })

    try {
      const res = await fetch("/api/admin/sessions", {
        method: editingSessionId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingSessionId,
          ...sessionForm,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setSessionFormMessage({ type: "error", text: data.error || "Failed to save session." })
        return
      }

      setSessionFormMessage({ type: "success", text: editingSessionId ? "Session updated successfully." : "Session created successfully." })
      setShowSessionForm(false)
      setEditingSessionId(null)
      resetSessionForm()
      fetchData()
    } catch (error) {
      console.error("Failed to save session:", error)
      setSessionFormMessage({ type: "error", text: "Failed to save session. Please try again." })
    }
  }

  async function handleDeleteSession(id: string) {
    if (!confirm("Delete this session?")) return
    const res = await fetch(`/api/admin/sessions?id=${id}`, { method: "DELETE" })
    if (res.ok) {
      fetchData()
    }
  }

  function startEditSession(session: SessionRecord) {
    setEditingSessionId(session.id)
    setSessionForm({
      title: session.title,
      description: session.description || "",
      meet_link: session.meet_link,
      session_at: session.session_at.slice(0, 16),
      visibility_scope: session.visibility_scope,
      audience_tiers: session.audience_tiers || [],
      selected_user_ids: session.selected_user_ids || [],
      is_active: session.is_active,
    })
    setShowSessionForm(true)
  }

  function formatDuration(totalSeconds: number) {
    if (!totalSeconds || totalSeconds <= 0) {
      return "0m"
    }

    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes || 1}m`
  }

  async function handleDeleteUser(userId: string) {
    const user = users.find((entry) => entry.id === userId)
    if (!user) return

    const requiredCount = adminEmails.length || 1
    const approvedCount = user.deletion_request_count || 0
    const isFinalDelete = approvedCount + 1 >= requiredCount
    const confirmMessage = isFinalDelete
      ? `This will permanently delete ${user.full_name || user.email}. Continue?`
      : `This will mark ${user.full_name || user.email} for deletion. The last admin will complete the delete. Continue?`

    if (!confirm(confirmMessage)) return

    setDeletingUserId(userId)
    setUserDeleteMessage({ type: "info", text: isFinalDelete ? "Deleting user..." : "Marking user for deletion..." })

    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId }),
      })

      const data = await res.json()
      if (!res.ok) {
        setUserDeleteMessage({ type: "error", text: data.error || "Failed to process deletion." })
        return
      }

      if (data.deleted) {
        setUserDeleteMessage({ type: "success", text: "User deleted successfully." })
      } else {
        setUserDeleteMessage({
          type: "success",
          text: `Deletion marked. ${data.approvedCount}/${data.requiredCount} admin approvals received.`,
        })
      }

      fetchData()
    } catch (error) {
      console.error("Failed to delete user:", error)
      setUserDeleteMessage({ type: "error", text: "Failed to process deletion. Please try again." })
    } finally {
      setDeletingUserId(null)
    }
  }

  const toggleMailRecipient = (userId: string) => {
    setSelectedMailRecipientIds((current) =>
      current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId]
    )
  }

  const selectVisibleMailRecipients = () => {
    const visibleIds = filteredUsers
      .filter((user) => !isUserAdmin(user.email))
      .map((user) => user.id)
    setSelectedMailRecipientIds(visibleIds)
  }

  const clearMailRecipients = () => {
    setSelectedMailRecipientIds([])
  }

  async function handleSendMail() {
    setMailFormMessage(null)

    if (!mailForm.senderEmail.trim() || !mailForm.appPassword.trim()) {
      setMailFormMessage({ type: "error", text: "Sender email and app password are required." })
      return
    }

    if (selectedMailRecipientIds.length === 0) {
      setMailFormMessage({ type: "error", text: "Select at least one recipient." })
      return
    }

    setSendingMail(true)
    setMailFormMessage({ type: "info", text: "Sending emails..." })
    setSendingMailStatus(filteredUsers
      .filter(u => selectedMailRecipientIds.includes(u.id))
      .map(u => ({ email: u.email, status: "pending" as const })))

    try {
      const res = await fetch("/api/admin/send-mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...mailForm,
          recipientIds: selectedMailRecipientIds,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setMailFormMessage({ type: "error", text: data.error || "Failed to send emails." })
        return
      }

      // Update sending status for sent emails
      setSendingMailStatus(prev =>
        prev.map(item => ({
          ...item,
          status: data.sent?.some((s: any) => s.email === item.email) ? "sent" : 
                  data.failed?.some((f: any) => f.email === item.email) ? "failed" : item.status
        }))
      )

      setMailFormMessage({
        type: "success",
        text: `Sent ${data.sentCount || 0} email(s). ${data.failedCount ? `${data.failedCount} failed.` : "All sent successfully."}`,
      })

      // Clear form and refresh past mails
      setSelectedMailRecipientIds([])
      await fetchPastMails()
    } catch (error) {
      console.error("Failed to send mail:", error)
      setMailFormMessage({ type: "error", text: "Failed to send emails. Please try again." })
    } finally {
      setSendingMail(false)
      setTimeout(() => setSendingMailStatus([]), 3000)
    }
  }

  function resetForm() {
    setFormData({
      title: "",
      description: "",
      type: "video",
      url: "",
      file_storage_path: "",
      thumbnail_url: "",
      tier_required: "initial",
      category: "general",
      sort_order: 0,
      is_active: true,
    })
    setResourceFormMessage(null)
  }

  function startEdit(resource: Resource) {
    setEditingId(resource.id)
    setFormData({
      title: resource.title,
      description: resource.description || "",
      type: resource.type,
      url: resource.url,
      file_storage_path: resource.file_storage_path || "",
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
            <button
              onClick={() => { setActiveTab("sessions"); setSearchQuery(""); }}
              className={`flex-shrink-0 px-3 sm:px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
                activeTab === "sessions"
                  ? "bg-white text-[#1A0A3D] shadow-lg"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Sessions</span>
              <span className="px-1.5 py-0.5 rounded-full text-xs bg-[#FF6B34] text-white">{sessions.length}</span>
            </button>
            <button
              onClick={() => { setActiveTab("mail"); setSearchQuery(""); }}
              className={`flex-shrink-0 px-3 sm:px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
                activeTab === "mail"
                  ? "bg-white text-[#1A0A3D] shadow-lg"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              <Mail className="w-4 h-4" />
              <span className="text-sm">Send Mail</span>
            </button>
            <button
              onClick={() => { setActiveTab("activity"); setSearchQuery(""); }}
              className={`flex-shrink-0 px-3 sm:px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
                activeTab === "activity"
                  ? "bg-white text-[#1A0A3D] shadow-lg"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Activity</span>
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
                      onChange={(e) => {
                        const type = e.target.value as Resource["type"]
                        setFormData((prev) => ({
                          ...prev,
                          type,
                          file_storage_path: type === "pdf" ? prev.file_storage_path : "",
                        }))
                        if (type !== "pdf") {
                          setResourceSource("link")
                          setSelectedDocument(null)
                        }
                      }}
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
                  {formData.type !== "pdf" && (
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-[#1A0A3D] mb-1.5">URL *</label>
                      <Input
                        value={formData.url}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        placeholder="https://youtube.com/watch?v=... or resource link"
                        className="border-[#E8E3F3] focus:border-[#492B8C] focus:ring-[#492B8C]"
                      />
                    </div>
                  )}
                  {formData.type === "pdf" && (
                    <div className="sm:col-span-2 space-y-3">
                      <label className="block text-sm font-medium text-[#1A0A3D]">Document Source *</label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={resourceSource === "link" ? "default" : "outline"}
                          onClick={() => {
                            setResourceSource("link")
                            setSelectedDocument(null)
                            setFormData((prev) => ({ ...prev, file_storage_path: "" }))
                            setResourceFormMessage(null)
                          }}
                          className={resourceSource === "link" ? "bg-[#492B8C] text-white" : "border-[#E8E3F3] text-[#6B5B9E]"}
                        >
                          <LinkIcon className="w-4 h-4 mr-2" />
                          External Link
                        </Button>
                        <Button
                          type="button"
                          variant={resourceSource === "upload" ? "default" : "outline"}
                          onClick={() => {
                            setResourceSource("upload")
                            setFormData((prev) => ({ ...prev, url: "" }))
                            setResourceFormMessage(null)
                          }}
                          className={resourceSource === "upload" ? "bg-[#492B8C] text-white" : "border-[#E8E3F3] text-[#6B5B9E]"}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Upload Document
                        </Button>
                      </div>

                      {resourceSource === "link" ? (
                        <Input
                          value={formData.url}
                          onChange={(e) => setFormData({ ...formData, url: e.target.value, file_storage_path: "" })}
                          placeholder="https://example.com/document.pdf"
                          className="border-[#E8E3F3] focus:border-[#492B8C] focus:ring-[#492B8C]"
                        />
                      ) : (
                        <div className="space-y-2">
                          <Input
                            type="file"
                            accept=".pdf,.doc,.docx,.txt,.md"
                            onChange={(e) => {
                              setSelectedDocument(e.target.files?.[0] || null)
                              setResourceFormMessage(null)
                            }}
                            className="border-[#E8E3F3] focus:border-[#492B8C] focus:ring-[#492B8C]"
                          />
                          <Button
                            type="button"
                            onClick={handleUploadDocument}
                            disabled={!selectedDocument || uploadingDocument || savingResource}
                            className="bg-[#2D1A69] hover:bg-[#492B8C] text-white"
                          >
                            {uploadingDocument ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              "Upload Document"
                            )}
                          </Button>
                          <p className="text-xs text-[#6B5B9E]">
                            {formData.file_storage_path
                              ? "Document uploaded. Resource link will be auto-generated when you save."
                              : "Upload a file first. Resource link will be auto-generated when you save."}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
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
                {resourceFormMessage && (
                  <div
                    className={`mt-4 rounded-lg px-3 py-2 text-sm ${
                      resourceFormMessage.type === "error"
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : resourceFormMessage.type === "success"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                    }`}
                  >
                    {resourceFormMessage.text}
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-2 mt-6">
                  <Button onClick={handleAddResource} disabled={savingResource || uploadingDocument} className="bg-[#00C8A7] hover:bg-[#00C8A7]/90 text-white">
                    {savingResource ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    {savingResource ? "Saving Resource..." : "Save Resource"}
                  </Button>
                  <Button variant="outline" onClick={() => { setShowAddForm(false); resetForm(); setResourceSource("link"); setSelectedDocument(null) }} className="border-[#E8E3F3] text-[#6B5B9E]">
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
                      className={`bg-white/95 backdrop-blur rounded-xl p-4 grid grid-cols-1 sm:grid-cols-[auto_minmax(0,1fr)_auto] gap-3 sm:gap-4 transition-all ${!resource.is_active ? "opacity-50" : ""}`}
                    >
                      <div className={`p-2.5 rounded-xl ${tierData.color}/10 w-fit`}>
                        <Icon className={`w-5 h-5 ${tierData.text}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4 className="font-medium text-[#1A0A3D] break-words">{resource.title}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-xs text-white ${tierData.color}`}>
                            {tierData.label}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-xs bg-[#F4F1FB] text-[#6B5B9E] capitalize">
                            {resource.type}
                          </span>
                        </div>
                        {resource.description && (
                          <p className="text-sm text-[#6B5B9E] line-clamp-2 break-words">{resource.description}</p>
                        )}
                        <p className="text-xs text-[#8A7CB5] mt-1 break-all truncate">{resource.url}</p>
                      </div>
                      <div className="flex items-center justify-end gap-2 sm:self-start">
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

        {/* Sessions Tab */}
        {activeTab === "sessions" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-white">Sessions</h3>
                <p className="text-sm text-white/60">Create Meet sessions and control who can see them.</p>
              </div>
              <Button
                onClick={() => {
                  setShowSessionForm((prev) => !prev)
                  if (showSessionForm) {
                    setEditingSessionId(null)
                    resetSessionForm()
                  }
                }}
                className="bg-[#FF6B34] hover:bg-[#E84C1E] text-white rounded-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                {showSessionForm ? "Close Form" : "Add Session"}
              </Button>
            </div>

            {sessionFormMessage && (
              <div
                className={`rounded-lg px-3 py-2 text-sm ${
                  sessionFormMessage.type === "error"
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : sessionFormMessage.type === "success"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-blue-50 text-blue-700 border border-blue-200"
                }`}
              >
                {sessionFormMessage.text}
              </div>
            )}

            {showSessionForm && (
              <div className="bg-white/95 backdrop-blur rounded-2xl p-5 border border-white/10 shadow-lg">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1A0A3D] mb-1.5">Title *</label>
                    <Input
                      value={sessionForm.title}
                      onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
                      placeholder="Session title"
                      className={sessionFieldClassName}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1A0A3D] mb-1.5">Meet Link *</label>
                    <Input
                      value={sessionForm.meet_link}
                      onChange={(e) => setSessionForm({ ...sessionForm, meet_link: e.target.value })}
                      placeholder="https://meet.google.com/..."
                      className={sessionFieldClassName}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1A0A3D] mb-1.5">Date & Time *</label>
                    <Input
                      type="datetime-local"
                      value={sessionForm.session_at}
                      onChange={(e) => setSessionForm({ ...sessionForm, session_at: e.target.value })}
                      className={sessionFieldClassName}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1A0A3D] mb-1.5">Visibility *</label>
                    <select
                      value={sessionForm.visibility_scope}
                      onChange={(e) => {
                        const visibility_scope = e.target.value as SessionRecord["visibility_scope"]
                        setSessionForm({
                          ...sessionForm,
                          visibility_scope,
                          audience_tiers: visibility_scope === "tiers" ? sessionForm.audience_tiers : [],
                          selected_user_ids: visibility_scope === "users" ? sessionForm.selected_user_ids : [],
                        })
                      }}
                      className="w-full px-3 py-2 bg-white border border-[#E8E3F3] rounded-lg text-[#1A0A3D] focus:outline-none focus:border-[#492B8C] focus:ring-1 focus:ring-[#492B8C]"
                    >
                      <option value="all">All users</option>
                      <option value="tiers">Selected tiers</option>
                      <option value="users">Specific users</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-[#1A0A3D] mb-1.5">Description</label>
                    <Textarea
                      value={sessionForm.description}
                      onChange={(e) => setSessionForm({ ...sessionForm, description: e.target.value })}
                      placeholder="Optional session notes"
                      className={sessionFieldClassName}
                    />
                  </div>
                </div>

                {sessionForm.visibility_scope === "tiers" && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-[#1A0A3D] mb-2">Select tiers</label>
                    <div className="flex flex-wrap gap-2">
                      {(["foundational", "builder", "architect"] as const).map((tier) => (
                        <button
                          key={tier}
                          type="button"
                          onClick={() => toggleSessionTier(tier)}
                          className={`px-3 py-2 rounded-full text-sm border transition-colors ${
                            sessionForm.audience_tiers.includes(tier)
                              ? "bg-[#492B8C] text-white border-[#492B8C]"
                              : "bg-white text-[#6B5B9E] border-[#E8E3F3]"
                          }`}
                        >
                          {tierConfig[tier].label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {sessionForm.visibility_scope === "users" && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <label className="block text-sm font-medium text-[#1A0A3D]">Select users</label>
                      <p className="text-xs text-[#6B5B9E]">{sessionForm.selected_user_ids.length} selected</p>
                    </div>
                    <div className="max-h-72 overflow-y-auto space-y-2 rounded-xl border border-[#E8E3F3] p-3 bg-[#FAF9FF]">
                      {filteredUsers
                        .filter((entry) => !isUserAdmin(entry.email))
                        .map((entry) => {
                          const isSelected = sessionForm.selected_user_ids.includes(entry.id)
                          return (
                            <label
                              key={entry.id}
                              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer ${
                                isSelected ? "bg-[#492B8C]/5 border-[#492B8C]/30" : "bg-white border-[#E8E3F3]"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSessionUser(entry.id)}
                                className="w-4 h-4 accent-[#492B8C]"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-[#1A0A3D] truncate">{entry.full_name || "No name"}</p>
                                <p className="text-sm text-[#6B5B9E] truncate">{entry.email}</p>
                              </div>
                            </label>
                          )
                        })}
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2 mt-6">
                  <Button onClick={handleSaveSession} className="bg-[#00C8A7] hover:bg-[#00C8A7]/90 text-white">
                    <Save className="w-4 h-4 mr-2" />
                    {editingSessionId ? "Update Session" : "Save Session"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowSessionForm(false)
                      setEditingSessionId(null)
                      resetSessionForm()
                    }}
                    className="border-[#E8E3F3] text-[#6B5B9E]"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="text-center py-12 text-white/60">Loading sessions...</div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                <Calendar className="w-12 h-12 mx-auto text-white/30 mb-3" />
                <p className="text-white/60">{searchQuery ? "No matching sessions" : "No sessions yet"}</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {sessions
                  .filter((session) =>
                    !searchQuery ||
                    session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (session.description || "").toLowerCase().includes(searchQuery.toLowerCase()),
                  )
                  .map((session) => (
                    <div key={session.id} className="bg-white/95 backdrop-blur rounded-xl p-4 flex flex-col gap-3">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h4 className="font-medium text-[#1A0A3D]">{session.title}</h4>
                            <span className="px-2 py-0.5 rounded-full text-xs text-white bg-[#492B8C]">
                              {session.visibility_scope}
                            </span>
                            {!session.is_active && (
                              <span className="px-2 py-0.5 rounded-full text-xs bg-[#F4F1FB] text-[#6B5B9E]">
                                Inactive
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-[#6B5B9E]">{session.description || "No description"}</p>
                          <p className="text-sm text-[#492B8C] mt-1">{new Date(session.session_at).toLocaleString()}</p>
                          <a href={session.meet_link} target="_blank" rel="noopener noreferrer" className="text-sm text-[#FF6B34] hover:underline break-all">
                            {session.meet_link}
                          </a>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => startEditSession(session)}
                            className="p-2 hover:bg-[#F4F1FB] rounded-lg text-[#492B8C] transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSession(session.id)}
                            className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {session.audience_tiers?.length ? session.audience_tiers.map((tier) => (
                          <span key={tier} className="px-2 py-0.5 rounded-full text-xs bg-[#F4F1FB] text-[#6B5B9E] capitalize">
                            {tier}
                          </span>
                        )) : null}
                        {session.selected_user_ids?.length ? (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-[#00C8A7]/10 text-[#00C8A7]">
                            {session.selected_user_ids.length} selected user{session.selected_user_ids.length === 1 ? "" : "s"}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Send Mail Tab */}
        {activeTab === "mail" && (
          <div className="space-y-4">
            {/* Send Mail Form */}
            <div className="bg-white/95 backdrop-blur rounded-2xl p-5 border border-white/10 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-[#1A0A3D]">Send Mail</h3>
                  <p className="text-sm text-[#6B5B9E]">Send a personalized Gmail message to selected users.</p>
                </div>
                <div className="text-xs text-[#6B5B9E] bg-[#F4F1FB] px-3 py-2 rounded-lg">
                  Variables: {"{{name}}"} {"{{full_name}}"} {"{{email}}"} {"{{tier}}"}
                </div>
              </div>

              {mailFormMessage && (
                <div
                  className={`mb-4 rounded-lg px-3 py-2 text-sm ${
                    mailFormMessage.type === "error"
                      ? "bg-red-50 text-red-700 border border-red-200"
                      : mailFormMessage.type === "success"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-blue-50 text-blue-700 border border-blue-200"
                  }`}
                >
                  {mailFormMessage.text}
                </div>
              )}

              {sendingMailStatus.length > 0 && (
                <div className="mb-4 rounded-lg p-4 bg-blue-50 border border-blue-200">
                  <p className="text-sm font-medium text-blue-900 mb-3">Sending to recipients...</p>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {sendingMailStatus.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        {item.status === "sent" && (
                          <span className="inline-block w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </span>
                        )}
                        {item.status === "pending" && (
                          <span className="inline-block w-4 h-4 rounded-full bg-blue-500 animate-pulse"></span>
                        )}
                        {item.status === "failed" && (
                          <span className="inline-block w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                            <span className="text-white text-xs">✕</span>
                          </span>
                        )}
                        <span className="text-blue-900">{item.email}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#1A0A3D] mb-1.5">From Email *</label>
                      <Input
                        value={mailForm.senderEmail}
                        onChange={(e) => setMailForm({ ...mailForm, senderEmail: e.target.value })}
                        placeholder="your@gmail.com"
                        className={mailFieldClassName}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1A0A3D] mb-1.5">Gmail App Password *</label>
                      <Input
                        type="password"
                        value={mailForm.appPassword}
                        onChange={(e) => setMailForm({ ...mailForm, appPassword: e.target.value })}
                        placeholder="xxxx xxxx xxxx xxxx"
                        className={mailFieldClassName}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-[#1A0A3D] mb-1.5">Mail Style</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setMailForm({ ...mailForm, isHtml: false })}
                          className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                            !mailForm.isHtml
                              ? "bg-[#492B8C] text-white"
                              : "bg-[#F4F1FB] text-[#6B5B9E] border border-[#E8E3F3]"
                          }`}
                        >
                          Plain Text
                        </button>
                        <button
                          onClick={() => setMailForm({ ...mailForm, isHtml: true })}
                          className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                            mailForm.isHtml
                              ? "bg-[#492B8C] text-white"
                              : "bg-[#F4F1FB] text-[#6B5B9E] border border-[#E8E3F3]"
                          }`}
                        >
                          HTML
                        </button>
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-[#1A0A3D] mb-1.5">Title / Subject *</label>
                      <Input
                        value={mailForm.subject}
                        onChange={(e) => setMailForm({ ...mailForm, subject: e.target.value })}
                        placeholder="AIBuilder Invite"
                        className={mailFieldClassName}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-[#1A0A3D] mb-1.5">Subtitle</label>
                      <Input
                        value={mailForm.subtitle}
                        onChange={(e) => setMailForm({ ...mailForm, subtitle: e.target.value })}
                        placeholder="Access resources, learn along with us"
                        className={mailFieldClassName}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-[#1A0A3D] mb-1.5">
                        {mailForm.isHtml ? "HTML Body *" : "Body *"}
                      </label>
                      {mailForm.isHtml ? (
                        <Textarea
                          value={mailForm.htmlTemplate}
                          onChange={(e) => setMailForm({ ...mailForm, htmlTemplate: e.target.value })}
                          placeholder={`<div style="font-family: Arial, sans-serif; padding: 24px;"><h1>AIBuilder Invite</h1><p>Hello {{name}},</p></div>`}
                          className={`${mailFieldClassName} min-h-[180px] font-mono text-sm`}
                        />
                      ) : (
                        <Textarea
                          value={mailForm.body}
                          onChange={(e) => setMailForm({ ...mailForm, body: e.target.value })}
                          placeholder="Write your message..."
                          className={`${mailFieldClassName} min-h-[180px]`}
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1A0A3D] mb-1.5">Gap Between Emails (seconds)</label>
                      <Input
                        type="number"
                        min="0"
                        value={mailForm.intervalSeconds}
                        onChange={(e) => setMailForm({ ...mailForm, intervalSeconds: Number(e.target.value) || 0 })}
                        className={mailFieldClassName}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-[#1A0A3D]">Recipients</h4>
                      <p className="text-sm text-[#6B5B9E]">{selectedMailRecipientIds.length} selected</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={selectVisibleMailRecipients} className="border-[#E8E3F3] text-[#6B5B9E] text-xs" size="sm">
                        Select All
                      </Button>
                      <Button variant="outline" onClick={clearMailRecipients} className="border-[#E8E3F3] text-[#6B5B9E] text-xs" size="sm">
                        Clear
                      </Button>
                      <Button
                        onClick={() => setShowMailPreview(true)}
                        className="bg-[#00C8A7] hover:bg-[#009E87] text-white text-xs"
                        size="sm"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Preview
                      </Button>
                    </div>
                  </div>
                  <div className="max-h-[420px] overflow-y-auto space-y-2 pr-1">
                    {filteredUsers.length === 0 ? (
                      <div className="p-4 rounded-xl bg-[#F4F1FB] text-[#6B5B9E] text-sm">No users found.</div>
                    ) : (
                      filteredUsers.map((user) => {
                        const userIsAdmin = isUserAdmin(user.email)
                        const isSelected = selectedMailRecipientIds.includes(user.id)
                        return (
                          <label
                            key={user.id}
                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer ${
                              userIsAdmin
                                ? "bg-[#F4F1FB] border-[#E8E3F3] opacity-70"
                                : isSelected
                                  ? "bg-[#492B8C]/5 border-[#492B8C]/30"
                                  : "bg-white border-[#E8E3F3]"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={userIsAdmin}
                              onChange={() => toggleMailRecipient(user.id)}
                              className="w-4 h-4 accent-[#492B8C]"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-[#1A0A3D] truncate">{user.full_name || "No name"}</p>
                              <p className="text-sm text-[#6B5B9E] truncate">{user.email}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs text-white ${tierConfig[user.membership_tier as keyof typeof tierConfig]?.color || tierConfig.initial.color}`}>
                                {tierConfig[user.membership_tier as keyof typeof tierConfig]?.label || "Explorer"}
                              </span>
                              {userIsAdmin && (
                                <span className="px-2 py-0.5 rounded-full text-xs bg-[#FF6B34] text-white">Admin</span>
                              )}
                            </div>
                          </label>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 mt-6">
                <Button
                  onClick={handleSendMail}
                  disabled={sendingMail}
                  className="bg-[#492B8C] hover:bg-[#2D1A69] text-white"
                >
                  {sendingMail ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                  {sendingMail ? "Sending..." : "Send Mail"}
                </Button>
                <div className="text-xs text-[#6B5B9E] self-center">
                  Gmail app password is used only for this send and is not stored.
                </div>
              </div>
            </div>

            {/* Past Mails Section */}
            <div className="bg-white/95 backdrop-blur rounded-2xl p-5 border border-white/10 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-[#1A0A3D]">Past Mails</h3>
                  <p className="text-sm text-[#6B5B9E]">History of all sent emails</p>
                </div>
                <Button
                  onClick={() => fetchPastMails()}
                  variant="outline"
                  className="border-[#E8E3F3] text-[#6B5B9E]"
                  size="sm"
                >
                  Refresh
                </Button>
              </div>

              {loadingPastMails ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-[#492B8C] mr-2" />
                  <span className="text-[#6B5B9E]">Loading past mails...</span>
                </div>
              ) : pastMails.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#F4F1FB] text-[#6B5B9E] text-sm">
                  No mails sent yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {pastMails.map((mail) => (
                    <div
                      key={mail.id}
                      className="border border-[#E8E3F3] rounded-xl p-4 hover:bg-[#F4F1FB] transition-colors cursor-pointer"
                      onClick={() => setExpandedMailId(expandedMailId === mail.id ? null : mail.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-[#1A0A3D] truncate">{mail.subject}</h4>
                            <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                              mail.is_html ? "bg-blue-100 text-blue-700" : "bg-[#F4F1FB] text-[#6B5B9E]"
                            }`}>
                              {mail.is_html ? "HTML" : "Plain"}
                            </span>
                          </div>
                          <p className="text-sm text-[#6B5B9E] mb-2">
                            By {mail.sent_by_admin_email} • {new Date(mail.sent_at).toLocaleDateString()} {new Date(mail.sent_at).toLocaleTimeString()}
                          </p>
                          <p className="text-sm text-[#1A0A3D]">
                            Sent to <span className="font-semibold">{mail.recipient_count}</span> recipient{mail.recipient_count === 1 ? "" : "s"}
                          </p>
                        </div>
                        <ChevronRight className={`w-5 h-5 text-[#6B5B9E] flex-shrink-0 transition-transform ${
                          expandedMailId === mail.id ? "rotate-90" : ""
                        }`} />
                      </div>

                      {expandedMailId === mail.id && (
                        <div className="mt-4 pt-4 border-t border-[#E8E3F3] space-y-3">
                          <div>
                            <p className="text-xs font-medium text-[#6B5B9E] mb-2">Recipients</p>
                            <div className="space-y-1 max-h-[200px] overflow-y-auto">
                              {mail.recipients?.map((recipient: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-2 text-sm">
                                  {recipient.status === "sent" && (
                                    <span className="inline-block w-3 h-3 rounded-full bg-emerald-500"></span>
                                  )}
                                  {recipient.status === "failed" && (
                                    <span className="inline-block w-3 h-3 rounded-full bg-red-500"></span>
                                  )}
                                  <span className="text-[#1A0A3D]">{recipient.name || recipient.email}</span>
                                  <span className="text-[#6B5B9E] text-xs">({recipient.email})</span>
                                  {recipient.error && (
                                    <span className="text-red-600 text-xs ml-auto">{recipient.error}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-[#6B5B9E] mb-2">Content</p>
                            <div className="bg-[#F4F1FB] rounded-lg p-3 max-h-[200px] overflow-y-auto text-sm text-[#1A0A3D]">
                              {mail.is_html ? (
                                <div className="font-mono text-xs whitespace-pre-wrap break-words">{mail.body.substring(0, 500)}...</div>
                              ) : (
                                <p className="whitespace-pre-wrap">{mail.body}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mail Preview Modal */}
        {showMailPreview && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-[#E8E3F3] px-6 py-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#1A0A3D]">Mail Preview</h3>
                <button onClick={() => setShowMailPreview(false)} className="text-[#6B5B9E] hover:text-[#1A0A3D]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <p className="text-xs font-medium text-[#6B5B9E] mb-2">Subject</p>
                  <p className="text-[#1A0A3D] font-medium">{mailForm.subject || "No subject"}</p>
                </div>

                {mailForm.subtitle && (
                  <div>
                    <p className="text-xs font-medium text-[#6B5B9E] mb-2">Subtitle</p>
                    <p className="text-[#1A0A3D]">{mailForm.subtitle}</p>
                  </div>
                )}

                <div>
                  <p className="text-xs font-medium text-[#6B5B9E] mb-2">Content</p>
                  <div className="bg-[#F4F1FB] rounded-lg p-4 border border-[#E8E3F3]">
                    {mailForm.isHtml && mailForm.htmlTemplate ? (
                      <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: mailForm.htmlTemplate
                            .replace(/\{\{name\}\}/gi, "John")
                            .replace(/\{\{full_name\}\}/gi, "John Doe")
                            .replace(/\{\{email\}\}/gi, "john@example.com")
                            .replace(/\{\{tier\}\}/gi, "builder"),
                        }}
                      />
                    ) : (
                      <pre className="whitespace-pre-wrap text-sm text-[#1A0A3D] font-sans">
                        {(mailForm.isHtml ? mailForm.htmlTemplate : mailForm.body)
                          .replace(/\{\{name\}\}/gi, "John")
                          .replace(/\{\{full_name\}\}/gi, "John Doe")
                          .replace(/\{\{email\}\}/gi, "john@example.com")
                          .replace(/\{\{tier\}\}/gi, "builder")}
                      </pre>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-[#6B5B9E] mb-2">Sample Data Used</p>
                  <div className="bg-[#F4F1FB] rounded-lg p-3 text-xs text-[#6B5B9E]">
                    <p>Name: John</p>
                    <p>Email: john@example.com</p>
                    <p>Tier: builder</p>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white border-t border-[#E8E3F3] px-6 py-4">
                <Button onClick={() => setShowMailPreview(false)} className="w-full bg-[#492B8C] hover:bg-[#2D1A69] text-white">
                  Close Preview
                </Button>
              </div>
            </div>
          </div>
        )}
      

        {/* Users Tab */}
        {activeTab === "users" && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Users</h3>
                <p className="text-sm text-white/60">Manage existing members or add a new user invite.</p>
              </div>
              <Button
                onClick={() => {
                  setShowAddUserForm((prev) => !prev)
                  setUserFormMessage(null)
                }}
                className="bg-[#FF6B34] hover:bg-[#E84C1E] text-white rounded-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                {showAddUserForm ? "Close Form" : "Add User"}
              </Button>
            </div>

            {userDeleteMessage && (
              <div
                className={`mb-4 rounded-lg px-3 py-2 text-sm ${
                  userDeleteMessage.type === "error"
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : userDeleteMessage.type === "success"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-blue-50 text-blue-700 border border-blue-200"
                }`}
              >
                {userDeleteMessage.text}
              </div>
            )}

            {showAddUserForm && (
              <div className="mb-6 bg-white/95 backdrop-blur rounded-2xl p-5 border border-white/10 shadow-lg">
                <h4 className="text-lg font-semibold text-[#1A0A3D] mb-4">Add New User</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1A0A3D] mb-1.5">Name *</label>
                    <Input
                      value={newUserForm.full_name}
                      onChange={(e) => setNewUserForm({ ...newUserForm, full_name: e.target.value })}
                      placeholder="Full name"
                      className="border-[#E8E3F3] focus:border-[#492B8C] focus:ring-[#492B8C]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1A0A3D] mb-1.5">Email *</label>
                    <Input
                      type="email"
                      value={newUserForm.email}
                      onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                      placeholder="user@example.com"
                      className="border-[#E8E3F3] focus:border-[#492B8C] focus:ring-[#492B8C]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1A0A3D] mb-1.5">Tier *</label>
                    <select
                      value={newUserForm.membership_tier}
                      onChange={(e) => setNewUserForm({ ...newUserForm, membership_tier: e.target.value as Resource["tier_required"] })}
                      className="w-full px-3 py-2 bg-white border border-[#E8E3F3] rounded-lg text-[#1A0A3D] focus:outline-none focus:border-[#492B8C] focus:ring-1 focus:ring-[#492B8C]"
                    >
                      <option value="initial">Explorer</option>
                      <option value="foundational">Foundational</option>
                      <option value="builder">Builder</option>
                      <option value="architect">Architect</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1A0A3D] mb-1.5">Avatar URL</label>
                    <Input
                      value={newUserForm.avatar_url}
                      onChange={(e) => setNewUserForm({ ...newUserForm, avatar_url: e.target.value })}
                      placeholder="https://..."
                      className="border-[#E8E3F3] focus:border-[#492B8C] focus:ring-[#492B8C]"
                    />
                  </div>
                </div>
                {userFormMessage && (
                  <div
                    className={`mt-4 rounded-lg px-3 py-2 text-sm ${
                      userFormMessage.type === "error"
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : userFormMessage.type === "success"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                    }`}
                  >
                    {userFormMessage.text}
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-2 mt-6">
                  <Button
                    onClick={handleAddUser}
                    disabled={creatingUser}
                    className="bg-[#00C8A7] hover:bg-[#00C8A7]/90 text-white"
                  >
                    {creatingUser ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                    {creatingUser ? "Adding User..." : "Add User"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddUserForm(false)
                      resetUserForm()
                    }}
                    className="border-[#E8E3F3] text-[#6B5B9E]"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}

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
                  const approvalCount = user.deletion_request_count || 0
                  const requiredApprovals = user.deletion_required_count || adminEmails.length || 1
                  const requestedByMe = Boolean(user.deletion_requested_by_me)
                  const canFinalizeDelete = !requestedByMe && approvalCount + 1 >= requiredApprovals
                  return (
                    <div key={user.id} className="bg-white/95 backdrop-blur rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className={`w-10 h-10 rounded-full ${userIsAdmin ? "bg-[#FF6B34]" : tierData.color} flex items-center justify-center text-white font-bold flex-shrink-0`}>
                        {(user.full_name?.[0] || user.email?.[0] || "?").toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium text-[#1A0A3D] truncate">{user.full_name || "No name"}</h4>
                          {userIsAdmin && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-[#FF6B34] text-white font-medium">
                              Admin
                            </span>
                          )}
                          {approvalCount > 0 && !userIsAdmin && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-[#F4F1FB] text-[#6B5B9E] font-medium">
                              Deletion pending {approvalCount}/{requiredApprovals}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[#6B5B9E] truncate">{user.email}</p>
                        <p className="text-xs text-[#6B5B9E]/60 mt-1">
                          Joined {new Date(user.created_at).toLocaleDateString()}
                        </p>
                        {(user.total_active_seconds || 0) > 0 && (
                          <p className="text-xs text-[#6B5B9E]/60 mt-1">
                            Active time: {formatDuration(user.total_active_seconds || 0)}
                            {user.last_seen_at ? ` • Last seen ${new Date(user.last_seen_at).toLocaleDateString()}` : ""}
                          </p>
                        )}
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
                          <>
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
                            <Button
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={deletingUserId === user.id || requestedByMe}
                              variant="outline"
                              className={`rounded-lg border ${
                                canFinalizeDelete
                                  ? "border-red-300 text-red-600 hover:bg-red-50"
                                  : "border-[#E8E3F3] text-[#6B5B9E]"
                              }`}
                            >
                              {deletingUserId === user.id ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4 mr-2" />
                              )}
                              {requestedByMe
                                ? "Requested"
                                : canFinalizeDelete
                                  ? "Final Delete"
                                  : "Mark for deletion"}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === "activity" && (
          <div className="space-y-4">
            <div className="bg-white/95 backdrop-blur rounded-2xl p-5 border border-white/10 shadow-lg">
              <div>
                <h3 className="text-lg font-semibold text-[#1A0A3D] mb-2">User Activity Analytics</h3>
                <p className="text-sm text-[#6B5B9E] mb-4">Track user engagement and time spent on the platform.</p>
              </div>

              {users.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[#6B5B9E]">No users yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#E8E3F3]">
                        <th className="text-left py-3 px-3 font-semibold text-[#1A0A3D]">User</th>
                        <th className="text-left py-3 px-3 font-semibold text-[#1A0A3D]">Email</th>
                        <th className="text-left py-3 px-3 font-semibold text-[#1A0A3D]">Tier</th>
                        <th className="text-left py-3 px-3 font-semibold text-[#1A0A3D]">Time Logged In</th>
                        <th className="text-left py-3 px-3 font-semibold text-[#1A0A3D]">Sessions</th>
                        <th className="text-left py-3 px-3 font-semibold text-[#1A0A3D]">Last Seen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users
                        .filter(user =>
                          user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .sort((a, b) => {
                          const aLastSeen = a.last_seen_at ? new Date(a.last_seen_at).getTime() : 0
                          const bLastSeen = b.last_seen_at ? new Date(b.last_seen_at).getTime() : 0
                          return bLastSeen - aLastSeen
                        })
                        .map((user) => {
                          const totalSeconds = user.total_active_seconds || 0
                          const hours = Math.floor(totalSeconds / 3600)
                          const minutes = Math.floor((totalSeconds % 3600) / 60)
                          const lastSeenDate = user.last_seen_at ? new Date(user.last_seen_at) : null
                          const isOnlineRecently = lastSeenDate && (Date.now() - lastSeenDate.getTime()) < 3600000

                          return (
                            <tr key={user.id} className="border-b border-[#F4F1FB] hover:bg-[#F4F1FB]/50 transition-colors">
                              <td className="py-3 px-3">
                                <div className="font-medium text-[#1A0A3D]">{user.full_name}</div>
                              </td>
                              <td className="py-3 px-3 text-[#6B5B9E]">{user.email}</td>
                              <td className="py-3 px-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  user.membership_tier === "architect" ? "bg-[#FF6B34]/10 text-[#FF6B34]" :
                                  user.membership_tier === "builder" ? "bg-[#FFD13F]/10 text-[#FFD13F]" :
                                  user.membership_tier === "foundational" ? "bg-[#00C8A7]/10 text-[#00C8A7]" :
                                  "bg-[#6B5B9E]/10 text-[#6B5B9E]"
                                }`}>
                                  {user.membership_tier === "initial" ? "Explorer" : 
                                   user.membership_tier.charAt(0).toUpperCase() + user.membership_tier.slice(1)}
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-[#492B8C]" />
                                  <span className="text-[#1A0A3D] font-medium">
                                    {hours}h {minutes}m
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-[#1A0A3D] font-medium">
                                {user.activity_session_count || 0}
                              </td>
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2">
                                  {isOnlineRecently && (
                                    <span className="w-2 h-2 bg-[#00C8A7] rounded-full animate-pulse" title="Online in last hour" />
                                  )}
                                  <span className="text-[#6B5B9E] text-xs">
                                    {lastSeenDate ? (
                                      (() => {
                                        const now = Date.now()
                                        const diff = now - lastSeenDate.getTime()
                                        if (diff < 3600000) return "Just now"
                                        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
                                        if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
                                        return lastSeenDate.toLocaleDateString()
                                      })()
                                    ) : "Never"}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
