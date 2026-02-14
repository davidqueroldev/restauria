import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { supabase } from '@/lib/supabase'

// Mock auth
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'waiter-1' },
    profile: { role: 'WAITER', full_name: 'Waiter' },
    loading: false,
    isAdmin: false,
    isKitchen: false,
    isWaiter: true,
    isTablet: false,
    signOut: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}))

import WaiterDashboard from '../page'

function mockWaiterData({
  orders = [],
  sessions = [],
}: {
  orders?: Array<{
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
      menu_items: { name: string } | null
    }>
  }>
  sessions?: Array<{
    id: string
    alias: string
    status: string
    seated_at: string
    table: { table_number: number } | null
  }>
}) {
  const fromMock = vi.mocked(supabase.from)
  let callCount = 0

  // Waiter fetchData makes 2 calls:
  // 1. .from('orders').select(...).eq('status', 'COMPLETED').order(...)
  // 2. .from('table_sessions').select(...).in('status', [...]).order(...)
  fromMock.mockImplementation(() => {
    callCount++
    if (callCount === 1) {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: orders,
              error: null,
            }),
          }),
        }),
      } as never
    }
    return {
      select: vi.fn().mockReturnValue({
        in: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: sessions,
            error: null,
          }),
        }),
      }),
    } as never
  })
}

describe('WaiterDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows "No orders ready" when no completed orders', async () => {
    mockWaiterData({ orders: [], sessions: [] })

    render(<WaiterDashboard />)

    await waitFor(() => {
      expect(screen.getByText('No orders ready currently.')).toBeInTheDocument()
    })
  })

  it('renders ready orders with table info and items', async () => {
    mockWaiterData({
      orders: [
        {
          id: 'order-1',
          status: 'COMPLETED',
          created_at: new Date().toISOString(),
          session: {
            alias: 'Demo Guest',
            table: { table_number: 4 },
          },
          order_items: [
            {
              id: 'oi-1',
              quantity: 2,
              menu_items: { name: 'Ensalada de Pasta' },
            },
            {
              id: 'oi-2',
              quantity: 1,
              menu_items: { name: 'Carpaccio de Cecina' },
            },
          ],
        },
      ],
      sessions: [],
    })

    render(<WaiterDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Table 4')).toBeInTheDocument()
    })

    expect(screen.getByText('#Demo Guest')).toBeInTheDocument()
    expect(screen.getByText('Ensalada de Pasta')).toBeInTheDocument()
    expect(screen.getByText('Carpaccio de Cecina')).toBeInTheDocument()
    expect(screen.getByText('Mark as Served')).toBeInTheDocument()
  })

  it('renders active sessions in the Active Services section', async () => {
    mockWaiterData({
      orders: [],
      sessions: [
        {
          id: 'sess-1',
          alias: 'Table Guest',
          status: 'ACTIVE',
          seated_at: new Date().toISOString(),
          table: { table_number: 2 },
        },
      ],
    })

    render(<WaiterDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Table Guest')).toBeInTheDocument()
    })
  })

  it('shows "No occupied tables" when no active sessions', async () => {
    mockWaiterData({ orders: [], sessions: [] })

    render(<WaiterDashboard />)

    await waitFor(() => {
      expect(screen.getByText('No occupied tables.')).toBeInTheDocument()
    })
  })
})
