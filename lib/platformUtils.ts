// Extract song ID and metadata from various platform URLs

export type Platform = 'spotify' | 'youtube' | 'apple_music' | 'audiomack'

interface SongData {
  platform: Platform
  songId: string
  embedUrl: string
  externalUrl: string
}

export function extractSongData(url: string): SongData | null {
  // Spotify
  const spotifyMatch = url.match(
    /spotify\.com\/track\/([a-zA-Z0-9]+)/
  )
  if (spotifyMatch) {
    const songId = spotifyMatch[1]
    return {
      platform: 'spotify',
      songId,
      embedUrl: `https://open.spotify.com/embed/track/${songId}`,
      externalUrl: `https://open.spotify.com/track/${songId}`,
    }
  }

  // YouTube
  const youtubeMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/
  )
  if (youtubeMatch) {
    const songId = youtubeMatch[1]
    return {
      platform: 'youtube',
      songId,
      embedUrl: `https://www.youtube.com/embed/${songId}`,
      externalUrl: `https://www.youtube.com/watch?v=${songId}`,
    }
  }

  // Apple Music
  const appleMusicMatch = url.match(
    /music\.apple\.com\/[a-z]{2}\/album\/[^\/]+\/(\d+)\?i=(\d+)/
  )
  if (appleMusicMatch) {
    const albumId = appleMusicMatch[1]
    const songId = appleMusicMatch[2]
    return {
      platform: 'apple_music',
      songId,
      embedUrl: `https://embed.music.apple.com/us/album/${albumId}?i=${songId}`,
      externalUrl: url,
    }
  }

  // Audiomack
  const audiomackMatch = url.match(
    /audiomack\.com\/song\/([^\/]+)\/([^\/\?]+)/
  )
  if (audiomackMatch) {
    const artist = audiomackMatch[1]
    const songSlug = audiomackMatch[2]
    return {
      platform: 'audiomack',
      songId: songSlug,
      embedUrl: `https://audiomack.com/embed/song/${artist}/${songSlug}`,
      externalUrl: url,
    }
  }

  return null
}

export function getPlatformName(platform: Platform): string {
  const names = {
    spotify: 'Spotify',
    youtube: 'YouTube',
    apple_music: 'Apple Music',
    audiomack: 'Audiomack',
  }
  return names[platform]
}

export function getPlatformIcon(platform: Platform): string {
  const icons = {
    spotify: '🎵',
    youtube: '▶️',
    apple_music: '🍎',
    audiomack: '🎧',
  }
  return icons[platform]
}

// Get YouTube video thumbnail
export function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
}

// Validate platform URL
export function isValidPlatformUrl(url: string): boolean {
  return extractSongData(url) !== null
}

// Get platform color for UI
export function getPlatformColor(platform: Platform): string {
  const colors = {
    spotify: '#1DB954',
    youtube: '#FF0000',
    apple_music: '#FC3C44',
    audiomack: '#FFA200',
  }
  return colors[platform]
}
