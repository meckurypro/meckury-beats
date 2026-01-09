'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PaystackButton } from 'react-paystack'
import { Lock, ShoppingCart, Check, ArrowLeft } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const beatId = searchParams.get('beat')
  const licenseType = searchParams.get('license') as 'lease' | 'exclusive'
  const amount = parseInt(searchParams.get('amount') || '0')

  const [beat, setBeat] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    checkAuth()
    if (beatId) {
      fetchBeat()
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

  const handlePaymentSuccess = async (reference: any) => {
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
          payment_reference: reference.reference,
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
    toast.error('Payment cancelled')
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const paystackConfig = {
    reference: `meckury-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    email: user?.email || '',
    amount: amount * 100, // Paystack uses kobo (smallest unit)
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
    metadata: {
      beat_id: beatId,
      license_type: licenseType,
      user_id: user?.id,
    },
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

                {/* Paystack Button */}
                {!processing ? (
                  <PaystackButton
                    {...paystackConfig}
                    text="Pay with Paystack"
                    onSuccess={handlePaymentSuccess}
                    onClose={handlePaymentClose}
                    className="btn-primary w-full flex items-center justify-center space-x-2"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span>Pay {formatPrice(amount)}</span>
                  </PaystackButton>
                ) : (
                  <button
                    disabled
                    className="btn-primary w-full flex items-center justify-center space-x-2 opacity-50 cursor-not-allowed"
                  >
                    <div className="spinner"></div>
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
