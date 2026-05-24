"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Star, ArrowRight, X, Sparkles } from "lucide-react"
import Link from "next/link"

export function FloatingShowcase() {
  const pathname = usePathname()
  const [showcase, setShowcase] = useState<any>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Fetch showcases
    fetch("/api/cohorts/showcases")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setShowcase(data[0])
        }
      })
      .catch(err => console.error("Failed to load floating showcase:", err))
  }, [])

  // Do not show on the cohort showcase page itself or if dismissed
  if (!showcase || dismissed || pathname?.startsWith("/cohort/")) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: -50, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
        exit={{ opacity: 0, x: -50, y: 50, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 300, damping: 25, delay: 1 }}
        className="fixed bottom-6 left-6 z-40 hidden md:block max-w-[280px]"
      >
        <div className="relative group p-4 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl hover:border-[#00C8A7]/50 transition-all duration-300">
          {/* Subtle glowing back-light */}
          <div className="absolute inset-0 rounded-2xl bg-[#00C8A7]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl pointer-events-none" />

          {/* Close button */}
          <button 
            onClick={() => setDismissed(true)}
            className="absolute top-2.5 right-2.5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/5 transition-colors z-10"
            aria-label="Dismiss showcase notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {/* Content */}
          <Link href={`/cohort/${showcase.slug}`} className="relative block space-y-2 select-none">
            <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-[#00C8A7] tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00C8A7] animate-pulse" />
              <span>{showcase.cohort?.code || "COHORT-0"} GRADUATED</span>
            </div>
            
            <h4 className="text-xs font-bold text-white tracking-wide group-hover:text-[#00C8A7] transition-colors leading-snug flex items-center gap-1">
              <Star className="w-3 h-3 text-[#FFD13F] fill-[#FFD13F] animate-pulse flex-shrink-0" />
              <span className="truncate">{showcase.title || "Graduation Gallery"}</span>
            </h4>
            
            <p className="text-[11px] text-slate-400 leading-normal line-clamp-2">
              See the stunning AI apps and autonomous agents shipped by our graduates!
            </p>

            <div className="flex items-center gap-1 text-[10px] font-extrabold text-[#00C8A7] pt-1 tracking-wider uppercase group-hover:text-[#00C8A7] transition-colors">
              <span>View Shipped Projects</span>
              <ArrowRight className="w-3 h-3 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
