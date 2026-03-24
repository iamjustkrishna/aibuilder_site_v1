"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { Brain, Code, Bot, Rocket, BookOpen, Users } from "lucide-react"

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

const weeks = [
  {
    week: 1,
    title: "Understand & Explore",
    description: "How LLMs work, prompt engineering, RAG, APIs, idea scoping. Know what to build and why before writing a line.",
    icon: Brain,
    color: "#492B8C",
    topics: ["LLM Fundamentals", "Prompt Engineering", "RAG Concepts", "API Integration"],
  },
  {
    week: 2,
    title: "Build Your First App",
    description: "Full stack AI app, RAG with vector databases, MVP in Replit, deploying live. Ship something real by end of week.",
    icon: Code,
    color: "#FF6B34",
    topics: ["Next.js/Flask MVP", "Vector Databases", "LangChain", "Deployment"],
  },
  {
    week: 3,
    title: "Build AI Agents",
    description: "ReAct loop, tool calling, multi-step workflows, agent memory. Create agents that browse, plan and execute tasks.",
    icon: Bot,
    color: "#00C8A7",
    topics: ["ReAct Loop", "Tool Calling", "Multi-Agent Systems", "Agent Memory"],
  },
  {
    week: 4,
    title: "Launch & Get Traction",
    description: "Publish to platform, pricing strategy, demo content, distribution channels, analytics. End with real users.",
    icon: Rocket,
    color: "#FFD13F",
    topics: ["Platform Publishing", "Pricing Strategy", "Distribution", "Analytics"],
  },
]

export function BentoGrid() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="curriculum" className="py-24 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2
            className="text-3xl sm:text-4xl font-bold text-[#1A0A3D] mb-4"
            style={{ fontFamily: "var(--font-instrument-sans)" }}
          >
            4-Week Curriculum
          </h2>
          <p className="text-[#6B5B9E] max-w-2xl mx-auto">
            Live classes 2 to 3 times per week. All sessions recorded for replay. Each class builds directly on the last.
          </p>
        </motion.div>

        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {weeks.map((week) => (
            <motion.div
              key={week.week}
              variants={itemVariants}
              className="group relative p-6 rounded-2xl bg-[#F4F1FB] border border-[#E8E3F3] hover:border-[#492B8C]/30 hover:scale-[1.02] transition-all duration-300 overflow-hidden"
            >
              {/* Left accent bar */}
              <div 
                className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                style={{ backgroundColor: week.color }}
              />
              
              <div className="flex items-start gap-4 mb-4 pl-3">
                <div 
                  className="p-3 rounded-xl border"
                  style={{ 
                    backgroundColor: `${week.color}15`,
                    borderColor: `${week.color}30`
                  }}
                >
                  <week.icon className="w-6 h-6" style={{ color: week.color }} strokeWidth={1.5} />
                </div>
                <div>
                  <span 
                    className="text-xs font-medium uppercase tracking-wider"
                    style={{ color: week.color }}
                  >
                    Week {week.week}
                  </span>
                  <h3 className="text-xl font-semibold text-[#1A0A3D]">{week.title}</h3>
                </div>
              </div>
              
              <p className="text-[#6B5B9E] text-sm mb-6 leading-relaxed pl-3">
                {week.description}
              </p>
              
              <div className="flex flex-wrap gap-2 pl-3">
                {week.topics.map((topic) => (
                  <span
                    key={topic}
                    className="px-3 py-1 text-xs bg-white border border-[#E8E3F3] rounded-full text-[#492B8C]"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Additional Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <div className="flex items-center gap-4 p-4 rounded-xl bg-[#F4F1FB] border border-[#E8E3F3]">
            <div className="p-2 rounded-lg bg-white border border-[#E8E3F3]">
              <BookOpen className="w-5 h-5 text-[#FF6B34]" />
            </div>
            <div>
              <h4 className="font-medium text-[#1A0A3D]">50+ Resources Provided</h4>
              <p className="text-sm text-[#6B5B9E]">Templates, guides, cheatsheets per week</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-xl bg-[#F4F1FB] border border-[#E8E3F3]">
            <div className="p-2 rounded-lg bg-white border border-[#E8E3F3]">
              <Users className="w-5 h-5 text-[#00C8A7]" />
            </div>
            <div>
              <h4 className="font-medium text-[#1A0A3D]">Community + Office Hours</h4>
              <p className="text-sm text-[#6B5B9E]">Peer support and weekly unblock sessions</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
