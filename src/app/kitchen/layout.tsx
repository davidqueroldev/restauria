'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function KitchenLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { profile, loading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (
      !loading &&
      profile?.role !== 'KITCHEN' &&
      profile?.role !== 'MANAGER'
    ) {
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
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="flex h-16 items-center justify-between border-b border-gray-800 bg-gray-900 px-6">
        <h1 className="text-xl font-bold tracking-wider">KITCHEN DISPLAY</h1>
        <Button variant="secondary" onClick={signOut} size="sm">
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </header>
      <main className="h-[calc(100vh-64px)] overflow-hidden p-4">
        {children}
      </main>
    </div>
  )
}
