'use client'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-32 pb-20 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-display font-bold text-white mb-4">
            Terms of Service
          </h1>
          <p className="text-text-secondary mb-12">
            Last updated: January 2026
          </p>

          <div className="space-y-8 text-text-secondary">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing and using dankemeckury.com (the "Site"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, please do not use the Site.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Use of Service</h2>
              <p className="mb-4">
                The Site provides access to music beats and related services. You agree to use the Site only for lawful purposes and in accordance with these Terms.
              </p>
              <p>
                You agree not to:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Use the Site in any way that violates any applicable law or regulation</li>
                <li>Reproduce, distribute, or publicly display any content without permission</li>
                <li>Attempt to gain unauthorized access to the Site or related systems</li>
                <li>Share purchased beats without proper licensing</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. Purchases and Payments</h2>
              <p className="mb-4">
                All purchases made through the Site are processed through Paystack, a third-party payment processor. By making a purchase, you agree to Paystack's terms and conditions.
              </p>
              <p className="mb-4">
                <strong className="text-white">Lease Licenses (₦20,000):</strong> Non-exclusive rights to use the beat commercially. Multiple artists may lease the same beat. Must credit "Produced by Meckury" in releases.
              </p>
              <p>
                <strong className="text-white">Exclusive Rights (₦80,000):</strong> Full exclusive ownership of the beat. Beat is removed from the store after purchase. Includes stems (trackouts) delivered within 48 hours.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. License Terms</h2>
              <p className="mb-4">
                When you purchase a beat, you receive a license to use it according to the license type purchased. The beat itself remains the intellectual property of Meckury.
              </p>
              <p>
                For detailed license terms, please see our <a href="/licenses" className="text-meckury-primary hover:underline">License Agreement</a> page.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Refund Policy</h2>
              <p className="mb-4">
                Due to the digital nature of our products, all sales are final. We do not offer refunds once a beat has been downloaded.
              </p>
              <p>
                If you experience technical issues with your purchase, please contact us immediately at the email provided on the Site.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Stems Delivery (Exclusive Only)</h2>
              <p className="mb-4">
                For exclusive purchases, stems (trackouts) will be prepared and made available within 48 hours of purchase. Download links will be active for 7 days.
              </p>
              <p>
                If you fail to download the stems within the 7-day window, please contact support for assistance. We reserve the right to charge a re-upload fee for expired downloads.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Song Submissions</h2>
              <p className="mb-4">
                Users who purchase beats may submit songs made with those beats for potential feature on the Site. By submitting, you grant us permission to display your song, artist name, and cover art on our platform.
              </p>
              <p className="mb-4">
                We reserve the right to approve or reject any submission at our discretion. Submission does not guarantee feature placement.
              </p>
              <p>
                You retain all rights to your song. We do not claim ownership of submitted content.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Intellectual Property</h2>
              <p className="mb-4">
                All beats, audio content, graphics, logos, and text on the Site are the property of Meckury or CovaStoris and are protected by copyright and other intellectual property laws.
              </p>
              <p>
                The "Danke Meckury" producer tag and CovaStoris name are trademarks of their respective owners.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. User Accounts</h2>
              <p className="mb-4">
                You are responsible for maintaining the confidentiality of your account credentials. You agree to accept responsibility for all activities that occur under your account.
              </p>
              <p>
                Notify us immediately of any unauthorized use of your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. Limitation of Liability</h2>
              <p>
                To the fullest extent permitted by law, Meckury and CovaStoris shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Site or purchased beats.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">11. Changes to Terms</h2>
              <p>
                We reserve the right to modify these Terms of Service at any time. Changes will be effective immediately upon posting to the Site. Your continued use of the Site after changes constitutes acceptance of the modified terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">12. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of Nigeria, without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">13. Contact</h2>
              <p>
                For questions about these Terms of Service, please contact:
              </p>
              <div className="mt-4 p-4 bg-background-card rounded-lg">
                <p className="text-white">CovaStoris / Meckury</p>
                <p>Lagos, Nigeria</p>
                <p>WhatsApp: +234 705 595 5523 (Substance - Manager)</p>
              </div>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
