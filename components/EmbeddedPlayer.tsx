'use client'

import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { Platform, getPlatformName, getPlatformColor } from '@/lib/platformUtils'

interface EmbeddedPlayerProps {
  platform: Platform
  embedUrl: string
  externalUrl: string
  title: string
  artist: string
}

export default function EmbeddedPlayer({
  platform,
  embedUrl,
  externalUrl,
  title,
  artist,
}: EmbeddedPlayerProps) {
  const [isLoading, setIsLoading] = useState(true)

  const getPlayerHeight = () => {
    switch (platform) {
      case 'spotify':
        return '152px'
      case 'youtube':
        return '315px'
      case 'apple_music':
        return '175px'
      case 'audiomack':
        return '252px'
      default:
        return '200px'
    }
  }

  const platformColor = getPlatformColor(platform)

  return (
    <div className="space-y-3">
      {/* Player Container */}
      <div className="relative rounded-lg overflow-hidden bg-background-elevated">
        {isLoading && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-background-elevated"
            style={{ height: getPlayerHeight() }}
          >
            <div className="spinner w-8 h-8"></div>
          </div>
        )}
        
        <iframe
          src={embedUrl}
          width="100%"
          height={getPlayerHeight()}
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          onLoad={() => setIsLoading(false)}
          className="w-full"
        />
      </div>

      {/* External Link */}
      <a
        href={externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-all hover:bg-opacity-10"
        style={{
          backgroundColor: `${platformColor}20`,
          color: platformColor,
        }}
      >
        <ExternalLink className="w-4 h-4" />
        <span className="font-semibold text-sm">
          Listen on {getPlatformName(platform)}
        </span>
      </a>
    </div>
  )
}
