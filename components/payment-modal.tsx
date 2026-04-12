"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, CreditCard, Smartphone, X, CheckCircle2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface PaymentModalProps {
  open: boolean
  onClose: () => void
  resource: {
    id: string
    title: string
    description: string
    price_inr?: number
    price_usd?: number
  }
  onSuccess?: () => void
}

declare global {
  interface Window {
    Razorpay: any
  }
}

export function PaymentModal({ open, onClose, resource, onSuccess }: PaymentModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR')
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  // Detect currency based on location (simple version)
  useEffect(() => {
    // You can enhance this with IP geolocation API
    const detectedCurrency = 'INR' // Default to INR
    setCurrency(detectedCurrency)
  }, [])

  const price = currency === 'INR' ? resource.price_inr : resource.price_usd
  const displayPrice = price ? (price / 100).toFixed(2) : '0'

  const handlePayment = async () => {
    setLoading(true)
    setPaymentStatus('processing')
    setErrorMessage('')

    try {
      // Create payment order
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceId: resource.id,
          currency,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create order')
      }

      const { order } = data

      if (order.gateway === 'razorpay') {
        handleRazorpayPayment(order)
      } else if (order.gateway === 'stripe') {
        handleStripePayment(order)
      }

    } catch (error: any) {
      console.error('Payment error:', error)
      setErrorMessage(error.message || 'Payment failed')
      setPaymentStatus('error')
      setLoading(false)
    }
  }

  const handleRazorpayPayment = (order: any) => {
    const options = {
      key: order.key,
      amount: order.amount,
      currency: order.currency,
      name: 'AI Builder',
      description: resource.title,
      order_id: order.orderId,
      handler: async function (response: any) {
        try {
          // Verify payment
          const verifyResponse = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              gateway: 'razorpay',
            }),
          })

          const verifyData = await verifyResponse.json()

          if (verifyData.success) {
            setPaymentStatus('success')
            setTimeout(() => {
              onSuccess?.()
              router.refresh()
              onClose()
            }, 2000)
          } else {
            throw new Error(verifyData.error || 'Payment verification failed')
          }
        } catch (error: any) {
          setErrorMessage(error.message)
          setPaymentStatus('error')
        } finally {
          setLoading(false)
        }
      },
      prefill: {
        name: '',
        email: '',
      },
      theme: {
        color: '#2D1A69',
      },
      modal: {
        ondismiss: function () {
          setLoading(false)
          setPaymentStatus('idle')
        },
      },
    }

    const razorpay = new window.Razorpay(options)
    razorpay.open()
  }

  const handleStripePayment = async (order: any) => {
    // For Stripe, you would typically use Stripe Elements or Stripe Checkout
    // This is a simplified version - you'll need to implement full Stripe integration
    setErrorMessage('Stripe integration coming soon')
    setPaymentStatus('error')
    setLoading(false)
  }

  // Load Razorpay script
  useEffect(() => {
    if (open && currency === 'INR') {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      document.body.appendChild(script)

      return () => {
        document.body.removeChild(script)
      }
    }
  }, [open, currency])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#1A0A3D]">Complete Purchase</DialogTitle>
          <DialogDescription className="text-[#6B5B9E]">
            {resource.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Price Display */}
          <div className="p-4 rounded-lg bg-[#F4F1FB] border border-[#E8E3F3]">
            <div className="flex items-center justify-between">
              <span className="text-[#6B5B9E]">Total Amount</span>
              <div className="text-right">
                <div className="text-2xl font-bold text-[#1A0A3D]">
                  {currency === 'INR' ? '₹' : '$'}{displayPrice}
                </div>
                <div className="text-xs text-[#6B5B9E]">{currency}</div>
              </div>
            </div>
          </div>

          {/* Currency Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={currency === 'INR' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrency('INR')}
              className={currency === 'INR' ? 'bg-[#2D1A69]' : ''}
              disabled={!resource.price_inr}
            >
              <Smartphone className="w-3 h-3 mr-1" />
              INR (India)
            </Button>
            <Button
              variant={currency === 'USD' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrency('USD')}
              className={currency === 'USD' ? 'bg-[#2D1A69]' : ''}
              disabled={!resource.price_usd}
            >
              <CreditCard className="w-3 h-3 mr-1" />
              USD (International)
            </Button>
          </div>

          {/* Success Message */}
          {paymentStatus === 'success' && (
            <div className="p-4 rounded-lg bg-green-50 border border-green-200 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Payment Successful!</p>
                <p className="text-sm text-green-700">Redirecting to download...</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {paymentStatus === 'error' && errorMessage && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-800">{errorMessage}</p>
            </div>
          )}

          {/* Payment Button */}
          <Button
            onClick={handlePayment}
            disabled={loading || paymentStatus === 'success'}
            className="w-full bg-[#FF6B34] hover:bg-[#FF6B34]/90 text-white rounded-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : paymentStatus === 'success' ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Payment Successful
              </>
            ) : (
              <>
                {currency === 'INR' ? (
                  <>
                    <Smartphone className="w-4 h-4 mr-2" />
                    Pay with UPI/Card
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pay with Card
                  </>
                )}
              </>
            )}
          </Button>

          <p className="text-xs text-center text-[#6B5B9E]">
            Secure payment powered by {currency === 'INR' ? 'Razorpay' : 'Stripe'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
