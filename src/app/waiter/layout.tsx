'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { LogOut, CheckSquare } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function WaiterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { profile, loading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && profile?.role !== 'WAITER' && profile?.role !== 'MANAGER') {
      router.push('/login')
    }
  }, [loading, profile, router])

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    )

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-white px-4 shadow-sm">
        <div className="flex items-center space-x-2">
          <CheckSquare className="h-5 w-5 text-indigo-600" />
          <h1 className="text-lg font-bold">Waiter</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={signOut}>
          <LogOut className="h-5 w-5" />
        </Button>
      </header>
      <main className="flex-1 overflow-y-auto p-4 pb-20">{children}</main>
    </div>
  )
}
