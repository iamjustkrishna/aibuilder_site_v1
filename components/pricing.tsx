"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { Check, Star, Users, Rocket } from "lucide-react"
import { Button } from "@/components/ui/button"

const plans = [
  {
    name: "Foundational",
    tagline: "Learn the Basics",
    description: "Perfect for beginners who want to understand AI development fundamentals through live sessions and recordings.",
    features: [
      "All 4 weeks of live sessions",
      "All session recordings",
      "Free resource pack",
      "Community chat access",
      "Certificate of completion",
    ],
    highlighted: false,
    icon: Star,
  },
  {
    name: "Builder",
    tagline: "Learn + Guidance",
    description: "Everything in Foundational plus dedicated mentor support to help you build your first AI product with confidence.",
    features: [
      "Everything in Foundational",
      "1-on-1 mentor support",
      "Code review sessions",
      "Priority Q&A in sessions",
      "Project feedback & guidance",
      "Can upgrade to Architect anytime",
    ],
    highlighted: false,
    icon: Users,
  },
  {
    name: "Architect",
    tagline: "Learn + Earn",
    description: "The complete package. Everything in Builder plus AI Store access where you can sell your products and keep 100% of earnings.",
    features: [
      "Everything in Builder",
      "AI Store publishing access",
      "Keep 100% of your earnings",
      "Priority platform placement",
      "Early audience access",
      "Shape the platform roadmap",
    ],
    highlighted: true,
    icon: Rocket,
  },
]

const earnings = [
  { step: "1", title: "Complete the cohort", desc: "Build your end-to-end AI product during the 4 weeks" },
  { step: "2", title: "Upload to AI Store", desc: "Publish your finished AI app on our marketplace" },
  { step: "3", title: "Set your price", desc: "Free, one-time, or monthly subscription - your choice" },
  { step: "4", title: "Keep 100% of earnings", desc: "Every dollar from your AI app goes to you. No platform cut." },
]

function BorderBeam() {
  return (
    <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
      <div
        className="absolute w-24 h-24 bg-[#FF6B34]/30 blur-xl border-beam"
        style={{
          offsetPath: "rect(0 100% 100% 0 round 16px)",
        }}
      />
    </div>
  )
}

export function Pricing() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="pricing" className="py-24 px-4 bg-[#F4F1FB]">
      <div className="max-w-6xl mx-auto">
        {/* Pricing Header */}
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
            Choose Your Path
          </h2>
          <p className="text-[#6B5B9E] max-w-2xl mx-auto">
            Three tiers to match your goals. Learn, build with support, or create and earn.
          </p>
        </motion.div>

        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-20"
        >
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
              className={`relative p-6 rounded-2xl border transition-all duration-300 hover:scale-[1.02] ${
                plan.highlighted
                  ? "bg-white border-[#FF6B34]/30 shadow-lg"
                  : "bg-white border-[#E8E3F3] hover:border-[#492B8C]/30"
              }`}
            >
              {plan.highlighted && <BorderBeam />}

              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#FF6B34] text-white text-xs font-medium rounded-full">
                  Best Value
                </div>
              )}

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-2 rounded-lg ${plan.highlighted ? "bg-[#FF6B34]/10" : "bg-[#F4F1FB]"}`}>
                    <plan.icon className={`w-5 h-5 ${plan.highlighted ? "text-[#FF6B34]" : "text-[#492B8C]"}`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-[#1A0A3D]">{plan.name}</h3>
                    <p className="text-xs text-[#6B5B9E]">{plan.tagline}</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-[#1A0A3D] mt-3 mb-2">Contact for pricing</p>
                <p className="text-[#6B5B9E] text-sm leading-relaxed">{plan.description}</p>
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-[#1A0A3D]">
                    <Check className="w-4 h-4 text-[#00C8A7] flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                asChild
                className={`w-full rounded-full ${
                  plan.highlighted
                    ? "shimmer-btn bg-[#FF6B34] text-white hover:bg-[#FF6B34]/90"
                    : "bg-[#2D1A69] text-white hover:bg-[#492B8C]"
                }`}
              >
                <a href={`mailto:support@aibuilder.space?subject=Pricing Inquiry - ${plan.name} Tier`}>
                  Contact for Pricing
                </a>
              </Button>
            </motion.div>
          ))}
        </motion.div>

        {/* Questions Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mb-20"
        >
          <div className="inline-flex flex-col sm:flex-row items-center gap-3 px-6 py-4 rounded-2xl bg-white border border-[#E8E3F3] shadow-sm">
            <p className="text-[#1A0A3D] font-medium">Have questions about our plans?</p>
            <a 
              href="mailto:support@aibuilder.space" 
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#2D1A69] text-white font-medium hover:bg-[#492B8C] transition-colors"
            >
              Contact Us
            </a>
          </div>
        </motion.div>

        {/* How to Earn Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-10">
            <h3 className="text-2xl sm:text-3xl font-bold text-[#1A0A3D] mb-3" style={{ fontFamily: "var(--font-instrument-sans)" }}>
              How Architects Earn
            </h3>
            <p className="text-[#6B5B9E]">Turn your cohort project into a revenue stream</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {earnings.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
                className="relative p-5 rounded-xl bg-white border border-[#E8E3F3] hover:border-[#492B8C]/30 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-[#FF6B34] text-white font-bold flex items-center justify-center text-sm mb-3">
                  {item.step}
                </div>
                <h4 className="font-semibold text-[#1A0A3D] mb-1">{item.title}</h4>
                <p className="text-sm text-[#6B5B9E]">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

    </section>
  )
}
