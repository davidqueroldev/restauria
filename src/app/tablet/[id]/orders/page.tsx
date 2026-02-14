'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
  Loader2,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  Clock,
  ChefHat,
} from 'lucide-react'
import { Database } from '@/types/database.types'

type Order = Database['public']['Tables']['orders']['Row'] & {
  order_items: (Database['public']['Tables']['order_items']['Row'] & {
    menu_items: Database['public']['Tables']['menu_items']['Row']
  })[]
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(
    price
  )

export default function OrdersPage() {
  const { id: tableId } = useParams()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOrders = useCallback(async () => {
    try {
      // Get current session
      const { data: table } = await supabase
        .from('tables')
        .select('current_session_id')
        .eq('id', tableId)
        .single()
      if (!table?.current_session_id) return

      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(
          `
            *,
            order_items (
                *,
                menu_items (*)
            )
         `
        )
        .eq('session_id', table?.current_session_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders((ordersData as unknown as Order[]) || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [tableId])

  useEffect(() => {
    fetchOrders()
    const channel = supabase
      .channel('orders-update')
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
  }, [tableId, fetchOrders])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'IN_KITCHEN':
        return <ChefHat className="h-5 w-5 text-orange-500" />
      case 'READY':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'SERVED':
        return <CheckCircle2 className="h-5 w-5 text-gray-400" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_KITCHEN':
        return <Badge variant="secondary">Preparing</Badge>
      case 'READY':
        return <Badge variant="success">Ready to Serve</Badge>
      case 'SERVED':
        return <Badge variant="outline">Served</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading)
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-indigo-600" />
      </div>
    )

  return (
    <div className="space-y-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/tablet/${tableId}/menu`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Your Orders</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchOrders}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {orders.length === 0 ? (
        <div className="py-12 text-center text-gray-500">
          <p>No orders yet.</p>
          <Button
            className="mt-4"
            onClick={() => router.push(`/tablet/${tableId}/menu`)}
          >
            Back to Menu
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between bg-gray-50 py-3">
                <div className="flex items-center gap-2">
                  {getStatusIcon(order.status)}
                  <span className="font-semibold text-gray-700">
                    Order #{order.id.slice(0, 4)}
                  </span>
                </div>
                {getStatusBadge(order.status)}
              </CardHeader>
              <CardContent className="divide-y">
                {order.order_items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-100 text-sm font-bold text-gray-600">
                        {item.quantity}x
                      </div>
                      <span>{item.menu_items?.name || 'Item'}</span>
                    </div>
                    <span className="text-gray-600">
                      {formatPrice(
                        (item.unit_price || 0) * (item.quantity || 1)
                      )}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
