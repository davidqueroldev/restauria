'use client'

import { UtensilsCrossed } from 'lucide-react'
import { CartProvider } from '@/context/CartContext'

export default function TabletLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="sticky top-0 z-20 border-b bg-white/80 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <div className="rounded-lg bg-black p-1.5">
              <UtensilsCrossed className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">Restauria</span>
          </div>
          {/* Session info or cart summary could go here */}
        </div>
      </header>
      <main className="mx-auto max-w-4xl p-4 pb-24">
        <CartProvider>{children}</CartProvider>
      </main>
      {/* Bottom nav or cart bar could be fixed here */}
    </div>
  )
}
