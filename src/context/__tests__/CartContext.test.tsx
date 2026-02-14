import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { CartProvider, useCart, CartItem } from '../CartContext'
import { MenuItem } from '@/types/menu'

// Helper component that exposes cart state for testing
function CartTestHarness({
  onRender,
}: {
  onRender: (cart: {
    items: CartItem[]
    addItem: (item: MenuItem) => void
    removeItem: (id: string) => void
    updateQuantity: (id: string, delta: number) => void
    clearCart: () => void
    totalAmount: number
    totalItems: number
  }) => void
}) {
  const cart = useCart()
  onRender(cart)
  return null
}

const mockItem1: MenuItem = {
  id: 'item-1',
  name: 'Ensalada de Pasta',
  price: 10,
  category_id: 'cat-1',
  description: 'Fresh pasta salad',
  available: true,
  image_url: null,
  created_at: '2026-01-01T00:00:00Z',
}

const mockItem2: MenuItem = {
  id: 'item-2',
  name: 'Carpaccio de Cecina',
  price: 12,
  category_id: 'cat-1',
  description: 'Cured beef carpaccio',
  available: true,
  image_url: null,
  created_at: '2026-01-01T00:00:00Z',
}

describe('CartContext', () => {
  let cartRef: ReturnType<typeof useCart>

  const renderCart = () => {
    render(
      <CartProvider>
        <CartTestHarness
          onRender={(cart) => {
            cartRef = cart
          }}
        />
      </CartProvider>
    )
  }

  beforeEach(() => {
    localStorage.clear()
  })

  it('starts with an empty cart', () => {
    renderCart()
    expect(cartRef.items).toEqual([])
    expect(cartRef.totalAmount).toBe(0)
    expect(cartRef.totalItems).toBe(0)
  })

  it('addItem — adds a new item with quantity 1', () => {
    renderCart()
    act(() => cartRef.addItem(mockItem1))
    expect(cartRef.items).toHaveLength(1)
    expect(cartRef.items[0].id).toBe('item-1')
    expect(cartRef.items[0].quantity).toBe(1)
  })

  it('addItem — increments quantity for existing item', () => {
    renderCart()
    act(() => cartRef.addItem(mockItem1))
    act(() => cartRef.addItem(mockItem1))
    expect(cartRef.items).toHaveLength(1)
    expect(cartRef.items[0].quantity).toBe(2)
  })

  it('addItem — adds multiple different items', () => {
    renderCart()
    act(() => cartRef.addItem(mockItem1))
    act(() => cartRef.addItem(mockItem2))
    expect(cartRef.items).toHaveLength(2)
  })

  it('removeItem — removes item by id', () => {
    renderCart()
    act(() => cartRef.addItem(mockItem1))
    act(() => cartRef.addItem(mockItem2))
    act(() => cartRef.removeItem('item-1'))
    expect(cartRef.items).toHaveLength(1)
    expect(cartRef.items[0].id).toBe('item-2')
  })

  it('updateQuantity — increments quantity', () => {
    renderCart()
    act(() => cartRef.addItem(mockItem1))
    act(() => cartRef.updateQuantity('item-1', 2))
    expect(cartRef.items[0].quantity).toBe(3)
  })

  it('updateQuantity — decrements quantity', () => {
    renderCart()
    act(() => cartRef.addItem(mockItem1))
    act(() => cartRef.addItem(mockItem1)) // qty = 2
    act(() => cartRef.updateQuantity('item-1', -1))
    expect(cartRef.items[0].quantity).toBe(1)
  })

  it('updateQuantity — removes item when quantity reaches 0', () => {
    renderCart()
    act(() => cartRef.addItem(mockItem1))
    act(() => cartRef.updateQuantity('item-1', -1))
    expect(cartRef.items).toHaveLength(0)
  })

  it('clearCart — empties all items', () => {
    renderCart()
    act(() => cartRef.addItem(mockItem1))
    act(() => cartRef.addItem(mockItem2))
    act(() => cartRef.clearCart())
    expect(cartRef.items).toEqual([])
    expect(cartRef.totalAmount).toBe(0)
    expect(cartRef.totalItems).toBe(0)
  })

  it('totalAmount — calculates sum of price × quantity', () => {
    renderCart()
    act(() => cartRef.addItem(mockItem1)) // 10 × 1
    act(() => cartRef.addItem(mockItem2)) // 12 × 1
    act(() => cartRef.addItem(mockItem1)) // 10 × 2
    // Expected: (10 × 2) + (12 × 1) = 32
    expect(cartRef.totalAmount).toBe(32)
  })

  it('totalItems — calculates total item count', () => {
    renderCart()
    act(() => cartRef.addItem(mockItem1)) // qty 1
    act(() => cartRef.addItem(mockItem2)) // qty 1
    act(() => cartRef.addItem(mockItem1)) // qty 2
    // Expected: 2 + 1 = 3
    expect(cartRef.totalItems).toBe(3)
  })

  it('useCart — throws when used outside provider', () => {
    // Suppress console.error for expected error
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() =>
      render(
        <CartTestHarness
          onRender={() => {
            /* unused */
          }}
        />
      )
    ).toThrow('useCart must be used within a CartProvider')
    spy.mockRestore()
  })
})
