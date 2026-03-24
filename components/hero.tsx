"use client"

import { motion } from "framer-motion"
import { ArrowRight, Calendar, Video, Percent } from "lucide-react"
import { Button } from "@/components/ui/button"

const stats = [
  { icon: Calendar, value: "4", label: "Weeks" },
  { icon: Video, value: "2-3x", label: "Live Classes/wk" },
  { icon: Percent, value: "100%", label: "Your Earnings" },
]

const textRevealVariants = {
  hidden: { y: "100%" },
  visible: (i: number) => ({
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
      delay: i * 0.1,
    },
  }),
}

export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-16 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 pointer-events-none" />

      {/* Subtle radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 border border-slate-700/50 mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-glow" />
          <span className="text-sm text-slate-400">Season 01 | Limited Seats</span>
        </motion.div>

        {/* Headline with text mask animation */}
        <h1
          className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6"
          style={{ fontFamily: "var(--font-cal-sans), sans-serif" }}
        >
          <span className="block overflow-hidden">
            <motion.span className="block" variants={textRevealVariants} initial="hidden" animate="visible" custom={0}>
              Build AI.
            </motion.span>
          </span>
          <span className="block overflow-hidden">
            <motion.span
              className="block text-emerald-400"
              variants={textRevealVariants}
              initial="hidden"
              animate="visible"
              custom={1}
            >
              Launch It.
            </motion.span>
          </span>
          <span className="block overflow-hidden">
            <motion.span
              className="block text-slate-500"
              variants={textRevealVariants}
              initial="hidden"
              animate="visible"
              custom={2}
            >
              Keep It All.
            </motion.span>
          </span>
        </h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          A 4-week cohort where you go from zero to shipping real AI apps and agents, then publish them on our marketplace and keep every rupee you earn. No commissions. No cuts.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <Button
            size="lg"
            className="shimmer-btn bg-emerald-500 text-slate-950 hover:bg-emerald-400 rounded-full px-8 h-12 text-base font-medium shadow-lg shadow-emerald-500/20"
          >
            Apply Now
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="rounded-full px-8 h-12 text-base font-medium border-slate-700 text-slate-300 hover:bg-slate-900 hover:text-white hover:border-slate-600 bg-transparent"
          >
            View Curriculum
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="flex flex-wrap items-center justify-center gap-8 sm:gap-12"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
              className="flex flex-col items-center gap-2"
            >
              <div className="flex items-center gap-2">
                <stat.icon className="w-5 h-5 text-emerald-500" />
                <span className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</span>
              </div>
              <span className="text-sm text-slate-500">{stat.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
