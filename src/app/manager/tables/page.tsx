'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Database } from '@/types/database.types'
import { QrCode, Plus, MonitorSmartphone } from 'lucide-react'

type Table = Database['public']['Tables']['tables']['Row']

export default function ManagerTablesPage() {
  const [tables, setTables] = useState<Table[]>([])
  const [tabletUsers, setTabletUsers] = useState<
    { id: string; email: string; full_name: string }[]
  >([])
  const [loading, setLoading] = useState(true)

  const fetchTables = useCallback(async () => {
    const { data: tablesData } = await supabase
      .from('tables')
      .select('*')
      .order('table_number', { ascending: true })
    setTables(tablesData || [])

    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('role', 'TABLET')

    // Since we need email from auth.users which we can't join easily in client,
    // we just use the profiles for now. In a real app we'd have a specific RPC or API.
    setTabletUsers(
      (profilesData as {
        id: string
        email: string
        full_name: string
        role: string
      }[]) || []
    )
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchTables()
  }, [fetchTables])

  const handleCreateTable = async () => {
    try {
      // Create next table number
      const nextNum =
        tables.length > 0
          ? Math.max(...tables.map((t) => t.table_number)) + 1
          : 1

      const { error } = await supabase
        .from('tables')
        .insert({ table_number: nextNum, capacity: 4, status: 'FREE' })

      if (error) {
        console.error('Error creating table:', error)
        alert(`Error al crear mesa: ${error.message}`)
      } else {
        await fetchTables()
      }
    } catch (err) {
      console.error('Unexpected error creating table:', err)
      alert('Error inesperado al crear la mesa')
    }
  }

  const handleResetTable = async (id: string, sessionId: string | null) => {
    if (
      !confirm(
        'Are you sure you want to reset this table? Current session will be closed.'
      )
    )
      return

    if (sessionId) {
      await supabase
        .from('table_sessions')
        .update({ status: 'CLOSED', end_time: new Date().toISOString() })
        .eq('id', sessionId)
    }

    await supabase
      .from('tables')
      .update({ status: 'FREE', current_session_id: null })
      .eq('id', id)
    fetchTables()
  }

  const handleAssignTablet = async (
    tableId: string,
    tabletUserId: string | null
  ) => {
    try {
      const { error } = await supabase
        .from('tables')
        .update({ tablet_user_id: tabletUserId || null })
        .eq('id', tableId)

      if (error) throw error
      await fetchTables()
    } catch (err: unknown) {
      console.error('Error assigning tablet:', err)
      const message = err instanceof Error ? err.message : 'Error desconocido'
      alert(`Error al asignar tablet: ${message}`)
    }
  }

  if (loading) return <div>Loading tables...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tables Management</h1>
        <Button onClick={handleCreateTable}>
          <Plus className="mr-2 h-4 w-4" /> Add Table
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {tables.map((table) => (
          <Card key={table.id} className="relative">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-xl">
                  Table {table.table_number}
                </CardTitle>
                <Badge
                  variant={
                    table.status === 'OCCUPIED' ? 'secondary' : 'outline'
                  }
                >
                  {table.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <MonitorSmartphone className="h-4 w-4 text-gray-500" />
                    Tablet Assignment
                  </div>
                  <select
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
                    value={table.tablet_user_id || ''}
                    onChange={(e) =>
                      handleAssignTablet(table.id, e.target.value || null)
                    }
                  >
                    <option value="">No Tablet Assigned</option>
                    {tabletUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name || u.email || 'Tablet Device'}
                      </option>
                    ))}
                  </select>
                </div>

                {table.status === 'OCCUPIED' && (
                  <Button
                    variant="danger"
                    size="sm"
                    className="w-full"
                    onClick={() =>
                      handleResetTable(table.id, table.current_session_id)
                    }
                  >
                    Force Free / Reset
                  </Button>
                )}

                {table.status === 'FREE' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full bg-indigo-50 text-indigo-600"
                  >
                    <QrCode className="mr-2 h-4 w-4" />
                    Generate QR
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
