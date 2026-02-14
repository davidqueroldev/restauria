'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Lock, Mail, Loader2, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { user, profile } = useAuth()

  // Fallback: redirect already-logged-in users
  useEffect(() => {
    if (user && profile) {
      redirectByRole(profile.role, user.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile])

  const redirectByRole = (role: string, userId?: string) => {
    switch (role) {
      case 'MANAGER':
        router.replace('/manager')
        break
      case 'KITCHEN':
        router.replace('/kitchen')
        break
      case 'WAITER':
        router.replace('/waiter')
        break
      case 'TABLET':
        if (userId) {
          supabase
            .from('tables')
            .select('id')
            .eq('tablet_user_id', userId)
            .single()
            .then(({ data }) => {
              if (data) router.replace(`/tablet/${data.id}`)
              else {
                setError('Error: Tablet user not linked to any table.')
                setLoading(false)
              }
            })
        }
        break
      default:
        setError('Unknown role')
        setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Redirect immediately using role from user_metadata (no second round-trip)
    const role = data.user?.user_metadata?.role as string | undefined
    if (role) {
      redirectByRole(role, data.user?.id)
    }
    // Fallback: useEffect will catch it if metadata is missing
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Sign in to Restauria
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your credentials to access the system
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full rounded-md border-0 py-2 pl-10 text-gray-900 ring-1 ring-gray-300 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-600 focus:ring-inset sm:text-sm sm:leading-6"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="block w-full rounded-md border-0 py-2 pl-10 text-gray-900 ring-1 ring-gray-300 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-600 focus:ring-inset sm:text-sm sm:leading-6"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center rounded-md bg-red-50 p-2 text-sm text-red-600">
              <AlertCircle className="mr-2 h-4 w-4" />
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group focus-visible:outline2 relative flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-70"
            >
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
                ) : (
                  <Lock className="h-5 w-5 text-indigo-500 group-hover:text-indigo-400" />
                )}
              </span>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
