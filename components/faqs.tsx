"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useState } from "react"
import { ChevronDown } from "lucide-react"

const faqs = [
  {
    question: "Do I need coding experience?",
    answer: "Not at all. The cohort is for mixed audiences from zero experience to experienced developers. The tools are designed to lower the barrier significantly."
  },
  {
    question: "What exactly will I build?",
    answer: "A live deployed AI app with an agent layer built in by week 4. Specifics depend on your idea from week 1: chatbots, automation tools, document Q&A, email agents, and more."
  },
  {
    question: "Do I really keep 100% of earnings?",
    answer: "Yes. The platform is designed so creators keep everything they earn. Any future change to this is communicated openly in advance, never quietly."
  },
  {
    question: "What if I miss a live session?",
    answer: "Every session is recorded and shared within 24 hours. Missing a class means watching the replay before the next one. Manageable even if life gets in the way."
  },
  {
    question: "When can I start earning on the platform?",
    answer: "From platform launch day. Founding cohort members get priority placement and an early built-in audience from cohort participants and their networks."
  },
  {
    question: "What specific resources are provided each week?",
    answer: "Session recordings, written guides, starter templates, cheatsheets and reference sheets. Including 50+ prompt templates, app starter templates, agent architecture diagrams, and more."
  },
  {
    question: "Is the platform only open to cohort members?",
    answer: "Eventually open to all creators globally. Cohort members get early, priority access and help shape how the platform grows."
  },
]

function FAQItem({ faq, isOpen, onClick }: { faq: typeof faqs[0], isOpen: boolean, onClick: () => void }) {
  return (
    <div className="border-b border-slate-800 last:border-b-0">
      <button
        onClick={onClick}
        className="w-full py-5 flex items-center justify-between text-left hover:text-emerald-400 transition-colors group"
      >
        <span className="font-medium text-white group-hover:text-emerald-400 transition-colors pr-4">
          {faq.question}
        </span>
        <ChevronDown 
          className={`w-5 h-5 text-slate-500 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-emerald-400' : ''}`} 
        />
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden"
      >
        <p className="pb-5 text-slate-400 text-sm leading-relaxed">
          {faq.answer}
        </p>
      </motion.div>
    </div>
  )
}

export function FAQs() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="faqs" className="py-24 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2
            className="text-3xl sm:text-4xl font-bold text-white mb-4"
            style={{ fontFamily: "var(--font-instrument-sans)" }}
          >
            Frequently Asked Questions
          </h2>
          <p className="text-slate-400">
            Everything you need to know about the AI Builder Cohort.
          </p>
        </motion.div>

        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="rounded-2xl bg-slate-900/50 border border-slate-800 p-6"
        >
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              faq={faq}
              isOpen={openIndex === index}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
