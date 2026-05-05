"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { Sparkles, Mail } from "lucide-react"

const footerLinks = {
  Program: [
    { label: "Curriculum", href: "#curriculum" },
    { label: "FAQs", href: "#faqs" },
  ],
  Resources: [
    { label: "Resources Hub", href: "/resources" },
    { label: "Session Recordings", href: "/resources" },
    { label: "Starter Code", href: "/resources" },
    { label: "Community", href: "https://whatsapp.com/channel/0029VbCJ26365yDAn7xmbq2R", external: true },
  ],
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
          className="grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <a href="#" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#FF6B34] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-white">AI Builder</span>
            </a>
            <p className="text-sm text-[#C3AFFF] mb-4">Build AI apps. Launch them. Contributors keep 100% of their AI app earnings.</p>
            {/* Season Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#492B8C]/50 border border-[#492B8C]">
              <span className="w-2 h-2 rounded-full bg-[#FF6B34] pulse-glow" />
              <span className="text-xs text-[#C3AFFF]">Season 0 | Join Season 1</span>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-white mb-4">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a 
                      href={link.href} 
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noopener noreferrer" : undefined}
                      className="text-sm text-[#C3AFFF] hover:text-[#FF6B34] transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-3">
              <li>
                <a href="mailto:support@aibuilder.space" className="flex items-center gap-2 text-sm text-[#C3AFFF] hover:text-[#FF6B34] transition-colors">
                  <Mail className="w-4 h-4" />
                  support@aibuilder.space
                </a>
              </li>
            </ul>
          </div>
        </motion.div>

        {/* Bottom */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 pt-8 border-t border-[#492B8C]/30 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <p className="text-sm text-[#C3AFFF]">&copy; {new Date().getFullYear()} AI Builder Cohort. All rights reserved.</p>
          <a href="mailto:support@aibuilder.space" className="text-sm text-[#C3AFFF] hover:text-[#FF6B34] transition-colors">
            support@aibuilder.space
          </a>
        </motion.div>
      </div>
    </footer>
  )
}
