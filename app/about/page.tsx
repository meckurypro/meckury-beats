'use client'

import Link from 'next/link'
import { Music, Award, Users, Zap } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-32 pb-20 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-display font-bold text-white mb-4">
              About
              <span className="block gradient-text mt-2">Meckury</span>
            </h1>
            <p className="text-text-secondary text-xl">
              Producer • Singer • Songwriter • Composer
            </p>
          </div>

          {/* Main Content */}
          <div className="space-y-12">
            {/* Story */}
            <div className="card">
              <h2 className="text-3xl font-bold text-white mb-6">
                The Story
              </h2>
              <div className="space-y-4 text-text-secondary leading-relaxed">
                <p>
                  Meckury is a Nigerian music producer, beat maker, singer, songwriter, and music composer currently based in Enugu. With over 10 years of experience in music production, Meckury has developed a versatile sound that spans multiple genres including Afrobeats, Amapiano, Afrogospel, Drill, and more.
                </p>
                <p>
                  Operating from CovaStoris studio in Lagos, Meckury has worked with numerous artists across Nigeria, helping them bring their musical visions to life through professional production, mixing, and mastering services.
                </p>
                <p>
                  The signature "Danke Meckury" producer tag has become synonymous with quality beats that resonate with audiences. Whether it's melodic Afrobeats, energetic Amapiano, soulful Afrogospel, or hard-hitting Drill, Meckury's versatility and creativity make every project unique.
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="card text-center">
                <div className="w-12 h-12 bg-meckury-primary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Music className="w-6 h-6 text-meckury-primary" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">20+</div>
                <div className="text-text-secondary text-sm">Beats Available</div>
              </div>

              <div className="card text-center">
                <div className="w-12 h-12 bg-meckury-accent bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-6 h-6 text-meckury-accent" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">10+</div>
                <div className="text-text-secondary text-sm">Years Experience</div>
              </div>

              <div className="card text-center">
                <div className="w-12 h-12 bg-meckury-secondary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-meckury-secondary" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">100+</div>
                <div className="text-text-secondary text-sm">Artists Worked With</div>
              </div>

              <div className="card text-center">
                <div className="w-12 h-12 bg-meckury-success bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-meckury-success" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">24/7</div>
                <div className="text-text-secondary text-sm">Beat Delivery</div>
              </div>
            </div>

            {/* CovaStoris */}
            <div className="card bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700">
              <h2 className="text-3xl font-bold text-white mb-4">
                CovaStoris Studio
              </h2>
              <p className="text-gray-200 mb-6 leading-relaxed">
                CovaStoris is Meckury's professional recording studio based in Lagos, Nigeria. Equipped with industry-standard gear and software, CovaStoris provides a creative environment where artists can bring their music to life. From beat production to full song recording and mixing, CovaStoris is where the magic happens.
              </p>
              <Link href="/studio" className="inline-block bg-white text-gray-900 hover:bg-gray-100 font-semibold py-3 px-6 rounded-lg transition-all">
                Book a Session
              </Link>
            </div>

            {/* Services */}
            <div className="card">
              <h2 className="text-3xl font-bold text-white mb-6">
                What I Offer
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2 flex items-center space-x-2">
                    <span className="text-meckury-primary">•</span>
                    <span>Beat Sales (Online)</span>
                  </h3>
                  <p className="text-text-secondary">
                    Browse and purchase high-quality beats with instant download. Lease licenses start at ₦20,000, exclusive rights at ₦80,000.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-2 flex items-center space-x-2">
                    <span className="text-meckury-primary">•</span>
                    <span>Custom Beat Production</span>
                  </h3>
                  <p className="text-text-secondary">
                    Get a beat made specifically for you at CovaStoris. Work directly with me to create something unique.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-2 flex items-center space-x-2">
                    <span className="text-meckury-primary">•</span>
                    <span>Recording & Mixing</span>
                  </h3>
                  <p className="text-text-secondary">
                    Professional recording and mixing services at CovaStoris. Bring your vocals or instrumentals to the next level.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-2 flex items-center space-x-2">
                    <span className="text-meckury-primary">•</span>
                    <span>Sound Engineering</span>
                  </h3>
                  <p className="text-text-secondary">
                    Full sound engineering services including mastering, vocal tuning, and audio post-production.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center space-y-6">
              <h2 className="text-3xl font-bold text-white">
                Ready to Work Together?
              </h2>
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                <Link href="/beats" className="btn-primary">
                  Browse Beats
                </Link>
                <Link href="/studio" className="btn-outline">
                  Book Studio Session
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
