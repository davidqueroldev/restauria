import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { supabase } from '@/lib/supabase'

// We need to mock the AuthContext for manager layout
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'manager-1' },
    profile: { role: 'MANAGER', full_name: 'Manager' },
    loading: false,
    isAdmin: true,
    isKitchen: false,
    isWaiter: false,
    isTablet: false,
    signOut: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Import after mocks
import ManagerDashboard from '../page'

// Helper to set up Supabase mock responses
function mockSupabaseResponses({
  activeTables = 0,
  orders = [],
  kitchenQueue = 0,
  revenueData = [],
  sessions = [],
}: {
  activeTables?: number
  orders?: Array<{ status: string }>
  kitchenQueue?: number
  revenueData?: Array<{ unit_price: number; quantity: number }>
  sessions?: Array<{
    id: string
    alias: string
    status: string
    table: { table_number: number }
    orders: Array<{
      id: string
      status: string
      order_items: Array<{ unit_price: number; quantity: number }>
    }>
  }>
}) {
  const fromMock = vi.mocked(supabase.from)
  let callCount = 0

  fromMock.mockImplementation(() => {
    callCount++
    // Call 1: Active tables count
    if (callCount === 1) {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            count: activeTables,
            data: null,
            error: null,
          }),
        }),
      } as never
    }
    // Call 2: Orders today
    if (callCount === 2) {
      return {
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockResolvedValue({
            data: orders,
            error: null,
          }),
        }),
      } as never
    }
    // Call 3: Kitchen queue count
    if (callCount === 3) {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            count: kitchenQueue,
            data: null,
            error: null,
          }),
        }),
      } as never
    }
    // Call 4: Revenue data
    if (callCount === 4) {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockResolvedValue({
              data: revenueData,
              error: null,
            }),
          }),
        }),
      } as never
    }
    // Call 5: Active sessions
    if (callCount === 5) {
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
    }
    // Default
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
    } as never
  })
}

describe('ManagerDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders stat cards with correct values', async () => {
    mockSupabaseResponses({
      activeTables: 2,
      orders: [{ status: 'IN_KITCHEN' }, { status: 'SERVED' }],
      kitchenQueue: 1,
      revenueData: [
        { unit_price: 10, quantity: 2 },
        { unit_price: 12, quantity: 1 },
      ],
      sessions: [],
    })

    render(<ManagerDashboard />)

    await waitFor(() => {
      // "Active Tables" appears in both the stat card and section header
      expect(
        screen.getAllByText('Active Tables').length
      ).toBeGreaterThanOrEqual(1)
    })

    // Check stat values — these may appear in multiple places (stat card + badge)
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1) // active tables
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1) // kitchen queue
  })

  it('renders active sessions with accumulated totals', async () => {
    mockSupabaseResponses({
      activeTables: 1,
      orders: [],
      kitchenQueue: 0,
      sessions: [
        {
          id: 'session-1',
          alias: 'Test Customer',
          status: 'ACTIVE',
          table: { table_number: 3 },
          orders: [
            {
              id: 'order-1',
              status: 'SERVED',
              order_items: [
                { unit_price: 10, quantity: 2 },
                { unit_price: 12, quantity: 1 },
              ],
            },
          ],
        },
      ],
    })

    render(<ManagerDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Test Customer')).toBeInTheDocument()
    })

    // Table number
    expect(screen.getByText('3')).toBeInTheDocument()

    // Accumulated total: (10*2) + (12*1) = 32€
    expect(screen.getByText('32,00 €')).toBeInTheDocument()
  })

  it('shows checkout-requested styling for billing sessions', async () => {
    mockSupabaseResponses({
      sessions: [
        {
          id: 'session-2',
          alias: 'Billing Guest',
          status: 'CHECKOUT_REQUESTED',
          table: { table_number: 5 },
          orders: [
            {
              id: 'order-2',
              status: 'SERVED',
              order_items: [{ unit_price: 15, quantity: 1 }],
            },
          ],
        },
      ],
    })

    render(<ManagerDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Billing Guest')).toBeInTheDocument()
    })

    // Should show "Bill Requested" indicator
    expect(screen.getByText('Bill Requested')).toBeInTheDocument()
  })

  it('shows empty state when no active tables', async () => {
    mockSupabaseResponses({ sessions: [] })

    render(<ManagerDashboard />)

    await waitFor(() => {
      expect(screen.getByText('No occupied tables.')).toBeInTheDocument()
    })
  })

  it('shows total of 0,00 € for session with no orders', async () => {
    mockSupabaseResponses({
      sessions: [
        {
          id: 'session-3',
          alias: 'New Guest',
          status: 'ACTIVE',
          table: { table_number: 7 },
          orders: [],
        },
      ],
    })

    render(<ManagerDashboard />)

    await waitFor(() => {
      expect(screen.getByText('New Guest')).toBeInTheDocument()
    })

    // 0,00 € appears in both Revenue Today card and session total
    expect(screen.getAllByText('0,00 €').length).toBeGreaterThanOrEqual(2)
  })

  it('accumulates totals across multiple orders in same session', async () => {
    mockSupabaseResponses({
      sessions: [
        {
          id: 'session-4',
          alias: 'Multi Order',
          status: 'ACTIVE',
          table: { table_number: 1 },
          orders: [
            {
              id: 'order-a',
              status: 'SERVED',
              order_items: [{ unit_price: 10, quantity: 1 }],
            },
            {
              id: 'order-b',
              status: 'IN_KITCHEN',
              order_items: [
                { unit_price: 8, quantity: 2 },
                { unit_price: 5, quantity: 1 },
              ],
            },
          ],
        },
      ],
    })

    render(<ManagerDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Multi Order')).toBeInTheDocument()
    })

    // Total: 10 + (8*2) + 5 = 31€
    expect(screen.getByText('31,00 €')).toBeInTheDocument()
  })
})
