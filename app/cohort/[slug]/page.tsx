"use client"

import { use, useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ArrowLeft, 
  ExternalLink, 
  PlayCircle, 
  Search, 
  Code, 
  User, 
  X, 
  Sparkles, 
  Check, 
  Star,
  Film,
  Calendar,
  Layers
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

interface Project {
  id: string
  title: string
  description: string | null
  project_url: string | null
  repo_url: string | null
  demo_url: string | null
  thumbnail_url: string | null
  technologies: string[]
  featured: boolean
  developer: {
    name: string
    email: string
    avatar_url: string | null
  }
}

interface ShowcaseData {
  showcase: {
    id: string
    title: string
    hero_title: string | null
    hero_subtitle: string | null
    summary: string | null
    highlight_video_url: string | null
    settings: any
    cohort: {
      id: string
      code: string
      name: string
      starts_at: string | null
      ends_at: string | null
    }
  }
  projects: Project[]
}

function extractYouTubeId(url: string | null): string | null {
  if (!url) return null
  const match = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/)
  return match?.[1] || null
}

export default function CohortShowcasePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params)
  const slug = resolvedParams.slug

  const [data, setData] = useState<ShowcaseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Interactive UI States
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTech, setSelectedTech] = useState<string>("All")
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [recapVideoOpen, setRecapVideoOpen] = useState(false)

  useEffect(() => {
    async function fetchShowcase() {
      try {
        const res = await fetch(`/api/cohorts/showcase/${slug}`)
        if (!res.ok) {
          if (res.status === 404) {
            setError("This cohort showcase page is not active or could not be found.")
          } else {
            setError("Failed to load cohort showcase. Please try again later.")
          }
          return
        }
        const showcaseData = await res.json()
        setData(showcaseData)
      } catch (err) {
        console.error(err)
        setError("An unexpected error occurred.")
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchShowcase()
    }
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-16 h-16 relative">
          <div className="absolute inset-0 rounded-full border-4 border-t-[#FF6B34] border-r-transparent border-b-[#492B8C] border-l-transparent animate-spin" />
          <Sparkles className="w-6 h-6 text-[#FFD13F] absolute inset-0 m-auto animate-pulse" />
        </div>
        <p className="text-slate-400 mt-4 font-medium tracking-wide animate-pulse">Loading Graduation Gallery...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white px-4">
        <div className="max-w-md text-center space-y-6">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
            <X className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Showcase Not Available</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            {error || "The showcase page is currently in draft mode or the slug is incorrect."}
          </p>
          <Button asChild className="bg-gradient-to-r from-[#492B8C] to-[#2D1A69] hover:from-[#3D2174] hover:to-[#1F104D] text-white rounded-full px-6">
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const { showcase, projects } = data

  // Extract all unique technologies for filtering
  const allTechs = ["All", ...Array.from(new Set(projects.flatMap(p => p.technologies || [])))]

  // Filter projects based on query, tech stack, and featured status
  const filteredProjects = projects.filter(project => {
    const matchesSearch = 
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.developer.name.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesTech = selectedTech === "All" || project.technologies.includes(selectedTech)
    const matchesFeatured = !showFeaturedOnly || project.featured

    return matchesSearch && matchesTech && matchesFeatured
  })

  const highlightVideoId = extractYouTubeId(showcase.highlight_video_url)

  return (
    <main className="min-h-screen bg-slate-950 text-white overflow-hidden pb-20">
      {/* Background glowing accents */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#492B8C]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-[#FF6B34]/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Floating Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 py-4 px-4 sm:px-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Home</span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#FF6B34] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-white tracking-wider text-sm">AI Builder Showcase</span>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative max-w-6xl mx-auto px-4 pt-16 pb-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-[#00C8A7] uppercase tracking-widest shadow-inner">
            <Star className="w-3.5 h-3.5 fill-current animate-pulse text-[#FFD13F]" />
            Graduation Spotlight
          </div>

          <h1 
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent"
            style={{ fontFamily: "var(--font-cal-sans), sans-serif" }}
          >
            {showcase.hero_title || showcase.title}
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed font-light">
            {showcase.hero_subtitle || `Check out the next generation of builders. Over 4 weeks, these participants shipped real production-grade AI apps and autonomous agents.`}
          </p>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center justify-center gap-8 pt-4">
            <div className="flex items-center gap-3 bg-white/5 px-5 py-2.5 rounded-full border border-white/10 shadow-lg">
              <Layers className="w-4 h-4 text-[#FF6B34]" />
              <span className="text-sm font-semibold text-slate-200">{projects.length} Shipped Projects</span>
            </div>
            <div className="flex items-center gap-3 bg-white/5 px-5 py-2.5 rounded-full border border-white/10 shadow-lg">
              <Calendar className="w-4 h-4 text-[#00C8A7]" />
              <span className="text-sm font-semibold text-slate-200">{showcase.cohort.code} Graduate Class</span>
            </div>
          </div>

          {/* Recap Video Banner */}
          {highlightVideoId && (
            <div className="pt-8">
              <button
                onClick={() => setRecapVideoOpen(true)}
                className="group relative inline-flex items-center gap-3 px-6 py-3.5 rounded-full bg-gradient-to-r from-[#FF6B34] to-[#E84C1E] text-white font-bold text-base hover:shadow-2xl hover:shadow-[#FF6B34]/30 transform hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#FF6B34] to-[#E84C1E] opacity-50 blur group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                <PlayCircle className="w-6 h-6 flex-shrink-0" />
                <span className="relative z-10">Watch Cohort Graduation Recap Video</span>
              </button>
            </div>
          )}
        </motion.div>
      </section>

      {/* Recap Video cinematic overlay player */}
      <AnimatePresence>
        {recapVideoOpen && highlightVideoId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 sm:p-12"
            onClick={() => setRecapVideoOpen(false)}
          >
            <button
              onClick={() => setRecapVideoOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white p-2 rounded-full border border-white/10 bg-slate-900/50"
            >
              <X className="w-6 h-6" />
            </button>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black shadow-[#FF6B34]/10"
            >
              <iframe
                src={`https://www.youtube.com/embed/${highlightVideoId}?autoplay=1`}
                title="Cohort highlight recap video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cohort Story Section */}
      {showcase.summary && (
        <section className="max-w-4xl mx-auto px-4 py-8">
          <div className="p-6 sm:p-8 rounded-3xl bg-white/5 border border-white/10 relative overflow-hidden backdrop-blur-xl shadow-2xl">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#492B8C]/20 rounded-full blur-2xl pointer-events-none" />
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2" style={{ fontFamily: "var(--font-cal-sans)" }}>
              <Film className="w-5 h-5 text-[#FFD13F]" /> The Cohort Journey
            </h3>
            <p className="text-slate-300 text-base leading-relaxed whitespace-pre-line font-light">
              {showcase.summary}
            </p>
          </div>
        </section>
      )}

      {/* Projects Spotlight Header & Controls */}
      <section className="max-w-6xl mx-auto px-4 pt-16 pb-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: "var(--font-cal-sans)" }}>
              <Code className="w-6 h-6 text-[#00C8A7]" /> Shipped Application Gallery
            </h2>
            <p className="text-xs text-slate-400 mt-1">Discover, inspect, and try real AI models and frameworks deployed by builders.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Bar */}
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-full text-sm text-white placeholder-slate-500 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all shadow-inner"
              />
            </div>

            {/* Featured Only Toggle */}
            <button
              onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
              className={`px-4 py-2.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition-all duration-300 ${
                showFeaturedOnly
                  ? "bg-[#FFD13F]/10 border-[#FFD13F] text-[#FFD13F]"
                  : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20"
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              Featured Only
            </button>
          </div>
        </div>

        {/* Technology Filter Badges Carousel */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth [&::-webkit-scrollbar]:hidden">
          {allTechs.map((tech) => {
            const isSelected = selectedTech === tech
            return (
              <button
                key={tech}
                onClick={() => setSelectedTech(tech)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium border transition-colors select-none ${
                  isSelected
                    ? "bg-[#492B8C] border-transparent text-white shadow-md shadow-[#492B8C]/20"
                    : "bg-white/5 border-white/5 text-slate-400 hover:text-white hover:border-white/10"
                }`}
              >
                {tech}
              </button>
            )
          })}
        </div>
      </section>

      {/* Projects Grid */}
      <section className="max-w-6xl mx-auto px-4">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
            <Code className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-semibold text-lg">No projects match your filter criteria.</p>
            <p className="text-slate-500 text-sm mt-1">Try expanding your search parameters or check back later.</p>
          </div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredProjects.map((project) => (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                onClick={() => setSelectedProject(project)}
                className="group relative flex flex-col justify-between h-full bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:border-[#492B8C] hover:shadow-xl hover:shadow-[#492B8C]/5 transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
              >
                {/* Visual highlights */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 z-10" />

                {/* Screenshot Photo */}
                <div className="relative aspect-[16/10] bg-slate-900 overflow-hidden flex-shrink-0">
                  {project.thumbnail_url ? (
                    <img 
                      src={project.thumbnail_url} 
                      alt={project.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1A0A3D] to-[#492B8C]/50 flex items-center justify-center">
                      <Code className="w-12 h-12 text-white/20 animate-pulse" />
                    </div>
                  )}
                  
                  {/* Badges */}
                  <div className="absolute top-4 left-4 z-20 flex gap-1.5 flex-wrap">
                    {project.featured && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFD13F] text-[#1A0A3D] flex items-center gap-1 shadow">
                        <Star className="w-3 h-3 fill-current" /> Featured
                      </span>
                    )}
                  </div>
                </div>

                {/* Info Content */}
                <div className="p-5 flex-1 flex flex-col justify-between relative z-20">
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-[#00C8A7] transition-colors duration-300 truncate mb-2">
                      {project.title}
                    </h3>
                    <p className="text-slate-400 text-xs sm:text-sm line-clamp-3 leading-relaxed font-light mb-4">
                      {project.description || "An impressive AI application launched at the graduation showcase."}
                    </p>
                  </div>

                  {/* Dev profile & tech list */}
                  <div className="space-y-4 pt-4 border-t border-white/5">
                    {/* Tech tag pills */}
                    <div className="flex flex-wrap gap-1">
                      {project.technologies.slice(0, 3).map((tech) => (
                        <span key={tech} className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[10px] font-medium text-slate-300">
                          {tech}
                        </span>
                      ))}
                      {project.technologies.length > 3 && (
                        <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[10px] font-medium text-slate-400">
                          +{project.technologies.length - 3} more
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {project.developer.avatar_url ? (
                        <img 
                          src={project.developer.avatar_url} 
                          alt={project.developer.name} 
                          className="w-7 h-7 rounded-full object-cover border border-white/10"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-slate-200 border border-white/5">
                          {project.developer.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-xs font-medium text-slate-300 truncate">
                        By {project.developer.name}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* Project Detail Modal Overlay */}
      <AnimatePresence>
        {selectedProject && (
          <div 
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setSelectedProject(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-950 border border-white/10 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh] text-white"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedProject(null)}
                className="absolute top-4 right-4 z-40 w-9 h-9 rounded-full bg-slate-900/50 hover:bg-slate-900 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all shadow"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="overflow-y-auto flex-1 pb-6">
                {/* Project Video/Image Frame Header */}
                {(() => {
                  const ytid = extractYouTubeId(selectedProject.demo_url)
                  return (
                    <div className="relative w-full aspect-video bg-black/30 border-b border-white/5">
                      {ytid ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${ytid}?autoplay=0`}
                          title={`${selectedProject.title} Demo Video`}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          className="absolute inset-0 w-full h-full"
                        />
                      ) : selectedProject.thumbnail_url ? (
                        <img 
                          src={selectedProject.thumbnail_url} 
                          alt={selectedProject.title} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-[#1A0A3D] to-[#492B8C] flex items-center justify-center">
                          <Code className="w-16 h-16 text-white/10 animate-pulse" />
                        </div>
                      )}
                    </div>
                  )
                })()}

                {/* Project details content */}
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {selectedProject.featured && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFD13F]/15 border border-[#FFD13F]/30 text-[#FFD13F] flex items-center gap-1 shadow">
                            <Star className="w-3 h-3 fill-current" /> Featured Project
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-900 border border-white/10 text-slate-400">Published</span>
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-white" style={{ fontFamily: "var(--font-cal-sans)" }}>
                        {selectedProject.title}
                      </h3>
                    </div>

                    {/* Developer details */}
                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-3 flex-shrink-0">
                      {selectedProject.developer.avatar_url ? (
                        <img 
                          src={selectedProject.developer.avatar_url} 
                          alt={selectedProject.developer.name} 
                          className="w-10 h-10 rounded-full object-cover border border-white/10"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-slate-200 border border-white/5">
                          {selectedProject.developer.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-white leading-tight">{selectedProject.developer.name}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{selectedProject.developer.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {selectedProject.description && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">About this application</h4>
                      <p className="text-slate-300 font-light text-sm sm:text-base leading-relaxed whitespace-pre-line">
                        {selectedProject.description}
                      </p>
                    </div>
                  )}

                  {/* Tech stack */}
                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Technologies and APIs</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProject.technologies.map((tech) => (
                        <span key={tech} className="px-3 py-1 bg-slate-900 border border-white/10 rounded-xl text-xs font-medium text-[#00C8A7]">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Call to Actions (CTAs) */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-white/5">
                    {selectedProject.project_url && (
                      <Button
                        size="lg"
                        asChild
                        className="bg-[#00C8A7] hover:bg-[#009E87] text-white rounded-xl flex-1 font-bold h-12 text-sm"
                      >
                        <a href={selectedProject.project_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                          Visit Live Application <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                    {selectedProject.repo_url && (
                      <Button
                        size="lg"
                        variant="outline"
                        asChild
                        className="border-white/10 hover:bg-white/5 rounded-xl text-slate-300 hover:text-white flex-1 font-semibold h-12 text-sm bg-transparent"
                      >
                        <a href={selectedProject.repo_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                          View Code Repository <Code className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  )
}
