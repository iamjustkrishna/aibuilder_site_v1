"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"

const tools = [
  { name: "ChatGPT", icon: "C" },
  { name: "Claude", icon: "A" },
  { name: "Cursor", icon: "Cu" },
  { name: "Replit", icon: "R" },
  { name: "LangChain", icon: "L" },
  { name: "Vercel", icon: "V" },
  { name: "Supabase", icon: "S" },
  { name: "Pinecone", icon: "P" },
  { name: "n8n", icon: "n" },
  { name: "OpenAI", icon: "O" },
]

export function LogoMarquee() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section ref={ref} className="py-16 overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6 }}
        className="text-center mb-10"
      >
        <p className="text-sm text-slate-500 uppercase tracking-wider font-medium">Tools you will master</p>
      </motion.div>

      <div className="relative">
        {/* Fade masks */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none" />

        {/* Marquee container */}
        <div className="flex animate-marquee">
          {[...tools, ...tools].map((tool, index) => (
            <div
              key={index}
              className="flex items-center justify-center min-w-[160px] h-16 mx-8 opacity-60 hover:opacity-100 transition-all duration-300"
            >
              <div className="flex items-center gap-2 text-slate-400">
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700/50 flex items-center justify-center">
                  <span className="text-xs font-bold text-emerald-400">{tool.icon}</span>
                </div>
                <span className="font-medium" style={{ fontFamily: "var(--font-instrument-sans)" }}>
                  {tool.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
