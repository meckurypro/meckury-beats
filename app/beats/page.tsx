'use client'

import { useEffect, useState } from 'react'
import { Search, Filter, SlidersHorizontal } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import BeatCard from '@/components/BeatCard'
import { supabase } from '@/lib/supabase'

export default function BeatsPage() {
  const [beats, setBeats] = useState<any[]>([])
  const [filteredBeats, setFilteredBeats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    genre: 'all',
    mood: 'all',
    bpmRange: 'all',
    priceRange: 'all',
    availability: 'all',
  })

  useEffect(() => {
    fetchBeats()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [beats, searchQuery, filters])

  const fetchBeats = async () => {
    try {
      const { data, error } = await supabase
        .from('beats')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setBeats(data || [])
    } catch (error) {
      console.error('Error fetching beats:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...beats]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (beat) =>
          beat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          beat.type_beat?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          beat.genre?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Genre filter
    if (filters.genre !== 'all') {
      filtered = filtered.filter((beat) => beat.genre === filters.genre)
    }

    // Mood filter
    if (filters.mood !== 'all') {
      filtered = filtered.filter((beat) => beat.mood === filters.mood)
    }

    // BPM filter
    if (filters.bpmRange !== 'all') {
      const [min, max] = filters.bpmRange.split('-').map(Number)
      filtered = filtered.filter(
        (beat) => beat.bpm >= min && beat.bpm <= max
      )
    }

    // Price filter
    if (filters.priceRange !== 'all') {
      const [min, max] = filters.priceRange.split('-').map(Number)
      filtered = filtered.filter(
        (beat) => beat.lease_price >= min && beat.lease_price <= max
      )
    }

    // Availability filter
    if (filters.availability === 'available') {
      filtered = filtered.filter((beat) => !beat.exclusive_sold)
    } else if (filters.availability === 'sold') {
      filtered = filtered.filter((beat) => beat.exclusive_sold)
    }

    setFilteredBeats(filtered)
  }

  const resetFilters = () => {
    setFilters({
      genre: 'all',
      mood: 'all',
      bpmRange: 'all',
      priceRange: 'all',
      availability: 'all',
    })
    setSearchQuery('')
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-32 pb-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-5xl font-display font-bold text-white mb-4">
              Browse Beats
            </h1>
            <p className="text-text-secondary text-lg">
              Explore {beats.length} premium beats by Meckury
            </p>
          </div>

          {/* Search and Filter Bar */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-muted w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by title, type, or genre..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-12"
                />
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn-outline flex items-center justify-center space-x-2"
              >
                <SlidersHorizontal className="w-5 h-5" />
                <span>Filters</span>
              </button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="card animate-slide-down">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {/* Genre */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Genre
                    </label>
                    <select
                      value={filters.genre}
                      onChange={(e) =>
                        setFilters({ ...filters, genre: e.target.value })
                      }
                      className="input"
                    >
                      <option value="all">All Genres</option>
                      <option value="afrobeats">Afrobeats</option>
                      <option value="trap">Trap</option>
                      <option value="drill">Drill</option>
                      <option value="rnb">R&B</option>
                      <option value="hiphop">Hip Hop</option>
                    </select>
                  </div>

                  {/* Mood */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Mood
                    </label>
                    <select
                      value={filters.mood}
                      onChange={(e) =>
                        setFilters({ ...filters, mood: e.target.value })
                      }
                      className="input"
                    >
                      <option value="all">All Moods</option>
                      <option value="dark">Dark</option>
                      <option value="melodic">Melodic</option>
                      <option value="aggressive">Aggressive</option>
                      <option value="chill">Chill</option>
                      <option value="energetic">Energetic</option>
                    </select>
                  </div>

                  {/* BPM Range */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      BPM
                    </label>
                    <select
                      value={filters.bpmRange}
                      onChange={(e) =>
                        setFilters({ ...filters, bpmRange: e.target.value })
                      }
                      className="input"
                    >
                      <option value="all">All BPM</option>
                      <option value="60-90">60-90</option>
                      <option value="90-120">90-120</option>
                      <option value="120-140">120-140</option>
                      <option value="140-180">140-180</option>
                    </select>
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Price
                    </label>
                    <select
                      value={filters.priceRange}
                      onChange={(e) =>
                        setFilters({ ...filters, priceRange: e.target.value })
                      }
                      className="input"
                    >
                      <option value="all">All Prices</option>
                      <option value="0-20000">Under ₦20,000</option>
                      <option value="20000-40000">₦20,000 - ₦40,000</option>
                      <option value="40000-100000">Above ₦40,000</option>
                    </select>
                  </div>

                  {/* Availability */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Availability
                    </label>
                    <select
                      value={filters.availability}
                      onChange={(e) =>
                        setFilters({ ...filters, availability: e.target.value })
                      }
                      className="input"
                    >
                      <option value="all">All Beats</option>
                      <option value="available">Available</option>
                      <option value="sold">Sold Out</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={resetFilters}
                    className="text-meckury-primary hover:text-meckury-accent font-medium"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Results Count */}
          <div className="mb-6">
            <p className="text-text-secondary">
              Showing {filteredBeats.length} of {beats.length} beats
            </p>
          </div>

          {/* Beats Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(9)].map((_, i) => (
                <div
                  key={i}
                  className="bg-background-card rounded-xl h-96 animate-pulse"
                ></div>
              ))}
            </div>
          ) : filteredBeats.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBeats.map((beat) => (
                <BeatCard key={beat.id} beat={beat} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Filter className="w-16 h-16 text-meckury-mediumGray mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-white mb-2">
                No beats found
              </h3>
              <p className="text-text-secondary mb-6">
                Try adjusting your filters or search query
              </p>
              <button onClick={resetFilters} className="btn-primary">
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
