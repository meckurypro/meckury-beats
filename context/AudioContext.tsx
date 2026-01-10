// context/AudioContext.tsx - Global audio manager with cleanup on page exit/minimize
'use client'

import { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react'

interface AudioContextType {
  currentlyPlayingId: string | null
  play: (beatId: string, audioUrl: string, onEnd?: () => void) => Promise<void>
  pause: (beatId: string) => void
  isPlaying: (beatId: string) => boolean
  pauseAll: () => void
}

const AudioContext = createContext<AudioContextType | undefined>(undefined)

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const onEndCallbackRef = useRef<(() => void) | null>(null)

  const pauseAll = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setCurrentlyPlayingId(null)
    onEndCallbackRef.current = null
  }, [])

  // Stop audio when page visibility changes (minimize, tab switch, etc.)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden (minimized, switched tabs, etc.)
        pauseAll()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [pauseAll])

  // Cleanup audio on unmount (when leaving the page)
  useEffect(() => {
    return () => {
      pauseAll()
      if (audioRef.current) {
        audioRef.current.src = ''
        audioRef.current = null
      }
    }
  }, [pauseAll])

  const play = useCallback(async (beatId: string, audioUrl: string, onEnd?: () => void) => {
    // If same beat is playing, do nothing
    if (currentlyPlayingId === beatId && audioRef.current && !audioRef.current.paused) {
      return
    }

    // Pause any currently playing audio
    pauseAll()

    // Create new audio element if needed or update source
    if (!audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.crossOrigin = 'anonymous'
      audioRef.current.volume = 0.7
    }

    // Set up event listeners
    const handleEnded = () => {
      setCurrentlyPlayingId(null)
      if (onEndCallbackRef.current) {
        onEndCallbackRef.current()
        onEndCallbackRef.current = null
      }
    }

    const handleError = (e: Event) => {
      console.error('Audio playback error:', e)
      setCurrentlyPlayingId(null)
      onEndCallbackRef.current = null
    }

    // Remove old listeners
    audioRef.current.removeEventListener('ended', handleEnded)
    audioRef.current.removeEventListener('error', handleError)

    // Add new listeners
    audioRef.current.addEventListener('ended', handleEnded)
    audioRef.current.addEventListener('error', handleError)

    // Set source and play
    audioRef.current.src = audioUrl
    onEndCallbackRef.current = onEnd || null
    
    try {
      await audioRef.current.play()
      setCurrentlyPlayingId(beatId)
    } catch (error) {
      console.error('Failed to play audio:', error)
      setCurrentlyPlayingId(null)
      onEndCallbackRef.current = null
    }
  }, [currentlyPlayingId, pauseAll])

  const pause = useCallback((beatId: string) => {
    if (currentlyPlayingId === beatId && audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setCurrentlyPlayingId(null)
      onEndCallbackRef.current = null
    }
  }, [currentlyPlayingId])

  const isPlaying = useCallback((beatId: string) => {
    return currentlyPlayingId === beatId
  }, [currentlyPlayingId])

  return (
    <AudioContext.Provider value={{ currentlyPlayingId, play, pause, isPlaying, pauseAll }}>
      {children}
    </AudioContext.Provider>
  )
}

export function useAudio() {
  const context = useContext(AudioContext)
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider')
  }
  return context
}
