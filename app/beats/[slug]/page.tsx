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
  ExternalLink,
  Volume2,
  VolumeX,
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import EmbeddedPlayer from '@/components/EmbeddedPlayer'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { getPlatformName } from '@/lib/extractSongData'

export default function BeatDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [beat, setBeat] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [featuredSong, setFeaturedSong] = useState<any>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)

  useEffect(() => {
    if (params.slug) {
      fetchBeat(params.slug as string)
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
  }, [params.slug])

  // Initialize and manage audio element
  useEffect(() => {
    if (!beat || !beat.mp3_url) return

    // Create audio element
    const audio = new Audio(beat.mp3_url)
    audio.crossOrigin = 'anonymous'
    audio.volume = volume
    audioRef.current = audio

    // Event handlers
    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
      console.log('Audio loaded, duration:', audio.duration)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    const handleError = (e: ErrorEvent) => {
      console.error('Audio error:', e)
      toast.error('Failed to load audio')
    }

    // Attach event listeners
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError as any)

    // Cleanup
    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError as any)
      audio.pause()
      audio.src = ''
    }
  }, [beat?.mp3_url, volume])

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio.play()
        .then(() => setIsPlaying(true))
        .catch((error) => {
          console.error('Playback error:', error)
          toast.error('Failed to play audio')
        })
    }
  }

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

      // If exclusive is sold, fetch the featured song submission
      if (data.exclusive_sold) {
        const { data: songData } = await supabase
          .from('song_submissions')
          .select('*')
          .eq('beat_id', data.id)
          .eq('featured', true)
          .eq('status', 'approved')
          .single()

        if (songData) {
          setFeaturedSong(songData)
        }
      }
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
                    onClick={togglePlayPause}
                    disabled={!audioRef.current}
                    className="w-14 h-14 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg shadow-red-500/50"
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6 text-white" fill="white" />
                    ) : (
                      <Play className="w-6 h-6 text-white ml-1" fill="white" />
                    )}
                  </button>
                </div>

                {/* Audio progress bar */}
                <div className="bg-background-elevated rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Music className="w-5 h-5 text-red-500" />
                    <div className="flex-1">
                      <div 
                        className="h-2 bg-gray-700 rounded-full overflow-hidden cursor-pointer hover:h-3 transition-all"
                        onClick={(e) => {
                          const audio = audioRef.current
                          if (audio && duration) {
                            const rect = e.currentTarget.getBoundingClientRect()
                            const percent = (e.clientX - rect.left) / rect.width
                            audio.currentTime = percent * duration
                            setCurrentTime(audio.currentTime)
                          }
                        }}
                      >
                        <div 
                          className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-100"
                          style={{ 
                            width: duration ? `${(currentTime / duration) * 100}%` : '0%'
                          }}
                        ></div>
                      </div>
                    </div>
                    <span className="text-text-secondary text-sm min-w-[80px] text-right">
                      {Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, '0')} / {Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '0')}
                    </span>
                  </div>
                  
                  {/* Volume Control */}
                  <div className="flex items-center space-x-2 px-2">
                    <button
                      onClick={() => {
                        const newVolume = volume > 0 ? 0 : 1
                        setVolume(newVolume)
                        if (audioRef.current) audioRef.current.volume = newVolume
                      }}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {volume > 0 ? (
                        <Volume2 className="w-4 h-4" />
                      ) : (
                        <VolumeX className="w-4 h-4" />
                      )}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={volume * 100}
                      onChange={(e) => {
                        const newVolume = parseFloat(e.target.value) / 100
                        setVolume(newVolume)
                        if (audioRef.current) audioRef.current.volume = newVolume
                      }}
                      className="w-24 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, rgb(239, 68, 68) 0%, rgb(239, 68, 68) ${volume * 100}%, rgb(55, 65, 81) ${volume * 100}%, rgb(55, 65, 81) 100%)`
                      }}
                    />
                    <span className="text-xs text-gray-500 min-w-[30px]">
                      {Math.round(volume * 100)}%
                    </span>
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

                {/* Featured Song (for exclusive-sold beats) */}
                {beat.exclusive_sold && featuredSong && (
                  <div className="mt-6 pt-6 border-t border-meckury-mediumGray">
                    <h4 className="text-lg font-semibold text-white mb-4">
                      🎵 Song Made With This Beat
                    </h4>
                    <div className="bg-background-elevated rounded-lg p-4">
                      <div className="mb-4">
                        <h5 className="text-xl font-semibold text-white mb-1">
                          {featuredSong.song_title}
                        </h5>
                        <p className="text-text-secondary">by {featuredSong.artist_name}</p>
                      </div>
                      {featuredSong.embed_url && (
                        <div className="mb-4">
                          <EmbeddedPlayer
                            platform={featuredSong.platform}
                            embedUrl={featuredSong.embed_url}
                            externalUrl={featuredSong.external_url}
                            title={featuredSong.song_title}
                            artist={featuredSong.artist_name}
                          />
                        </div>
                      )}
                      <a
                        href={featuredSong.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 text-meckury-primary hover:text-meckury-accent font-medium"
                      >
                        <span>Listen on {getPlatformName(featuredSong.platform)}</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
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
