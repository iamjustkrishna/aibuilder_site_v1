"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Menu, X, Sparkles, User, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import Link from "next/link"

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
  const [activeShowcases, setActiveShowcases] = useState<any[]>([])
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

    // Fetch showcases
    fetch("/api/cohorts/showcases")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setActiveShowcases(data)
        }
      })
      .catch(err => console.error("Failed to load active showcases:", err))

    return () => subscription.unsubscribe()
  }, [])

  // Keep main menu items clean and static
  const navItems = [
    { label: "Curriculum", href: "#curriculum" },
    { label: "Resources", href: "/resources" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQs", href: "#faqs" },
    { label: "Community", href: "https://whatsapp.com/channel/0029VbCJ26365yDAn7xmbq2R", external: true },
  ]

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
        <div className="flex items-center gap-2 min-w-0">
          <a href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[#FF6B34] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-white hidden sm:block">AI Builder</span>
          </a>
        </div>

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

        {/* CTA Button & Showcase Badge */}
        <div className="hidden md:flex items-center gap-3">
          {activeShowcases.length > 0 && (
            <Link
              href={`/cohort/${activeShowcases[0].slug}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-[#00C8A7]/30 bg-[#00C8A7]/5 text-[#00C8A7] text-[11px] font-bold hover:bg-[#00C8A7]/10 hover:border-[#00C8A7] hover:scale-102 active:scale-98 transition-all duration-300 shadow-sm"
              title={`View ${activeShowcases[0].title}`}
            >
              <Star className="w-3 h-3 fill-current text-[#FFD13F] flex-shrink-0" />
              <span>{activeShowcases[0].cohort?.code || "GALLERY"}</span>
            </Link>
          )}
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
            {activeShowcases.length > 0 && (
              <Link
                href={`/cohort/${activeShowcases[0].slug}`}
                className="flex items-center justify-between px-4 py-2.5 text-sm font-semibold bg-[#00C8A7]/10 border border-[#00C8A7]/20 text-[#00C8A7] rounded-xl transition-all duration-300 mb-1 hover:bg-[#00C8A7]/20"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-[#FFD13F] fill-[#FFD13F]" />
                  <span>{activeShowcases[0].cohort?.code || "COHORT-0"} Showcase Gallery</span>
                </span>
                <span className="text-[9px] uppercase font-extrabold tracking-wider bg-[#00C8A7] text-white px-2 py-0.5 rounded-full animate-pulse">Live</span>
              </Link>
            )}
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
