'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Play, Pause, TrendingUp, Lock } from 'lucide-react'

interface BeatCardProps {
  beat: {
    id: string
    title: string
    slug: string
    type_beat: string | null
    cover_art_url: string
    bpm: number | null
    key: string | null
    lease_price: number
    exclusive_sold: boolean
    play_count: number
  }
}

export default function BeatCard({ beat }: BeatCardProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const handlePlayPause = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Audio player logic will be added later
    setIsPlaying(!isPlaying)
  }

  return (
    <Link href={`/beats/${beat.slug}`}>
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

          {/* Overlay on Hover */}
          <div
            className={`absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <button
              onClick={handlePlayPause}
              className="w-16 h-16 bg-meckury-primary hover:bg-meckury-accent rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-glow"
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 text-white" fill="white" />
              ) : (
                <Play className="w-8 h-8 text-white ml-1" fill="white" />
              )}
            </button>
          </div>

          {/* Exclusive Badge */}
          {beat.exclusive_sold && (
            <div className="absolute top-3 right-3 bg-meckury-accent text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
              <Lock className="w-3 h-3" />
              <span>EXCLUSIVE SOLD</span>
            </div>
          )}

          {/* Play Count */}
          {beat.play_count > 0 && (
            <div className="absolute top-3 left-3 bg-black bg-opacity-60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs flex items-center space-x-1">
              <TrendingUp className="w-3 h-3" />
              <span>{beat.play_count} plays</span>
            </div>
          )}
        </div>

        {/* Beat Info */}
        <div className="p-5">
          {/* Title */}
          <h3 className="text-xl font-semibold text-white mb-1 line-clamp-1 group-hover:text-meckury-primary transition-colors">
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

          {/* Price */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-meckury-primary font-bold text-lg">
                {formatPrice(beat.lease_price)}
              </span>
              <span className="text-text-secondary text-sm ml-2">Lease</span>
            </div>
            <button
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                beat.exclusive_sold
                  ? 'bg-meckury-mediumGray text-text-muted cursor-not-allowed'
                  : 'bg-meckury-primary hover:bg-meckury-accent text-white hover:shadow-glow'
              }`}
              disabled={beat.exclusive_sold}
            >
              {beat.exclusive_sold ? 'Sold Out' : 'View'}
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}
