"use client"

import { motion } from "framer-motion"
import { Zap, Gift, ExternalLink, Sparkles } from "lucide-react"

const aiTools = [
  {
    name: "v0.app",
    description: "Build full-stack apps with AI. We provide free credits for every sign up!",
    url: "https://v0.app/ref/RAIJ6R",
    rank: 1,
    highlight: true,
    badge: "Free Credits",
  },
  {
    name: "Cursor",
    description: "AI-powered code editor. The best IDE for AI development.",
    url: "https://cursor.sh",
    rank: 2,
  },
  {
    name: "Claude",
    description: "Advanced AI assistant for coding and reasoning.",
    url: "https://claude.ai",
    rank: 3,
  },
  {
    name: "ChatGPT",
    description: "OpenAI's powerful assistant for any task.",
    url: "https://chat.openai.com",
    rank: 4,
  },
  {
    name: "Replit",
    description: "Build and deploy apps instantly with AI help.",
    url: "https://replit.com",
    rank: 5,
  },
  {
    name: "Bolt.new",
    description: "Ship full-stack apps from your browser.",
    url: "https://bolt.new",
    rank: 6,
  },
]

export function AITools() {
  return (
    <section id="tools" className="py-20 px-4 bg-[#F4F1FB]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#E8E3F3] mb-6">
            <Sparkles className="w-4 h-4 text-[#FF6B34]" />
            <span className="text-sm text-[#492B8C] font-medium">Recommended Tools</span>
          </div>
          <h2
            className="text-3xl sm:text-4xl font-bold text-[#1A0A3D] mb-4"
            style={{ fontFamily: "var(--font-cal-sans)" }}
          >
            Best AI Tools to Build With
          </h2>
          <p className="text-[#6B5B9E] max-w-2xl mx-auto">
            These are the tools we use and recommend. Start with v0 - we provide free credits for every sign up!
          </p>
        </motion.div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {aiTools.map((tool, index) => (
            <motion.a
              key={index}
              href={tool.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className={`group relative p-6 rounded-2xl border transition-all hover:shadow-xl hover:-translate-y-1 ${
                tool.highlight 
                  ? "bg-gradient-to-br from-[#FF6B34]/10 via-white to-[#FFD13F]/10 border-[#FF6B34] shadow-lg shadow-[#FF6B34]/10" 
                  : "bg-white border-[#E8E3F3] hover:border-[#492B8C]"
              }`}
            >
              {/* Rank Badge */}
              <div className={`absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg ${
                tool.rank === 1 ? "bg-[#FF6B34] text-white" : "bg-white text-[#492B8C] border border-[#E8E3F3]"
              }`}>
                #{tool.rank}
              </div>
              
              {/* Free Credits Badge */}
              {tool.badge && (
                <div className="absolute -top-3 -right-3 px-3 py-1 rounded-full bg-[#00C8A7] text-white text-xs font-bold flex items-center gap-1.5 shadow-lg">
                  <Gift className="w-3.5 h-3.5" />
                  {tool.badge}
                </div>
              )}
              
              <div className="flex items-start gap-4 mt-2">
                <div className={`p-3 rounded-xl ${tool.highlight ? "bg-[#FF6B34]" : "bg-[#F4F1FB] group-hover:bg-[#492B8C]"} transition-colors`}>
                  <Zap className={`w-6 h-6 ${tool.highlight ? "text-white" : "text-[#492B8C] group-hover:text-white"} transition-colors`} />
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg font-bold mb-1 ${tool.highlight ? "text-[#FF6B34]" : "text-[#1A0A3D] group-hover:text-[#492B8C]"} transition-colors`}>
                    {tool.name}
                  </h3>
                  <p className="text-sm text-[#6B5B9E] leading-relaxed">{tool.description}</p>
                </div>
              </div>
              
              <div className={`mt-4 flex items-center gap-2 text-sm font-medium ${tool.highlight ? "text-[#FF6B34]" : "text-[#492B8C]"}`}>
                <span>{tool.highlight ? "Get Free Credits" : "Try it out"}</span>
                <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  )
}
