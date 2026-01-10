// app/layout.tsx - Production-ready root layout with global providers
import type { Metadata, Viewport } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import { CartProvider } from '@/context/CartContext'
import { AudioProvider } from '@/context/AudioContext'
import './globals.css'
import { Toaster } from 'react-hot-toast'

// Font optimization with display swap for better performance
const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'], 
  variable: '--font-space-grotesk',
  display: 'swap',
})

// Viewport configuration (Next.js 14+ approach)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0A0E27' },
  ],
}

// SEO Metadata
export const metadata: Metadata = {
  title: {
    default: 'Danke Meckury | Premium Beats & Music Production',
    template: '%s | Danke Meckury',
  },
  description: 'Official beat store of Meckury, producer at CovaStoris. Buy premium beats, lease tracks, or book a studio session. Afrobeats, Trap, and more.',
  keywords: [
    'Meckury',
    'Danke Meckury',
    'CovaStoris',
    'beats for sale',
    'buy beats online',
    'lease beats',
    'exclusive beats',
    'Nigerian producer',
    'Afrobeats',
    'trap beats',
    'music production Nigeria',
    'Port Harcourt producer',
    'beat store',
  ],
  authors: [{ name: 'Meckury', url: 'https://dankemeckury.com' }],
  creator: 'Meckury',
  publisher: 'CovaStoris',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://dankemeckury.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    url: 'https://dankemeckury.com',
    title: 'Danke Meckury | Premium Beats & Music Production',
    description: 'Official beat store of Meckury, producer at CovaStoris. Buy premium beats, lease tracks, or book a studio session.',
    siteName: 'Danke Meckury',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Danke Meckury - Premium Beats',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Danke Meckury | Premium Beats & Music Production',
    description: 'Official beat store of Meckury. Buy beats, lease tracks, or book a studio session at CovaStoris.',
    images: ['/og-image.jpg'],
    creator: '@meckury',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon-16x16.png',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  verification: {
    // Add your verification codes here when ready
    google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  },
  category: 'music',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html 
      lang="en" 
      className={`${inter.variable} ${spaceGrotesk.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS prefetch for Supabase and other services */}
        <link rel="dns-prefetch" href="https://supabase.co" />
        
        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'MusicGroup',
              name: 'Meckury',
              alternateName: 'Danke Meckury',
              url: 'https://dankemeckury.com',
              genre: ['Afrobeats', 'Trap', 'Hip Hop', 'R&B'],
              description: 'Professional music producer and beat maker based in Port Harcourt, Nigeria',
              image: 'https://dankemeckury.com/og-image.jpg',
              sameAs: [
                'https://twitter.com/meckury',
                'https://instagram.com/meckury',
                // Add other social media links
              ],
              founder: {
                '@type': 'Person',
                name: 'Meckury',
              },
              location: {
                '@type': 'Place',
                address: {
                  '@type': 'PostalAddress',
                  addressLocality: 'Port Harcourt',
                  addressRegion: 'Rivers State',
                  addressCountry: 'NG',
                },
              },
            }),
          }}
        />
      </head>
      <body 
        className="min-h-screen bg-background text-white antialiased"
        suppressHydrationWarning
      >
        {/* Global Providers Stack */}
        <CartProvider>
          <AudioProvider>
            {/* Main Application */}
            <main className="relative">
              {children}
            </main>
          </AudioProvider>
        </CartProvider>
        
        {/* Global Toast Notifications */}
        <Toaster
          position="top-right"
          reverseOrder={false}
          gutter={8}
          containerClassName=""
          containerStyle={{}}
          toastOptions={{
            // Default options
            duration: 4000,
            style: {
              background: '#1A1F3A',
              color: '#fff',
              border: '1px solid #2D3250',
              borderRadius: '0.75rem',
              padding: '16px',
              fontSize: '14px',
              maxWidth: '500px',
            },
            // Success toast styling
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
              style: {
                background: '#1A1F3A',
                border: '1px solid #10B981',
              },
            },
            // Error toast styling
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
              style: {
                background: '#1A1F3A',
                border: '1px solid #EF4444',
              },
            },
            // Loading toast styling
            loading: {
              iconTheme: {
                primary: '#3B82F6',
                secondary: '#fff',
              },
            },
          }}
        />

        {/* Performance monitoring script (optional - add your analytics) */}
        {process.env.NODE_ENV === 'production' && (
          <>
            {/* Google Analytics */}
            {process.env.NEXT_PUBLIC_GA_ID && (
              <>
                <script
                  async
                  src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
                />
                <script
                  dangerouslySetInnerHTML={{
                    __html: `
                      window.dataLayer = window.dataLayer || [];
                      function gtag(){dataLayer.push(arguments);}
                      gtag('js', new Date());
                      gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                        page_path: window.location.pathname,
                      });
                    `,
                  }}
                />
              </>
            )}
          </>
        )}
      </body>
    </html>
  )
}
