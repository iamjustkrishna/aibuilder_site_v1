import type React from "react"
import type { Metadata } from "next"
import { Manrope, DM_Sans, Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Chatbot } from "@/components/chatbot"
import { ActivityTracker } from "@/components/activity-tracker"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-cal-sans",
  weight: ["600", "700"],
  display: "swap",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: "AI Builder Cohort | Season 0 Complete - Join Season 1 | Build AI, Launch It, Keep It All",
  description: "A 4-week cohort where you go from zero to shipping real AI apps and agents, then publish them on our marketplace and keep 100% of your earnings.",
  generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${manrope.variable} ${dmSans.variable} ${inter.variable} font-sans antialiased`}>
        <div className="noise-overlay" aria-hidden="true" />
        {children}
        <ActivityTracker />
        <Chatbot />
        <Toaster position="top-center" richColors closeButton />
        <Analytics />
      </body>
    </html>
  )
}
