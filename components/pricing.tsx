"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { Check, Star, Store } from "lucide-react"
import { Button } from "@/components/ui/button"

const plans = [
  {
    name: "Standard",
    description: "Perfect for those who want to learn AI development, are exploring options, or want to check if this is right for them. Full curriculum access with option to upgrade later.",
    features: [
      "All 4 weeks of live sessions",
      "All session recordings",
      "Full resource pack per week",
      "Community chat access",
      "Certificate of completion",
      "Can upgrade to Contributor anytime",
    ],
    cta: "Apply as Standard",
    highlighted: false,
  },
  {
    name: "Contributor",
    description: "For those ready to build and earn. Get everything in Standard plus access to our AI Store where you can upload and sell your AI products and keep 100% of your earnings.",
    features: [
      "Everything in Standard",
      "AI Store publishing access",
      "Keep 100% of your earnings",
      "Priority platform placement",
      "Early audience access",
      "Shape the platform with feedback",
    ],
    cta: "Apply as Contributor",
    highlighted: true,
  },
]

const earnings = [
  { step: "1", title: "Complete the cohort", desc: "Build your end-to-end AI product during the 4 weeks" },
  { step: "2", title: "Upload to AI Store", desc: "Publish your finished product on our marketplace" },
  { step: "3", title: "Set your price", desc: "Free, one-time, or monthly subscription - your choice" },
  { step: "4", title: "Keep 100% earnings", desc: "Every rupee goes to you. No platform cut, ever." },
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
            Join the Cohort
          </h2>
          <p className="text-[#6B5B9E] max-w-2xl mx-auto">
            Two paths to join. Standard to learn, Contributor to learn and earn. Exact fees shared during onboarding.
          </p>
        </motion.div>

        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-20"
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
                  Recommended
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-[#1A0A3D] mb-2">{plan.name}</h3>
                <p className="text-[#6B5B9E] text-sm leading-relaxed">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-[#1A0A3D]">
                    <Check className="w-4 h-4 text-[#FF6B34] shrink-0" strokeWidth={2} />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full rounded-full ${
                  plan.highlighted
                    ? "shimmer-btn bg-[#FF6B34] text-white hover:bg-[#FF6B34]/90"
                    : "bg-[#2D1A69] text-white hover:bg-[#492B8C]"
                }`}
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </motion.div>

        {/* 100% Earnings Section - Contributors Only */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#E8E3F3] mb-6">
            <Store className="w-4 h-4 text-[#FF6B34]" />
            <span className="text-sm text-[#492B8C] font-medium">Contributors: 100% Earnings on AI Store</span>
          </div>
          <h3
            className="text-2xl sm:text-3xl font-bold text-[#1A0A3D] mb-4"
            style={{ fontFamily: "var(--font-instrument-sans)" }}
          >
            How Contributors Earn
          </h3>
          <p className="text-[#6B5B9E] max-w-2xl mx-auto mb-12">
            As a Contributor, you get access to our AI Store. Upload your completed AI products, set your own prices, and keep every rupee you earn. No platform fees. No commissions.
          </p>

          {/* How You Earn Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {earnings.map((item) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.5 + Number(item.step) * 0.1 }}
                className="relative p-5 rounded-xl bg-white border border-[#E8E3F3] text-left"
              >
                <span className="absolute -top-3 left-4 w-6 h-6 rounded-full bg-[#FF6B34] text-white text-xs font-bold flex items-center justify-center">
                  {item.step}
                </span>
                <h4 className="font-semibold text-[#1A0A3D] mb-1 mt-1">{item.title}</h4>
                <p className="text-sm text-[#6B5B9E]">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
