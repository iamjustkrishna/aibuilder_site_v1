"use client"

import { useState, useEffect } from "react"
import { Download, FileText, Video, Calendar, Loader2, ShoppingBag, Link2, Copy, Check, Clock, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface Purchase {
  purchaseId: string
  purchasedAt: string
  amountPaid: number
  currency: string
  resource: {
    id: string
    title: string
    description: string
    type: string
  }
}

interface GeneratedLink {
  resourceId: string
  url: string
  expiresAt: string
}

export function MyPurchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [generatingLinkId, setGeneratingLinkId] = useState<string | null>(null)
  const [generatedLinks, setGeneratedLinks] = useState<Record<string, GeneratedLink>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    fetchPurchases()
  }, [])

  const fetchPurchases = async () => {
    try {
      const response = await fetch('/api/resources/purchased')
      const data = await response.json()

      if (data.success) {
        setPurchases(data.purchases)
      }
    } catch (error) {
      console.error('Failed to fetch purchases:', error)
      toast.error('Failed to load purchases')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (resourceId: string) => {
    setDownloadingId(resourceId)
    try {
      const response = await fetch(`/api/resources/${resourceId}/download`)
      const data = await response.json()

      if (data.success) {
        window.open(data.downloadUrl, '_blank')
        toast.success('Download started!')
      } else {
        toast.error(data.error || 'Failed to download')
      }
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download resource')
    } finally {
      setDownloadingId(null)
    }
  }

  const handleGenerateLink = async (resourceId: string) => {
    setGeneratingLinkId(resourceId)
    try {
      const response = await fetch(`/api/resources/${resourceId}/signed-url`)
      const data = await response.json()

      if (data.success) {
        setGeneratedLinks(prev => ({
          ...prev,
          [resourceId]: {
            resourceId,
            url: data.signedUrl,
            expiresAt: data.expiresAt,
          }
        }))
        toast.success('Download link generated! Valid for 5 minutes.')
      } else {
        toast.error(data.error || 'Failed to generate link')
      }
    } catch (error) {
      console.error('Generate link error:', error)
      toast.error('Failed to generate download link')
    } finally {
      setGeneratingLinkId(null)
    }
  }

  const handleCopyLink = async (resourceId: string) => {
    const link = generatedLinks[resourceId]
    if (!link) return

    try {
      await navigator.clipboard.writeText(link.url)
      setCopiedId(resourceId)
      toast.success('Link copied to clipboard!')
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error('Copy error:', error)
      toast.error('Failed to copy link')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatPrice = (amount: number, currency: string) => {
    const price = (amount / 100).toFixed(2)
    return currency === 'INR' ? `₹${price}` : `$${price}`
  }

  const isLinkExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-[#492B8C]" />
      </div>
    )
  }

  if (purchases.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-[#F4F1FB] flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-8 h-8 text-[#6B5B9E]" />
        </div>
        <h3 className="text-lg font-semibold text-[#1A0A3D] mb-2">No purchases yet</h3>
        <p className="text-[#6B5B9E] text-sm mb-4">
          Purchase premium resources to access exclusive content
        </p>
        <Button
          asChild
          className="bg-[#FF6B34] hover:bg-[#FF6B34]/90 text-white rounded-full"
        >
          <a href="/resources">Browse Resources</a>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[#1A0A3D]" style={{ fontFamily: "var(--font-cal-sans)" }}>
          My Purchases ({purchases.length})
        </h2>
        <p className="text-xs text-[#6B5B9E]">
          Download links expire after 5 minutes
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {purchases.map((purchase) => {
          const Icon = purchase.resource.type === 'video' ? Video : FileText
          const generatedLink = generatedLinks[purchase.resource.id]
          const linkExpired = generatedLink && isLinkExpired(generatedLink.expiresAt)

          return (
            <div
              key={purchase.purchaseId}
              className="p-5 rounded-xl border border-[#E8E3F3] bg-white hover:border-[#492B8C] hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-[#F4F1FB] shrink-0">
                  <Icon className="w-6 h-6 text-[#492B8C]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[#1A0A3D] mb-1 line-clamp-1">
                    {purchase.resource.title}
                  </h3>
                  <p className="text-sm text-[#6B5B9E] line-clamp-2 mb-3">
                    {purchase.resource.description}
                  </p>
                  <div className="flex items-center flex-wrap gap-3 text-xs text-[#6B5B9E]">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Purchased {formatDate(purchase.purchasedAt)}
                    </div>
                    <span className="font-semibold text-[#1A0A3D]">
                      {formatPrice(purchase.amountPaid, purchase.currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={() => handleDownload(purchase.resource.id)}
                  disabled={downloadingId === purchase.resource.id}
                  className="flex-1 bg-[#00C8A7] hover:bg-[#00C8A7]/90 text-white rounded-full"
                  size="sm"
                >
                  {downloadingId === purchase.resource.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download Now
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => handleGenerateLink(purchase.resource.id)}
                  disabled={generatingLinkId === purchase.resource.id}
                  variant="outline"
                  className="flex-1 border-[#492B8C] text-[#492B8C] hover:bg-[#F4F1FB] rounded-full"
                  size="sm"
                >
                  {generatingLinkId === purchase.resource.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4 mr-2" />
                      Generate Link
                    </>
                  )}
                </Button>
              </div>

              {/* Generated Link Display */}
              {generatedLink && (
                <div className={`mt-4 p-3 rounded-lg ${linkExpired ? 'bg-red-50 border border-red-200' : 'bg-[#F4F1FB] border border-[#E8E3F3]'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs">
                      <Clock className={`w-3 h-3 ${linkExpired ? 'text-red-500' : 'text-[#6B5B9E]'}`} />
                      {linkExpired ? (
                        <span className="text-red-500 font-medium">Link expired - generate a new one</span>
                      ) : (
                        <span className="text-[#6B5B9E]">
                          Expires at {formatTime(generatedLink.expiresAt)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {!linkExpired && (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={generatedLink.url}
                        readOnly
                        className="flex-1 px-3 py-2 text-xs bg-white border border-[#E8E3F3] rounded-lg truncate text-[#6B5B9E] focus:outline-none"
                      />
                      <Button
                        onClick={() => handleCopyLink(purchase.resource.id)}
                        size="sm"
                        variant="ghost"
                        className="shrink-0 text-[#492B8C] hover:bg-[#E8E3F3]"
                      >
                        {copiedId === purchase.resource.id ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        asChild
                        size="sm"
                        variant="ghost"
                        className="shrink-0 text-[#492B8C] hover:bg-[#E8E3F3]"
                      >
                        <a href={generatedLink.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
