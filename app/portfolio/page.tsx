'use client'

import { useEffect, useState } from 'react'
import { Music, ExternalLink } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPortfolio()
  }, [])

  const fetchPortfolio = async () => {
    try {
      const { data, error } = await supabase
        .from('portfolio')
        .select('*')
        .order('order_index', { ascending: true })

      if (error) throw error
      setPortfolio(data || [])
    } catch (error) {
      console.error('Error fetching portfolio:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-32 pb-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-5xl font-display font-bold text-white mb-4">
              Portfolio
            </h1>
            <p className="text-text-secondary text-lg">
              Songs produced by Meckury @ CovaStoris
            </p>
          </div>

          {/* Portfolio Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-background-card rounded-xl h-96 animate-pulse"
                ></div>
              ))}
            </div>
          ) : portfolio.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {portfolio.map((item) => (
                <div key={item.id} className="card-beat">
                  {/* Cover Art */}
                  <div className="relative h-64 bg-background-elevated overflow-hidden">
                    {item.cover_art_url ? (
                      <img
                        src={item.cover_art_url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-meckury-primary to-meckury-secondary">
                        <Music className="w-16 h-16 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-5">
                    <h3 className="text-xl font-semibold text-white mb-1 line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-text-secondary text-sm mb-4">
                      by {item.artist_name}
                    </p>

                    {item.description && (
                      <p className="text-text-muted text-sm mb-4 line-clamp-2">
                        {item.description}
                      </p>
                    )}

                    {/* Links */}
                    <div className="flex flex-wrap gap-2">
                      {item.spotify_url && (
                        <a
                          href={item.spotify_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-3 py-1 bg-[#1DB954] bg-opacity-20 text-[#1DB954] rounded-full hover:bg-opacity-30 transition-all flex items-center space-x-1"
                        >
                          <span>Spotify</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {item.apple_music_url && (
                        <a
                          href={item.apple_music_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-3 py-1 bg-[#FC3C44] bg-opacity-20 text-[#FC3C44] rounded-full hover:bg-opacity-30 transition-all flex items-center space-x-1"
                        >
                          <span>Apple Music</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {item.youtube_url && (
                        <a
                          href={item.youtube_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-3 py-1 bg-[#FF0000] bg-opacity-20 text-[#FF0000] rounded-full hover:bg-opacity-30 transition-all flex items-center space-x-1"
                        >
                          <span>YouTube</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center py-20">
              <Music className="w-16 h-16 text-meckury-mediumGray mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-white mb-2">
                Portfolio Coming Soon
              </h3>
              <p className="text-text-secondary">
                Check back to see songs produced by Meckury
              </p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
