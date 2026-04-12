"use client"

import { useState, useEffect } from "react"
import { Download, FileText, Video, Calendar, Loader2, ShoppingBag } from "lucide-react"
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

export function MyPurchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatPrice = (amount: number, currency: string) => {
    const price = (amount / 100).toFixed(2)
    return currency === 'INR' ? `₹${price}` : `$${price}`
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
      <h2 className="text-xl font-bold text-[#1A0A3D] mb-4" style={{ fontFamily: "var(--font-cal-sans)" }}>
        My Purchases ({purchases.length})
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {purchases.map((purchase) => {
          const Icon = purchase.resource.type === 'video' ? Video : FileText

          return (
            <div
              key={purchase.purchaseId}
              className="p-4 rounded-xl border border-[#E8E3F3] bg-white hover:border-[#492B8C] hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 rounded-lg bg-[#F4F1FB]">
                  <Icon className="w-5 h-5 text-[#492B8C]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-[#1A0A3D] mb-1 line-clamp-2">
                    {purchase.resource.title}
                  </h3>
                  <p className="text-xs text-[#6B5B9E] line-clamp-2 mb-2">
                    {purchase.resource.description}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-[#6B5B9E]">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(purchase.purchasedAt)}
                    </div>
                    <span className="font-semibold text-[#1A0A3D]">
                      {formatPrice(purchase.amountPaid, purchase.currency)}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => handleDownload(purchase.resource.id)}
                disabled={downloadingId === purchase.resource.id}
                className="w-full bg-[#00C8A7] hover:bg-[#00C8A7]/90 text-white rounded-full"
                size="sm"
              >
                {downloadingId === purchase.resource.id ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="w-3 h-3 mr-2" />
                    Download
                  </>
                )}
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
