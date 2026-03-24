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
    question: "What's the difference between Standard and Contributor?",
    answer: "Standard gives you full access to learn AI development through the cohort. Contributor includes everything in Standard plus access to our AI Store where you can upload and sell your finished AI products and keep 100% of your earnings."
  },
  {
    question: "Do Contributors really keep 100% of earnings?",
    answer: "Yes. The platform is designed so creators keep everything they earn from the AI Store. Any future change to this is communicated openly in advance, never quietly."
  },
  {
    question: "What if I miss a live session?",
    answer: "Every session is recorded and shared within 24 hours. Missing a class means watching the replay before the next one. Manageable even if life gets in the way."
  },
  {
    question: "When can Contributors start earning on the platform?",
    answer: "From platform launch day. Founding cohort Contributors get priority placement and an early built-in audience from cohort participants and their networks."
  },
  {
    question: "What specific resources are provided each week?",
    answer: "Session recordings, written guides, starter templates, cheatsheets and reference sheets. Including 50+ prompt templates, app starter templates, agent architecture diagrams, and more."
  },
  {
    question: "Can I upgrade from Standard to Contributor later?",
    answer: "Yes! If you start as Standard and later decide you want to publish on the AI Store and earn, you can upgrade to Contributor at any time."
  },
]

function FAQItem({ faq, isOpen, onClick }: { faq: typeof faqs[0], isOpen: boolean, onClick: () => void }) {
  return (
    <div className="border-b border-[#E8E3F3] last:border-b-0">
      <button
        onClick={onClick}
        className="w-full py-5 flex items-center justify-between text-left hover:text-[#FF6B34] transition-colors group"
      >
        <span className="font-medium text-[#1A0A3D] group-hover:text-[#FF6B34] transition-colors pr-4">
          {faq.question}
        </span>
        <ChevronDown 
          className={`w-5 h-5 text-[#6B5B9E] shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#FF6B34]' : ''}`} 
        />
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden"
      >
        <p className="pb-5 text-[#6B5B9E] text-sm leading-relaxed">
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
    <section id="faqs" className="py-24 px-4 bg-white">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2
            className="text-3xl sm:text-4xl font-bold text-[#1A0A3D] mb-4"
            style={{ fontFamily: "var(--font-instrument-sans)" }}
          >
            Frequently Asked Questions
          </h2>
          <p className="text-[#6B5B9E]">
            Everything you need to know about the AI Builder Cohort.
          </p>
        </motion.div>

        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="rounded-2xl bg-[#F4F1FB] border border-[#E8E3F3] p-6"
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
