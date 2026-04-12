"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useState } from "react"
import { Check, Star, Store, Users, Rocket, IndianRupee, CreditCard, Copy, X, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

const plans = [
  {
    name: "Foundational",
    tagline: "Learn the Basics",
    price: 499,
    description: "Perfect for beginners who want to understand AI development fundamentals through live sessions and recordings.",
    features: [
      "All 4 weeks of live sessions",
      "All session recordings",
      "Free resource pack",
      "Community chat access",
      "Certificate of completion",
    ],
    cta: "Get Foundational",
    highlighted: false,
    icon: Star,
  },
  {
    name: "Builder",
    tagline: "Learn + Guidance",
    price: 999,
    description: "Everything in Foundational plus dedicated mentor support to help you build your first AI product with confidence.",
    features: [
      "Everything in Foundational",
      "1-on-1 mentor support",
      "Code review sessions",
      "Priority Q&A in sessions",
      "Project feedback & guidance",
      "Can upgrade to Architect anytime",
    ],
    cta: "Get Builder",
    highlighted: false,
    icon: Users,
  },
  {
    name: "Architect",
    tagline: "Learn + Earn",
    price: 1999,
    description: "The complete package. Everything in Builder plus AI Store access where you can sell your products and keep 100% of earnings.",
    features: [
      "Everything in Builder",
      "AI Store publishing access",
      "Keep 100% of your earnings",
      "Priority platform placement",
      "Early audience access",
      "Shape the platform roadmap",
    ],
    cta: "Get Architect",
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
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null)
  const [copiedUPI, setCopiedUPI] = useState(false)

  const UPI_ID = "thekrishnajeena@ybl"

  const copyUPIId = async () => {
    await navigator.clipboard.writeText(UPI_ID)
    setCopiedUPI(true)
    setTimeout(() => setCopiedUPI(false), 2000)
  }

  const handlePlanClick = (plan: typeof plans[0]) => {
    setSelectedPlan(plan)
    setShowPaymentModal(true)
  }

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

      {/* UPI Payment Modal */}
      {showPaymentModal && selectedPlan && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => {
            setShowPaymentModal(false)
            setSelectedPlan(null)
          }}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#2D1A69] to-[#492B8C] px-6 py-5 sticky top-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-xs uppercase tracking-wider">You selected</p>
                  <h3 className="text-white font-bold text-xl" style={{ fontFamily: "var(--font-instrument-sans)" }}>
                    {selectedPlan.name} Tier
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setShowPaymentModal(false)
                    setSelectedPlan(null)
                  }}
                  className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Price Display */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-1 text-4xl font-bold text-[#1A0A3D]">
                  <IndianRupee className="w-8 h-8" />
                  {selectedPlan.price}
                </div>
                <p className="text-[#6B5B9E] text-sm mt-1">One-time payment</p>
              </div>

              {/* Features */}
              <div className="bg-[#F4F1FB] rounded-xl p-4 mb-6">
                <p className="text-sm font-medium text-[#1A0A3D] mb-3">What you get:</p>
                <ul className="space-y-2">
                  {selectedPlan.features.slice(0, 4).map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-[#6B5B9E]">
                      <Check className="w-4 h-4 text-[#00C8A7] flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* UPI Section */}
              <div className="bg-[#F4F1FB] rounded-xl p-4 mb-6">
                <p className="text-sm font-medium text-[#1A0A3D] mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#492B8C]" />
                  Pay via UPI
                </p>
                
                <div className="flex items-center gap-2 bg-white rounded-lg p-3 border border-[#E8E3F3]">
                  <span className="flex-1 font-mono text-[#1A0A3D] text-sm">{UPI_ID}</span>
                  <button
                    onClick={copyUPIId}
                    className="p-2 rounded-lg bg-[#F4F1FB] hover:bg-[#E8E3F3] transition-colors"
                  >
                    {copiedUPI ? (
                      <Check className="w-4 h-4 text-[#00C8A7]" />
                    ) : (
                      <Copy className="w-4 h-4 text-[#492B8C]" />
                    )}
                  </button>
                </div>

                <p className="text-xs text-[#6B5B9E] mt-3">
                  Pay using any UPI app (GPay, PhonePe, Paytm, etc.)
                </p>
              </div>

              {/* Steps */}
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#FF6B34] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">1</div>
                  <p className="text-sm text-[#1A0A3D]">Copy the UPI ID above and pay using any UPI app</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#FF6B34] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">2</div>
                  <p className="text-sm text-[#1A0A3D]">Take a screenshot of the payment confirmation</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#FF6B34] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">3</div>
                  <p className="text-sm text-[#1A0A3D]">Send the screenshot to our support email</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  asChild
                  className="w-full bg-[#2D1A69] text-white hover:bg-[#492B8C] rounded-full py-6"
                >
                  <a href={`mailto:support@aibuilder.space?subject=Payment Confirmation - ${selectedPlan.name} Tier&body=Hi,%0A%0AI have made the payment of ₹${selectedPlan.price} for the ${selectedPlan.name} tier.%0A%0APlease find the payment screenshot attached.%0A%0AThank you!`}>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Send Payment Confirmation
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowPaymentModal(false)
                    setSelectedPlan(null)
                  }}
                  className="w-full text-[#6B5B9E] hover:text-[#1A0A3D] rounded-full"
                >
                  Maybe Later
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
