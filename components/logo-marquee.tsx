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
  { name: "v0", icon: "v0" },
  { name: "Bolt", icon: "B" },
  { name: "Lovable", icon: "Lv" },
  { name: "Make", icon: "M" },
  { name: "Zapier", icon: "Z" },
  { name: "Notion AI", icon: "N" },
  { name: "Gemini", icon: "G" },
  { name: "Perplexity", icon: "Px" },
  { name: "Midjourney", icon: "Mj" },
  { name: "ElevenLabs", icon: "11" },
]

export function LogoMarquee() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section ref={ref} className="py-16 overflow-hidden bg-[#F4F1FB]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6 }}
        className="text-center mb-10"
      >
        <p className="text-sm text-[#6B5B9E] uppercase tracking-wider font-medium">Tools you will master</p>
      </motion.div>

      <div className="relative">
        {/* Fade masks */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#F4F1FB] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#F4F1FB] to-transparent z-10 pointer-events-none" />

        {/* Marquee container */}
        <div className="flex animate-marquee">
          {[...tools, ...tools].map((tool, index) => (
            <div
              key={index}
              className="flex items-center justify-center min-w-[160px] h-16 mx-8 opacity-70 hover:opacity-100 transition-all duration-300"
            >
              <div className="flex items-center gap-2 text-[#1A0A3D]">
                <div className="w-8 h-8 rounded-lg bg-white border border-[#E8E3F3] flex items-center justify-center shadow-sm">
                  <span className="text-xs font-bold text-[#492B8C]">{tool.icon}</span>
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
