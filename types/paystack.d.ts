/**
 * Paystack Payment Integration Types
 * 
 * This file contains all TypeScript type definitions for Paystack payment integration.
 * It extends the global Window interface and defines payment option types.
 * 
 * @see https://paystack.com/docs/api/
 */

/**
 * Paystack payment response object
 * Returned when a payment is successful
 */
export interface PaystackResponse {
  reference: string
  status: string
  trans: string
  transaction: string
  trxref: string
  message?: string
}

/**
 * Paystack payment options interface
 * Configuration object passed to PaystackPop.setup()
 */
export interface PaystackOptions {
  /** Paystack public key from environment variables */
  key: string
  
  /** Customer email address (required) */
  email: string
  
  /** Amount in smallest currency unit (kobo for NGN) */
  amount: number
  
  /** Unique transaction reference */
  ref: string
  
  /** Currency code (default: NGN) */
  currency?: string
  
  /** Payment channels to enable */
  channels?: string[]
  
  /** Additional metadata for the transaction */
  metadata?: Record<string, any>
  
  /** Callback fired on successful payment */
  onSuccess?: (response: PaystackResponse) => void
  
  /** Callback fired when user cancels payment */
  onCancel?: () => void
  
  /** Callback fired when payment modal is closed */
  onClose?: () => void
}

/**
 * Paystack handler interface
 * Returned by PaystackPop.setup()
 */
export interface PaystackHandler {
  /** Opens the Paystack payment iframe */
  openIframe: () => void
}

/**
 * Global Window interface extension
 * Adds Paystack payment library to window object
 */
declare global {
  interface Window {
    /**
     * Paystack payment popup library
     * Loaded via external script tag
     */
    PaystackPop?: {
      /**
       * Initialize a payment transaction
       * @param options - Payment configuration options
       * @returns Handler object with openIframe method
       */
      setup: (options: PaystackOptions) => PaystackHandler
    }
  }
}

// Required for TypeScript to treat this as a module
export {}
