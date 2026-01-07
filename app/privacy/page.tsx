'use client'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-32 pb-20 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-display font-bold text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-text-secondary mb-12">
            Last updated: January 2026
          </p>

          <div className="space-y-8 text-text-secondary">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
              <p>
                Danke Meckury / CovaStoris ("we," "our," or "us") respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, and protect your information when you use dankemeckury.com (the "Site").
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-white mb-3 mt-6">2.1 Information You Provide</h3>
              <p className="mb-4">
                We collect information you provide directly to us, including:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Name and email address (when you create an account)</li>
                <li>Payment information (processed securely through Paystack)</li>
                <li>Song information (when you submit songs for feature)</li>
                <li>Communications with us (support requests, feedback)</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">2.2 Automatically Collected Information</h3>
              <p className="mb-4">
                When you use the Site, we automatically collect:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Device and browser information</li>
                <li>IP address and location data</li>
                <li>Pages visited and time spent on the Site</li>
                <li>Beat play counts and interactions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Information</h2>
              <p className="mb-4">
                We use the collected information to:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Process your purchases and deliver products</li>
                <li>Manage your account and provide customer support</li>
                <li>Send you transactional emails (purchase confirmations, download links)</li>
                <li>Display approved song submissions on the Site</li>
                <li>Improve our Site and services</li>
                <li>Prevent fraud and ensure security</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Information Sharing</h2>
              <p className="mb-4">
                We do not sell your personal information. We may share your information with:
              </p>
              
              <h3 className="text-xl font-semibold text-white mb-3 mt-4">4.1 Service Providers</h3>
              <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
                <li><strong className="text-white">Supabase:</strong> Database and authentication services</li>
                <li><strong className="text-white">Paystack:</strong> Payment processing</li>
                <li><strong className="text-white">Vercel:</strong> Website hosting</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3">4.2 Song Submissions</h3>
              <p className="mb-4">
                If your submitted song is approved, we will publicly display:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Your song title and artist name</li>
                <li>Cover art you provide</li>
                <li>Links to streaming platforms</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3 mt-4">4.3 Legal Requirements</h3>
              <p>
                We may disclose your information if required by law or in response to valid legal requests.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Data Storage and Security</h2>
              <p className="mb-4">
                Your data is stored securely using industry-standard encryption. We use:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>HTTPS encryption for all data transmission</li>
                <li>Secure authentication via Supabase</li>
                <li>Row-level security on database access</li>
                <li>Regular security audits and updates</li>
              </ul>
              <p className="mt-4">
                However, no method of transmission over the Internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Your Rights</h2>
              <p className="mb-4">
                You have the right to:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Access the personal data we hold about you</li>
                <li>Correct inaccurate or incomplete data</li>
                <li>Request deletion of your data (subject to legal requirements)</li>
                <li>Object to processing of your data</li>
                <li>Withdraw consent for marketing communications</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, contact us at the details provided below.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Cookies and Tracking</h2>
              <p className="mb-4">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Keep you logged in</li>
                <li>Remember your preferences</li>
                <li>Analyze site usage and performance</li>
              </ul>
              <p className="mt-4">
                You can control cookies through your browser settings. Note that disabling cookies may affect site functionality.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Third-Party Links</h2>
              <p>
                The Site may contain links to third-party websites (e.g., Spotify, YouTube, Apple Music). We are not responsible for the privacy practices of these external sites. Please review their privacy policies separately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. Children's Privacy</h2>
              <p>
                The Site is not intended for users under 18 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. Data Retention</h2>
              <p className="mb-4">
                We retain your personal data for as long as:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Your account is active</li>
                <li>Needed to provide services</li>
                <li>Required by law or for legitimate business purposes</li>
              </ul>
              <p className="mt-4">
                Stems files are automatically deleted 7 days after upload. Other purchase data is retained for tax and legal compliance.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">11. International Data Transfers</h2>
              <p>
                Your data may be processed in countries outside Nigeria where our service providers operate. We ensure appropriate safeguards are in place to protect your data in compliance with applicable laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">12. Changes to Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated "Last updated" date. We encourage you to review this page periodically.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">13. Contact Us</h2>
              <p className="mb-4">
                If you have questions about this Privacy Policy or wish to exercise your privacy rights, contact us:
              </p>
              <div className="p-4 bg-background-card rounded-lg">
                <p className="text-white">CovaStoris / Meckury</p>
                <p>Lagos, Nigeria</p>
                <p>WhatsApp: +234 705 595 5523 (Substance - Manager)</p>
                <p>Website: dankemeckury.com</p>
              </div>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
