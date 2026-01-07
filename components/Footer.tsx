'use client'

import Link from 'next/link'
import { Instagram, Twitter, Youtube, Mail, Phone } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-background-card border-t border-meckury-mediumGray mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="text-2xl font-display font-bold">
              <span className="text-meckury-primary">DANKE</span>
              <span className="text-white ml-2">MECKURY</span>
            </div>
            <p className="text-text-secondary text-sm">
              Premium beats & music production by Meckury at CovaStoris.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://instagram.com/meckury"
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-secondary hover:text-meckury-primary transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com/meckury"
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-secondary hover:text-meckury-primary transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://youtube.com/@meckury"
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-secondary hover:text-meckury-primary transition-colors"
              >
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/beats"
                  className="text-text-secondary hover:text-white transition-colors text-sm"
                >
                  Browse Beats
                </Link>
              </li>
              <li>
                <Link
                  href="/portfolio"
                  className="text-text-secondary hover:text-white transition-colors text-sm"
                >
                  Portfolio
                </Link>
              </li>
              <li>
                <Link
                  href="/studio"
                  className="text-text-secondary hover:text-white transition-colors text-sm"
                >
                  Book Session
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-text-secondary hover:text-white transition-colors text-sm"
                >
                  About Meckury
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/terms"
                  className="text-text-secondary hover:text-white transition-colors text-sm"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-text-secondary hover:text-white transition-colors text-sm"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/licenses"
                  className="text-text-secondary hover:text-white transition-colors text-sm"
                >
                  License Agreement
                </Link>
              </li>
              <li>
                <Link
                  href="/refund"
                  className="text-text-secondary hover:text-white transition-colors text-sm"
                >
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Book a Session</h3>
            <div className="space-y-3">
              <p className="text-text-secondary text-sm">
                Contact Substance to book studio time with Meckury at CovaStoris.
              </p>
              <a
                href="https://wa.me/2347055955523"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-meckury-primary hover:text-meckury-accent transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span className="text-sm font-medium">+234 705 595 5523</span>
              </a>
              <a
                href="mailto:bookings@covastoris.com"
                className="flex items-center space-x-2 text-text-secondary hover:text-white transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span className="text-sm">bookings@covastoris.com</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-meckury-mediumGray">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-text-secondary text-sm">
              © {currentYear} Danke Meckury. All rights reserved.
            </p>
            <p className="text-text-secondary text-sm">
              Powered by{' '}
              <span className="text-meckury-primary font-semibold">
                CovaStoris
              </span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
