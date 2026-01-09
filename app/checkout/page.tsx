'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Lock, Check, ArrowLeft, CreditCard } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: PaystackOptions) => { openIframe: () => void }
    }
  }
}

interface PaystackOptions {
  key: string
  email: string
  amount: number
  ref: string
  currency?: string
  channels?: string[]
  metadata?: Record<string, any>
  onSuccess?: (response: any) => void
  onCancel?: () => void
  onClose?: () => void
}

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const beatId = searchParams.get('beat')
  const licenseType = searchParams.get('license') as 'lease' | 'exclusive'
  const amount = parseInt(searchParams.get('amount') || '0')

  const [beat, setBeat] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [paystackLoaded, setPaystackLoaded] = useState(false)

  useEffect(() => {
    checkAuth()
    if (beatId) {
      fetchBeat()
    }
    
    // Check if Paystack is loaded
    const checkPaystack = () => {
      if (typeof window !== 'undefined' && window.PaystackPop) {
        setPaystackLoaded(true)
      }
    }
    
    // Check immediately
    checkPaystack()
    
    // Check again after a delay (in case script loads later)
    const timer = setTimeout(checkPaystack, 1000)
    
    // Listen for script load
    const script = document.querySelector('script[src*="paystack"]')
    if (script) {
      script.addEventListener('load', checkPaystack)
    }
    
    return () => {
      clearTimeout(timer)
      if (script) {
        script.removeEventListener('load', checkPaystack)
      }
    }
  }, [beatId])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to continue')
      router.push('/auth/signin')
      return
    }
    setUser(user)
  }

  const fetchBeat = async () => {
    try {
      const { data, error } = await supabase
        .from('beats')
        .select('*')
        .eq('id', beatId)
        .single()

      if (error) throw error
      
      // Check if exclusive and already sold
      if (licenseType === 'exclusive' && data.exclusive_sold) {
        toast.error('This beat is no longer available for exclusive purchase')
        router.push(`/beats/${data.slug}`)
        return
      }

      setBeat(data)
    } catch (error) {
      console.error('Error fetching beat:', error)
      toast.error('Beat not found')
      router.push('/beats')
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentSuccess = async (response: any) => {
    console.log('Payment successful:', response)
    setProcessing(true)
    
    try {
      // Create purchase record
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          user_id: user.id,
          beat_id: beatId,
          license_type: licenseType,
          amount: amount,
          payment_reference: response.reference,
          payment_status: 'completed',
        })
        .select()
        .single()

      if (purchaseError) throw purchaseError

      // If exclusive, mark beat as sold
      if (licenseType === 'exclusive') {
        const { error: updateError } = await supabase
          .from('beats')
          .update({
            exclusive_sold: true,
            exclusive_buyer_id: user.id,
          })
          .eq('id', beatId)

        if (updateError) throw updateError

        // Create stems request
        const { error: stemsError } = await supabase
          .from('stems_requests')
          .insert({
            beat_id: beatId,
            buyer_id: user.id,
            purchase_id: purchase.id,
            status: 'pending_upload',
          })

        if (stemsError) throw stemsError
      }

      // Increment lease count if lease
      if (licenseType === 'lease') {
        await supabase.rpc('increment_lease_count', { beat_id: beatId })
      }

      toast.success('Payment successful! Redirecting to your downloads...')
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (error: any) {
      console.error('Error processing purchase:', error)
      toast.error('Payment succeeded but there was an error. Please contact support.')
    } finally {
      setProcessing(false)
    }
  }

  const handlePaymentClose = () => {
    console.log('Payment closed by user')
    toast.error('Payment cancelled')
  }

  const initializePayment = useCallback(() => {
    if (processing) {
      toast.error('Please wait while we process your payment')
      return
    }

    if (!user?.email) {
      toast.error('Email address is required')
      return
    }

    // Check if Paystack is loaded
    if (!window.PaystackPop) {
      toast.error('Payment system is loading. Please wait a moment and try again.')
      console.error('Paystack not loaded. Available window.PaystackPop:', window.PaystackPop)
      return
    }

    const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
    if (!paystackKey) {
      toast.error('Payment configuration error. Please contact support.')
      console.error('Paystack public key not found')
      return
    }

    try {
      const paystackOptions: PaystackOptions = {
        key: paystackKey,
        email: user.email,
        amount: amount * 100,
        ref: `meckury-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        currency: 'NGN',
        channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
        metadata: {
          beat_id: beatId,
          license_type: licenseType,
          customer_id: user.id,
          customer_email: user.email,
        },
        onSuccess: (response: any) => {
          console.log('Paystack payment successful:', response)
          handlePaymentSuccess(response)
        },
        onCancel: () => {
          console.log('Paystack payment cancelled by user')
          handlePaymentClose()
        },
        onClose: () => {
          console.log('Paystack payment window closed')
          handlePaymentClose()
        }
      }

      console.log('Initializing Paystack payment with options:', {
        ...paystackOptions,
        key: `${paystackKey.substring(0, 10)}...`,
        email: user.email
      })

      // Use Paystack's setup method
      const handler = window.PaystackPop.setup(paystackOptions)
      handler.openIframe()
    } catch (error) {
      console.error('Error initializing Paystack payment:', error)
      toast.error('Failed to initialize payment. Please try again.')
    }
  }, [processing, user, amount, beatId, licenseType, handlePaymentSuccess, handlePaymentClose])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-12 h-12"></div>
      </div>
    )
  }

  if (!beat || !user) {
    return null
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-32 pb-20 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-text-secondary hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-display font-bold text-white mb-2">
              Checkout
            </h1>
            <p className="text-text-secondary">
              Complete your purchase securely with Paystack
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Order Summary */}
            <div className="lg:col-span-2">
              <div className="card">
                <h2 className="text-2xl font-bold text-white mb-6">
                  Order Summary
                </h2>

                <div className="flex items-start space-x-4 mb-6">
                  {/* Beat Cover */}
                  <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-background-elevated">
                    {beat.cover_art_url ? (
                      <img
                        src={beat.cover_art_url}
                        alt={beat.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">
                        🎵
                      </div>
                    )}
                  </div>

                  {/* Beat Info */}
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-1">
                      {beat.title}
                    </h3>
                    {beat.type_beat && (
                      <p className="text-text-secondary text-sm mb-2">
                        {beat.type_beat}
                      </p>
                    )}
                    <div className="flex items-center space-x-3 text-text-muted text-sm">
                      {beat.bpm && <span>{beat.bpm} BPM</span>}
                      {beat.key && (
                        <>
                          <span>•</span>
                          <span>{beat.key}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* License Details */}
                <div className="border-t border-meckury-mediumGray pt-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    {licenseType === 'lease' ? 'Lease License' : 'Exclusive Rights'}
                  </h3>

                  <div className="space-y-3">
                    <div className="flex items-start space-x-2">
                      <Check className="w-5 h-5 text-meckury-success mt-0.5 flex-shrink-0" />
                      <span className="text-text-secondary text-sm">
                        {licenseType === 'lease' ? 'MP3 & WAV files' : 'MP3, WAV & Stems'}
                      </span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Check className="w-5 h-5 text-meckury-success mt-0.5 flex-shrink-0" />
                      <span className="text-text-secondary text-sm">
                        {licenseType === 'lease'
                          ? 'Non-exclusive commercial use'
                          : 'Full exclusive ownership'}
                      </span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Check className="w-5 h-5 text-meckury-success mt-0.5 flex-shrink-0" />
                      <span className="text-text-secondary text-sm">
                        {licenseType === 'lease'
                          ? 'Instant download'
                          : 'Stems prepared within 48 hours'}
                      </span>
                    </div>
                    {licenseType === 'exclusive' && (
                      <div className="flex items-start space-x-2">
                        <Check className="w-5 h-5 text-meckury-success mt-0.5 flex-shrink-0" />
                        <span className="text-text-secondary text-sm">
                          Beat removed from store after purchase
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="lg:col-span-1">
              <div className="card sticky top-32">
                <h3 className="text-xl font-bold text-white mb-6">Payment</h3>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Subtotal</span>
                    <span className="text-white font-semibold">
                      {formatPrice(amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Tax</span>
                    <span className="text-white font-semibold">₦0</span>
                  </div>
                  <div className="border-t border-meckury-mediumGray pt-4 flex justify-between">
                    <span className="text-white font-bold">Total</span>
                    <span className="text-meckury-primary font-bold text-2xl">
                      {formatPrice(amount)}
                    </span>
                  </div>
                </div>

                {/* Debug info (remove in production) */}
                <div className="mb-4 text-xs text-gray-500">
                  <div>Paystack loaded: {paystackLoaded ? 'Yes' : 'No'}</div>
                  <div>User email: {user?.email ? 'Set' : 'Not set'}</div>
                  <div>Amount: {amount} NGN</div>
                </div>

                {/* Paystack Button */}
                {!processing ? (
                  <button
                    onClick={initializePayment}
                    disabled={!paystackLoaded || !user?.email}
                    className={`btn-primary w-full flex items-center justify-center space-x-2 py-4 ${
                      (!paystackLoaded || !user?.email) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>
                      {!paystackLoaded ? 'Loading Payment...' : 'Pay with Paystack'}
                    </span>
                  </button>
                ) : (
                  <button
                    disabled
                    className="btn-primary w-full flex items-center justify-center space-x-2 opacity-50 cursor-not-allowed py-4"
                  >
                    <div className="spinner w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </button>
                )}

                {/* Security Notice */}
                <div className="mt-6 p-4 bg-background-elevated rounded-lg border border-meckury-mediumGray">
                  <div className="flex items-start space-x-2">
                    <Lock className="w-5 h-5 text-meckury-success mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-white font-semibold text-sm mb-1">
                        Secure Payment
                      </h4>
                      <p className="text-text-secondary text-xs">
                        Powered by Paystack. Your payment information is encrypted and secure.
                      </p>
                    </div>
                  </div>
                </div>

                {/* License Note */}
                <div className="mt-4 p-3 bg-meckury-secondary bg-opacity-10 rounded-lg border border-meckury-secondary">
                  <p className="text-text-secondary text-xs">
                    By completing this purchase, you agree to our{' '}
                    <a href="/licenses" className="text-meckury-primary hover:underline">
                      License Agreement
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-12 h-12"></div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
