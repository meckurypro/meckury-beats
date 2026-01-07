'use client'

import { useEffect, useState } from 'react'
import { Music, Filter } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SongCard from '@/components/SongCard'
import EmbeddedPlayer from '@/components/EmbeddedPlayer'
import { supabase } from '@/lib/supabase'
import { Platform } from '@/lib/platformUtils'

export default function SongsPage() {
  const [songs, setSongs] = useState<any[]>([])
  const [filteredSongs, setFilteredSongs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSong, setSelectedSong] = useState<any>(null)
  const [platformFilter, setPlatformFilter] = useState<'all' | Platform>('all')

  useEffect(() => {
    fetchSongs()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [songs, platformFilter])

  const fetchSongs = async () => {
    try {
      const { data, error } = await supabase
        .from('song_submissions')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })

      if (error) throw error
      setSongs(data || [])
    } catch (error) {
      console.error('Error fetching songs:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...songs]

    if (platformFilter !== 'all') {
      filtered = filtered.filter((song) => song.platform === platformFilter)
    }

    setFilteredSongs(filtered)
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-32 pb-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-5xl font-display font-bold text-white mb-4">
              Songs From Meckury Beats
            </h1>
            <p className="text-text-secondary text-lg">
              Discover tracks created by artists using Meckury's production
            </p>
          </div>

          {/* Filter */}
          <div className="mb-8">
            <div className="flex items-center space-x-4">
              <Filter className="w-5 h-5 text-text-muted" />
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value as any)}
                className="input max-w-xs"
              >
                <option value="all">All Platforms</option>
                <option value="spotify">Spotify</option>
                <option value="youtube">YouTube</option>
                <option value="apple_music">Apple Music</option>
                <option value="audiomack">Audiomack</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-6">
            <p className="text-text-secondary">
              Showing {filteredSongs.length} of {songs.length} songs
            </p>
          </div>

          {/* Songs Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-background-card rounded-xl h-96 animate-pulse"
                ></div>
              ))}
            </div>
          ) : filteredSongs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSongs.map((song) => (
                <SongCard
                  key={song.id}
                  song={song}
                  onClick={() => setSelectedSong(song)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Music className="w-16 h-16 text-meckury-mediumGray mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-white mb-2">
                No songs yet
              </h3>
              <p className="text-text-secondary mb-6">
                Be the first to submit your song made with a Meckury beat!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Song Player Modal */}
      {selectedSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
          <div className="bg-background-card rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {selectedSong.song_title}
                  </h2>
                  <p className="text-text-secondary text-lg">
                    by {selectedSong.artist_name}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSong(null)}
                  className="text-text-muted hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Player */}
              <EmbeddedPlayer
                platform={selectedSong.platform}
                embedUrl={selectedSong.embed_url}
                externalUrl={selectedSong.external_url}
                title={selectedSong.song_title}
                artist={selectedSong.artist_name}
              />

              {/* Info */}
              <div className="mt-6 p-4 bg-background-elevated rounded-lg border border-meckury-mediumGray">
                <p className="text-text-secondary text-sm">
                  🎵 This song was made using a beat produced by Meckury
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
