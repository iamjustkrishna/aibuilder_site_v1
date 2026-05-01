"use client"

import { useState, useEffect } from "react"
import { ChevronDown, Download, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react"
import {
  Cohort,
  CohortUser,
  CertificateStatus,
  MOCK_COHORTS,
  MOCK_USERS,
  generateMockStatuses,
  updateProgressStepSimulation,
  getStatusBadge,
  getStatusLabel,
  getTierColor,
} from "@/lib/certificate-utils"

export default function CertificateManagement() {
  // State Management
  const [selectedCohort, setSelectedCohort] = useState<string>("cohort-0")
  const [showCohortDropdown, setShowCohortDropdown] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [certificateStatuses, setCertificateStatuses] = useState<CertificateStatus[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [pollingActive, setPollingActive] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [pollingStep, setPollingStep] = useState(0)

  const currentCohort = MOCK_COHORTS.find((c) => c.id === selectedCohort)
  const cohortUsers = MOCK_USERS.slice(0, currentCohort?.user_count || 0)

  // Toast notification effect
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toastMessage])

  // Polling effect - simulates status updates every 2 seconds
  useEffect(() => {
    if (!pollingActive) return

    const timer = setTimeout(() => {
      setPollingStep((prev) => {
        const nextStep = prev + 1
        if (nextStep > 4) {
          setPollingActive(false)
          return prev
        }
        setCertificateStatuses((prev) => updateProgressStepSimulation(prev, nextStep))
        return nextStep
      })
    }, 2000)

    return () => clearTimeout(timer)
  }, [pollingActive, pollingStep])

  // Prevent polling completion when step reaches 4
  useEffect(() => {
    if (pollingStep === 4) {
      setPollingActive(false)
    }
  }, [pollingStep])

  // Handle Select All checkbox
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      setSelectedUsers(new Set(cohortUsers.map((u) => u.id)))
    } else {
      setSelectedUsers(new Set())
    }
  }

  // Handle individual user selection
  const handleUserToggle = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUsers)
    if (checked) {
      newSelected.add(userId)
    } else {
      newSelected.delete(userId)
    }
    setSelectedUsers(newSelected)
    setSelectAll(newSelected.size === cohortUsers.length)
  }

  // Generate certificates
  const handleGenerateCertificates = async () => {
    if (selectedUsers.size === 0) {
      setToastMessage("Please select at least one user")
      return
    }

    setIsGenerating(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))

    const statuses = generateMockStatuses(Array.from(selectedUsers))
    setCertificateStatuses(statuses)
    setPollingActive(true)
    setPollingStep(0)
    setIsGenerating(false)
    setToastMessage(`Queued ${selectedUsers.size} certificate(s) for generation`)
  }

  // Toggle visibility
  const handleToggleVisibility = (userId: string) => {
    setCertificateStatuses((prev) =>
      prev.map((s) =>
        s.user_id === userId
          ? {
              ...s,
              visibility: s.visibility === "visible" ? "hidden" : "visible",
            }
          : s
      )
    )
  }

  // Make all generated visible
  const handleMakeAllVisible = () => {
    const generatedCount = certificateStatuses.filter((s) => s.status === "generated").length
    if (generatedCount === 0) {
      setToastMessage("No generated certificates to make visible")
      return
    }

    setCertificateStatuses((prev) =>
      prev.map((s) => (s.status === "generated" ? { ...s, visibility: "visible" } : s))
    )
    setToastMessage(`Made ${generatedCount} certificate(s) visible`)
  }

  const generatedCount = certificateStatuses.filter((s) => s.status === "generated").length
  const failedCount = certificateStatuses.filter((s) => s.status === "failed").length
  const inProgressCount = certificateStatuses.filter(
    (s) => s.status !== "generated" && s.status !== "failed"
  ).length

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6">
        <h2 className="text-2xl font-bold text-gray-900">Certificate Management</h2>
        <p className="mt-1 text-sm text-gray-600">
          Generate and manage certificates for cohort members
        </p>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 flex items-start gap-3">
          <div className="mt-0.5 text-blue-600">ℹ️</div>
          <p className="text-sm text-blue-800">{toastMessage}</p>
        </div>
      )}

      {/* Cohort & Generation Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Step 1: Select Cohort</h3>

        {/* Cohort Dropdown */}
        <div className="max-w-xs">
          <label className="block text-sm font-medium text-gray-700 mb-2">Cohort</label>
          <div className="relative">
            <button
              onClick={() => setShowCohortDropdown(!showCohortDropdown)}
              className="w-full px-4 py-2 text-left bg-white border border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 flex items-center justify-between"
            >
              <span className="text-gray-900">{currentCohort?.name || "Select cohort"}</span>
              <ChevronDown
                className={`w-4 h-4 text-gray-600 transition-transform ${
                  showCohortDropdown ? "rotate-180" : ""
                }`}
              />
            </button>

            {showCohortDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                {MOCK_COHORTS.map((cohort) => (
                  <button
                    key={cohort.id}
                    onClick={() => {
                      setSelectedCohort(cohort.id)
                      setShowCohortDropdown(false)
                      setSelectedUsers(new Set())
                      setSelectAll(false)
                      setCertificateStatuses([])
                    }}
                    className={`w-full px-4 py-3 text-left text-sm hover:bg-purple-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                      selectedCohort === cohort.id
                        ? "bg-purple-50 text-purple-900 font-medium"
                        : "text-gray-700"
                    }`}
                  >
                    {cohort.name}
                    <span className="text-gray-500 text-xs ml-2">({cohort.user_count} users)</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Selection Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Step 2: Select Users</h3>
          <p className="mt-1 text-sm text-gray-600">
            {selectedUsers.size} of {cohortUsers.length} users selected
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Select All</span>
                  </label>
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {cohortUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(user.id)}
                        onChange={(e) => handleUserToggle(user.id, e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                    </label>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatar_url}
                        alt={user.full_name}
                        className="w-8 h-8 rounded-full"
                      />
                      <span className="text-sm font-medium text-gray-900">{user.full_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getTierColor(user.membership_tier)}`}>
                      {user.membership_tier.charAt(0).toUpperCase() + user.membership_tier.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generation Button */}
      <button
        onClick={handleGenerateCertificates}
        disabled={selectedUsers.size === 0 || isGenerating}
        className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all flex items-center justify-center gap-2 ${
          selectedUsers.size === 0 || isGenerating
            ? "bg-gray-300 cursor-not-allowed"
            : "bg-purple-600 hover:bg-purple-700 active:scale-95"
        }`}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Queueing...
          </>
        ) : (
          <>
            🚀 Generate Certificates for {selectedUsers.size}{" "}
            {selectedUsers.size === 1 ? "User" : "Users"}
          </>
        )}
      </button>

      {/* Status Summary */}
      {certificateStatuses.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="text-2xl font-bold text-blue-900">{inProgressCount}</div>
            <div className="text-sm text-blue-700">In Progress</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <div className="text-2xl font-bold text-green-900">{generatedCount}</div>
            <div className="text-sm text-green-700">Generated</div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
            <div className="text-2xl font-bold text-red-900">{failedCount}</div>
            <div className="text-sm text-red-700">Failed</div>
          </div>
        </div>
      )}

      {/* Status Tracking Table */}
      {certificateStatuses.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Generation Status</h3>
              <p className="mt-1 text-sm text-gray-600">Real-time certificate generation tracking</p>
            </div>
            <button
              onClick={handleMakeAllVisible}
              disabled={generatedCount === 0}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                generatedCount === 0
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-purple-100 text-purple-700 hover:bg-purple-200"
              }`}
            >
              Make All Generated Visible
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Certificate
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-gray-700">
                    Visibility
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {certificateStatuses.map((status) => {
                  const badge = getStatusBadge(status.status)
                  return (
                    <tr key={status.user_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {status.full_name}
                          </div>
                          <div className="text-xs text-gray-500">{status.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}
                        >
                          <span>{badge.icon}</span>
                          {getStatusLabel(status.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs overflow-hidden">
                            <div
                              className="bg-purple-600 h-full transition-all"
                              style={{ width: `${status.progress_percent || 0}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-600">
                            {status.progress_percent || 0}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {status.certificate_url ? (
                          <a
                            href={status.certificate_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-700 text-sm font-medium"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </a>
                        ) : status.error_message ? (
                          <div className="inline-flex items-center gap-1 text-red-600">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-xs">{status.error_message}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <button
                            onClick={() => handleToggleVisibility(status.user_id)}
                            disabled={status.status !== "generated"}
                            className={`p-2 rounded-lg transition-colors ${
                              status.status !== "generated"
                                ? "text-gray-300 cursor-not-allowed"
                                : status.visibility === "visible"
                                  ? "text-purple-600 bg-purple-50 hover:bg-purple-100"
                                  : "text-gray-400 hover:bg-gray-100"
                            }`}
                          >
                            {status.visibility === "visible" ? (
                              <Eye className="w-5 h-5" />
                            ) : (
                              <EyeOff className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
