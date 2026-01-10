'use client'

/**
 * Checkout Page Component
 * 
 * Handles the complete checkout flow for beat purchases including:
 * - Order summary display
 * - Payment processing via Paystack
 * - License information
 * - Purchase record creation
 * - Post-purchase redirects
 * 
 * @route /checkout?beat={id}&license={type}&amount={price}
 */

import { Suspense, useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Lock, Check, ArrowLeft, CreditCard } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import type { PaystackOptions, PaystackResponse } from '@/types/paystack'

/**
 * Beat data structure from database
 */
interface Beat {
  id: string
  title: string
  slug: string
  type_beat?: string
  bpm?: number
  key?: string
  cover_art_url?: string
  lease_price: number
  exclusive_price: number
  exclusive_sold: boolean
  exclusive_buyer_id?: string
}

/**
 * License type for purchase
 */
type LicenseType = 'lease' | 'exclusive'

/**
 * Checkout Content Component
 * Main component handling payment flow with Paystack integration
 */
function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Extract URL parameters
  const beatId = searchParams.get('beat')
  const licenseType = searchParams.get('license') as LicenseType
  const amount = parseInt(searchParams.get('amount') || '0')

  // Component state
  const [beat, setBeat] = useState<Beat | null>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [paystackLoaded, setPaystackLoaded] = useState(false)

  /**
   * Initialize component on mount
   * - Check user authentication
   * - Fetch beat details
   * - Verify Paystack script loaded
   */
  useEffect(() => {
    checkAuth()
    if (beatId) {
      fetchBeat()
    }
    
    // Verify Paystack script is available
    const checkPaystackScript = () => {
      if (typeof window !== 'undefined' && window.PaystackPop) {
        setPaystackLoaded(true)
        console.log('✅ Paystack payment library loaded successfully')
      } else {
        console.warn('⚠️ Paystack library not yet available on window object')
      }
    }
    
    // Check immediately
    checkPaystackScript()
    
    // Retry after delay to handle late script loading
    const timer = setTimeout(checkPaystackScript, 1500)
    
    return () => clearTimeout(timer)
  }, [beatId])

  /**
   * Verify user authentication status
   * Redirects to sign-in page if not authenticated
   */
  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) throw error
      
      if (!user) {
        toast.error('Please sign in to continue with your purchase')
        router.push('/auth/signin')
        return
      }
      
      setUser(user)
    } catch (error) {
      console.error('Authentication check failed:', error)
      toast.error('Authentication error. Please try signing in again.')
      router.push('/auth/signin')
    }
  }

  /**
   * Fetch beat details from database
   * Validates exclusive availability if applicable
   */
  const fetchBeat = async () => {
    try {
      const { data, error } = await supabase
        .from('beats')
        .select('*')
        .eq('id', beatId)
        .single()

      if (error) throw error
      
      // Validate exclusive license availability
      if (licenseType === 'exclusive' && data.exclusive_sold) {
        toast.error('This beat has already been sold exclusively')
        router.push(`/beats/${data.slug}`)
        return
      }

      setBeat(data)
    } catch (error) {
      console.error('Error fetching beat:', error)
      toast.error('Could not load beat details')
      router.push('/beats')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle successful payment completion
   * Creates purchase records and updates beat status
   * 
   * @param response - Paystack payment response object
   */
  const handlePaymentSuccess = async (response: PaystackResponse) => {
    console.log('✅ Payment successful - Reference:', response.reference)
    setProcessing(true)
    
    try {
      // Create purchase record in database
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

      // Handle exclusive purchase workflow
      if (licenseType === 'exclusive') {
        // Mark beat as exclusively sold
        const { error: updateError } = await supabase
          .from('beats')
          .update({
            exclusive_sold: true,
            exclusive_buyer_id: user.id,
          })
          .eq('id', beatId)

        if (updateError) throw updateError

        // Create stems delivery request for producer
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

      // Increment lease counter for lease purchases
      if (licenseType === 'lease') {
        const { error: incrementError } = await supabase
          .rpc('increment_lease_count', { beat_id: beatId })
        
        if (incrementError) {
          console.error('Failed to increment lease count:', incrementError)
          // Non-critical error, continue with success flow
        }
      }

      toast.success('🎉 Payment successful! Redirecting to your downloads...')
      
      // Redirect to user dashboard
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (error: any) {
      console.error('Error processing purchase:', error)
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
   * Initialize and open Paystack payment modal
   * Validates all requirements before opening payment window
   */
  const initializePayment = useCallback(() => {
    // Prevent duplicate payment attempts
    if (processing) {
      toast.error('Please wait while we process your payment')
      return
    }

    // Validate user email exists
    if (!user?.email) {
      toast.error('Email address is required for payment')
      return
    }

    // Verify Paystack library is loaded
    if (!window.PaystackPop) {
      toast.error('Payment system is still loading. Please wait a moment and try again.')
      console.error('❌ Paystack not available. window.PaystackPop:', window.PaystackPop)
      return
    }

    // Verify Paystack public key is configured
    const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
    if (!paystackKey) {
      toast.error('Payment configuration error. Please contact support.')
      console.error('❌ NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY not found in environment')
      return
    }

    try {
      // Generate unique transaction reference
      const transactionRef = `meckury-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      // Configure Paystack payment options
      const paystackOptions: PaystackOptions = {
        key: paystackKey,
        email: user.email,
        amount: amount * 100, // Convert to kobo (NGN smallest unit)
        ref: transactionRef,
        currency: 'NGN',
        channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
        metadata: {
          beat_id: beatId,
          license_type: licenseType,
          customer_id: user.id,
          customer_email: user.email,
          beat_title: beat?.title,
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
        email: user.email,
        amount: amount,
        currency: 'NGN',
        reference: transactionRef
      })

      // Initialize Paystack and open payment iframe
      const handler = window.PaystackPop.setup(paystackOptions)
      handler.openIframe()
    } catch (error) {
      console.error('❌ Error initializing Paystack payment:', error)
      toast.error('Failed to initialize payment. Please try again.')
    }
  }, [processing, user, amount, beatId, licenseType, beat])

  /**
   * Format price in Nigerian Naira currency
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
          <p className="text-text-secondary">Loading checkout...</p>
        </div>
      </div>
    )
  }

  // Guard: Ensure required data exists
  if (!beat || !user) {
    return null
  }

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
              Checkout
            </h1>
            <p className="text-text-secondary">
              Complete your purchase securely with Paystack
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Order Summary Section */}
            <div className="lg:col-span-2">
              <div className="card">
                <h2 className="text-2xl font-bold text-white mb-6">
                  Order Summary
                </h2>

                {/* Beat Information Card */}
                <div className="flex items-start space-x-4 mb-6">
                  {/* Beat Cover Art */}
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

                  {/* Beat Details */}
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

                {/* License Information */}
                <div className="border-t border-meckury-mediumGray pt-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    {licenseType === 'lease' ? 'Lease License' : 'Exclusive Rights'}
                  </h3>

                  <div className="space-y-3">
                    <div className="flex items-start space-x-2">
                      <Check className="w-5 h-5 text-meckury-success mt-0.5 flex-shrink-0" />
                      <span className="text-text-secondary text-sm">
                        {licenseType === 'lease' ? 'MP3 & WAV files included' : 'MP3, WAV & Stems included'}
                      </span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Check className="w-5 h-5 text-meckury-success mt-0.5 flex-shrink-0" />
                      <span className="text-text-secondary text-sm">
                        {licenseType === 'lease'
                          ? 'Non-exclusive commercial use rights'
                          : 'Full exclusive ownership and publishing rights'}
                      </span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Check className="w-5 h-5 text-meckury-success mt-0.5 flex-shrink-0" />
                      <span className="text-text-secondary text-sm">
                        {licenseType === 'lease'
                          ? 'Instant download after payment'
                          : 'Stems prepared and delivered within 48 hours'}
                      </span>
                    </div>
                    {licenseType === 'exclusive' && (
                      <div className="flex items-start space-x-2">
                        <Check className="w-5 h-5 text-meckury-success mt-0.5 flex-shrink-0" />
                        <span className="text-text-secondary text-sm">
                          Beat removed from store permanently after your purchase
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Summary Section */}
            <div className="lg:col-span-1">
              <div className="card sticky top-32">
                <h3 className="text-xl font-bold text-white mb-6">Payment</h3>

                {/* Price Breakdown */}
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
                      {!paystackLoaded ? 'Loading Payment System...' : 'Pay with Paystack'}
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

                {/* License Agreement Notice */}
                <div className="mt-4 p-3 bg-meckury-secondary bg-opacity-10 rounded-lg border border-meckury-secondary">
                  <p className="text-text-secondary text-xs">
                    By completing this purchase, you agree to our{' '}
                    <a 
                      href="/licenses" 
                      className="text-meckury-primary hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
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

/**
 * Main Checkout Page Component
 * Wrapped with Suspense boundary for search params loading
 */
export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="spinner w-12 h-12 mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading checkout...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
