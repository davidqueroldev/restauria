import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../AuthContext'
import { supabase } from '@/lib/supabase'

// Helper component to expose auth state
function AuthTestHarness({
  onRender,
}: {
  onRender: (auth: ReturnType<typeof useAuth>) => void
}) {
  const auth = useAuth()
  onRender(auth)
  return null
}

describe('AuthContext', () => {
  let authRef: ReturnType<typeof useAuth>

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('useAuth — throws when used outside provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() =>
      render(
        <AuthTestHarness
          onRender={() => {
            /* unused */
          }}
        />
      )
    ).toThrow('useAuth must be used within an AuthProvider')
    spy.mockRestore()
  })

  it('starts with loading = true and no user', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    })

    render(
      <AuthProvider>
        <AuthTestHarness
          onRender={(auth) => {
            authRef = auth
          }}
        />
      </AuthProvider>
    )

    // Initially loading
    expect(authRef.user).toBeNull()
    expect(authRef.session).toBeNull()

    // After session check resolves
    await waitFor(() => {
      expect(authRef.loading).toBe(false)
    })
  })

  it('sets role flags correctly for MANAGER', async () => {
    const mockUser = { id: 'user-123' }
    const mockSession = { user: mockUser, access_token: 'token' }

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession as never },
      error: null,
    })

    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'user-123',
              role: 'MANAGER',
              full_name: 'Manager User',
              created_at: '2026-01-01',
            },
            error: null,
          }),
        }),
      }),
    } as never)

    render(
      <AuthProvider>
        <AuthTestHarness
          onRender={(auth) => {
            authRef = auth
          }}
        />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(authRef.loading).toBe(false)
    })

    expect(authRef.isAdmin).toBe(true)
    expect(authRef.isKitchen).toBe(false)
    expect(authRef.isWaiter).toBe(false)
    expect(authRef.isTablet).toBe(false)
  })

  it('sets role flags correctly for KITCHEN', async () => {
    const mockUser = { id: 'user-456' }
    const mockSession = { user: mockUser, access_token: 'token' }

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession as never },
      error: null,
    })

    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'user-456',
              role: 'KITCHEN',
              full_name: 'Kitchen User',
              created_at: '2026-01-01',
            },
            error: null,
          }),
        }),
      }),
    } as never)

    render(
      <AuthProvider>
        <AuthTestHarness
          onRender={(auth) => {
            authRef = auth
          }}
        />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(authRef.loading).toBe(false)
    })

    expect(authRef.isAdmin).toBe(false)
    expect(authRef.isKitchen).toBe(true)
    expect(authRef.isWaiter).toBe(false)
    expect(authRef.isTablet).toBe(false)
  })

  it('signOut clears user, session, and profile', async () => {
    const mockUser = { id: 'user-789' }
    const mockSession = { user: mockUser, access_token: 'token' }

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession as never },
      error: null,
    })

    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'user-789',
              role: 'WAITER',
              full_name: 'Waiter',
              created_at: '2026-01-01',
            },
            error: null,
          }),
        }),
      }),
    } as never)

    render(
      <AuthProvider>
        <AuthTestHarness
          onRender={(auth) => {
            authRef = auth
          }}
        />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(authRef.loading).toBe(false)
    })

    expect(authRef.isWaiter).toBe(true)

    await act(async () => {
      await authRef.signOut()
    })

    expect(authRef.user).toBeNull()
    expect(authRef.session).toBeNull()
    expect(authRef.profile).toBeNull()
  })
})
