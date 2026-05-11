"use client"

import { useEffect } from "react"
import { toast } from "sonner"
import type { ReactNode } from "react"

export default function RegistrationSuccessClient({
  cohortName,
  children,
}: {
  cohortName: string
  children: ReactNode
}) {
  useEffect(() => {
    toast.success("Form submitted successfully")
  }, [cohortName])

  return children
}
