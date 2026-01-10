'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Lock, Check, ArrowLeft, CreditCard, Tag } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: any) => { openIframe: () => void }
    }
  }
}

function PurchaseContent() {
  const router = useRouter()
  const params = useParams()
  const requestId = params.id as string
  
  const [request, setRequest] = useState<any>(null)
  const [beat, setBeat] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [paystackLoaded, setPaystackLoaded] = useState(false)
  const [selectedLicense, setSelectedLicense] = useState<'lease' | 'exclusive'>('lease')

  useEffect(() => {
    checkAuth()
    
    // Check Paystack
    const checkPaystackScript = () => {
      if (typeof window !== 'undefined' && window.PaystackPop) {
        setPaystackLoaded(true)
      }
    }
    
    checkPaystackScript()
    const timer = setTimeout(checkPaystackScript, 1500)
    
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (user) {
      fetchRequest()
    }
  }, [user])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to continue')
      router.push('/auth/signin')
      return
    }
    setUser(user)
  }

  const fetchRequest = async () => {
    try {
      const { data: reqData, error: reqError } = await supabase
        .from('beat_requests')
        .select(`
          *,
          beats!beat_requests_linked_beat_id_fkey (*)
        `)
        .eq('id', requestId)
        .single()

      if (reqError) throw reqError

      // Authorization check
      if (reqData.user_id !== user?.id) {
        toast.error('Unauthorized access')
        router.push('/dashboard')
        return
      }

      // Check if client approved
      if (reqData.client_response !== 'approved') {
        toast.error('Beat must be approved before purchase')
        router.push('/dashboard')
        return
      }

      setRequest(reqData)
      
      if (reqData.beats && reqData.beats.length > 0) {
        setBeat(reqData.beats[0])
        
        // Check if exclusive is sold
        if (reqData.beats[0].exclusive_sold) {
          setSelectedLicense('lease')
        }
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load request')
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const getAmount = () => {
    // Already paid ₦10,000 upfront
    const upfrontPaid = request?.upfront_amount || 10000
    const leaseTotal = 20000
    const exclusiveTotal = 80000
    
    if (selectedLicense === 'lease') {
      return leaseTotal - upfrontPaid // ₦10,000 more
    } else {
      return exclusiveTotal - upfrontPaid // ₦70,000 more
    }
  }

  const handlePaymentSuccess = async (response: any) => {
    setProcessing(true)
    
    try {
      // Create purchase record
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          user_id: user.id,
          beat_id: beat.id,
          license_type: selectedLicense,
          amount: selectedLicense === 'lease' ? 20000 : 80000, // Total amount
          payment_reference: response.reference,
          payment_status: 'completed',
        })
        .select()
        .single()

      if (purchaseError) throw purchaseError

      // Handle exclusive purchase
      if (selectedLicense === 'exclusive') {
        // Mark beat as sold
        const { error: updateError } = await supabase
          .from('beats')
          .update({
            exclusive_sold: true,
            exclusive_buyer_id: user.id,
          })
          .eq('id', beat.id)

        if (updateError) throw updateError

        // Create stems request
        const { error: stemsError } = await supabase
          .from('stems_requests')
          .insert({
            beat_id: beat.id,
            buyer_id: user.id,
            purchase_id: purchase.id,
            status: 'pending_upload',
          })

        if (stemsError) throw stemsError
      }

      // Increment lease count for lease
      if (selectedLicense === 'lease') {
        await supabase.rpc('increment_lease_count', { beat_id: beat.id })
      }

      // Make beat public and mark request as completed
      await supabase
        .from('beats')
        .update({ active: true })
        .eq('id', beat.id)

      await supabase
        .from('beat_requests')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', requestId)

      toast.success('Payment successful! Redirecting to your downloads...')
      
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

    if (!window.PaystackPop) {
      toast.error('Payment system is still loading. Please wait a moment and try again.')
      return
    }

    const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
    if (!paystackKey) {
      toast.error('Payment configuration error. Please contact support.')
      return
    }

    try {
      const amount = getAmount()
      
      const handler = window.PaystackPop.setup({
        key: paystackKey,
        email: user.email,
        amount: amount * 100,
        ref: `beat-req-final-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        currency: 'NGN',
        channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
        metadata: {
          type: 'beat_request_final',
          beat_id: beat.id,
          request_id: requestId,
          license_type: selectedLicense,
          customer_id: user.id,
          customer_email: user.email,
        },
        onSuccess: (response: any) => {
          handlePaymentSuccess(response)
        },
        onCancel: handlePaymentClose,
        onClose: handlePaymentClose,
      })

      handler.openIframe()
    } catch (error) {
      console.error('Error initializing payment:', error)
      toast.error('Failed to initialize payment. Please try again.')
    }
  }, [processing, user, beat, selectedLicense, requestId])

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

  if (!beat || !user || !request) {
    return null
  }

  const remainingAmount = getAmount()
  const totalAmount = selectedLicense === 'lease' ? 20000 : 80000

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
              Complete Your Purchase
            </h1>
            <p className="text-text-secondary">
              You've already paid ₦10,000. Choose your license and pay the remaining balance.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Beat Summary */}
            <div className="lg:col-span-2">
              <div className="card">
                <h2 className="text-2xl font-bold text-white mb-6">
                  Your Custom Beat
                </h2>

                <div className="flex items-start space-x-4 mb-6">
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

                {/* License Selection */}
                <div className="border-t border-meckury-mediumGray pt-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Choose Your License
                  </h3>

                  <div className="space-y-4">
                    {/* Lease License */}
                    <button
                      onClick={() => setSelectedLicense('lease')}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selectedLicense === 'lease'
                          ? 'border-meckury-primary bg-meckury-primary bg-opacity-10'
                          : 'border-meckury-mediumGray hover:border-meckury-primary'
                      }`}
                      disabled={processing}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-lg font-bold text-white">Lease License</h4>
                          <p className="text-text-secondary text-sm">Non-exclusive commercial use</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-text-muted line-through">₦20,000</p>
                          <p className="text-2xl font-bold text-meckury-primary">₦10,000</p>
                          <p className="text-xs text-meckury-success">₦10k credit applied!</p>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm text-text-secondary">
                        <p>✓ MP3 & WAV files</p>
                        <p>✓ Unlimited distribution streams</p>
                        <p>✓ Credit required: "Produced by Meckury"</p>
                      </div>
                    </button>

                    {/* Exclusive License */}
                    <button
                      onClick={() => setSelectedLicense('exclusive')}
                      disabled={beat.exclusive_sold || processing}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        beat.exclusive_sold
                          ? 'border-meckury-mediumGray opacity-50 cursor-not-allowed'
                          : selectedLicense === 'exclusive'
                            ? 'border-meckury-accent bg-meckury-accent bg-opacity-10'
                            : 'border-meckury-mediumGray hover:border-meckury-accent'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-lg font-bold text-white">
                            Exclusive Rights
                            {beat.exclusive_sold && (
                              <span className="ml-2 text-sm text-meckury-danger">(Sold Out)</span>
                            )}
                          </h4>
                          <p className="text-text-secondary text-sm">Full exclusive ownership</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-text-muted line-through">₦80,000</p>
                          <p className="text-2xl font-bold text-meckury-accent">₦70,000</p>
                          <p className="text-xs text-meckury-success">₦10k credit applied!</p>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm text-text-secondary">
                        <p>✓ MP3, WAV & Stems (trackouts)</p>
                        <p>✓ Full exclusive ownership</p>
                        <p>✓ Beat removed from store</p>
                        <p>✓ Stems within 48 hours</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="lg:col-span-1">
              <div className="card sticky top-32">
                <h3 className="text-xl font-bold text-white mb-6">Payment Summary</h3>

                {/* Price Breakdown */}
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Original Price</span>
                    <span className="text-white font-semibold">
                      {formatPrice(totalAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-meckury-success flex items-center space-x-1">
                      <Tag className="w-4 h-4" />
                      <span>Upfront Credit</span>
                    </span>
                    <span className="text-meckury-success font-semibold">
                      -₦10,000
                    </span>
                  </div>
                  <div className="border-t border-meckury-mediumGray pt-4 flex justify-between">
                    <span className="text-white font-bold">Amount Due</span>
                    <span className="text-meckury-primary font-bold text-2xl">
                      {formatPrice(remainingAmount)}
                    </span>
                  </div>
                </div>

                {/* Payment Button */}
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
                      {!paystackLoaded ? 'Loading...' : `Pay ${formatPrice(remainingAmount)}`}
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
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default function BeatRequestPurchasePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-12 h-12"></div>
      </div>
    }>
      <PurchaseContent />
    </Suspense>
  )
}
