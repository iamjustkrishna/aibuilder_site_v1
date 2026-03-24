"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { ArrowRight, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"

export function FinalCTA() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section className="py-24 px-4">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-4xl mx-auto text-center"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-glow" />
          <span className="text-sm text-emerald-400 font-medium">Season 01 seats are limited</span>
        </div>
        
        <h2
          className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight text-balance"
          style={{ fontFamily: "var(--font-cal-sans)" }}
        >
          Ready to Build Your Future with AI?
        </h2>
        <p className="text-lg sm:text-xl text-slate-400 mb-10 max-w-2xl mx-auto text-pretty">
          Founding cohort members get the best access, the earliest platform spot, and the most to gain from joining now.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <Button
            size="lg"
            className="shimmer-btn bg-emerald-500 text-slate-950 hover:bg-emerald-400 rounded-full px-8 h-14 text-base font-medium shadow-lg shadow-emerald-500/20"
          >
            Apply / Express Interest
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>

        <div className="flex items-center justify-center gap-2 text-slate-500">
          <Mail className="w-4 h-4" />
          <a href="mailto:chitranshuharbola@gmail.com" className="text-sm hover:text-emerald-400 transition-colors">
            chitranshuharbola@gmail.com
          </a>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
          <span>4 Weeks</span>
          <span className="w-1 h-1 rounded-full bg-slate-700" />
          <span>2 to 3 Live Classes Per Week</span>
          <span className="w-1 h-1 rounded-full bg-slate-700" />
          <span>100% Your Earnings</span>
          <span className="w-1 h-1 rounded-full bg-slate-700" />
          <span>Hybrid / Online</span>
        </div>
      </motion.div>
    </section>
  )
}
