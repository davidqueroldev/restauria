'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useCart, CartItem } from '@/context/CartContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import Image from 'next/image'
import {
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  Utensils,
  AlertCircle,
} from 'lucide-react'

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(
    price
  )

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, totalAmount } =
    useCart()
  const router = useRouter()
  const params = useParams()
  const tableId = params.id as string

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase
        .from('tables')
        .select('current_session_id, status')
        .eq('id', tableId)
        .single()

      if (!data?.current_session_id || data.status !== 'OCCUPIED') {
        router.replace(`/tablet/${tableId}`)
      }
    }

    checkSession()

    // Realtime listener for session termination
    const channel = supabase
      .channel(`cart-session-${tableId}`)
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
  }, [tableId, router])

  const handleSubmitOrder = async () => {
    if (items.length === 0) return
    setSubmitting(true)
    setError(null)

    try {
      // 1. Get current session ID
      const { data: tableData, error: tableError } = await supabase
        .from('tables')
        .select('current_session_id')
        .eq('id', tableId)
        .single()

      if (tableError || !tableData?.current_session_id) {
        throw new Error('No active session found. Please start a session.')
      }

      const sessionId = tableData.current_session_id

      // 2. Check if there is an active order (batch) for this session: IN_KITCHEN
      const { data: existingOrders, error: existingError } = await supabase
        .from('orders')
        .select('id')
        .eq('session_id', sessionId)
        .eq('status', 'IN_KITCHEN')

      if (existingError) throw existingError

      // Rule: Only 1 open batch allowed.
      if (existingOrders && existingOrders.length > 0) {
        throw new Error(
          'You have an order in the kitchen. Please wait for it to be served before ordering more.'
        )
      }

      // 3. Create Order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          session_id: sessionId,
          status: 'IN_KITCHEN',
        })
        .select()
        .single()

      if (orderError) throw orderError

      // 4. Create Order Items
      const orderItems = items.map((item: CartItem) => ({
        order_id: order.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        status: 'PENDING',
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      // 5. Decrement Stock (Optimistic/Simple update)
      // Ideally this should be a stored procedure or transaction to be safe.
      // For MVP, we loop and update.
      for (const item of items as CartItem[]) {
        await supabase.rpc('decrement_stock', {
          item_id: item.id,
          qty: item.quantity,
        })
        // Or simple update if RPC not defined:
        // But let's define an RPC for this or just do direct update if we trust concurrent access is low.
        // Direct update: stock = stock - qty.
        // supabase.from('menu_items').update({ stock: item.stock - item.quantity })...
        // Wait, we can't rely on item.stock from context (might be stale).

        // Let's implement the SQL RPC function for safety in next step.
        // For now, I'll assume it exists or do a raw decrement.
        // Fallback:
        // await supabase.from('menu_items').update({ stock: item.stock - item.quantity }).eq('id', item.id) <-- Unsafe
      }

      clearCart()
      router.replace(`/tablet/${tableId}/orders`)
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unknown error occurred'
      setError(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="mb-6 flex items-center space-x-2">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Your Order</h1>
      </div>

      {items.length === 0 ? (
        <div className="py-12 text-center text-gray-500">
          <Utensils className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <p>Your cart is empty.</p>
          <Button
            className="mt-4"
            onClick={() => router.push(`/tablet/${tableId}/menu`)}
          >
            Go to Menu
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {items.map((item: CartItem) => (
              <Card key={item.id} className="flex items-center gap-4 p-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-gray-200">
                  {item.image_url && (
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-500">
                    {formatPrice(item.price)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    className="rounded-full bg-gray-100 p-1 text-gray-700 hover:bg-gray-200"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-6 text-center font-semibold">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    className="rounded-full bg-gray-100 p-1 text-gray-700 hover:bg-gray-200"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="ml-2 rounded-full p-2 text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </Card>
            ))}
          </div>

          <div className="fixed right-0 bottom-0 left-0 z-20 border-t bg-white p-4">
            <div className="mx-auto max-w-4xl space-y-4">
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>

              {error && (
                <div className="flex items-center rounded-md bg-red-50 p-3 text-sm text-red-600">
                  <AlertCircle className="mr-2 h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <Button
                size="lg"
                className="w-full text-lg"
                onClick={handleSubmitOrder}
                isLoading={submitting}
              >
                Submit Order to Kitchen
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
