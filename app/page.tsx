'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Play, Music, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import BeatCard from '@/components/BeatCard'
import { supabase } from '@/lib/supabase'

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=2070',
  'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?q=80&w=2070',
  'https://images.unsplash.com/photo-1598653222000-6b7b7a552625?q=80&w=2070',
]

export default function HomePage() {
  const [featuredBeats, setFeaturedBeats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    fetchFeaturedBeats()
    
    // Auto-play slider
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_IMAGES.length)
    }, 5000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchFeaturedBeats = async () => {
    try {
      const { data, error } = await supabase
        .from('beats')
        .select('*')
        .eq('active', true)
        .eq('featured', true)
        .order('created_at', { ascending: false })
        .limit(6)

      if (error) throw error
      setFeaturedBeats(data || [])
    } catch (error) {
      console.error('Error fetching featured beats:', error)
    } finally {
      setLoading(false)
    }
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % HERO_IMAGES.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + HERO_IMAGES.length) % HERO_IMAGES.length)
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section with Slider */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image Slider */}
        <div className="absolute inset-0">
          {HERO_IMAGES.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={image}
                alt={`Studio ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80"></div>
            </div>
          ))}
        </div>

        {/* Slider Controls */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-all"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-all"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
          {HERO_IMAGES.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentSlide ? 'bg-red-500 w-8' : 'bg-white/50'
              }`}
            />
          ))}
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Main Heading */}
          <h1 className="text-6xl sm:text-7xl md:text-8xl font-display font-bold mb-6">
            <span className="block text-white">DANKE</span>
            <span className="block bg-gradient-to-r from-red-500 via-red-600 to-blue-500 bg-clip-text text-transparent">
              MECKURY
            </span>
          </h1>

          <p className="text-xl sm:text-2xl text-gray-200 max-w-3xl mx-auto mb-10">
            Premium beats & music production by Meckury
            <br />
            <span className="text-red-500 font-semibold">@ CovaStoris</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link 
              href="/beats" 
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-4 px-8 rounded-lg transition-all flex items-center space-x-2 shadow-lg shadow-red-500/50"
            >
              <Music className="w-5 h-5" />
              <span>Browse Beats</span>
            </Link>
            <Link 
              href="/studio" 
              className="border-2 border-white/30 backdrop-blur-sm bg-white/10 hover:bg-white/20 text-white font-semibold py-4 px-8 rounded-lg transition-all flex items-center space-x-2"
            >
              <Play className="w-5 h-5" />
              <span>Book Studio Session</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Beats Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl font-display font-bold text-white mb-2">
                Featured Beats
              </h2>
              <p className="text-text-secondary">
                Handpicked tracks from the collection
              </p>
            </div>
            <Link
              href="/beats"
              className="hidden sm:flex items-center space-x-2 text-red-500 hover:text-red-400 transition-colors"
            >
              <span className="font-semibold">View All</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-background-card rounded-xl h-80 animate-pulse"
                ></div>
              ))}
            </div>
          ) : featuredBeats.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredBeats.map((beat) => (
                <BeatCard key={beat.id} beat={beat} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Music className="w-16 h-16 text-meckury-mediumGray mx-auto mb-4" />
              <p className="text-text-secondary">
                No featured beats yet. Check back soon!
              </p>
            </div>
          )}

          <div className="text-center mt-12 sm:hidden">
            <Link href="/beats" className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-all inline-flex items-center space-x-2">
              <span>View All Beats</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="py-20 bg-background-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-display font-bold text-white mb-4">
              Why Choose Meckury?
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              Professional production, affordable pricing, and instant delivery
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card text-center hover:shadow-lg hover:shadow-red-500/20 transition-all">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/50">
                <Music className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Premium Quality
              </h3>
              <p className="text-text-secondary">
                Professional mixing, mastering, and production ready for commercial use
              </p>
            </div>

            <div className="card text-center hover:shadow-lg hover:shadow-blue-500/20 transition-all">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/50">
                <Play className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Instant Delivery
              </h3>
              <p className="text-text-secondary">
                Download MP3 and WAV files immediately after payment. Stems prepared within 48 hours
              </p>
            </div>

            <div className="card text-center hover:shadow-lg hover:shadow-red-500/20 transition-all">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/50">
                <Music className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Flexible Licensing
              </h3>
              <p className="text-text-secondary">
                Choose between affordable leases or exclusive rights with stems included
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-red-600 via-red-700 to-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-display font-bold text-white mb-6">
            Ready to Create Your Next Hit?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Book a studio session at CovaStoris or browse our beat collection
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link
              href="/studio"
              className="bg-white text-red-600 hover:bg-gray-100 font-semibold py-4 px-8 rounded-lg transition-all shadow-lg"
            >
              Book Studio Session
            </Link>
            <Link
              href="/beats"
              className="border-2 border-white text-white hover:bg-white hover:text-red-600 font-semibold py-4 px-8 rounded-lg transition-all"
            >
              Browse Beats
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
