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
    topics: ["LLM Fundamentals", "Prompt Engineering", "RAG Concepts", "API Integration"],
  },
  {
    week: 2,
    title: "Build Your First App",
    description: "Full stack AI app, RAG with vector databases, MVP in Replit, deploying live. Ship something real by end of week.",
    icon: Code,
    topics: ["Next.js/Flask MVP", "Vector Databases", "LangChain", "Deployment"],
  },
  {
    week: 3,
    title: "Build AI Agents",
    description: "ReAct loop, tool calling, multi-step workflows, agent memory. Create agents that browse, plan and execute tasks.",
    icon: Bot,
    topics: ["ReAct Loop", "Tool Calling", "Multi-Agent Systems", "Agent Memory"],
  },
  {
    week: 4,
    title: "Launch & Get Traction",
    description: "Publish to platform, pricing strategy, demo content, distribution channels, analytics. End with real users.",
    icon: Rocket,
    topics: ["Platform Publishing", "Pricing Strategy", "Distribution", "Analytics"],
  },
]

export function BentoGrid() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="curriculum" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2
            className="text-3xl sm:text-4xl font-bold text-white mb-4"
            style={{ fontFamily: "var(--font-instrument-sans)" }}
          >
            4-Week Curriculum
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
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
              className="group relative p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-emerald-500/30 hover:scale-[1.02] transition-all duration-300 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />
              
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <week.icon className="w-6 h-6 text-emerald-400" strokeWidth={1.5} />
                </div>
                <div>
                  <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Week {week.week}</span>
                  <h3 className="text-xl font-semibold text-white">{week.title}</h3>
                </div>
              </div>
              
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                {week.description}
              </p>
              
              <div className="flex flex-wrap gap-2">
                {week.topics.map((topic) => (
                  <span
                    key={topic}
                    className="px-3 py-1 text-xs bg-slate-800/80 border border-slate-700/50 rounded-full text-slate-300"
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
          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-900/30 border border-slate-800/50">
            <div className="p-2 rounded-lg bg-slate-800">
              <BookOpen className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="font-medium text-white">50+ Resources Provided</h4>
              <p className="text-sm text-slate-500">Templates, guides, cheatsheets per week</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-900/30 border border-slate-800/50">
            <div className="p-2 rounded-lg bg-slate-800">
              <Users className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="font-medium text-white">Community + Office Hours</h4>
              <p className="text-sm text-slate-500">Peer support and weekly unblock sessions</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
