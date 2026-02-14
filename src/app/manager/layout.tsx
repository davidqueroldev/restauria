'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard,
  Utensils,
  Users,
  LogOut,
  Settings,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { clsx } from 'clsx'

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { profile, loading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && profile?.role !== 'MANAGER') {
      router.push('/login')
    }
  }, [loading, profile, router])

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    )

  const navItems = [
    { name: 'Dashboard', href: '/manager', icon: LayoutDashboard },
    { name: 'Menu', href: '/manager/menu', icon: Utensils },
    { name: 'Tables', href: '/manager/tables', icon: Users },
    { name: 'Settings', href: '/manager/settings', icon: Settings },
  ]

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="flex h-16 items-center justify-center border-b">
          <h1 className="text-xl font-bold text-indigo-600">Restauria</h1>
        </div>
        <nav className="mt-6 px-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={clsx(
                    'flex items-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
                    pathname === item.href
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="absolute bottom-0 w-64 border-t p-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={signOut}
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  )
}
