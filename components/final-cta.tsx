"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { ArrowRight, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"

export function FinalCTA() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section className="py-24 px-4 bg-[#2D1A69]">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-4xl mx-auto text-center"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#492B8C]/50 border border-[#492B8C] mb-6">
          <span className="w-2 h-2 rounded-full bg-[#FF6B34] pulse-glow" />
          <span className="text-sm text-[#C3AFFF] font-medium">Season 01 seats are limited</span>
        </div>
        
        <h2
          className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight text-balance"
          style={{ fontFamily: "var(--font-cal-sans)" }}
        >
          Ready to Build Your Future with AI?
        </h2>
        <p className="text-lg sm:text-xl text-[#C3AFFF] mb-10 max-w-2xl mx-auto text-pretty">
          Founding cohort members get the best access, the earliest platform spot, and the most to gain from joining now.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <Button
            size="lg"
            asChild
            className="shimmer-btn bg-[#FF6B34] text-white hover:bg-[#FF6B34]/90 rounded-full px-8 h-14 text-base font-medium shadow-lg shadow-[#FF6B34]/20"
          >
            <a href="https://docs.google.com/forms/d/e/1FAIpQLSelAKQrkxz97RxCo7B8K-xNOAe3-wXhtmnxyW6qx-WNA_82ZA/viewform?usp=header" target="_blank" rel="noopener noreferrer">
              Express Interest
              <ArrowRight className="ml-2 w-5 h-5" />
            </a>
          </Button>
        </div>

        <div className="flex items-center justify-center gap-2 text-[#C3AFFF]">
          <Mail className="w-4 h-4" />
          <a href="mailto:support@aibuilder.space" className="text-sm hover:text-white transition-colors">
            support@aibuilder.space
          </a>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-[#C3AFFF]">
          <span>4 Weeks</span>
          <span className="w-1 h-1 rounded-full bg-[#492B8C]" />
          <span>2 to 3 Live Classes Per Week</span>
          <span className="w-1 h-1 rounded-full bg-[#492B8C]" />
          <span>Contributors Keep 100% of AI App Earnings</span>
          <span className="w-1 h-1 rounded-full bg-[#492B8C]" />
          <span>Hybrid / Online</span>
        </div>
      </motion.div>
    </section>
  )
}
