'use client'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Check, X } from 'lucide-react'

export default function LicensesPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-32 pb-20 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-display font-bold text-white mb-4">
            License Agreement
          </h1>
          <p className="text-text-secondary mb-12">
            Understanding your rights when you purchase a beat
          </p>

          {/* Comparison Table */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            {/* Lease License */}
            <div className="card">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-white mb-2">
                  Lease License
                </h2>
                <div className="text-4xl font-bold text-meckury-primary">
                  ₦20,000
                </div>
                <p className="text-text-secondary mt-2">
                  Non-exclusive commercial use
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-meckury-success mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-white font-semibold">MP3 + WAV Files</p>
                    <p className="text-text-secondary text-sm">
                      High-quality audio files for recording and distribution
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-meckury-success mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-white font-semibold">Unlimited Streams</p>
                    <p className="text-text-secondary text-sm">
                      Stream on Spotify, Apple Music, YouTube, etc.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-meckury-success mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-white font-semibold">Commercial Use</p>
                    <p className="text-text-secondary text-sm">
                      Release songs commercially and monetize
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-meckury-success mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-white font-semibold">Music Videos</p>
                    <p className="text-text-secondary text-sm">
                      Create and monetize music videos
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-meckury-success mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-white font-semibold">Live Performances</p>
                    <p className="text-text-secondary text-sm">
                      Perform the song live at shows and events
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <X className="w-5 h-5 text-meckury-danger mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-white font-semibold">Non-Exclusive</p>
                    <p className="text-text-secondary text-sm">
                      Other artists can also lease this beat
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-meckury-success mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-white font-semibold">Producer Credit Required</p>
                    <p className="text-text-secondary text-sm">
                      Must credit "Produced by Meckury"
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-meckury-success mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-white font-semibold">Instant Download</p>
                    <p className="text-text-secondary text-sm">
                      Download immediately after payment
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Exclusive License */}
            <div className="card border-2 border-meckury-accent">
              <div className="text-center mb-6">
                <div className="inline-block px-3 py-1 bg-meckury-accent rounded-full text-white text-xs font-semibold mb-3">
                  MOST POPULAR
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Exclusive Rights
                </h2>
                <div className="text-4xl font-bold text-meckury-accent">
                  ₦80,000
                </div>
                <p className="text-text-secondary mt-2">
                  Full exclusive ownership
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-meckury-success mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-white font-semibold">MP3 + WAV + Stems</p>
                    <p className="text-text-secondary text-sm">
                      All files including trackouts for full control
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-meckury-success mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-white font-semibold">Exclusive Ownership</p>
                    <p className="text-text-secondary text-sm">
                      You are the ONLY person who can use this beat
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-meckury-success mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-white font-semibold">Beat Removed From Store</p>
                    <p className="text-text-secondary text-sm">
                      No one else can purchase after you buy
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-meckury-success mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-white font-semibold">Unlimited Everything</p>
                    <p className="text-text-secondary text-sm">
                      Streams, sales, performances - no limits
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-meckury-success mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-white font-semibold">Full Commercial Rights</p>
                    <p className="text-text-secondary text-sm">
                      Use in ads, TV, films, games, etc.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-meckury-success mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-white font-semibold">Negotiable Credit</p>
                    <p className="text-text-secondary text-sm">
                      Producer credit can be discussed
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-meckury-success mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-white font-semibold">Stems Within 48 Hours</p>
                    <p className="text-text-secondary text-sm">
                      Trackouts prepared and delivered quickly
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-meckury-success mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-white font-semibold">Priority Support</p>
                    <p className="text-text-secondary text-sm">
                      Direct support for any issues
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Terms */}
          <div className="space-y-8 text-text-secondary">
            <section>
              <h2 className="text-3xl font-bold text-white mb-4">Detailed License Terms</h2>
              
              <h3 className="text-2xl font-semibold text-white mb-3 mt-8">1. Grant of License</h3>
              <p>
                Upon purchase and payment confirmation, Meckury grants you a license to use the beat according to the license type purchased. The underlying composition and sound recording remain the property of Meckury.
              </p>

              <h3 className="text-2xl font-semibold text-white mb-3 mt-8">2. Lease License Terms</h3>
              <p className="mb-4">
                A Lease License grants you non-exclusive rights to:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Create one (1) new song using the beat</li>
                <li>Distribute and monetize the song on all digital platforms</li>
                <li>Stream and download the song unlimited times</li>
                <li>Perform the song live at paid and unpaid performances</li>
                <li>Create and monetize music videos on YouTube and other platforms</li>
                <li>Sell the song as a single or part of an album/mixtape</li>
              </ul>
              <p className="mt-4">
                <strong className="text-white">You must:</strong> Credit "Produced by Meckury" in all releases and platforms.
              </p>
              <p className="mt-2">
                <strong className="text-white">You cannot:</strong> Re-sell or transfer the beat to another artist, claim ownership of the beat, or register the beat with a performance rights organization.
              </p>

              <h3 className="text-2xl font-semibold text-white mb-3 mt-8">3. Exclusive Rights Terms</h3>
              <p className="mb-4">
                Exclusive Rights grant you full ownership rights to:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Create unlimited songs using the beat</li>
                <li>Distribute, stream, and monetize without restrictions</li>
                <li>License the beat to third parties (films, ads, etc.)</li>
                <li>Register the composition with performance rights organizations</li>
                <li>Have the beat removed from sale to all other customers</li>
                <li>Receive stems (trackouts) for full mixing control</li>
              </ul>
              <p className="mt-4">
                <strong className="text-white">Publishing:</strong> For exclusive purchases, Meckury typically retains 25% publishing rights. This can be negotiated. Contact Substance for details.
              </p>

              <h3 className="text-2xl font-semibold text-white mb-3 mt-8">4. Stems Delivery</h3>
              <p>
                Stems (trackouts) are only included with Exclusive Rights purchases. Stems will be prepared within 48 hours of purchase and made available for download via email. Download links are valid for 7 days.
              </p>

              <h3 className="text-2xl font-semibold text-white mb-3 mt-8">5. Producer Tag</h3>
              <p>
                All beats contain the "Danke Meckury" producer tag. For Lease licenses, the tag must remain in the final song. For Exclusive purchases, tag removal can be negotiated.
              </p>

              <h3 className="text-2xl font-semibold text-white mb-3 mt-8">6. Territory</h3>
              <p>
                All licenses grant worldwide rights. You may distribute your song globally.
              </p>

              <h3 className="text-2xl font-semibold text-white mb-3 mt-8">7. Term</h3>
              <p>
                Lease licenses are perpetual (forever) as long as you comply with the terms. Exclusive rights are perpetual with full ownership transfer.
              </p>

              <h3 className="text-2xl font-semibold text-white mb-3 mt-8">8. Copyright</h3>
              <p>
                You own the copyright to your lyrics and vocal performance. Meckury retains copyright to the instrumental composition and sound recording, except where exclusive rights transfer ownership.
              </p>

              <h3 className="text-2xl font-semibold text-white mb-3 mt-8">9. Breach of License</h3>
              <p>
                If you violate the license terms, Meckury reserves the right to terminate your license and take legal action. This includes using the beat beyond the scope of your license or failing to provide proper credit.
              </p>
            </section>

            <section className="card bg-meckury-primary bg-opacity-10 border border-meckury-primary">
              <h3 className="text-2xl font-semibold text-white mb-3">Questions?</h3>
              <p className="mb-4">
                If you have questions about licensing or need a custom agreement, contact our manager:
              </p>
              <div className="p-4 bg-background-card rounded-lg">
                <p className="text-white">Substance (Manager)</p>
                <p>WhatsApp: +234 705 595 5523</p>
                <p>We're happy to discuss custom terms for your project.</p>
              </div>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
