import { SmoothScroll } from "@/components/smooth-scroll"
import { Navbar } from "@/components/navbar"
import { Hero } from "@/components/hero"
import { LogoMarquee } from "@/components/logo-marquee"
import { BentoGrid } from "@/components/bento-grid"
import { Pricing } from "@/components/pricing"
import { FAQs } from "@/components/faqs"
import { FinalCTA } from "@/components/final-cta"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <SmoothScroll>
      <main className="min-h-screen bg-slate-950">
        <Navbar />
        <Hero />
        <LogoMarquee />
        <BentoGrid />
        <Pricing />
        <FAQs />
        <FinalCTA />
        <Footer />
      </main>
    </SmoothScroll>
  )
}
