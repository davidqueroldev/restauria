'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { MenuItem } from '@/types/menu'

export interface CartItem extends MenuItem {
  quantity: number
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: MenuItem) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, delta: number) => void
  clearCart: () => void
  totalAmount: number
  totalItems: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  // Load from local storage on mount (client side only)
  useEffect(() => {
    const saved = localStorage.getItem('restauria-cart')
    if (saved) {
      try {
        const parsedData = JSON.parse(saved)
        // Defer to avoid "cascading render" lint error in Next.js 15/React 19
        setTimeout(() => {
          setItems(parsedData)
        }, 0)
      } catch (e) {
        console.error('Failed to parse cart', e)
      }
    }
  }, [])

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem('restauria-cart', JSON.stringify(items))
  }, [items])

  const addItem = (item: MenuItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id)
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const removeItem = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId))
  }

  const updateQuantity = (itemId: string, delta: number) => {
    setItems((prev) => {
      return prev
        .map((i) => {
          if (i.id === itemId) {
            const newQty = Math.max(0, i.quantity + delta)
            return { ...i, quantity: newQty }
          }
          return i
        })
        .filter((i) => i.quantity > 0)
    })
  }

  const clearCart = () => setItems([])

  const totalAmount = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalAmount,
        totalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
