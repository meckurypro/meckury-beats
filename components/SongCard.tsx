'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Play, ExternalLink } from 'lucide-react'
import { Platform, getPlatformName, getPlatformIcon, getPlatformColor } from '@/lib/platformUtils'

interface SongCardProps {
  song: {
    id: string
    song_title: string
    artist_name: string
    platform: Platform
    external_url: string
    cover_art_url: string | null
  }
  onClick?: () => void
}

export default function SongCard({ song, onClick }: SongCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const platformColor = getPlatformColor(song.platform)

  return (
    <div
      className="card-beat relative group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Cover Art */}
      <div className="relative h-64 bg-background-elevated overflow-hidden">
        {song.cover_art_url ? (
          <Image
            src={song.cover_art_url}
            alt={song.song_title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-meckury-primary to-meckury-secondary">
            <div className="text-6xl">🎵</div>
          </div>
        )}

        {/* Overlay on Hover */}
        <div
          className={`absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <button className="w-16 h-16 bg-meckury-primary hover:bg-meckury-accent rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-glow">
            <Play className="w-8 h-8 text-white ml-1" fill="white" />
          </button>
        </div>

        {/* Platform Badge */}
        <div
          className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 text-white"
          style={{ backgroundColor: platformColor }}
        >
          <span>{getPlatformIcon(song.platform)}</span>
          <span>{getPlatformName(song.platform)}</span>
        </div>
      </div>

      {/* Song Info */}
      <div className="p-5">
        <h3 className="text-xl font-semibold text-white mb-1 line-clamp-1 group-hover:text-meckury-primary transition-colors">
          {song.song_title}
        </h3>
        <p className="text-text-secondary text-sm mb-4">by {song.artist_name}</p>

        <div className="flex items-center justify-between">
          <span className="text-text-muted text-sm">Made with Meckury beat</span>
          <a
            href={song.external_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center space-x-1 text-meckury-primary hover:text-meckury-accent transition-colors text-sm font-semibold"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Listen</span>
          </a>
        </div>
      </div>
    </div>
  )
}
