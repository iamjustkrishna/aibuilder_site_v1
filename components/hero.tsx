"use client"

import { motion } from "framer-motion"
import { ArrowRight, Calendar, Video, Percent, PlayCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

const stats = [
  { icon: Calendar, value: "4", label: "Weeks" },
  { icon: Video, value: "2-3x", label: "Live Classes/wk" },
  { icon: PlayCircle, value: "2-4", label: "Recorded Videos/wk" },
  { icon: Percent, value: "100%", label: "Of AI App Earnings" },
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
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-16 overflow-hidden bg-white">
      {/* Subtle radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#F4F1FB] rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F4F1FB] border border-[#E8E3F3] mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-[#FF6B34] pulse-glow" />
          <span className="text-sm text-[#492B8C]">Season 0 | Join Season 1, Register Now</span>
        </motion.div>

        {/* Headline with text mask animation */}
        <h1
          className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#1A0A3D] mb-6"
          style={{ fontFamily: "var(--font-cal-sans), sans-serif" }}
        >
          <span className="block overflow-hidden">
            <motion.span className="block" variants={textRevealVariants} initial="hidden" animate="visible" custom={0}>
              Build AI.
            </motion.span>
          </span>
          <span className="block overflow-hidden">
            <motion.span
              className="block text-[#FF6B34]"
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
              className="block text-[#6B5B9E]"
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
          className="text-lg sm:text-xl text-[#6B5B9E] max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          A 4-week cohort where you go from zero to shipping real AI apps and agents. Contributors can publish on our AI Store and keep 100% of earnings from their AI apps. No commissions. No cuts.
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
            asChild
            className="shimmer-btn bg-[#FF6B34] text-white hover:bg-[#FF6B34]/90 rounded-full px-8 h-12 text-base font-medium shadow-lg shadow-[#FF6B34]/20"
          >
            <a href="https://docs.google.com/forms/d/e/1FAIpQLSelAKQrkxz97RxCo7B8K-xNOAe3-wXhtmnxyW6qx-WNA_82ZA/viewform?usp=header" target="_blank" rel="noopener noreferrer">
              Express Interest
              <ArrowRight className="ml-2 w-4 h-4" />
            </a>
          </Button>
          <Button
            variant="outline"
            size="lg"
            asChild
            className="rounded-full px-8 h-12 text-base font-medium border-[#2D1A69] text-[#2D1A69] hover:bg-[#2D1A69] hover:text-white bg-white"
          >
            <a href="#curriculum">
              View Curriculum
            </a>
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
                <stat.icon className="w-5 h-5 text-[#FF6B34]" />
                <span className="text-2xl sm:text-3xl font-bold text-[#1A0A3D]">{stat.value}</span>
              </div>
              <span className="text-sm text-[#6B5B9E]">{stat.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
