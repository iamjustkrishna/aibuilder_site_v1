import Link from "next/link"
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import RegistrationSuccessClient from "./success-client"

type SearchParams = {
  cohort?: string | string[]
}

export default function RegistrationSuccessPage({
  searchParams,
}: {
  searchParams?: SearchParams
}) {
  const cohortValue = searchParams?.cohort
  const cohortName = Array.isArray(cohortValue) ? cohortValue[0] : cohortValue || "Cohort 1"

  return (
    <RegistrationSuccessClient cohortName={cohortName}>
      <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(73,43,140,0.14),_transparent_42%),linear-gradient(180deg,#f7f4ff_0%,#ffffff_100%)] px-4 py-16">
        <div className="w-full max-w-2xl rounded-3xl border border-[#E8E3F3] bg-white/95 p-8 shadow-[0_24px_80px_rgba(26,10,61,0.12)] backdrop-blur sm:p-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E8E3F3] bg-[#F4F1FB] px-4 py-2 text-sm font-medium text-[#492B8C]">
            <Sparkles className="h-4 w-4 text-[#FF6B34]" />
            You are in line for {cohortName}
          </div>

          <div className="mt-6 flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-bold tracking-tight text-[#1A0A3D] sm:text-4xl">
                Your registration is in.
              </h1>
              <p className="text-lg leading-relaxed text-[#6B5B9E]">
                Thanks for joining the next cohort. We will share the next steps and session details soon.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild className="h-12 rounded-full bg-[#FF6B34] px-6 text-white hover:bg-[#E84C1E]">
              <Link href="/">
                Back to Home
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-12 rounded-full border-[#D7CCE9] px-6 text-[#1A0A3D] hover:bg-[#F4F1FB]">
              <Link href="/#curriculum">View Curriculum</Link>
            </Button>
          </div>
        </div>
      </main>
    </RegistrationSuccessClient>
  )
}
