// Mock data and utility functions for Certificate Management

export interface Cohort {
  id: string
  code: string
  name: string
  user_count: number
  is_current: boolean
}

export interface CohortUser {
  id: string
  full_name: string
  email: string
  membership_tier: "initial" | "foundational" | "builder" | "architect"
  avatar_url?: string
}

export interface CertificateStatus {
  user_id: string
  full_name: string
  email: string
  status: "pending" | "in_queue" | "generating" | "generated" | "failed"
  certificate_url?: string
  visibility: "visible" | "hidden"
  error_message?: string
  generated_at?: string
  progress_percent?: number
}

// Mock cohorts data
export const MOCK_COHORTS: Cohort[] = [
  {
    id: "cohort-0",
    code: "cohort-0",
    name: "Cohort 0 (Current)",
    user_count: 12,
    is_current: true,
  },
  {
    id: "cohort-1",
    code: "cohort-1",
    name: "Cohort 1",
    user_count: 8,
    is_current: false,
  },
  {
    id: "cohort-2",
    code: "cohort-2",
    name: "Cohort 2",
    user_count: 15,
    is_current: false,
  },
]

// Mock users data
export const MOCK_USERS: CohortUser[] = [
  {
    id: "u1",
    full_name: "John Doe",
    email: "john@example.com",
    membership_tier: "foundational",
    avatar_url: "https://ui-avatars.com/api/?name=John+Doe",
  },
  {
    id: "u2",
    full_name: "Jane Smith",
    email: "jane@example.com",
    membership_tier: "builder",
    avatar_url: "https://ui-avatars.com/api/?name=Jane+Smith",
  },
  {
    id: "u3",
    full_name: "Bob Wilson",
    email: "bob@example.com",
    membership_tier: "foundational",
    avatar_url: "https://ui-avatars.com/api/?name=Bob+Wilson",
  },
  {
    id: "u4",
    full_name: "Alice Johnson",
    email: "alice@example.com",
    membership_tier: "architect",
    avatar_url: "https://ui-avatars.com/api/?name=Alice+Johnson",
  },
  {
    id: "u5",
    full_name: "Charlie Brown",
    email: "charlie@example.com",
    membership_tier: "initial",
    avatar_url: "https://ui-avatars.com/api/?name=Charlie+Brown",
  },
  {
    id: "u6",
    full_name: "Diana Martinez",
    email: "diana@example.com",
    membership_tier: "builder",
    avatar_url: "https://ui-avatars.com/api/?name=Diana+Martinez",
  },
  {
    id: "u7",
    full_name: "Ethan Lee",
    email: "ethan@example.com",
    membership_tier: "foundational",
    avatar_url: "https://ui-avatars.com/api/?name=Ethan+Lee",
  },
  {
    id: "u8",
    full_name: "Fiona Garcia",
    email: "fiona@example.com",
    membership_tier: "architect",
    avatar_url: "https://ui-avatars.com/api/?name=Fiona+Garcia",
  },
  {
    id: "u9",
    full_name: "George Taylor",
    email: "george@example.com",
    membership_tier: "builder",
    avatar_url: "https://ui-avatars.com/api/?name=George+Taylor",
  },
  {
    id: "u10",
    full_name: "Hannah White",
    email: "hannah@example.com",
    membership_tier: "foundational",
    avatar_url: "https://ui-avatars.com/api/?name=Hannah+White",
  },
  {
    id: "u11",
    full_name: "Ivan Robinson",
    email: "ivan@example.com",
    membership_tier: "initial",
    avatar_url: "https://ui-avatars.com/api/?name=Ivan+Robinson",
  },
  {
    id: "u12",
    full_name: "Julia Clark",
    email: "julia@example.com",
    membership_tier: "builder",
    avatar_url: "https://ui-avatars.com/api/?name=Julia+Clark",
  },
]

// Simulate certificate status progression
export const simulateCertificateStatus = (
  userId: string,
  stepNumber: number
): CertificateStatus["status"] => {
  const statuses: CertificateStatus["status"][] = [
    "pending",
    "in_queue",
    "generating",
    "generated",
  ]
  // Random failure for 1 in 7 users
  if (parseInt(userId.substring(1)) % 7 === 0 && stepNumber === 4) {
    return "failed"
  }
  return statuses[Math.min(stepNumber, statuses.length - 1)]
}

// Generate mock certificate statuses
export const generateMockStatuses = (
  userIds: string[]
): CertificateStatus[] => {
  return userIds.map((userId) => {
    const user = MOCK_USERS.find((u) => u.id === userId)!
    return {
      user_id: userId,
      full_name: user.full_name,
      email: user.email,
      status: "pending",
      visibility: "hidden",
      progress_percent: 0,
    }
  })
}

// Simulate progress update
export const updateProgressStepSimulation = (
  statuses: CertificateStatus[],
  step: number
): CertificateStatus[] => {
  return statuses.map((status) => ({
    ...status,
    status: simulateCertificateStatus(status.user_id, step),
    progress_percent: step * 25,
    certificate_url:
      step === 4 && simulateCertificateStatus(status.user_id, step) === "generated"
        ? `https://certificates.aibuilder.space/${status.user_id}.pdf`
        : undefined,
    generated_at:
      step === 4 && simulateCertificateStatus(status.user_id, step) === "generated"
        ? new Date().toISOString()
        : undefined,
    error_message:
      step === 4 && simulateCertificateStatus(status.user_id, step) === "failed"
        ? "Generation failed - invalid user data"
        : undefined,
  }))
}

// Get tier badge color
export const getTierColor = (tier: string): string => {
  const colors: Record<string, string> = {
    initial: "bg-gray-100 text-gray-700",
    foundational: "bg-blue-100 text-blue-700",
    builder: "bg-purple-100 text-purple-700",
    architect: "bg-pink-100 text-pink-700",
  }
  return colors[tier] || colors.initial
}

// Get status badge styling
export const getStatusBadge = (
  status: CertificateStatus["status"]
): { bg: string; text: string; icon: string } => {
  const styles: Record<CertificateStatus["status"], any> = {
    pending: { bg: "bg-gray-100", text: "text-gray-700", icon: "⏳" },
    in_queue: { bg: "bg-yellow-100", text: "text-yellow-700", icon: "⏳" },
    generating: { bg: "bg-blue-100", text: "text-blue-700", icon: "🔄" },
    generated: { bg: "bg-green-100", text: "text-green-700", icon: "✅" },
    failed: { bg: "bg-red-100", text: "text-red-700", icon: "❌" },
  }
  return styles[status]
}

// Format status label
export const getStatusLabel = (status: CertificateStatus["status"]): string => {
  const labels: Record<CertificateStatus["status"], string> = {
    pending: "Pending",
    in_queue: "In Queue",
    generating: "Generating",
    generated: "Generated",
    failed: "Failed",
  }
  return labels[status]
}
