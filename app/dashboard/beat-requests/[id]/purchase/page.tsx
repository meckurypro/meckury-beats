'use client'

/**
 * Beat Request Purchase Page Component
 * 
 * Handles final payment for approved custom beat requests:
 * - License selection (Lease or Exclusive)
 * - Credit application from upfront payment
 * - Final payment processing via Paystack
 * - Purchase completion and beat activation
 * 
 * @route /dashboard/beat-requests/[id]/purchase
 */

import { Suspense, useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Lock, Check, ArrowLeft, CreditCard, Tag } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import type { PaystackOptions, PaystackResponse } from '@/types/paystack'

/**
 * Beat Request data structure
 */
interface BeatRequest {
  id: string
  user_id: string
  title: string
  description: string
  client_response: 'pending' | 'approved' | 'rejected'
  status: string
  upfront_amount: number
  linked_beat_id?: string
  beats?: Beat[]
  completed_at?: string
}

/**
 * Beat data structure
 */
interface Beat {
  id: string
  title: string
  slug: string
  type_beat?: string
  bpm?: number
  key?: string
  cover_art_url?: string
  exclusive_sold: boolean
  exclusive_buyer_id?: string
  active: boolean
}

/**
 * License type
 */
type LicenseType = 'lease' | 'exclusive'

/**
 * Pricing constants
 */
const PRICING = {
  UPFRONT_PAID: 10000,
  LEASE_TOTAL: 20000,
  EXCLUSIVE_TOTAL: 80000,
} as const

/**
 * Purchase Content Component
 * Main component handling the purchase flow
 */
