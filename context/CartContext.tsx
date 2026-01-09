// context/CartContext.tsx
'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type LicenseType = 'lease' | 'exclusive'

export interface CartItem {
  beatId: string
  beatTitle: string
  beatSlug: string
  coverArtUrl: string
  bpm?: number
  key?: string
  typeBeat?: string
  licenseType: LicenseType
  price: number
  quantity: number
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (beatId: string, licenseType: LicenseType) => void
  updateQuantity: (beatId: string, licenseType: LicenseType, quantity: number) => void
  clearCart: () => void
  getSubtotal: () => number
  getItemCount: () => number
  isInCart: (beatId: string, licenseType: LicenseType) => boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('meckury_cart')
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart))
      } catch (error) {
        console.error('Failed to parse cart from localStorage:', error)
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('meckury_cart', JSON.stringify(items))
  }, [items])

  const addItem = (newItem: CartItem) => {
    setItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(
        item => item.beatId === newItem.beatId && item.licenseType === newItem.licenseType
      )

      if (existingItemIndex !== -1) {
        // Update quantity if item exists
        const updatedItems = [...prevItems]
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + newItem.quantity
        }
        return updatedItems
      } else {
        // Add new item
        return [...prevItems, newItem]
      }
    })
  }

  const removeItem = (beatId: string, licenseType: LicenseType) => {
    setItems(prevItems =>
      prevItems.filter(item => !(item.beatId === beatId && item.licenseType === licenseType))
    )
  }

  const updateQuantity = (beatId: string, licenseType: LicenseType, quantity: number) => {
    if (quantity < 1) {
      removeItem(beatId, licenseType)
      return
    }

    setItems(prevItems =>
      prevItems.map(item =>
        item.beatId === beatId && item.licenseType === licenseType
          ? { ...item, quantity }
          : item
      )
    )
  }

  const clearCart = () => {
    setItems([])
  }

  const getSubtotal = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const getItemCount = () => {
    return items.reduce((total, item) => total + item.quantity, 0)
  }

  const isInCart = (beatId: string, licenseType: LicenseType) => {
    return items.some(item => item.beatId === beatId && item.licenseType === licenseType)
  }

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getSubtotal,
        getItemCount,
        isInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
