'use client'

import Script from 'next/script'

/**
 * Checkout-specific layout (Client Component)
 * Loads Paystack payment script before page becomes interactive
 * This ensures the payment modal is always available when users reach checkout
 * 
 * Note: This must be a Client Component to support Script component event handlers
 */
export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* 
        Load Paystack script with beforeInteractive strategy
        This loads the script before Next.js hydrates the page
        ensuring PaystackPop is available immediately
      */}
      <Script
        src="https://js.paystack.co/v1/inline.js"
        strategy="beforeInteractive"
        onLoad={() => {
          // Confirm script loaded successfully
          if (typeof window !== 'undefined' && window.PaystackPop) {
            console.log('✅ Paystack script loaded successfully')
          }
        }}
        onError={(e) => {
          // Log any loading errors for debugging
          console.error('❌ Paystack script failed to load:', e)
        }}
      />
      {children}
    </>
  )
}
