"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Zap, Gift, ExternalLink, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"

const aiTools = [
  {
    name: "v0.app",
    description: "Build full-stack apps with AI in minutes",
    url: "https://v0.app/ref/RAIJ6R",
    highlight: true,
    badge: "Free Credits",
  },
  {
    name: "Cursor",
    description: "AI-powered code editor",
    url: "https://cursor.sh",
  },
  {
    name: "Claude",
    description: "Advanced AI assistant",
    url: "https://claude.ai",
  },
]

export function AITools() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <section id="tools" className="py-16 px-4 bg-white">
      <div className="max-w-4xl mx-auto">
        {/* Header with Collapse Control */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          {/* Title with inline collapse toggle */}
          <div className="flex items-center justify-center gap-3 mb-3">
            <h2
              className="text-2xl sm:text-3xl font-bold text-[#1A0A3D]"
              style={{ fontFamily: "var(--font-cal-sans)" }}
            >
              Best AI Tools to Build With
            </h2>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${
                isExpanded 
                  ? "bg-[#492B8C] text-white" 
                  : "bg-[#FF6B34] text-white animate-pulse shadow-lg shadow-[#FF6B34]/40"
              }`}
              aria-label={isExpanded ? "Collapse tools" : "Expand tools"}
            >
              <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
            </button>
          </div>
          <p className="text-[#6B5B9E] max-w-xl mx-auto">
            We will teach you how to max out the potential of these kind of AI tools to be productive
          </p>
        </motion.div>

        {/* Tools - Collapsible */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row items-stretch gap-4 justify-center pt-8">
                {aiTools.map((tool, index) => (
                  <motion.a
                    key={index}
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className={`group relative flex-1 p-5 rounded-xl border transition-all hover:shadow-lg hover:-translate-y-1 ${
                      tool.highlight 
                        ? "bg-gradient-to-br from-[#FF6B34] to-[#FF8F34] border-[#FF6B34] shadow-lg shadow-[#FF6B34]/20" 
                        : "bg-[#F4F1FB] border-[#E8E3F3] hover:border-[#492B8C]"
                    }`}
                  >
                    {/* Free Credits Badge */}
                    {tool.badge && (
                      <div className="absolute -top-2 -right-2 px-2.5 py-1 rounded-full bg-[#00C8A7] text-white text-xs font-bold flex items-center gap-1 shadow-md">
                        <Gift className="w-3 h-3" />
                        {tool.badge}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${tool.highlight ? "bg-white/20" : "bg-white"}`}>
                        <Zap className={`w-5 h-5 ${tool.highlight ? "text-white" : "text-[#492B8C]"}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-bold ${tool.highlight ? "text-white" : "text-[#1A0A3D]"}`}>
                          {tool.name}
                        </h3>
                        <p className={`text-sm ${tool.highlight ? "text-white/80" : "text-[#6B5B9E]"}`}>
                          {tool.description}
                        </p>
                      </div>
                      <ExternalLink className={`w-4 h-4 ${tool.highlight ? "text-white/70" : "text-[#6B5B9E]"} group-hover:translate-x-0.5 transition-transform`} />
                    </div>
                    
                    {tool.highlight && (
                      <p className="mt-3 text-xs text-white/90 font-medium text-center">
                        We provide free credits for every sign up!
                      </p>
                    )}
                  </motion.a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
