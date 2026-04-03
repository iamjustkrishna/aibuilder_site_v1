"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Menu, X, Sparkles, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"

const navItems = [
  { label: "Curriculum", href: "#curriculum" },
  { label: "Resources", href: "/resources" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQs", href: "#faqs" },
  { label: "Community", href: "https://whatsapp.com/channel/0029VbCJ26365yDAn7xmbq2R", external: true },
]

export function Navbar() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const navRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-3xl"
    >
      <nav
        ref={navRef}
        className="relative flex items-center justify-between px-4 py-3 rounded-full bg-[#2D1A69] backdrop-blur-md border border-[#492B8C]/50 shadow-lg"
      >
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#FF6B34] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-white hidden sm:block">AI Builder</span>
        </a>

        {/* Desktop Nav Items */}
        <div className="hidden md:flex items-center gap-1 relative">
          {navItems.map((item, index) => (
            <a
              key={item.label}
              href={item.href}
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noopener noreferrer" : undefined}
              className="relative px-4 py-2 text-sm text-[#C3AFFF] hover:text-white transition-colors"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {hoveredIndex === index && (
                <motion.div
                  layoutId="navbar-hover"
                  className="absolute inset-0 bg-[#492B8C] rounded-full"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <span className="relative z-10">{item.label}</span>
            </a>
          ))}
        </div>

        {/* CTA Button */}
        <div className="hidden md:flex items-center gap-3">
          {!loading && (
            user ? (
              <Button size="sm" asChild className="shimmer-btn bg-[#FF6B34] text-white hover:bg-[#FF6B34]/90 rounded-full px-5 font-medium">
                <a href="/dashboard" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Dashboard
                </a>
              </Button>
            ) : (
              <Button size="sm" asChild className="shimmer-btn bg-[#FF6B34] text-white hover:bg-[#FF6B34]/90 rounded-full px-5 font-medium">
                <a href="/login">
                  Login
                </a>
              </Button>
            )
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-[#C3AFFF] hover:text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 right-0 mt-2 p-4 rounded-2xl bg-[#2D1A69]/95 backdrop-blur-md border border-[#492B8C]/50"
        >
          <div className="flex flex-col gap-2">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
                className="px-4 py-3 text-sm text-[#C3AFFF] hover:text-white hover:bg-[#492B8C] rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <hr className="border-[#492B8C] my-2" />
            {!loading && (
              user ? (
                <Button asChild className="shimmer-btn bg-[#FF6B34] text-white hover:bg-[#FF6B34]/90 rounded-full font-medium">
                  <a href="/dashboard" className="flex items-center justify-center gap-2">
                    <User className="w-4 h-4" />
                    Dashboard
                  </a>
                </Button>
              ) : (
                <Button asChild className="shimmer-btn bg-[#FF6B34] text-white hover:bg-[#FF6B34]/90 rounded-full font-medium">
                  <a href="/login">
                    Login
                  </a>
                </Button>
              )
            )}
          </div>
        </motion.div>
      )}
    </motion.header>
  )
}