function PurchaseContent() {
  const router = useRouter()
  const params = useParams()
  const requestId = params.id as string
  
  // Component state
  const [request, setRequest] = useState<BeatRequest | null>(null)
  const [beat, setBeat] = useState<Beat | null>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [paystackLoaded, setPaystackLoaded] = useState(false)
  const [selectedLicense, setSelectedLicense] = useState<LicenseType>('lease')

  /**
   * Initialize component
   * Check authentication and Paystack availability
   */
  useEffect(() => {
    checkAuth()
    
    // Verify Paystack script is loaded
    const checkPaystackScript = () => {
      if (typeof window !== 'undefined' && window.PaystackPop) {
        setPaystackLoaded(true)
        console.log('✅ Paystack payment library loaded')
      } else {
        console.warn('⚠️ Paystack not yet available')
      }
    }
    
    checkPaystackScript()
    const timer = setTimeout(checkPaystackScript, 1500)
    
    return () => clearTimeout(timer)
  }, [])

  /**
   * Fetch request data when user is authenticated
   */
  useEffect(() => {
    if (user) {
      fetchRequest()
    }
  }, [user])

  /**
   * Verify user authentication
   * Redirect to sign-in if not authenticated
   */
  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) throw error
      
      if (!user) {
        toast.error('Please sign in to continue')
        router.push('/auth/signin')
        return
      }
      
      setUser(user)
    } catch (error) {
      console.error('Authentication error:', error)
      toast.error('Authentication failed')
      router.push('/auth/signin')
    }
  }

  /**
   * Fetch beat request and associated beat data
   * Validates authorization and request status
   */
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

      // Verify user owns this request
      if (reqData.user_id !== user?.id) {
        toast.error('You do not have permission to access this request')
        router.push('/dashboard')
        return
      }

      // Verify request has been approved by client
      if (reqData.client_response !== 'approved') {
        toast.error('Beat must be approved before purchase')
        router.push('/dashboard')
        return
      }

      setRequest(reqData)
      
      // Set beat data if available
      if (reqData.beats && reqData.beats.length > 0) {
        const beatData = reqData.beats[0]
        setBeat(beatData)
        
        // Force lease selection if exclusive is already sold
        if (beatData.exclusive_sold) {
          setSelectedLicense('lease')
        }
      } else {
        toast.error('Beat not found for this request')
        router.push('/dashboard')
        return
      }
    } catch (error) {
      console.error('Error fetching beat request:', error)
      toast.error('Failed to load request details')
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Calculate remaining amount to pay after upfront credit
   * 
   * @returns Amount due in naira
   */
  const getAmount = (): number => {
    const upfrontPaid = request?.upfront_amount || PRICING.UPFRONT_PAID
    
    if (selectedLicense === 'lease') {
      return PRICING.LEASE_TOTAL - upfrontPaid
    } else {
      return PRICING.EXCLUSIVE_TOTAL - upfrontPaid
    }
  }

  /**
   * Handle successful payment completion
   * Creates purchase record and updates beat/request status
   * 
   * @param response - Paystack payment response
   */
  const handlePaymentSuccess = async (response: PaystackResponse) => {
    console.log('✅ Payment successful - Reference:', response.reference)
    setProcessing(true)
    
    try {
      // Determine total amount (original price, not discounted)
      const totalAmount = selectedLicense === 'lease' 
        ? PRICING.LEASE_TOTAL 
        : PRICING.EXCLUSIVE_TOTAL

      // Create purchase record
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          user_id: user.id,
          beat_id: beat!.id,
          license_type: selectedLicense,
          amount: totalAmount,
          payment_reference: response.reference,
          payment_status: 'completed',
        })
        .select()
        .single()

      if (purchaseError) throw purchaseError

      // Handle exclusive purchase workflow
      if (selectedLicense === 'exclusive') {
        // Mark beat as exclusively sold
        const { error: updateError } = await supabase
          .from('beats')
          .update({
            exclusive_sold: true,
            exclusive_buyer_id: user.id,
          })
          .eq('id', beat!.id)

        if (updateError) throw updateError

        // Create stems delivery request
        const { error: stemsError } = await supabase
          .from('stems_requests')
          .insert({
            beat_id: beat!.id,
            buyer_id: user.id,
            purchase_id: purchase.id,
            status: 'pending_upload',
          })

        if (stemsError) throw stemsError
      }

      // Increment lease count for lease purchases
      if (selectedLicense === 'lease') {
        const { error: incrementError } = await supabase
          .rpc('increment_lease_count', { beat_id: beat!.id })
        
        if (incrementError) {
          console.error('Failed to increment lease count:', incrementError)
          // Non-critical error, continue
        }
      }

      // Activate beat (make it public in store)
      const { error: activateError } = await supabase
        .from('beats')
        .update({ active: true })
        .eq('id', beat!.id)

      if (activateError) {
        console.error('Failed to activate beat:', activateError)
        // Non-critical error, continue
      }

      // Mark request as completed
      const { error: completeError } = await supabase
        .from('beat_requests')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', requestId)

      if (completeError) {
        console.error('Failed to mark request as completed:', completeError)
        // Non-critical error, continue
      }

      toast.success('🎉 Payment successful! Redirecting to your downloads...')
      
      // Redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (error: any) {
      console.error('❌ Error processing purchase:', error)
      toast.error(
        'Payment was successful but there was an error processing your order. ' +
        'Please contact support with reference: ' + response.reference
      )
    } finally {
      setProcessing(false)
    }
  }

  /**
   * Handle payment cancellation or modal close
   */
  const handlePaymentClose = () => {
    console.log('Payment cancelled or closed by user')
    toast.error('Payment was cancelled')
  }

  /**
   * Initialize Paystack payment modal
   * Validates requirements and opens payment window
   */
  const initializePayment = useCallback(() => {
    // Prevent duplicate payment attempts
    if (processing) {
      toast.error('Please wait while we process your payment')
      return
    }

    // Validate user email
    if (!user?.email) {
      toast.error('Email address is required for payment')
      return
    }

    // Verify Paystack is loaded
    if (!window.PaystackPop) {
      toast.error('Payment system is still loading. Please wait a moment and try again.')
      console.error('❌ Paystack not available')
      return
    }

    // Verify Paystack key is configured
    const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
    if (!paystackKey) {
      toast.error('Payment configuration error. Please contact support.')
      console.error('❌ NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY not configured')
      return
    }

    try {
      const amount = getAmount()
      const transactionRef = `beat-req-final-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      // Configure Paystack payment options
      const paystackOptions: PaystackOptions = {
        key: paystackKey,
        email: user.email,
        amount: amount * 100, // Convert to kobo
        ref: transactionRef,
        currency: 'NGN',
        channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
        metadata: {
          type: 'beat_request_final',
          beat_id: beat!.id,
          request_id: requestId,
          license_type: selectedLicense,
          customer_id: user.id,
          customer_email: user.email,
          beat_title: beat!.title,
        },
        onSuccess: (response: PaystackResponse) => {
          console.log('Paystack onSuccess callback triggered:', response)
          handlePaymentSuccess(response)
        },
        onCancel: () => {
          console.log('Paystack onCancel callback triggered')
          handlePaymentClose()
        },
        onClose: () => {
          console.log('Paystack onClose callback triggered')
          handlePaymentClose()
        }
      }

      console.log('Initializing Paystack payment...', {
        amount,
        license: selectedLicense,
        reference: transactionRef
      })

      // Open Paystack payment modal
      const handler = window.PaystackPop.setup(paystackOptions)
      handler.openIframe()
    } catch (error) {
      console.error('❌ Error initializing payment:', error)
      toast.error('Failed to initialize payment. Please try again.')
    }
  }, [processing, user, beat, selectedLicense, requestId])

  /**
   * Format price in Nigerian Naira
   * 
   * @param price - Price in naira
   * @returns Formatted currency string
   */
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price)
  }

  // Loading state UI
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="spinner w-12 h-12 mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading purchase details...</p>
        </div>
      </div>
    )
  }

  // Guard: Ensure required data exists
  if (!beat || !user || !request) {
    return null
  }

  const remainingAmount = getAmount()
  const totalAmount = selectedLicense === 'lease' 
    ? PRICING.LEASE_TOTAL 
    : PRICING.EXCLUSIVE_TOTAL

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-32 pb-20 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Navigation */}
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-text-secondary hover:text-white transition-colors mb-8 group"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back</span>
          </button>

          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-display font-bold text-white mb-2">
              Complete Your Purchase
            </h1>
            <p className="text-text-secondary">
              You've already paid ₦{PRICING.UPFRONT_PAID.toLocaleString()}. Choose your license and pay the remaining balance.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Beat Summary Section */}
            <div className="lg:col-span-2">
              <div className="card">
                <h2 className="text-2xl font-bold text-white mb-6">
                  Your Custom Beat
                </h2>

                {/* Beat Information Card */}
                <div className="flex items-start space-x-4 mb-6">
                  <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-background-elevated">
                    {beat.cover_art_url ? (
                      <img
                        src={beat.cover_art_url}
                        alt={`${beat.title} cover art`}
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
                    {/* Lease License Option */}
                    <button
                      onClick={() => setSelectedLicense('lease')}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selectedLicense === 'lease'
                          ? 'border-meckury-primary bg-meckury-primary bg-opacity-10'
                          : 'border-meckury-mediumGray hover:border-meckury-primary'
                      }`}
                      disabled={processing}
                      aria-label="Select lease license"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-lg font-bold text-white">Lease License</h4>
                          <p className="text-text-secondary text-sm">Non-exclusive commercial use</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-text-muted line-through">
                            ₦{PRICING.LEASE_TOTAL.toLocaleString()}
                          </p>
                          <p className="text-2xl font-bold text-meckury-primary">
                            ₦{(PRICING.LEASE_TOTAL - PRICING.UPFRONT_PAID).toLocaleString()}
                          </p>
                          <p className="text-xs text-meckury-success">
                            ₦{PRICING.UPFRONT_PAID.toLocaleString()} credit applied!
                          </p>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm text-text-secondary">
                        <p>✓ MP3 & WAV files included</p>
                        <p>✓ Unlimited distribution streams</p>
                        <p>✓ Credit required: "Produced by Meckury"</p>
                      </div>
                    </button>

                    {/* Exclusive License Option */}
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
                      aria-label={beat.exclusive_sold ? 'Exclusive license sold out' : 'Select exclusive license'}
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
                          <p className="text-xs text-text-muted line-through">
                            ₦{PRICING.EXCLUSIVE_TOTAL.toLocaleString()}
                          </p>
                          <p className="text-2xl font-bold text-meckury-accent">
                            ₦{(PRICING.EXCLUSIVE_TOTAL - PRICING.UPFRONT_PAID).toLocaleString()}
                          </p>
                          <p className="text-xs text-meckury-success">
                            ₦{PRICING.UPFRONT_PAID.toLocaleString()} credit applied!
                          </p>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm text-text-secondary">
                        <p>✓ MP3, WAV & Stems (trackouts)</p>
                        <p>✓ Full exclusive ownership rights</p>
                        <p>✓ Beat removed from store permanently</p>
                        <p>✓ Stems delivered within 48 hours</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Summary Section */}
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
                      -₦{PRICING.UPFRONT_PAID.toLocaleString()}
                    </span>
                  </div>
                  <div className="border-t border-meckury-mediumGray pt-4 flex justify-between">
                    <span className="text-white font-bold">Amount Due</span>
                    <span className="text-meckury-primary font-bold text-2xl">
                      {formatPrice(remainingAmount)}
                    </span>
                  </div>
                </div>

                {/* Payment Action Button */}
                {!processing ? (
                  <button
                    onClick={initializePayment}
                    disabled={!paystackLoaded || !user?.email}
                    className={`btn-primary w-full flex items-center justify-center space-x-2 py-4 ${
                      (!paystackLoaded || !user?.email) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    aria-label="Proceed to payment"
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>
                      {!paystackLoaded ? 'Loading Payment System...' : `Pay ${formatPrice(remainingAmount)}`}
                    </span>
                  </button>
                ) : (
                  <button
                    disabled
                    className="btn-primary w-full flex items-center justify-center space-x-2 opacity-50 cursor-not-allowed py-4"
                    aria-label="Processing payment"
                  >
                    <div className="spinner w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing Payment...</span>
                  </button>
                )}

                {/* Security Badge */}
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

/**
 * Main Beat Request Purchase Page Component
 * Wrapped with Suspense boundary for params loading
 */
export default function BeatRequestPurchasePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="spinner w-12 h-12 mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading purchase details...</p>
        </div>
      </div>
    }>
      <PurchaseContent />
    </Suspense>
  )
}
