/**
 * Extract song/video ID and generate embed URLs from platform links
 */

export type Platform = 'spotify' | 'youtube' | 'apple_music' | 'audiomack'

export interface SongData {
  platform: Platform
  songId: string
  embedUrl: string
  externalUrl: string
}

/**
 * Extract Spotify track ID from URL
 * Supports: https://open.spotify.com/track/ABC123...
 */
export function extractSpotifyId(url: string): string | null {
  const patterns = [
    /spotify\.com\/track\/([a-zA-Z0-9]+)/,
    /spotify:track:([a-zA-Z0-9]+)/,
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  
  return null
}

/**
 * Extract YouTube video ID from URL
 * Supports: https://youtu.be/ABC123, https://youtube.com/watch?v=ABC123
 */
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  
  return null
}

/**
 * Extract Apple Music track ID from URL
 * Supports: https://music.apple.com/.../track-name/id123456
 */
export function extractAppleMusicId(url: string): string | null {
  const match = url.match(/music\.apple\.com\/[^\/]+\/album\/[^\/]+\/(\d+)\?i=(\d+)/)
  if (match) return match[2] // Track ID
  
  const simpleMatch = url.match(/music\.apple\.com.*[?&]i=(\d+)/)
  if (simpleMatch) return simpleMatch[1]
  
  return null
}

/**
 * Extract Audiomack track slug from URL
 * Supports: https://audiomack.com/artist/song
 */
export function extractAudiomackSlug(url: string): string | null {
  const match = url.match(/audiomack\.com\/([^\/]+\/[^\/\?]+)/)
  if (match) return match[1]
  
  return null
}

/**
 * Detect platform from URL
 */
export function detectPlatform(url: string): Platform | null {
  if (url.includes('spotify.com')) return 'spotify'
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
  if (url.includes('music.apple.com')) return 'apple_music'
  if (url.includes('audiomack.com')) return 'audiomack'
  
  return null
}

/**
 * Generate embed URL for Spotify
 */
export function getSpotifyEmbedUrl(trackId: string): string {
  return `https://open.spotify.com/embed/track/${trackId}`
}

/**
 * Generate embed URL for YouTube
 */
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`
}

/**
 * Generate embed URL for Apple Music
 */
export function getAppleMusicEmbedUrl(trackId: string): string {
  // Apple Music embed requires country code, defaulting to 'us'
  return `https://embed.music.apple.com/us/album/${trackId}`
}

/**
 * Generate embed URL for Audiomack
 */
export function getAudiomackEmbedUrl(slug: string): string {
  return `https://audiomack.com/embed/${slug}`
}

/**
 * Parse URL and extract all song data
 */
export function parseSongUrl(url: string): SongData | null {
  const platform = detectPlatform(url)
  if (!platform) return null
  
  let songId: string | null = null
  let embedUrl: string = ''
  
  switch (platform) {
    case 'spotify':
      songId = extractSpotifyId(url)
      if (songId) embedUrl = getSpotifyEmbedUrl(songId)
      break
      
    case 'youtube':
      songId = extractYouTubeId(url)
      if (songId) embedUrl = getYouTubeEmbedUrl(songId)
      break
      
    case 'apple_music':
      songId = extractAppleMusicId(url)
      if (songId) embedUrl = getAppleMusicEmbedUrl(songId)
      break
      
    case 'audiomack':
      songId = extractAudiomackSlug(url)
      if (songId) embedUrl = getAudiomackEmbedUrl(songId)
      break
  }
  
  if (!songId) return null
  
  return {
    platform,
    songId,
    embedUrl,
    externalUrl: url,
  }
}

/**
 * Get platform display name
 */
export function getPlatformName(platform: Platform): string {
  const names: Record<Platform, string> = {
    spotify: 'Spotify',
    youtube: 'YouTube',
    apple_music: 'Apple Music',
    audiomack: 'Audiomack',
  }
  return names[platform]
}

/**
 * Get platform icon/color
 */
export function getPlatformColor(platform: Platform): string {
  const colors: Record<Platform, string> = {
    spotify: '#1DB954',
    youtube: '#FF0000',
    apple_music: '#FA243C',
    audiomack: '#FFA200',
  }
  return colors[platform]
}

/**
 * Validate if URL is from supported platform
 */
export function isSupportedPlatform(url: string): boolean {
  return detectPlatform(url) !== null
}
