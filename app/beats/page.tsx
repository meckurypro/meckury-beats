'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, Filter, SlidersHorizontal, Plus, Check, ShoppingCart } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import BeatCard from '@/components/BeatCard'
import { supabase } from '@/lib/supabase'
import { useCart } from '@/context/CartContext'
import toast from 'react-hot-toast'

// Quick Add Button Component for BeatCard
function QuickAddButton({ beat, licenseType }: { beat: any; licenseType: 'lease' | 'exclusive' }) {
  const { addItem, isInCart } = useCart()

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Check if exclusive is sold
    if (licenseType === 'exclusive' && beat.exclusive_sold) {
      toast.error('Exclusive license sold out')
      return
    }

    // Check if already in cart
    if (isInCart(beat.id, licenseType)) {
      toast.error('Already in cart')
      return
    }

    addItem({
      beatId: beat.id,
      beatTitle: beat.title,
      beatSlug: beat.slug,
      coverArtUrl: beat.cover_art_url,
      bpm: beat.bpm,
      key: beat.key,
      typeBeat: beat.type_beat,
      licenseType,
      price: licenseType === 'lease' ? beat.lease_price : beat.exclusive_price,
      quantity: 1,
    })

    toast.success(`Added ${beat.title} ${licenseType} to cart!`)
  }

  const price = licenseType === 'lease' ? beat.lease_price : beat.exclusive_price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price)
  }

  if (licenseType === 'exclusive' && beat.exclusive_sold) {
    return null
  }

  return (
    <button
      onClick={handleAddToCart}
      disabled={isInCart(beat.id, licenseType)}
      className={`
        flex items-center justify-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold
        transition-all duration-200 hover:scale-105 active:scale-95
        ${isInCart(beat.id, licenseType)
          ? 'bg-meckury-success text-white cursor-not-allowed'
          : licenseType === 'lease'
            ? 'bg-meckury-primary hover:bg-meckury-primary/90 text-white'
            : 'bg-meckury-accent hover:bg-meckury-accent/90 text-white'
        }
      `}
      title={`Add ${licenseType} license to cart - ${formatPrice(price)}`}
    >
      {isInCart(beat.id, licenseType) ? (
        <>
          <Check className="w-3 h-3" />
          <span>In Cart</span>
        </>
      ) : (
        <>
          <ShoppingCart className="w-3 h-3" />
          <span>{licenseType === 'lease' ? 'Lease' : 'Exclusive'}</span>
        </>
      )}
    </button>
  )
}

// Enhanced BeatCard wrapper with quick-add buttons
function EnhancedBeatCard({ beat }: { beat: any }) {
  return (
    <div className="relative group">
      <BeatCard beat={beat} />
      
      {/* Quick Add Buttons Overlay */}
      <div className="absolute top-3 right-3 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="flex flex-col space-y-2">
          <QuickAddButton beat={beat} licenseType="lease" />
          <QuickAddButton beat={beat} licenseType="exclusive" />
        </div>
      </div>
    </div>
  )
}

