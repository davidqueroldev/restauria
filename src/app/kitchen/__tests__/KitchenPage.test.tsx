import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { supabase } from '@/lib/supabase'

// Mock auth
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'kitchen-1' },
    profile: { role: 'KITCHEN', full_name: 'Kitchen' },
    loading: false,
    isAdmin: false,
    isKitchen: true,
    isWaiter: false,
    isTablet: false,
    signOut: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}))

import KitchenPage from '../page'

function mockKitchenData(
  orders: Array<{
    id: string
    status: string
    created_at: string
    session: {
      alias: string
      table: { table_number: number }
    } | null
    order_items: Array<{
      id: string
      quantity: number
      status: string
      menu_items: { name: string } | null
    }>
  }> = []
) {
  const fromMock = vi.mocked(supabase.from)

  // Kitchen fetchOrders: .from('orders').select(...).eq('status', 'IN_KITCHEN').order(...)
  fromMock.mockImplementation(() => {
    return {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: orders,
            error: null,
          }),
        }),
        in: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: orders,
            error: null,
          }),
        }),
      }),
    } as never
  })
}

describe('KitchenPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows empty state when no kitchen orders', async () => {
    mockKitchenData([])

    render(<KitchenPage />)

    await waitFor(() => {
      expect(
        screen.getByText((content) => content.includes('No active orders'))
      ).toBeInTheDocument()
    })
  })

  it('renders orders with table info and items', async () => {
    mockKitchenData([
      {
        id: 'order-1',
        status: 'IN_KITCHEN',
        created_at: new Date().toISOString(),
        session: {
          alias: 'Cook Guest',
          table: { table_number: 6 },
        },
        order_items: [
          {
            id: 'oi-1',
            quantity: 1,
            status: 'PENDING',
            menu_items: { name: 'Hamburguesa Clásica' },
          },
          {
            id: 'oi-2',
            quantity: 2,
            status: 'PENDING',
            menu_items: { name: 'Patatas Bravas' },
          },
        ],
      },
    ])

    render(<KitchenPage />)

    await waitFor(() => {
      expect(screen.getByText('Table 6')).toBeInTheDocument()
    })

    expect(screen.getByText('#Cook Guest')).toBeInTheDocument()
    expect(screen.getByText('Hamburguesa Clásica')).toBeInTheDocument()
    expect(screen.getByText('Patatas Bravas')).toBeInTheDocument()
  })

  it('renders multiple orders from different tables', async () => {
    mockKitchenData([
      {
        id: 'order-1',
        status: 'IN_KITCHEN',
        created_at: new Date().toISOString(),
        session: {
          alias: 'Guest A',
          table: { table_number: 1 },
        },
        order_items: [
          {
            id: 'oi-1',
            quantity: 1,
            status: 'PENDING',
            menu_items: { name: 'Pizza' },
          },
        ],
      },
      {
        id: 'order-2',
        status: 'IN_KITCHEN',
        created_at: new Date().toISOString(),
        session: {
          alias: 'Guest B',
          table: { table_number: 3 },
        },
        order_items: [
          {
            id: 'oi-2',
            quantity: 1,
            status: 'PENDING',
            menu_items: { name: 'Pasta' },
          },
        ],
      },
    ])

    render(<KitchenPage />)

    await waitFor(() => {
      expect(screen.getByText('Table 1')).toBeInTheDocument()
    })

    expect(screen.getByText('Table 3')).toBeInTheDocument()
    expect(screen.getByText('Pizza')).toBeInTheDocument()
    expect(screen.getByText('Pasta')).toBeInTheDocument()
  })

  it('shows "Complete Order" button for orders', async () => {
    mockKitchenData([
      {
        id: 'order-1',
        status: 'IN_KITCHEN',
        created_at: new Date().toISOString(),
        session: {
          alias: 'Test',
          table: { table_number: 1 },
        },
        order_items: [
          {
            id: 'oi-1',
            quantity: 1,
            status: 'PENDING',
            menu_items: { name: 'Soup' },
          },
        ],
      },
    ])

    render(<KitchenPage />)

    await waitFor(() => {
      expect(screen.getByText('Complete Order')).toBeInTheDocument()
    })
  })
})
