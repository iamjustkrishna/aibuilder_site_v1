"use client"

import { useEffect, useState, type FormEvent } from "react"
import { motion } from "framer-motion"
import { CheckCircle2, Loader2, Mail, Phone, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type CurrentCohort = {
  id: string
  code: string
  name: string
  description: string | null
  is_current: boolean
}

type FormState = {
  full_name: string
  phone_number: string
  email: string
  project_description: string
  experience_level: "beginner" | "intermediate" | "advanced"
  daily_time_commitment_hours: string
  preferred_timing_ist: string
  preferred_timing_other: string
  availability: "weekdays" | "weekends" | "both"
}

const EXPERIENCE_OPTIONS = [
  {
    value: "beginner",
    title: "Beginner",
    description: "Just starting or little experience",
  },
  {
    value: "intermediate",
    title: "Intermediate",
    description: "Built a few projects and know the fundamentals",
  },
  {
    value: "advanced",
    title: "Advanced",
    description: "Professional experience or deep knowledge",
  },
] as const

const TIMING_OPTIONS = ["8:00 PM - 9:00 PM", "9:00 PM - 10:00 PM", "10:00 PM - 11:00 PM", "Other"] as const
const AVAILABILITY_OPTIONS = [
  { value: "weekdays", label: "Weekdays (Monday to Friday)" },
  { value: "weekends", label: "Only Weekends (Saturday and Sunday)" },
  { value: "both", label: "Both Weekdays and Weekends" },
] as const

export function CohortRegistrationForm() {
  const [currentCohort, setCurrentCohort] = useState<CurrentCohort | null>(null)
  const [loadingCohort, setLoadingCohort] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null)
  const [form, setForm] = useState<FormState>({
    full_name: "",
    phone_number: "",
    email: "",
    project_description: "",
    experience_level: "beginner",
    daily_time_commitment_hours: "",
    preferred_timing_ist: "8:00 PM - 9:00 PM",
    preferred_timing_other: "",
    availability: "weekdays",
  })

  useEffect(() => {
    async function loadCurrentCohort() {
      try {
        const res = await fetch("/api/public/cohorts/current")
        const data = await res.json()
        setCurrentCohort(data.current_cohort || null)
      } catch (error) {
        console.error("Failed to load current cohort:", error)
        setCurrentCohort(null)
      } finally {
        setLoadingCohort(false)
      }
    }

    loadCurrentCohort()
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)

    if (!currentCohort) {
      setMessage({ type: "error", text: "Registration is not open right now." })
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/cohort-registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Failed to submit registration." })
        return
      }

      setMessage({
        type: "success",
        text: `Your registration for ${data.cohort?.name || "the current cohort"} has been received.`,
      })
      setForm({
        full_name: "",
        phone_number: "",
        email: "",
        project_description: "",
        experience_level: "beginner",
        daily_time_commitment_hours: "",
        preferred_timing_ist: "8:00 PM - 9:00 PM",
        preferred_timing_other: "",
        availability: "weekdays",
      })
    } catch (error) {
      console.error("Failed to submit cohort registration:", error)
      setMessage({ type: "error", text: "Something went wrong while submitting the form." })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="relative overflow-hidden px-4 py-16 sm:py-20 bg-[radial-gradient(circle_at_top,_rgba(73,43,140,0.14),_transparent_40%),linear-gradient(180deg,#f7f4ff_0%,#ffffff_100%)]">
      <div className="absolute inset-0 pointer-events-none opacity-70">
        <div className="absolute top-10 left-10 h-40 w-40 rounded-full bg-[#FF6B34]/10 blur-3xl" />
        <div className="absolute right-10 top-32 h-64 w-64 rounded-full bg-[#492B8C]/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.05fr_0.95fr] items-start">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E8E3F3] bg-white px-4 py-2 shadow-sm">
            <Sparkles className="h-4 w-4 text-[#FF6B34]" />
            <span className="text-sm font-medium text-[#492B8C]">
              {loadingCohort ? "Loading current cohort..." : currentCohort ? `Register for ${currentCohort.name}` : "Registration closed"}
            </span>
          </div>

          <div className="space-y-4">
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#1A0A3D]"
              style={{ fontFamily: "var(--font-cal-sans), sans-serif" }}
            >
              Register for the next cohort
            </h1>
            <p className="max-w-2xl text-lg sm:text-xl leading-relaxed text-[#6B5B9E]">
              Submit your details on the website and we will save your registration directly in the backend for admin review.
            </p>
          </div>

          <div className="grid gap-3 rounded-3xl border border-[#E8E3F3] bg-white/85 p-6 shadow-[0_24px_80px_rgba(26,10,61,0.08)] backdrop-blur">
            <div className="flex items-center gap-3 text-sm text-[#6B5B9E]">
              <Phone className="h-4 w-4 text-[#492B8C]" />
              <span>Admin can review every registration field from the dashboard.</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[#6B5B9E]">
              <Mail className="h-4 w-4 text-[#492B8C]" />
              <span>No external Google Form required.</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[#6B5B9E]">
              <CheckCircle2 className="h-4 w-4 text-[#00C8A7]" />
              <span>Submissions are linked to the currently live cohort.</span>
            </div>
          </div>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          onSubmit={handleSubmit}
          className="rounded-3xl border border-[#E8E3F3] bg-white/95 p-5 sm:p-6 shadow-[0_24px_80px_rgba(26,10,61,0.12)] backdrop-blur"
        >
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-[#1A0A3D]">Cohort Registration</h2>
              <p className="mt-1 text-sm text-[#6B5B9E]">
                {loadingCohort
                  ? "Checking the active cohort..."
                  : currentCohort
                    ? `${currentCohort.code} is currently open for registrations.`
                    : "No cohort is currently open."}
              </p>
            </div>
            <div className="rounded-full bg-[#F4F1FB] px-3 py-1 text-xs font-medium text-[#492B8C]">
              Live cohort
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-[#1A0A3D]">Full Name</label>
              <Input
                required
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="Your full name"
                className="border-[#E8E3F3] focus:border-[#492B8C] focus:ring-[#492B8C]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#1A0A3D]">Phone Number</label>
              <Input
                required
                type="tel"
                value={form.phone_number}
                onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                placeholder="+91..."
                className="border-[#E8E3F3] focus:border-[#492B8C] focus:ring-[#492B8C]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#1A0A3D]">Email Address</label>
              <Input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="border-[#E8E3F3] focus:border-[#492B8C] focus:ring-[#492B8C]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-[#1A0A3D]">
                What kind of project or application are you looking to build during the mentorship?
              </label>
              <Textarea
                required
                value={form.project_description}
                onChange={(e) => setForm({ ...form, project_description: e.target.value })}
                placeholder="Describe the product idea you want to build"
                className="min-h-28 border-[#E8E3F3] focus:border-[#492B8C] focus:ring-[#492B8C] resize-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#1A0A3D]">Your Current Experience Level in Coding</label>
              <div className="grid gap-2">
                {EXPERIENCE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setForm({ ...form, experience_level: option.value })}
                    className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
                      form.experience_level === option.value
                        ? "border-[#492B8C] bg-[#F4F1FB]"
                        : "border-[#E8E3F3] bg-white hover:border-[#492B8C]/40"
                    }`}
                  >
                    <div className="text-sm font-semibold text-[#1A0A3D]">{option.title}</div>
                    <div className="text-xs text-[#6B5B9E]">{option.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#1A0A3D]">
                Desired daily time commitment (hours)
              </label>
              <Input
                required
                type="number"
                min="0.5"
                step="0.5"
                value={form.daily_time_commitment_hours}
                onChange={(e) => setForm({ ...form, daily_time_commitment_hours: e.target.value })}
                placeholder="2"
                className="border-[#E8E3F3] focus:border-[#492B8C] focus:ring-[#492B8C]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-[#1A0A3D]">
                Preferred Timing for Mentoring Session (IST - Indian Standard Time)
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                {TIMING_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setForm({ ...form, preferred_timing_ist: option })}
                    className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
                      form.preferred_timing_ist === option
                        ? "border-[#492B8C] bg-[#F4F1FB]"
                        : "border-[#E8E3F3] bg-white hover:border-[#492B8C]/40"
                    }`}
                  >
                    <div className="text-sm font-semibold text-[#1A0A3D]">{option}</div>
                  </button>
                ))}
              </div>

              {form.preferred_timing_ist === "Other" && (
                <div className="mt-3">
                  <Input
                    required
                    value={form.preferred_timing_other}
                    onChange={(e) => setForm({ ...form, preferred_timing_other: e.target.value })}
                    placeholder="Tell us your preferred time"
                    className="border-[#E8E3F3] focus:border-[#492B8C] focus:ring-[#492B8C]"
                  />
                </div>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-[#1A0A3D]">When are you generally available for sessions?</label>
              <div className="grid gap-2">
                {AVAILABILITY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setForm({ ...form, availability: option.value })}
                    className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
                      form.availability === option.value
                        ? "border-[#492B8C] bg-[#F4F1FB]"
                        : "border-[#E8E3F3] bg-white hover:border-[#492B8C]/40"
                    }`}
                  >
                    <div className="text-sm font-semibold text-[#1A0A3D]">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {message && (
            <div
              className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
                message.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              type="submit"
              disabled={submitting || !currentCohort}
              className="h-12 rounded-full bg-[#FF6B34] px-6 text-white hover:bg-[#E84C1E]"
            >
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {submitting ? "Submitting..." : "Register for Cohort 1"}
            </Button>
            <p className="text-xs text-[#6B5B9E]">
              By registering, your information will be stored in the cohort backend for admin review.
            </p>
          </div>
        </motion.form>
      </div>
    </section>
  )
}
