"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { Sparkles } from "lucide-react"

const footerLinks = {
  Program: ["Curriculum", "Pricing", "FAQs", "Apply Now"],
  Resources: ["Session Recordings", "Templates", "Community", "Office Hours"],
  Platform: ["AI Store", "Publishing", "Analytics", "Pricing Tools"],
  Connect: ["Email", "Twitter/X", "LinkedIn", "WhatsApp"],
}

export function Footer() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })

  return (
    <footer ref={ref} className="border-t border-[#492B8C]/30 bg-[#2D1A69]">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-8"
        >
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <a href="#" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#FF6B34] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-white">AI Builder</span>
            </a>
            <p className="text-sm text-[#C3AFFF] mb-4">Build AI apps. Launch them. Contributors keep 100% of their earnings.</p>
            {/* Season Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#492B8C]/50 border border-[#492B8C]">
              <span className="w-2 h-2 rounded-full bg-[#FF6B34] pulse-glow" />
              <span className="text-xs text-[#C3AFFF]">Season 01 Open</span>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-white mb-4">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-[#C3AFFF] hover:text-[#FF6B34] transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </motion.div>

        {/* Bottom */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 pt-8 border-t border-[#492B8C]/30 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <p className="text-sm text-[#C3AFFF]">&copy; {new Date().getFullYear()} AI Builder Cohort. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-[#C3AFFF] hover:text-[#FF6B34] transition-colors">
              Twitter/X
            </a>
            <a href="#" className="text-sm text-[#C3AFFF] hover:text-[#FF6B34] transition-colors">
              LinkedIn
            </a>
            <a href="mailto:chitranshuharbola@gmail.com" className="text-sm text-[#C3AFFF] hover:text-[#FF6B34] transition-colors">
              Email
            </a>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}
