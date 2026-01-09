import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import { CartProvider } from '@/context/CartContext'
import './globals.css'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'], 
  variable: '--font-space-grotesk' 
})

export const metadata: Metadata = {
  title: 'Danke Meckury | Premium Beats & Music Production',
  description: 'Official beat store of Meckury, producer at CovaStoris. Buy premium beats, lease tracks, or book a studio session. Afrobeats, Trap, and more.',
  keywords: 'Meckury, Danke Meckury, CovaStoris, beats for sale, buy beats online, lease beats, exclusive beats, Nigerian producer, Afrobeats, trap beats, music production Nigeria',
  authors: [{ name: 'Meckury', url: 'https://dankemeckury.com' }],
  creator: 'Meckury',
  publisher: 'CovaStoris',
  metadataBase: new URL('https://dankemeckury.com'),
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
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <head>
        {/* Add viewport meta tag for mobile responsiveness */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* Paystack Script - Load early for payment processing */}
        <script 
          src="https://js.paystack.co/v1/inline.js" 
          async 
          defer
          crossOrigin="anonymous"
        />
        
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon?<generated>" type="image/<generated>" sizes="<generated>" />
        <link rel="apple-touch-icon" href="/apple-touch-icon?<generated>" type="image/<generated>" sizes="<generated>" />
      </head>
      <body className="min-h-screen bg-background">
        <CartProvider>
          {children}
        </CartProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1A1F3A',
              color: '#fff',
              border: '1px solid #2D3250',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />
        
        {/* Script to check if Paystack loaded (non-blocking) */}
        <script dangerouslySetInnerHTML={{
          __html: `
            // Check if Paystack script loaded
            function checkPaystackLoaded() {
              if (typeof window !== 'undefined') {
                const isLoaded = typeof window.PaystackPop !== 'undefined';
                console.log('Paystack script loaded:', isLoaded);
                if (!isLoaded) {
                  // If not loaded after 3 seconds, try to reload
                  setTimeout(() => {
                    if (typeof window.PaystackPop === 'undefined') {
                      console.warn('Paystack script not loaded, attempting to reload...');
                      const script = document.createElement('script');
                      script.src = 'https://js.paystack.co/v1/inline.js';
                      script.async = true;
                      script.defer = true;
                      script.crossOrigin = 'anonymous';
                      document.head.appendChild(script);
                    }
                  }, 3000);
                }
              }
            }
            
            // Check when page loads
            window.addEventListener('load', checkPaystackLoaded);
            
            // Also check after a short delay
            setTimeout(checkPaystackLoaded, 1000);
          `
        }} />
      </body>
    </html>
  )
}
