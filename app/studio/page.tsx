'use client'

import Link from 'next/link'
import { Phone, Mail, MapPin, Clock, Music, Zap, Award } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function StudioPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-32 pb-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-display font-bold text-white mb-4">
              Book a Session at
              <span className="block gradient-text mt-2">CovaStoris</span>
            </h1>
            <p className="text-text-secondary text-xl max-w-3xl mx-auto">
              Work directly with Meckury in a professional studio environment
            </p>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            {/* Left Column - Info */}
            <div className="space-y-8">
              {/* What You Get */}
              <div className="card">
                <h2 className="text-3xl font-bold text-white mb-6">
                  What You Get
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-meckury-primary bg-opacity-10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Music className="w-6 h-6 text-meckury-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-1">
                        Custom Beat Production
                      </h3>
                      <p className="text-text-secondary">
                        Get a beat made specifically for you, tailored to your style and vision
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-meckury-accent bg-opacity-10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Zap className="w-6 h-6 text-meckury-accent" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-1">
                        Recording & Mixing
                      </h3>
                      <p className="text-text-secondary">
                        Professional recording and mixing services to bring your track to life
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-meckury-secondary bg-opacity-10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Award className="w-6 h-6 text-meckury-secondary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-1">
                        1-on-1 with Meckury
                      </h3>
                      <p className="text-text-secondary">
                        Direct collaboration and guidance from an experienced producer
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing Info */}
              <div className="card bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700">
                <h3 className="text-2xl font-bold text-white mb-2">
                  Session Pricing
                </h3>
                <p className="text-gray-200 mb-4">
                  Contact management for custom pricing based on your needs
                </p>
                <p className="text-gray-300 text-sm">
                  💡 Studio sessions are more expensive than buying beats online, but you get a fully custom production tailored to you.
                </p>
              </div>
            </div>

            {/* Right Column - Contact */}
            <div>
              <div className="card sticky top-32">
                <h2 className="text-3xl font-bold text-white mb-6">
                  Book Your Session
                </h2>

                <p className="text-text-secondary mb-8">
                  To book a studio session with Meckury at CovaStoris, contact management via WhatsApp or phone.
                </p>

                {/* Contact Card */}
                <div className="space-y-4 mb-8">
                  <div className="p-4 bg-background-elevated rounded-lg">
                    <p className="text-text-muted text-sm mb-2">Manager</p>
                    <p className="text-white font-semibold text-lg">Substance</p>
                  </div>

                  <a
                    href="https://wa.me/2347055955523"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary w-full flex items-center justify-center space-x-2 bg-[#25D366] hover:bg-[#20BA5A]"
                  >
                    <Phone className="w-5 h-5" />
                    <span>WhatsApp</span>
                  </a>

                  <a
                    href="tel:+2347055955523"
                    className="btn-outline w-full flex items-center justify-center space-x-2"
                  >
                    <Phone className="w-5 h-5" />
                    <span>Call</span>
                  </a>
                </div>

                {/* Info */}
                <div className="p-4 bg-background-elevated rounded-lg space-y-3 text-sm">
                  <div className="flex items-start space-x-3">
                    <Clock className="w-5 h-5 text-meckury-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white font-semibold">Response Time</p>
                      <p className="text-text-secondary">Usually within 24 hours</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-meckury-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white font-semibold">Location</p>
                      <p className="text-text-secondary">CovaStoris Studio, Enugu</p>
                    </div>
                  </div>
                </div>

                {/* Alternative */}
                <div className="mt-8 p-4 bg-meckury-secondary bg-opacity-10 border border-meckury-secondary rounded-lg">
                  <p className="text-text-secondary text-sm mb-2">
                    💡 <strong className="text-white">On a budget?</strong>
                  </p>
                  <p className="text-text-secondary text-sm mb-4">
                    Browse our beat store for affordable, high-quality beats starting at ₦20,000.
                  </p>
                  <Link href="/beats" className="btn-outline text-sm">
                    Browse Beats
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="card">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  What's included in a session?
                </h3>
                <p className="text-text-secondary">
                  Beat production, recording, mixing, and consultation. The exact deliverables depend on your package - discuss with management.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  How long is a session?
                </h3>
                <p className="text-text-secondary">
                  Session length varies based on your needs. Discuss timing and pricing with management.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Can I bring my own beat?
                </h3>
                <p className="text-text-secondary">
                  Yes! We also offer recording and mixing services if you already have instrumentals.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  What's the difference vs buying a beat?
                </h3>
                <p className="text-text-secondary">
                  Studio sessions give you custom production + recording. Buying beats online is just instrumentals at a lower price.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
