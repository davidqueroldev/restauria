'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Clock, CheckCircle2 } from 'lucide-react'
import { clsx } from 'clsx'

// Types
type Order = Database['public']['Tables']['orders']['Row'] & {
  session:
    | (Database['public']['Tables']['table_sessions']['Row'] & {
        table: Database['public']['Tables']['tables']['Row']
      })
    | null
  order_items: (Database['public']['Tables']['order_items']['Row'] & {
    menu_items: Database['public']['Tables']['menu_items']['Row'] | null
  })[]
}

type OrderItem = Order['order_items'][0]

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = async () => {
    try {
      setError(null)
      const { data, error: supabaseError } = await supabase
        .from('orders')
        .select(
          `
          *,
          session:table_sessions (
            *,
            table:tables!table_sessions_table_id_fkey (*)
          ),
          order_items (
            *,
            menu_items (*)
          )
        `
        )
        .eq('status', 'IN_KITCHEN') // Only show active kitchen orders
        .order('created_at', { ascending: true }) // Oldest first (FIFO)

      if (supabaseError) throw supabaseError
      console.log('Fetched orders:', data)
      setOrders(data || [])
    } catch (err) {
      console.error('Error fetching kitchen orders:', err)

      // Safe type narrowing for Supabase/Postgrest errors
      const errorObj = err as { message?: string; details?: string }
      const message =
        errorObj.message ||
        (typeof err === 'string' ? err : 'An unexpected error occurred')
      const details = errorObj.details ? ` (${errorObj.details})` : ''

      setError(`${message}${details}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()

    const channel = supabase
      .channel('kitchen-view')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => fetchOrders()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_items' },
        () => fetchOrders()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleMarkItemReady = async (
    itemId: string,
    orderId: string,
    allItems: OrderItem[]
  ) => {
    try {
      setError(null)
      // 1. Update item status to DISPATCHED
      const { error: itemError } = await supabase
        .from('order_items')
        .update({ status: 'DISPATCHED' })
        .eq('id', itemId)

      if (itemError) throw itemError

      // 2. Optimistic check for remaining items
      const remainingItems = allItems.filter(
        (i) =>
          i.id !== itemId &&
          i.status !== 'DISPATCHED' &&
          i.status !== 'SERVED' &&
          i.status !== 'CANCELLED'
      )

      if (remainingItems.length === 0) {
        const { error: orderError } = await supabase
          .from('orders')
          .update({ status: 'COMPLETED' })
          .eq('id', orderId)

        if (orderError) throw orderError
      }
    } catch (err) {
      console.error('Failed to update item:', err)
      const errorObj = err as { message?: string }
      setError(`Failed to update: ${errorObj.message || 'Unknown error'}`)
    }
  }

  const handleMarkOrderReady = async (orderId: string) => {
    try {
      setError(null)
      const { error: itemsError } = await supabase
        .from('order_items')
        .update({ status: 'DISPATCHED' })
        .eq('order_id', orderId)

      if (itemsError) throw itemsError

      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'COMPLETED' })
        .eq('id', orderId)

      if (orderError) throw orderError
    } catch (err) {
      console.error('Failed to complete order:', err)
      const errorObj = err as { message?: string }
      setError(
        `Failed to complete order: ${errorObj.message || 'Unknown error'}`
      )
    }
  }

  if (loading) return <div className="p-8 text-white">Loading orders...</div>

  if (error)
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 rounded-lg border border-red-900/50 bg-red-900/20 p-4 text-red-400">
          <p className="font-bold">Error loading orders</p>
          <p className="text-sm opacity-80">{error}</p>
        </div>
        <Button onClick={() => fetchOrders()}>Try Again</Button>
      </div>
    )

  return (
    <div className="grid grid-cols-1 gap-4 pb-20 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {orders.length === 0 && (
        <div className="col-span-full flex min-h-[50vh] flex-col items-center justify-center text-gray-500">
          <CheckCircle2 className="mb-4 h-16 w-16 text-green-500 opacity-20" />
          <p className="text-xl font-medium text-gray-400">
            All caught up! No active orders.
          </p>
        </div>
      )}

      {orders.map((order) => {
        // Calculate time elapsed
        const created = order.created_at
          ? new Date(order.created_at).getTime()
          : Date.now()
        const elapsed = Math.floor((Date.now() - created) / 60000)
        const isLate = elapsed > 15 // Highlight if waiting > 15 mins

        return (
          <Card
            key={order.id}
            className={clsx(
              'flex flex-col overflow-hidden border-2',
              isLate
                ? 'border-red-500 bg-red-900/10'
                : 'border-gray-700 bg-gray-800'
            )}
          >
            <CardHeader
              className={clsx(
                'px-4 py-3 text-white',
                isLate ? 'bg-red-900/50' : 'bg-gray-700'
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">
                    Table {order.session?.table?.table_number}
                  </CardTitle>
                  <p className="text-sm text-gray-300 opacity-80">
                    #{order.session?.alias}
                  </p>
                </div>
                <div className="text-right">
                  <div
                    className={clsx(
                      'flex items-center font-mono font-bold',
                      isLate ? 'text-red-300' : 'text-gray-300'
                    )}
                  >
                    <Clock className="mr-1 h-4 w-4" />
                    {elapsed}m
                  </div>
                  <span className="text-xs text-gray-400">
                    #{order.id.slice(0, 4)}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col p-0">
              <div className="flex-1 divide-y divide-gray-700">
                {order.order_items.map((item) => {
                  const isReady =
                    item.status === 'DISPATCHED' || item.status === 'SERVED'
                  return (
                    <div
                      key={item.id}
                      className={clsx(
                        'flex items-center justify-between p-3 transition-colors',
                        isReady
                          ? 'bg-green-900/20 opacity-50'
                          : 'hover:bg-gray-700/50'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="min-w-8 rounded bg-gray-700 px-2 py-1 text-center text-sm font-bold text-white">
                          {item.quantity}
                        </span>
                        <span
                          className={clsx(
                            'font-medium text-white',
                            isReady && 'text-gray-400 line-through'
                          )}
                        >
                          {item.menu_items?.name}
                        </span>
                      </div>
                      {!isReady && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 rounded-full p-0 text-green-400 hover:bg-green-900/30 hover:text-green-300"
                          onClick={() =>
                            handleMarkItemReady(
                              item.id,
                              order.id,
                              order.order_items
                            )
                          }
                        >
                          <CheckCircle2 className="h-5 w-5" />
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="mt-auto border-t border-gray-700 bg-gray-800/50 p-3">
                <Button
                  className="w-full bg-green-600 text-white hover:bg-green-700"
                  onClick={() => handleMarkOrderReady(order.id)}
                >
                  Complete Order
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
