'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Play,
  Pause,
  ShoppingCart,
  Download,
  Check,
  Music,
  Clock,
  TrendingUp,
  Lock,
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function BeatDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [beat, setBeat] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    if (params.slug) {
      fetchBeat(params.slug as string)
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
  }, [params.slug])

  const fetchBeat = async (slug: string) => {
    try {
      const { data, error } = await supabase
        .from('beats')
        .select('*')
        .eq('slug', slug)
        .eq('active', true)
        .single()

      if (error) throw error
      setBeat(data)

      // Increment play count
      await supabase.rpc('increment_play_count', { beat_id: data.id })
    } catch (error) {
      console.error('Error fetching beat:', error)
      toast.error('Beat not found')
      router.push('/beats')
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async (licenseType: 'lease' | 'exclusive') => {
    if (!user) {
      toast.error('Please sign in to purchase')
      router.push('/auth/signin')
      return
    }

    if (licenseType === 'exclusive' && beat.exclusive_sold) {
      toast.error('This beat is no longer available for exclusive purchase')
      return
    }

    // Redirect to checkout with beat and license type
    router.push(
      `/checkout?beat=${beat.id}&license=${licenseType}&amount=${
        licenseType === 'lease' ? beat.lease_price : beat.exclusive_price
      }`
    )
  }

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

  if (!beat) {
    return null
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-32 pb-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left Column - Beat Info */}
            <div>
              {/* Cover Art */}
              <div className="relative aspect-square mb-8 rounded-xl overflow-hidden shadow-glow">
                <Image
                  src={beat.cover_art_url || '/placeholder-beat.jpg'}
                  alt={beat.title}
                  fill
                  className="object-cover"
                />
                {beat.exclusive_sold && (
                  <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                    <div className="text-center">
                      <Lock className="w-16 h-16 text-meckury-accent mx-auto mb-4" />
                      <p className="text-white text-xl font-semibold">
                        Exclusive License Sold
                      </p>
                      <p className="text-text-secondary mt-2">
                        Lease licenses may still be available
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Audio Player */}
              <div className="card mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">
                      {beat.title}
                    </h2>
                    {beat.type_beat && (
                      <p className="text-text-secondary">{beat.type_beat}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-14 h-14 bg-meckury-primary hover:bg-meckury-accent rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-glow"
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6 text-white" fill="white" />
                    ) : (
                      <Play className="w-6 h-6 text-white ml-1" fill="white" />
                    )}
                  </button>
                </div>

                {/* Waveform placeholder */}
                <div className="waveform-container">
                  <div className="w-full h-full flex items-center justify-center text-text-muted">
                    Audio Player
                  </div>
                </div>
              </div>

              {/* Beat Details */}
              <div className="card">
                <h3 className="text-xl font-semibold text-white mb-4">
                  Beat Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {beat.bpm && (
                    <div>
                      <p className="text-text-secondary text-sm mb-1">BPM</p>
                      <p className="text-white font-semibold">{beat.bpm}</p>
                    </div>
                  )}
                  {beat.key && (
                    <div>
                      <p className="text-text-secondary text-sm mb-1">Key</p>
                      <p className="text-white font-semibold">{beat.key}</p>
                    </div>
                  )}
                  {beat.genre && (
                    <div>
                      <p className="text-text-secondary text-sm mb-1">Genre</p>
                      <p className="text-white font-semibold">{beat.genre}</p>
                    </div>
                  )}
                  {beat.mood && (
                    <div>
                      <p className="text-text-secondary text-sm mb-1">Mood</p>
                      <p className="text-white font-semibold">{beat.mood}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-text-secondary text-sm mb-1">Plays</p>
                    <p className="text-white font-semibold flex items-center">
                      <TrendingUp className="w-4 h-4 mr-1 text-meckury-primary" />
                      {beat.play_count}
                    </p>
                  </div>
                  <div>
                    <p className="text-text-secondary text-sm mb-1">
                      Leases Sold
                    </p>
                    <p className="text-white font-semibold">{beat.lease_count}</p>
                  </div>
                </div>

                {beat.description && (
                  <div className="mt-6 pt-6 border-t border-meckury-mediumGray">
                    <p className="text-text-secondary leading-relaxed">
                      {beat.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Purchase Options */}
            <div>
              <div className="sticky top-32">
                {/* Lease License */}
                <div className="card mb-6 hover:shadow-glow transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">
                        Lease License
                      </h3>
                      <p className="text-text-secondary">
                        Non-exclusive rights for commercial use
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-meckury-primary">
                        {formatPrice(beat.lease_price)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-start space-x-2">
                      <Check className="w-5 h-5 text-meckury-success mt-0.5 flex-shrink-0" />
                      <span className="text-text-secondary">
                        MP3 & WAV files included
                      </span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Check className="w-5 h-5 text-meckury-success mt-0.5 flex-shrink-0" />
                      <span className="text-text-secondary">
                        Unlimited distribution streams
                      </span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Check className="w-5 h-5 text-meckury-success mt-0.5 flex-shrink-0" />
                      <span className="text-text-secondary">
                        Must credit "Produced by Meckury"
                      </span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Check className="w-5 h-5 text-meckury-success mt-0.5 flex-shrink-0" />
                      <span className="text-text-secondary">
                        Beat can be leased to other artists
                      </span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Check className="w-5 h-5 text-meckury-success mt-0.5 flex-shrink-0" />
                      <span className="text-text-secondary">
                        Instant download after payment
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handlePurchase('lease')}
                    className="btn-primary w-full flex items-center justify-center space-x-2"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span>Purchase Lease</span>
                  </button>
                </div>

                {/* Exclusive License */}
                <div
                  className={`card hover:shadow-glow transition-all ${
                    beat.exclusive_sold ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">
                        Exclusive Rights
                      </h3>
                      <p className="text-text-secondary">
                        Full exclusive ownership with stems
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-meckury-accent">
                        {formatPrice(beat.exclusive_price)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-start space-x-2">
                      <Check className="w-5 h-5 text-meckury-success mt-0.5 flex-shrink-0" />
                      <span className="text-text-secondary">
                        MP3, WAV & Stems (trackouts)
                      </span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Check className="w-5 h-5 text-meckury-success mt-0.5 flex-shrink-0" />
                      <span className="text-text-secondary">
                        Full exclusive rights - you own it
                      </span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Check className="w-5 h-5 text-meckury-success mt-0.5 flex-shrink-0" />
                      <span className="text-text-secondary">
                        Beat removed from store after purchase
                      </span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Check className="w-5 h-5 text-meckury-success mt-0.5 flex-shrink-0" />
                      <span className="text-text-secondary">
                        Unlimited commercial use
                      </span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Clock className="w-5 h-5 text-meckury-accent mt-0.5 flex-shrink-0" />
                      <span className="text-text-secondary">
                        Stems prepared within 48 hours
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handlePurchase('exclusive')}
                    disabled={beat.exclusive_sold}
                    className={`w-full flex items-center justify-center space-x-2 font-semibold py-3 px-6 rounded-lg transition-all ${
                      beat.exclusive_sold
                        ? 'bg-meckury-mediumGray text-text-muted cursor-not-allowed'
                        : 'bg-meckury-accent hover:bg-opacity-90 text-white hover:shadow-glow'
                    }`}
                  >
                    {beat.exclusive_sold ? (
                      <>
                        <Lock className="w-5 h-5" />
                        <span>Sold Out</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5" />
                        <span>Buy Exclusive</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Need Help */}
                <div className="mt-6 p-4 bg-background-elevated rounded-lg border border-meckury-mediumGray">
                  <p className="text-text-secondary text-sm mb-2">
                    Need a custom beat or want to book a studio session?
                  </p>
                  <Link
                    href="/studio"
                    className="text-meckury-primary hover:text-meckury-accent font-semibold text-sm flex items-center space-x-1"
                  >
                    <Music className="w-4 h-4" />
                    <span>Book at CovaStoris →</span>
                  </Link>
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
