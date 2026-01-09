'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, Filter, SlidersHorizontal, Plus, Check } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'
import { useCart } from '@/context/CartContext'
import toast from 'react-hot-toast'

// Beat Card Component
function BeatCard({ beat }: { beat: any }) {
  const { addItem, isInCart } = useCart()

  const handleAddToCart = (e: React.MouseEvent, licenseType: 'lease' | 'exclusive') => {
    e.stopPropagation()
    e.preventDefault()

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <a
      href={`/beats/${beat.slug}`}
      className="card-beat group relative overflow-hidden"
    >
      {/* Cover Art */}
      <div className="aspect-square relative overflow-hidden bg-background-elevated">
        <img
          src={beat.cover_art_url || '/placeholder-beat.jpg'}
          alt={beat.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Exclusive Sold Overlay */}
        {beat.exclusive_sold && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-center p-4">
              <div className="badge badge-warning mb-2">Exclusive Sold</div>
              <p className="text-white text-sm">Lease Available</p>
            </div>
          </div>
        )}

        {/* Quick Add Buttons */}
        <div className="absolute top-3 right-3 flex flex-col space-y-2">
          <button
            onClick={(e) => handleAddToCart(e, 'lease')}
            disabled={isInCart(beat.id, 'lease')}
            className={`p-2 rounded-full shadow-lg transition-all transform hover:scale-110 ${
              isInCart(beat.id, 'lease')
                ? 'bg-meckury-success text-white'
                : 'bg-meckury-primary hover:bg-meckury-accent text-white'
            }`}
            title="Add lease to cart"
          >
            {isInCart(beat.id, 'lease') ? (
              <Check className="w-3 h-3" />
            ) : (
              <Plus className="w-3 h-3" />
            )}
          </button>
          
          {!beat.exclusive_sold && (
            <button
              onClick={(e) => handleAddToCart(e, 'exclusive')}
              disabled={isInCart(beat.id, 'exclusive')}
              className={`p-2 rounded-full shadow-lg transition-all transform hover:scale-110 ${
                isInCart(beat.id, 'exclusive')
                  ? 'bg-meckury-success text-white'
                  : 'bg-meckury-accent hover:bg-opacity-90 text-white'
              }`}
              title="Add exclusive to cart"
            >
              {isInCart(beat.id, 'exclusive') ? (
                <Check className="w-3 h-3" />
              ) : (
                <Plus className="w-3 h-3" />
              )}
            </button>
          )}
        </div>

        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="w-12 h-12 bg-meckury-primary rounded-full flex items-center justify-center transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
            <div className="w-4 h-4 ml-1">
              <div className="w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-l-6 border-l-white"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Beat Info */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-white font-bold text-lg truncate">
              {beat.title}
            </h3>
            {beat.type_beat && (
              <p className="text-text-muted text-sm truncate">{beat.type_beat}</p>
            )}
          </div>
          <div className="flex items-center space-x-1">
            {beat.play_count > 0 && (
              <span className="text-xs text-text-muted flex items-center">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                {beat.play_count}
              </span>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center space-x-4 text-sm text-text-muted mb-3">
          {beat.bpm && (
            <span className="flex items-center">
              <span className="w-1 h-1 bg-text-muted rounded-full mr-1"></span>
              {beat.bpm} BPM
            </span>
          )}
          {beat.key && (
            <span className="flex items-center">
              <span className="w-1 h-1 bg-text-muted rounded-full mr-1"></span>
              {beat.key}
            </span>
          )}
        </div>

        {/* Genre & Mood */}
        <div className="flex flex-wrap gap-2 mb-3">
          {beat.genre && (
            <span className="px-2 py-1 bg-background-elevated rounded text-xs text-text-secondary">
              {beat.genre}
            </span>
          )}
          {beat.mood && (
            <span className="px-2 py-1 bg-background-elevated rounded text-xs text-text-secondary">
              {beat.mood}
            </span>
          )}
        </div>

        {/* Price & Availability */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-meckury-primary font-bold text-lg">
                {formatPrice(beat.lease_price)}
              </span>
              {!beat.exclusive_sold && (
                <span className="text-meckury-accent font-bold text-lg">
                  {formatPrice(beat.exclusive_price)}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 text-xs text-text-secondary">
              <span>Lease</span>
              {!beat.exclusive_sold && (
                <>
                  <span>•</span>
                  <span>Exclusive</span>
                </>
              )}
            </div>
          </div>

          {/* Quick Info */}
          <div className="text-right">
            {beat.lease_count > 0 && (
              <p className="text-xs text-text-muted">
                {beat.lease_count} lease{beat.lease_count !== 1 ? 's' : ''} sold
              </p>
            )}
          </div>
        </div>
      </div>
    </a>
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

  useEffect(() => {
    fetchBeats()
  }, [])

  useEffect(() => {
    // Update filters from URL params
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
    if (searchQuery) {
      filtered = filtered.filter(
        (beat) =>
          beat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          beat.type_beat?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          beat.genre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          beat.mood?.toLowerCase().includes(searchQuery.toLowerCase())
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

  const getGenreOptions = () => {
    const genres = new Set(beats.map(beat => beat.genre).filter(Boolean))
    return Array.from(genres).sort()
  }

  const getMoodOptions = () => {
    const moods = new Set(beats.map(beat => beat.mood).filter(Boolean))
    return Array.from(moods).sort()
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-32 pb-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-5xl font-display font-bold text-white mb-4">
              Premium Beats Catalog
            </h1>
            <p className="text-text-secondary text-lg">
              Discover {beats.length} professionally produced beats by Meckury
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
                  placeholder="Search beats by title, type, genre, or mood..."
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
                {Object.values(filters).some(f => f !== 'all') && (
                  <span className="bg-meckury-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    !
                  </span>
                )}
              </button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="card animate-slide-down">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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
                      {getGenreOptions().map((genre) => (
                        <option key={genre} value={genre}>
                          {genre}
                        </option>
                      ))}
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
                      {getMoodOptions().map((mood) => (
                        <option key={mood} value={mood}>
                          {mood}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* BPM Range */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      BPM Range
                    </label>
                    <select
                      value={filters.bpmRange}
                      onChange={(e) =>
                        setFilters({ ...filters, bpmRange: e.target.value })
                      }
                      className="input"
                    >
                      <option value="all">Any BPM</option>
                      <option value="60-90">60-90 BPM (Slow)</option>
                      <option value="90-120">90-120 BPM (Medium)</option>
                      <option value="120-140">120-140 BPM (Upbeat)</option>
                      <option value="140-180">140-180 BPM (Fast)</option>
                    </select>
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Price Range
                    </label>
                    <select
                      value={filters.priceRange}
                      onChange={(e) =>
                        setFilters({ ...filters, priceRange: e.target.value })
                      }
                      className="input"
                    >
                      <option value="all">Any Price</option>
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
                      <option value="available">Exclusive Available</option>
                      <option value="sold">Exclusive Sold</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row justify-between items-center pt-6 border-t border-meckury-mediumGray">
                  <div className="mb-4 sm:mb-0">
                    <p className="text-text-secondary text-sm">
                      {filteredBeats.length} beats match your criteria
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={resetFilters}
                      className="text-meckury-primary hover:text-meckury-accent font-medium"
                    >
                      Reset All Filters
                    </button>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="btn-primary px-4 py-2"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Results Summary */}
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
            <p className="text-text-secondary">
              Showing <span className="text-white font-semibold">{filteredBeats.length}</span> of{' '}
              <span className="text-white font-semibold">{beats.length}</span> beats
            </p>
            
            {Object.values(filters).some(f => f !== 'all') && (
              <div className="flex flex-wrap gap-2">
                {filters.genre !== 'all' && (
                  <span className="badge badge-primary">{filters.genre}</span>
                )}
                {filters.mood !== 'all' && (
                  <span className="badge badge-success">{filters.mood}</span>
                )}
                {filters.bpmRange !== 'all' && (
                  <span className="badge badge-warning">{filters.bpmRange} BPM</span>
                )}
              </div>
            )}
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
            <div className="text-center py-20 card">
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
                <button onClick={resetFilters} className="btn-primary">
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {/* Featured Beats Section */}
          {!loading && beats.some(b => b.featured) && (
            <div className="mt-16">
              <div className="mb-8">
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
                    <BeatCard key={beat.id} beat={beat} />
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
        <div className="spinner w-12 h-12"></div>
      </div>
    }>
      <BeatsContent />
    </Suspense>
  )
}
