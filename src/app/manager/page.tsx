'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database.types'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  Users,
  ShoppingBag,
  Utensils,
  DollarSign,
  LucideIcon,
  Receipt,
  RefreshCw,
} from 'lucide-react'
import { clsx } from 'clsx'

type OrderItem = {
  unit_price: number | null
  quantity: number | null
}

type SessionOrder = {
  id: string
  status: string
  order_items: OrderItem[]
}

type ActiveSession = Database['public']['Tables']['table_sessions']['Row'] & {
  table: Database['public']['Tables']['tables']['Row'] | null
  orders: SessionOrder[]
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(
    price
  )

const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string
  value: string | number
  icon: LucideIcon
  color: string
}) => {
  return (
    <Card>
      <CardContent className="flex items-center p-6">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-full ${color} text-white`}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ManagerDashboard() {
  const [stats, setStats] = useState({
    activeTables: 0,
    totalOrdersToday: 0,
    revenueToday: 0,
    kitchenQueue: 0,
  })
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setError(null)

      // 1. Active Tables
      const { count: activeTables } = await supabase
        .from('tables')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'OCCUPIED')

      // 2. Orders Today
      const today = new Date().toISOString().split('T')[0]
      const { data: orders } = await supabase
        .from('orders')
        .select('status')
        .gte('created_at', today)

      const totalOrdersToday = orders?.length || 0

      // 3. Kitchen Queue
      const { count: kitchenQueue } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'IN_KITCHEN')

      // 4. Revenue Today — sum from PAID order items
      const { data: revenueData } = await supabase
        .from('order_items')
        .select(
          `
          unit_price,
          quantity,
          orders!inner (
            status,
            created_at
          )
        `
        )
        .eq('orders.status', 'PAID')
        .gte('orders.created_at', today)

      const revenueToday =
        revenueData?.reduce((sum, item) => {
          return sum + (item.unit_price || 0) * (item.quantity || 1)
        }, 0) || 0

      // 5. Active Sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('table_sessions')
        .select(
          `
          *,
          table:tables!table_sessions_table_id_fkey (*),
          orders (
            id,
            status,
            order_items (
              unit_price,
              quantity
            )
          )
        `
        )
        .in('status', ['ACTIVE', 'CHECKOUT_REQUESTED'])
        .order('seated_at', { ascending: true })

      if (sessionsError) throw sessionsError

      setStats({
        activeTables: activeTables || 0,
        totalOrdersToday,
        revenueToday,
        kitchenQueue: kitchenQueue || 0,
      })
      setActiveSessions((sessionsData as unknown as ActiveSession[]) || [])
    } catch (err) {
      console.error('Manager dashboard error:', err)
      const errorObj = err as { message?: string }
      setError(errorObj.message || 'Error loading dashboard')
    }
  }, [])

  useEffect(() => {
    fetchData()

    // Real-time subscriptions
    const channel = supabase
      .channel('manager-changes')
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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tables' },
        () => fetchData()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchData])

  const handleCheckout = async (session: ActiveSession) => {
    if (
      !confirm(`¿Cerrar cuenta y liberar mesa ${session.table?.table_number}?`)
    )
      return

    try {
      setLoading(true)
      setError(null)

      // 1. Mark all session orders as PAID
      const { error: ordersError } = await supabase
        .from('orders')
        .update({ status: 'PAID' })
        .eq('session_id', session.id)

      if (ordersError) throw ordersError

      // 2. Close the session
      const { error: sessionError } = await supabase
        .from('table_sessions')
        .update({
          status: 'CLOSED',
          closed_at: new Date().toISOString(),
        })
        .eq('id', session.id)

      if (sessionError) throw sessionError

      // 3. Free the table
      if (session.table_id) {
        const { error: tableError } = await supabase
          .from('tables')
          .update({
            status: 'FREE',
            current_session_id: null,
          })
          .eq('id', session.table_id)

        if (tableError) throw tableError
      }

      await fetchData()
    } catch (err) {
      console.error('Error during checkout:', err)
      const errorObj = err as { message?: string }
      setError(
        `Error al procesar pago: ${errorObj.message || 'Error desconocido'}`
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Button variant="ghost" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Tables"
          value={stats.activeTables}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="Orders Today"
          value={stats.totalOrdersToday}
          icon={ShoppingBag}
          color="bg-indigo-500"
        />
        <StatCard
          title="Kitchen Queue"
          value={stats.kitchenQueue}
          icon={Utensils}
          color="bg-orange-500"
        />
        <StatCard
          title="Revenue Today"
          value={formatPrice(stats.revenueToday)}
          icon={DollarSign}
          color="bg-green-500"
        />
      </div>

      {/* SECTION: ACTIVE TABLES — Payment */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <Users className="h-5 w-5 text-indigo-600" />
            Active Tables
            <Badge variant="secondary" className="ml-2">
              {activeSessions.length}
            </Badge>
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {activeSessions.map((session) => {
            const isCheckout = session.status === 'CHECKOUT_REQUESTED'
            return (
              <Card
                key={session.id}
                className={clsx(
                  'relative flex flex-col transition-all',
                  isCheckout ? 'border-amber-400 bg-amber-50' : 'bg-white'
                )}
              >
                <div className="flex-1 p-4 text-center">
                  <div className="mb-1 text-xs font-bold tracking-widest text-gray-400 uppercase">
                    Table
                  </div>
                  <div
                    className={clsx(
                      'mb-1 text-3xl font-black',
                      isCheckout ? 'text-amber-700' : 'text-gray-900'
                    )}
                  >
                    {session.table?.table_number}
                  </div>
                  <div className="truncate px-2 font-mono text-[10px] text-gray-400">
                    {session.alias}
                  </div>
                  <div className="mt-2 text-lg font-bold text-gray-900">
                    {formatPrice(
                      (session.orders || []).reduce(
                        (total, order) =>
                          total +
                          (order.order_items || []).reduce(
                            (sum, item) =>
                              sum +
                              (item.unit_price || 0) * (item.quantity || 1),
                            0
                          ),
                        0
                      )
                    )}
                  </div>

                  {isCheckout && (
                    <div className="flex animate-pulse items-center justify-center gap-1 text-amber-600">
                      <Receipt className="h-3 w-3" />
                      <span className="text-[10px] font-bold uppercase">
                        Bill Requested
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-2 pt-0">
                  <Button
                    variant={isCheckout ? 'primary' : 'outline'}
                    size="sm"
                    className={clsx(
                      'h-8 w-full text-[10px] font-bold uppercase',
                      isCheckout
                        ? 'bg-amber-600 text-white hover:bg-amber-700'
                        : 'text-gray-500'
                    )}
                    onClick={() => handleCheckout(session)}
                    disabled={loading}
                  >
                    Procesar Pago
                  </Button>
                </div>
              </Card>
            )
          })}
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
