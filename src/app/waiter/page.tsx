'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { CheckSquare, RefreshCw, Clock, Users } from 'lucide-react'

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

type ActiveSession = Database['public']['Tables']['table_sessions']['Row'] & {
  table: Database['public']['Tables']['tables']['Row'] | null
}

export default function WaiterDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // 1. Fetch Ready Orders (from Kitchen)
      const { data: readyOrdersData, error: ordersError } = await supabase
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
        .eq('status', 'COMPLETED') // COMPLETED in kitchen = READY for waiter
        .order('created_at', { ascending: true })

      if (ordersError) throw ordersError

      // 2. Fetch Active Sessions (Tables)
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('table_sessions')
        .select(
          `
          *,
          table:tables!table_sessions_table_id_fkey (*)
        `
        )
        .in('status', ['ACTIVE', 'CHECKOUT_REQUESTED'])
        .order('seated_at', { ascending: true })

      if (sessionsError) throw sessionsError

      setOrders((readyOrdersData as unknown as Order[]) || [])
      setActiveSessions((sessionsData as unknown as ActiveSession[]) || [])
    } catch (err) {
      console.error('Waiter dashboard error:', err)
      const errorObj = err as { message?: string }
      setError(errorObj.message || 'Error loading dashboard data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()

    // Real-time subscriptions
    const channel = supabase
      .channel('waiter-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'table_sessions' },
        () => fetchData()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchData])

  const handleMarkServed = async (orderId: string) => {
    try {
      setError(null)
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'SERVED' })
        .eq('id', orderId)

      if (updateError) throw updateError

      // Also update items for consistency
      const { error: itemsError } = await supabase
        .from('order_items')
        .update({ status: 'SERVED' })
        .eq('order_id', orderId)

      if (itemsError) throw itemsError

      fetchData()
    } catch (err) {
      console.error('Error serving order:', err)
      const errorObj = err as { message?: string }
      setError(
        `Error al servir pedido: ${errorObj.message || 'Error desconocido'}`
      )
    }
  }

  if (loading && orders.length === 0 && activeSessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-gray-400">
        <RefreshCw className="mb-4 h-8 w-8 animate-spin" />
        <p>Loading Waiter Dashboard...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-20">
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* SECTION: READY TO SERVE */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-gray-900Condensed flex items-center gap-2 text-xl font-bold">
            <CheckSquare className="h-5 w-5 text-green-600" />
            Ready to Serve
            <Badge variant="success" className="ml-2">
              {orders.length}
            </Badge>
          </h2>
          <Button variant="ghost" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 py-8 text-center text-gray-400">
            No orders ready currently.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {orders.map((order) => (
              <Card
                key={order.id}
                className="transition-hover border-l-4 border-l-green-500 shadow-sm hover:shadow-md"
              >
                <CardHeader className="flex flex-row items-center justify-between bg-gray-50/50 pb-2">
                  <div>
                    <CardTitle className="text-xl font-black">
                      Table {order.session?.table?.table_number}
                    </CardTitle>
                    <p className="font-mono text-xs text-gray-500">
                      #{order.session?.alias}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 font-mono text-sm font-bold text-green-600">
                      <Clock className="h-3 w-3" />
                      {Math.floor(
                        (Date.now() -
                          new Date(order.created_at || '').getTime()) /
                          60000
                      )}
                      m
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="mb-4 space-y-2">
                    {order.order_items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between text-sm leading-tight"
                      >
                        <span className="font-bold text-gray-800">
                          {item.quantity}x{' '}
                          <span className="font-normal">
                            {item.menu_items?.name}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                  <Button
                    className="w-full bg-green-600 font-bold text-white shadow-sm hover:bg-green-700"
                    onClick={() => handleMarkServed(order.id)}
                  >
                    Mark as Served
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* SECTION: ACTIVE TABLES */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-gray-900Condensed flex items-center gap-2 text-xl font-bold">
            <Users className="h-5 w-5 text-indigo-600" />
            Active Services
            <Badge variant="secondary" className="ml-2">
              {activeSessions.length}
            </Badge>
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {activeSessions.map((session) => (
            <Card
              key={session.id}
              className="relative flex flex-col bg-white transition-all"
            >
              <div className="flex-1 p-4 text-center">
                <div className="mb-1 text-xs font-bold tracking-widest text-gray-400 uppercase">
                  Table
                </div>
                <div className="mb-1 text-3xl font-black text-gray-900">
                  {session.table?.table_number}
                </div>
                <div className="truncate px-2 font-mono text-[10px] text-gray-400">
                  {session.alias}
                </div>
              </div>
            </Card>
          ))}
          {activeSessions.length === 0 && (
            <div className="col-span-full py-8 text-center text-sm text-gray-400">
              No occupied tables.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
