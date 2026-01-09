// components/CartButton.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, X, Plus, Minus, Trash2 } from 'lucide-react'
import { useCart, type CartItem } from '@/context/CartContext'
import { formatPrice } from '@/lib/utils'

export default function CartButton() {
  const router = useRouter()
  const { items, getItemCount, removeItem, updateQuantity, getSubtotal, clearCart } = useCart()
  const [isOpen, setIsOpen] = useState(false)

  const handleCheckout = () => {
    if (items.length === 1) {
      // Single item checkout - redirect to checkout page directly
      const item = items[0]
      router.push(`/checkout?beat=${item.beatId}&license=${item.licenseType}&amount=${item.price}`)
    } else {
      // Multiple items - go to cart page
      router.push('/cart')
    }
    setIsOpen(false)
  }

  return (
    <>
      {/* Cart Icon */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative p-2 text-text-secondary hover:text-white transition-colors"
      >
        <ShoppingCart className="w-6 h-6" />
        {getItemCount() > 0 && (
          <span className="absolute -top-1 -right-1 bg-meckury-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {getItemCount()}
          </span>
        )}
      </button>

      {/* Cart Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Cart Panel */}
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-background-card z-50 shadow-xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-meckury-mediumGray">
              <div className="flex items-center space-x-3">
                <ShoppingCart className="w-6 h-6 text-meckury-primary" />
                <h2 className="text-2xl font-bold text-white">Your Cart</h2>
                {getItemCount() > 0 && (
                  <span className="bg-meckury-primary text-white text-sm font-semibold rounded-full px-2 py-1">
                    {getItemCount()} {getItemCount() === 1 ? 'item' : 'items'}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-text-secondary hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <ShoppingCart className="w-16 h-16 text-meckury-mediumGray mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Your cart is empty</h3>
                  <p className="text-text-secondary">Add some beats to get started</p>
                  <button
                    onClick={() => {
                      setIsOpen(false)
                      router.push('/beats')
                    }}
                    className="btn-primary mt-6"
                  >
                    Browse Beats
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={`${item.beatId}-${item.licenseType}`}
                      className="p-4 bg-background-elevated rounded-lg border border-meckury-mediumGray"
                    >
                      <div className="flex space-x-4">
                        {/* Beat Cover */}
                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-background-card">
                          {item.coverArtUrl ? (
                            <img
                              src={item.coverArtUrl}
                              alt={item.beatTitle}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl">
                              🎵
                            </div>
                          )}
                        </div>

                        {/* Beat Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between mb-2">
                            <h4 className="text-white font-semibold truncate">
                              {item.beatTitle}
                            </h4>
                            <button
                              onClick={() => removeItem(item.beatId, item.licenseType)}
                              className="text-text-muted hover:text-meckury-danger transition-colors ml-2"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              item.licenseType === 'exclusive'
                                ? 'bg-meckury-primary bg-opacity-20 text-meckury-primary'
                                : 'bg-meckury-secondary bg-opacity-20 text-meckury-secondary'
                            }`}>
                              {item.licenseType === 'exclusive' ? 'Exclusive' : 'Lease'}
                            </span>
                            {item.bpm && (
                              <span className="px-2 py-1 bg-background rounded text-xs text-text-muted">
                                {item.bpm} BPM
                              </span>
                            )}
                            {item.key && (
                              <span className="px-2 py-1 bg-background rounded text-xs text-text-muted">
                                {item.key}
                              </span>
                            )}
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => updateQuantity(item.beatId, item.licenseType, item.quantity - 1)}
                                className="w-8 h-8 rounded-lg border border-meckury-mediumGray flex items-center justify-center text-text-secondary hover:text-white hover:border-white transition-colors"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="text-white font-medium min-w-8 text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.beatId, item.licenseType, item.quantity + 1)}
                                className="w-8 h-8 rounded-lg border border-meckury-mediumGray flex items-center justify-center text-text-secondary hover:text-white hover:border-white transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="text-right">
                              <p className="text-meckury-primary font-bold">
                                {formatPrice(item.price * item.quantity)}
                              </p>
                              {item.quantity > 1 && (
                                <p className="text-text-muted text-xs">
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
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-meckury-mediumGray p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Subtotal</span>
                  <span className="text-white font-bold text-xl">
                    {formatPrice(getSubtotal())}
                  </span>
                </div>
                
                <div className="space-y-3">
                  <button
                    onClick={handleCheckout}
                    className="btn-primary w-full"
                  >
                    {items.length === 1 ? 'Checkout Now' : 'Proceed to Checkout'}
                  </button>
                  
                  <button
                    onClick={clearCart}
                    className="btn-outline w-full"
                  >
                    Clear Cart
                  </button>
                  
                  <button
                    onClick={() => {
                      setIsOpen(false)
                      router.push('/cart')
                    }}
                    className="text-center w-full text-text-secondary hover:text-white transition-colors text-sm"
                  >
                    View Full Cart →
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}
