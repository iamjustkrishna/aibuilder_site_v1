"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { Check, Star } from "lucide-react"
import { Button } from "@/components/ui/button"

const plans = [
  {
    name: "Standard",
    description: "Join to learn, build, and get full access to curriculum, live sessions, recordings, community, and the platform.",
    features: [
      "All 4 weeks of live sessions",
      "All session recordings",
      "Full resource pack per week",
      "Platform publishing access",
      "Community chat access",
      "Certificate of completion",
    ],
    cta: "Apply Now",
    highlighted: false,
  },
  {
    name: "Contributor",
    description: "Actively build and publish apps on the platform. Your cohort fee reflects the value you create. High contributors may get access at reduced cost.",
    features: [
      "Everything in Standard",
      "Priority platform placement",
      "Contribution recognized publicly",
      "Reduced or zero fee if eligible",
      "Early audience access",
      "Shape the platform with feedback",
    ],
    cta: "Apply as Contributor",
    highlighted: true,
  },
]

const earnings = [
  { step: "1", title: "Publish your app", desc: "Upload to the marketplace in one session" },
  { step: "2", title: "Set your price", desc: "Free, one-time, or monthly subscription" },
  { step: "3", title: "Reach real users", desc: "Platform handles discovery, you own the product" },
  { step: "4", title: "Get paid, keep it all", desc: "100% goes to you. No platform cut, ever." },
]

function BorderBeam() {
  return (
    <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
      <div
        className="absolute w-24 h-24 bg-emerald-500/30 blur-xl border-beam"
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
    <section id="pricing" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* 100% Earnings Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
            <Star className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-emerald-400 font-medium">100% Earnings - No Platform Cuts</span>
          </div>
          <h2
            className="text-3xl sm:text-4xl font-bold text-white mb-4"
            style={{ fontFamily: "var(--font-instrument-sans)" }}
          >
            Keep Every Rupee You Earn
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto mb-12">
            You set your own price. Payments go directly to you. No hidden fees or commissions. Full transparent dashboard.
          </p>

          {/* How You Earn Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
            {earnings.map((item) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: Number(item.step) * 0.1 }}
                className="relative p-5 rounded-xl bg-slate-900/50 border border-slate-800 text-left"
              >
                <span className="absolute -top-3 left-4 w-6 h-6 rounded-full bg-emerald-500 text-slate-950 text-xs font-bold flex items-center justify-center">
                  {item.step}
                </span>
                <h4 className="font-semibold text-white mb-1 mt-1">{item.title}</h4>
                <p className="text-sm text-slate-500">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Pricing Header */}
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
            Join the Cohort
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Simple, transparent enrollment. Exact fees shared during onboarding before any payment.
          </p>
        </motion.div>

        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto"
        >
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
              className={`relative p-6 rounded-2xl border transition-all duration-300 hover:scale-[1.02] ${
                plan.highlighted
                  ? "bg-slate-900 border-emerald-500/30"
                  : "bg-slate-900/50 border-slate-800 hover:border-slate-600"
              }`}
            >
              {plan.highlighted && <BorderBeam />}

              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 text-slate-950 text-xs font-medium rounded-full">
                  Recommended
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-white mb-2">{plan.name}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-slate-300">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" strokeWidth={2} />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full rounded-full ${
                  plan.highlighted
                    ? "shimmer-btn bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                    : "bg-slate-800 text-white hover:bg-slate-700 border border-slate-700"
                }`}
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
