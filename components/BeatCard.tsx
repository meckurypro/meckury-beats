'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Play, Pause, TrendingUp, Lock, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface BeatCardProps {
  beat: {
    id: string
    title: string
    slug: string
    type_beat: string | null
    cover_art_url: string
    mp3_url: string
    bpm: number | null
    key: string | null
    lease_price: number
    exclusive_price: number
    exclusive_sold: boolean
    play_count: number
  }
}

export default function BeatCard({ beat }: BeatCardProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [localPlayCount, setLocalPlayCount] = useState(beat.play_count)
  const [hasPlayed, setHasPlayed] = useState(false) // Track if play has been counted
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Create audio element
    if (!audioRef.current && beat.mp3_url) {
      const audio = new Audio(beat.mp3_url)
      audio.crossOrigin = 'anonymous'
      audio.volume = 0.7 // 70% volume for preview
      
      audio.addEventListener('loadedmetadata', () => {
        console.log('Audio loaded for:', beat.title)
      })
      
      audio.addEventListener('playing', () => {
        console.log('Audio started playing for:', beat.title)
        if (!hasPlayed) {
          incrementPlayCount()
        }
      })
      
      audio.addEventListener('ended', () => {
        setIsPlaying(false)
      })
      
      audio.addEventListener('error', (e) => {
        console.error('Audio error for', beat.title, ':', e)
        toast.error('Failed to load audio preview')
      })
      
      audioRef.current = audio
    }

    // Cleanup
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
    }
  }, [beat.mp3_url, beat.title, hasPlayed])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const incrementPlayCount = async () => {
    try {
      console.log('Incrementing play count for beat:', beat.id)
      const { error } = await supabase.rpc('increment_play_count', { 
        beat_id: beat.id 
      })
      
      if (error) {
        console.error('Error incrementing play count:', error)
        throw error
      }
      
      console.log('Play count incremented successfully for beat:', beat.id)
      setLocalPlayCount(prev => prev + 1)
      setHasPlayed(true)
    } catch (error) {
      console.error('Failed to increment play count:', error)
      // Don't show toast to avoid interrupting user experience
    }
  }

  const handlePlayPause = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const audio = audioRef.current
    if (!audio) {
      console.error('Audio element not initialized for:', beat.title)
      toast.error('Audio not loaded yet')
      return
    }

    try {
      if (isPlaying) {
        audio.pause()
        setIsPlaying(false)
      } else {
        // Reset audio to start if it ended previously
        if (audio.currentTime >= audio.duration - 1) {
          audio.currentTime = 0
        }
        
        await audio.play()
        setIsPlaying(true)
        
        // Note: The 'playing' event listener will handle play count increment
        // This ensures we count plays even if user skips around in the audio
      }
    } catch (error) {
      console.error('Playback error for', beat.title, ':', error)
      toast.error('Failed to play audio preview')
    }
  }

  return (
    <div
      className="card-beat relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Cover Art */}
      <div className="relative h-64 bg-background-elevated overflow-hidden">
        <Image
          src={beat.cover_art_url || '/placeholder-beat.jpg'}
          alt={beat.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-110"
        />

        {/* Always Visible Play Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={handlePlayPause}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg z-10 ${
              isPlaying || isHovered
                ? 'bg-red-600 hover:bg-red-700 shadow-red-500/50'
                : 'bg-black/60 hover:bg-black/70 shadow-black/50'
            }`}
            aria-label={isPlaying ? `Pause ${beat.title}` : `Play ${beat.title}`}
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 text-white" fill="white" />
            ) : (
              <Play className="w-8 h-8 text-white ml-1" fill="white" />
            )}
          </button>
        </div>

        {/* Semi-transparent overlay on image (not covering button) */}
        <div 
          className={`absolute inset-0 transition-opacity duration-300 ${
            isHovered ? 'bg-black opacity-40' : 'bg-black opacity-20'
          }`}
        />

        {/* Playing Indicator */}
        {isPlaying && (
          <div className="absolute bottom-3 left-3 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 animate-pulse z-20">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <span>PLAYING</span>
          </div>
        )}

        {/* Exclusive Badge */}
        {beat.exclusive_sold && (
          <div className="absolute top-3 right-3 bg-yellow-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 z-20">
            <Lock className="w-3 h-3" />
            <span>SOLD</span>
          </div>
        )}

        {/* Play Count - Using local play count state */}
        {localPlayCount > 0 && (
          <div className="absolute top-3 left-3 bg-black bg-opacity-60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs flex items-center space-x-1 z-20">
            <TrendingUp className="w-3 h-3" />
            <span>{localPlayCount} {localPlayCount === 1 ? 'play' : 'plays'}</span>
          </div>
        )}
      </div>

      {/* Beat Info */}
      <div className="p-5">
        {/* Title */}
        <h3 className="text-xl font-semibold text-white mb-1 line-clamp-1">
          {beat.title}
        </h3>

        {/* Type Beat Label */}
        {beat.type_beat && (
          <p className="text-text-secondary text-sm mb-3">{beat.type_beat}</p>
        )}

        {/* Metadata */}
        <div className="flex items-center space-x-4 mb-4 text-text-muted text-sm">
          {beat.bpm && <span>{beat.bpm} BPM</span>}
          {beat.key && (
            <>
              <span>•</span>
              <span>{beat.key}</span>
            </>
          )}
        </div>

        {/* See Details Button */}
        <Link href={`/beats/${beat.slug}`}>
          <button className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-all flex items-center justify-center space-x-2 group">
            <span>See Details</span>
            <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </Link>

        {/* Price Info Below Button */}
        <div className="mt-3 pt-3 border-t border-gray-700 flex items-center justify-between text-sm">
          <div>
            <span className="text-gray-400">Lease:</span>
            <span className="text-red-500 font-semibold ml-2">
              {formatPrice(beat.lease_price)}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Exclusive:</span>
            <span className="text-red-500 font-semibold ml-2">
              {beat.exclusive_sold ? 'SOLD' : formatPrice(beat.exclusive_price)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
