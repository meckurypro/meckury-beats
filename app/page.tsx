'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Play, TrendingUp, Music, Zap, ArrowRight } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import BeatCard from '@/components/BeatCard'
import { supabase } from '@/lib/supabase'

export default function HomePage() {
  const [featuredBeats, setFeaturedBeats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeaturedBeats()
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

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-meckury-dark via-meckury-darkGray to-meckury-dark">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-meckury-primary rounded-full blur-3xl animate-pulse-slow"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-meckury-secondary rounded-full blur-3xl animate-pulse-slow animation-delay-400"></div>
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Producer Tag */}
          <div className="inline-flex items-center space-x-2 bg-meckury-primary bg-opacity-10 border border-meckury-primary rounded-full px-6 py-3 mb-8 animate-fade-in">
            <Zap className="w-5 h-5 text-meckury-primary" />
            <span className="text-meckury-primary font-semibold">
              Official Producer Tag
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-bold mb-6 animate-slide-up">
            <span className="block text-white">DANKE</span>
            <span className="block gradient-text">MECKURY</span>
          </h1>

          <p className="text-xl sm:text-2xl text-text-secondary max-w-3xl mx-auto mb-8 animate-slide-up animation-delay-200">
            Premium beats & music production by Meckury
            <br />
            <span className="text-meckury-primary font-semibold">
              @ CovaStoris
            </span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-12 animate-slide-up animation-delay-400">
            <Link href="/beats" className="btn-primary flex items-center space-x-2">
              <Music className="w-5 h-5" />
              <span>Browse Beats</span>
            </Link>
            <Link href="/studio" className="btn-outline flex items-center space-x-2">
              <Play className="w-5 h-5" />
              <span>Book Studio Session</span>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 max-w-2xl mx-auto mt-16">
            <div className="text-center">
              <div className="text-4xl font-bold text-meckury-primary mb-2">20+</div>
              <div className="text-text-secondary text-sm">Premium Beats</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-meckury-accent mb-2">₦20K</div>
              <div className="text-text-secondary text-sm">Starting Price</div>
            </div>
            <div className="text-center col-span-2 md:col-span-1">
              <div className="text-4xl font-bold text-meckury-secondary mb-2">24/7</div>
              <div className="text-text-secondary text-sm">Instant Delivery</div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-meckury-primary rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-meckury-primary rounded-full"></div>
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
              className="hidden sm:flex items-center space-x-2 text-meckury-primary hover:text-meckury-accent transition-colors"
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
            <Link href="/beats" className="btn-primary inline-flex items-center space-x-2">
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
            <div className="card text-center hover:shadow-glow transition-all">
              <div className="w-16 h-16 bg-meckury-primary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-8 h-8 text-meckury-primary" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Premium Quality
              </h3>
              <p className="text-text-secondary">
                Professional mixing, mastering, and production ready for
                commercial use
              </p>
            </div>

            <div className="card text-center hover:shadow-glow transition-all">
              <div className="w-16 h-16 bg-meckury-accent bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-meckury-accent" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Instant Delivery
              </h3>
              <p className="text-text-secondary">
                Download MP3 and WAV files immediately after payment. Stems
                prepared within 48 hours
              </p>
            </div>

            <div className="card text-center hover:shadow-glow transition-all">
              <div className="w-16 h-16 bg-meckury-secondary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Music className="w-8 h-8 text-meckury-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Flexible Licensing
              </h3>
              <p className="text-text-secondary">
                Choose between affordable leases or exclusive rights with stems
                included
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-meckury-primary to-meckury-accent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-display font-bold text-white mb-6">
            Ready to Create Your Next Hit?
          </h2>
          <p className="text-xl text-white text-opacity-90 mb-8">
            Book a studio session at CovaStoris or browse our beat collection
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link
              href="/studio"
              className="bg-white text-meckury-primary hover:bg-opacity-90 font-semibold py-4 px-8 rounded-lg transition-all"
            >
              Book Studio Session
            </Link>
            <Link
              href="/beats"
              className="border-2 border-white text-white hover:bg-white hover:text-meckury-primary font-semibold py-4 px-8 rounded-lg transition-all"
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
