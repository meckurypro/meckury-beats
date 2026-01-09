// app/cart/page.tsx
'use client'

import { Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, Lock } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { useCart } from '@/context/CartContext'
import { formatPrice } from '@/lib/utils'

function CartContent() {
  const router = useRouter()
  const { items, removeItem, updateQuantity, getSubtotal, clearCart, getItemCount } = useCart()

  const handleProceedToCheckout = () => {
    // For multi-item checkout, you might want to create a batch checkout process
    // For now, we'll redirect to a batch checkout or implement single-item checkout
    if (items.length === 0) return
    
    // For MVP, we'll take the first item (you can expand this later)
    const firstItem = items[0]
    router.push(`/checkout?beat=${firstItem.beatId}&license=${firstItem.licenseType}&amount=${firstItem.price}`)
  }

  const handleBatchCheckout = async () => {
    // This would be for multiple items - you'd need to create a batch checkout system
    // For now, we'll show a message
    alert('Multi-item checkout coming soon! Currently, please checkout items individually.')
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-32 pb-20 bg-background">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Back Button */}
            <Link
              href="/beats"
              className="flex items-center space-x-2 text-text-secondary hover:text-white transition-colors mb-8"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Beats</span>
            </Link>

            {/* Empty Cart */}
            <div className="card text-center py-16">
              <ShoppingCart className="w-20 h-20 text-meckury-mediumGray mx-auto mb-6" />
              <h1 className="text-4xl font-display font-bold text-white mb-4">
                Your Cart is Empty
              </h1>
              <p className="text-text-secondary text-lg mb-8 max-w-md mx-auto">
                Looks like you haven't added any beats to your cart yet.
              </p>
              <Link href="/beats" className="btn-primary inline-flex items-center space-x-2">
                <span>Browse Beats</span>
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-32 pb-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Link
            href="/beats"
            className="flex items-center space-x-2 text-text-secondary hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Continue Shopping</span>
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-5xl font-display font-bold text-white mb-2">
              Shopping Cart
            </h1>
            <p className="text-text-secondary text-lg">
              Review your items and proceed to checkout
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="card">
                {/* Cart Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <ShoppingCart className="w-6 h-6 text-meckury-primary" />
                    <h2 className="text-2xl font-bold text-white">
                      Items ({getItemCount()})
                    </h2>
                  </div>
                  <button
                    onClick={clearCart}
                    className="text-meckury-danger hover:text-opacity-80 transition-colors text-sm font-semibold flex items-center space-x-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear Cart</span>
                  </button>
                </div>

                {/* Cart Items List */}
                <div className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={`${item.beatId}-${item.licenseType}`}
                      className="p-4 bg-background-elevated rounded-lg border border-meckury-mediumGray"
                    >
                      <div className="flex flex-col md:flex-row md:items-start space-y-4 md:space-y-0">
                        {/* Beat Cover */}
                        <div className="flex-shrink-0">
                          <div className="w-24 h-24 rounded-lg overflow-hidden bg-background-card">
                            {item.coverArtUrl ? (
                              <img
                                src={item.coverArtUrl}
                                alt={item.beatTitle}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-3xl">
                                🎵
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Beat Details */}
                        <div className="flex-1 md:ml-6">
                          {/* Title and Remove */}
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="text-xl font-bold text-white mb-1">
                                {item.beatTitle}
                              </h3>
                              <div className="flex items-center space-x-3">
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                  item.licenseType === 'exclusive'
                                    ? 'bg-meckury-primary bg-opacity-20 text-meckury-primary'
                                    : 'bg-meckury-secondary bg-opacity-20 text-meckury-secondary'
                                }`}>
                                  {item.licenseType === 'exclusive' ? 'Exclusive License' : 'Lease License'}
                                </span>
                                {item.typeBeat && (
                                  <span className="text-text-muted text-sm">
                                    {item.typeBeat}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => removeItem(item.beatId, item.licenseType)}
                              className="text-text-muted hover:text-meckury-danger transition-colors"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>

                          {/* Beat Metadata */}
                          {(item.bpm || item.key) && (
                            <div className="flex items-center space-x-4 mb-4">
                              {item.bpm && (
                                <div className="flex items-center space-x-1">
                                  <span className="text-text-muted text-sm">BPM:</span>
                                  <span className="text-white font-medium">{item.bpm}</span>
                                </div>
                              )}
                              {item.key && (
                                <div className="flex items-center space-x-1">
                                  <span className="text-text-muted text-sm">Key:</span>
                                  <span className="text-white font-medium">{item.key}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Quantity and Price */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t border-meckury-mediumGray">
                            {/* Quantity Controls */}
                            <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                              <span className="text-text-secondary text-sm">Quantity:</span>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => updateQuantity(item.beatId, item.licenseType, item.quantity - 1)}
                                  className="w-10 h-10 rounded-lg border border-meckury-mediumGray flex items-center justify-center text-text-secondary hover:text-white hover:border-white transition-colors"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="text-white font-medium min-w-8 text-center">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item.beatId, item.licenseType, item.quantity + 1)}
                                  className="w-10 h-10 rounded-lg border border-meckury-mediumGray flex items-center justify-center text-text-secondary hover:text-white hover:border-white transition-colors"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Price */}
                            <div className="text-right">
                              <p className="text-meckury-primary font-bold text-2xl">
                                {formatPrice(item.price * item.quantity)}
                              </p>
                              {item.quantity > 1 && (
                                <p className="text-text-muted text-sm">
                                  {formatPrice(item.price)} each
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="card sticky top-32">
                <h3 className="text-2xl font-bold text-white mb-6">Order Summary</h3>

                {/* Price Breakdown */}
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Subtotal</span>
                    <span className="text-white font-semibold">
                      {formatPrice(getSubtotal())}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Tax</span>
                    <span className="text-white font-semibold">₦0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Discount</span>
                    <span className="text-meckury-success font-semibold">₦0</span>
                  </div>
                  <div className="border-t border-meckury-mediumGray pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-bold text-lg">Total</span>
                      <span className="text-meckury-primary font-bold text-3xl">
                        {formatPrice(getSubtotal())}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Checkout Button */}
                <div className="space-y-3">
                  {items.length === 1 ? (
                    <button
                      onClick={handleProceedToCheckout}
                      className="btn-primary w-full flex items-center justify-center space-x-2"
                    >
                      <Lock className="w-5 h-5" />
                      <span>Proceed to Checkout</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleBatchCheckout}
                      className="btn-primary w-full flex items-center justify-center space-x-2"
                    >
                      <Lock className="w-5 h-5" />
                      <span>Checkout All Items</span>
                    </button>
                  )}
                  
                  <Link
                    href="/beats"
                    className="btn-outline w-full flex items-center justify-center"
                  >
                    Continue Shopping
                  </Link>
                </div>

                {/* Security Notice */}
                <div className="mt-6 p-4 bg-background-elevated rounded-lg border border-meckury-mediumGray">
                  <div className="flex items-start space-x-3">
                    <Lock className="w-5 h-5 text-meckury-success mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-white font-semibold text-sm mb-1">
                        100% Secure Checkout
                      </h4>
                      <p className="text-text-secondary text-xs">
                        Powered by Paystack. All transactions are encrypted and secure.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Help Links */}
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">Need help?</span>
                    <Link href="/contact" className="text-meckury-primary hover:text-meckury-accent transition-colors">
                      Contact Support
                    </Link>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">Have a promo code?</span>
                    <span className="text-text-muted">Apply at checkout</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default function CartPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-12 h-12"></div>
      </div>
    }>
      <CartContent />
    </Suspense>
  )
}