function BeatsContent() {
  const searchParams = useSearchParams()
  const [beats, setBeats] = useState<any[]>([])
  const [filteredBeats, setFilteredBeats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    genre: searchParams.get('genre') || 'all',
    mood: searchParams.get('mood') || 'all',
    bpmRange: searchParams.get('bpm') || 'all',
    priceRange: searchParams.get('price') || 'all',
    availability: searchParams.get('availability') || 'all',
  })

  // Fetch beats on mount
  useEffect(() => {
    fetchBeats()
  }, [])

  // Sync filters with URL params
  useEffect(() => {
    const genre = searchParams.get('genre')
    const mood = searchParams.get('mood')
    const bpm = searchParams.get('bpm')
    const price = searchParams.get('price')
    const availability = searchParams.get('availability')

    if (genre || mood || bpm || price || availability) {
      setFilters({
        genre: genre || 'all',
        mood: mood || 'all',
        bpmRange: bpm || 'all',
        priceRange: price || 'all',
        availability: availability || 'all',
      })
    }
  }, [searchParams])

  // Apply filters when dependencies change
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
      toast.error('Failed to load beats')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...beats]

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(
        (beat) =>
          beat.title.toLowerCase().includes(query) ||
          beat.type_beat?.toLowerCase().includes(query) ||
          beat.genre?.toLowerCase().includes(query) ||
          beat.mood?.toLowerCase().includes(query) ||
          beat.key?.toLowerCase().includes(query)
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
        (beat) => beat.bpm && beat.bpm >= min && beat.bpm <= max
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

  const getGenreOptions = () => {
    const genres = new Set(beats.map(beat => beat.genre).filter(Boolean))
    return Array.from(genres).sort()
  }

  const getMoodOptions = () => {
    const moods = new Set(beats.map(beat => beat.mood).filter(Boolean))
    return Array.from(moods).sort()
  }

  const getUniqueBPMRanges = () => {
    const ranges = [
      { value: '60-90', label: '60-90 BPM (Slow)' },
      { value: '90-120', label: '90-120 BPM (Medium)' },
      { value: '120-140', label: '120-140 BPM (Upbeat)' },
      { value: '140-180', label: '140-180 BPM (Fast)' },
    ]
    return ranges
  }

  const getPriceRanges = () => {
    return [
      { value: '0-20000', label: 'Under ₦20,000' },
      { value: '20000-40000', label: '₦20,000 - ₦40,000' },
      { value: '40000-100000', label: 'Above ₦40,000' },
    ]
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-28 pb-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-10 text-center">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
              Premium Beats Catalog
            </h1>
            <p className="text-text-secondary text-lg">
              Discover {beats.length} professionally produced beats by Meckury
            </p>
          </div>

          {/* Search and Filter Bar */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-muted w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search beats by title, type, genre, or mood..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-12 w-full"
                  aria-label="Search beats"
                />
              </div>

              {/* Filter Toggle Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn-outline flex items-center justify-center space-x-2 px-6 py-3"
                aria-expanded={showFilters}
                aria-controls="filters-panel"
              >
                <SlidersHorizontal className="w-5 h-5" />
                <span>Filters</span>
                {Object.values(filters).some(f => f !== 'all') && (
                  <span className="bg-meckury-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    !
                  </span>
                )}
              </button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div 
                id="filters-panel"
                className="card animate-slide-down p-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Genre Filter */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Genre
                    </label>
                    <select
                      value={filters.genre}
                      onChange={(e) =>
                        setFilters({ ...filters, genre: e.target.value })
                      }
                      className="input w-full"
                      aria-label="Filter by genre"
                    >
                      <option value="all">All Genres</option>
                      {getGenreOptions().map((genre) => (
                        <option key={genre} value={genre}>
                          {genre}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Mood Filter */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Mood
                    </label>
                    <select
                      value={filters.mood}
                      onChange={(e) =>
                        setFilters({ ...filters, mood: e.target.value })
                      }
                      className="input w-full"
                      aria-label="Filter by mood"
                    >
                      <option value="all">All Moods</option>
                      {getMoodOptions().map((mood) => (
                        <option key={mood} value={mood}>
                          {mood}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* BPM Filter */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      BPM Range
                    </label>
                    <select
                      value={filters.bpmRange}
                      onChange={(e) =>
                        setFilters({ ...filters, bpmRange: e.target.value })
                      }
                      className="input w-full"
                      aria-label="Filter by BPM range"
                    >
                      <option value="all">Any BPM</option>
                      {getUniqueBPMRanges().map((range) => (
                        <option key={range.value} value={range.value}>
                          {range.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price Filter */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Price Range
                    </label>
                    <select
                      value={filters.priceRange}
                      onChange={(e) =>
                        setFilters({ ...filters, priceRange: e.target.value })
                      }
                      className="input w-full"
                      aria-label="Filter by price range"
                    >
                      <option value="all">Any Price</option>
                      {getPriceRanges().map((range) => (
                        <option key={range.value} value={range.value}>
                          {range.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Availability Filter */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Availability
                    </label>
                    <select
                      value={filters.availability}
                      onChange={(e) =>
                        setFilters({ ...filters, availability: e.target.value })
                      }
                      className="input w-full"
                      aria-label="Filter by availability"
                    >
                      <option value="all">All Beats</option>
                      <option value="available">Exclusive Available</option>
                      <option value="sold">Exclusive Sold</option>
                    </select>
                  </div>
                </div>

                {/* Filter Actions */}
                <div className="mt-6 pt-6 border-t border-meckury-mediumGray flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-text-secondary text-sm">
                    <span className="font-semibold text-white">{filteredBeats.length}</span> beats match your criteria
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={resetFilters}
                      className="text-meckury-primary hover:text-meckury-accent font-medium px-3 py-2"
                      aria-label="Reset all filters"
                    >
                      Reset All Filters
                    </button>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="btn-primary px-6 py-2"
                      aria-label="Apply filters"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Active Filters Display */}
          {Object.values(filters).some(f => f !== 'all') && (
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <p className="text-text-secondary">
                Showing <span className="text-white font-semibold">{filteredBeats.length}</span> of{' '}
                <span className="text-white font-semibold">{beats.length}</span> beats
              </p>
              
              <div className="flex flex-wrap gap-2">
                {filters.genre !== 'all' && (
                  <span className="badge badge-primary" aria-label={`Genre: ${filters.genre}`}>
                    {filters.genre}
                  </span>
                )}
                {filters.mood !== 'all' && (
                  <span className="badge badge-success" aria-label={`Mood: ${filters.mood}`}>
                    {filters.mood}
                  </span>
                )}
                {filters.bpmRange !== 'all' && (
                  <span className="badge badge-warning" aria-label={`BPM: ${filters.bpmRange}`}>
                    {filters.bpmRange} BPM
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Beats Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-background-card rounded-xl h-96 animate-pulse"
                  aria-label="Loading beat card"
                />
              ))}
            </div>
          ) : filteredBeats.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBeats.map((beat) => (
                <EnhancedBeatCard key={beat.id} beat={beat} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 card">
              <Filter className="w-16 h-16 text-meckury-mediumGray mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-white mb-2">
                No beats found
              </h3>
              <p className="text-text-secondary mb-6 max-w-md mx-auto">
                {searchQuery || Object.values(filters).some(f => f !== 'all')
                  ? 'Try adjusting your filters or search query'
                  : 'No beats available at the moment. Check back soon!'}
              </p>
              {(searchQuery || Object.values(filters).some(f => f !== 'all')) && (
                <button 
                  onClick={resetFilters} 
                  className="btn-primary px-6 py-3"
                  aria-label="Clear all filters"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {/* Featured Beats Section */}
          {!loading && beats.some(b => b.featured) && (
            <div className="mt-20">
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold text-white mb-2">
                  Featured Beats
                </h2>
                <p className="text-text-secondary">
                  Handpicked selections from Meckury
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {beats
                  .filter(beat => beat.featured)
                  .slice(0, 3)
                  .map((beat) => (
                    <EnhancedBeatCard key={beat.id} beat={beat} />
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default function BeatsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-12 h-12" aria-label="Loading beats page" />
      </div>
    }>
      <BeatsContent />
    </Suspense>
  )
}
