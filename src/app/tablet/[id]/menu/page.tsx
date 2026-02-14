'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import { MenuCategory } from '@/types/menu'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { ShoppingCart, Plus, UtensilsCrossed, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useCart } from '@/context/CartContext'

// Simple helper for price formatting
const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(
    price
  )

export default function MenuPage() {
  const { id: tableId } = useParams()
  const router = useRouter()

  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const { addItem, totalItems } = useCart()

  const fetchMenu = useCallback(async () => {
    try {
      // Fetch categories
      const { data: cats, error: catError } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (catError) throw catError

      // Fetch items
      const { data: items, error: itemError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (itemError) throw itemError

      // Group items by category
      const menu = (cats || []).map((cat) => ({
        ...cat,
        items: (items || []).filter((item) => item.category_id === cat.id),
      }))

      setCategories(menu)
      if (menu.length > 0 && !activeCategory) setActiveCategory(menu[0].id)
    } catch (err) {
      console.error('Error fetching menu:', err)
    } finally {
      setLoading(false)
    }
  }, [activeCategory])

  const checkSession = useCallback(async () => {
    const { data } = await supabase
      .from('tables')
      .select('current_session_id, status')
      .eq('id', tableId)
      .single()

    if (!data?.current_session_id || data.status !== 'OCCUPIED') {
      router.replace(`/tablet/${tableId}`)
    }
  }, [tableId, router])

  useEffect(() => {
    fetchMenu()

    const channel = supabase
      .channel('menu-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'menu_items' },
        () => fetchMenu()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'menu_categories' },
        () => fetchMenu()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchMenu])

  useEffect(() => {
    checkSession()

    // Realtime listener for session termination
    const channel = supabase
      .channel(`table-session-${tableId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tables',
          filter: `id=eq.${tableId}`,
        },
        (payload) => {
          if (!payload.new.current_session_id) {
            router.replace(`/tablet/${tableId}`)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tableId, router, checkSession])

  if (loading)
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" />
      </div>
    )

  return (
    <div className="space-y-6">
      {/* Category Nav */}
      <div className="hide-scrollbar sticky top-16 z-10 -mx-4 flex gap-2 overflow-x-auto border-b border-gray-200 bg-gray-50 px-4 py-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setActiveCategory(cat.id)
              document
                .getElementById(cat.id)
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat.id
                ? 'bg-gray-900 text-white shadow-md'
                : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Menu Grid */}
      <div className="space-y-8">
        {categories.map((cat) => (
          <section key={cat.id} id={cat.id} className="scroll-mt-28">
            <h2 className="mb-4 px-1 text-xl font-bold text-gray-900">
              {cat.name}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cat.items.map((item) => (
                <Card
                  key={item.id}
                  className="flex h-full cursor-pointer flex-col overflow-hidden border-gray-100 bg-white transition-shadow hover:shadow-md"
                >
                  <div className="relative h-40 w-full bg-gray-200">
                    {item.image_url ? (
                      <Image
                        src={item.image_url}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-400">
                        <UtensilsCrossed className="h-8 w-8" />
                      </div>
                    )}
                    {item.stock === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-lg font-bold text-white backdrop-blur-sm">
                        SOLD OUT
                      </div>
                    )}
                  </div>
                  <CardContent className="flex flex-1 flex-col p-4">
                    <div className="mb-2 flex items-start justify-between">
                      <h3 className="line-clamp-2 font-bold text-gray-900">
                        {item.name}
                      </h3>
                      <span className="font-semibold text-gray-900">
                        {formatPrice(item.price)}
                      </span>
                    </div>
                    <p className="mb-4 line-clamp-2 flex-1 text-sm text-gray-500">
                      {item.description}
                    </p>

                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {item.allergens?.map(
                          (allergen: string, idx: number) => (
                            <span
                              key={idx}
                              className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-red-600 uppercase"
                            >
                              {allergen}
                            </span>
                          )
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 shrink-0 rounded-full p-0"
                        disabled={item.stock === 0}
                        onClick={() => addItem(item)}
                      >
                        <Plus className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Floating Cart Button */}
      {totalItems > 0 && (
        <div className="fixed right-6 bottom-6 z-20">
          <Button
            size="lg"
            className="relative flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 shadow-xl hover:bg-indigo-700"
            onClick={() => router.push(`/tablet/${tableId}/cart`)}
          >
            <ShoppingCart className="h-6 w-6 text-white" />
            <span className="absolute -top-1 -right-1 rounded-full border-2 border-white bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
              {totalItems}
            </span>
          </Button>
        </div>
      )}
    </div>
  )
}
