'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Users, ArrowRight, Loader2 } from 'lucide-react'
import { Database } from '@/types/database.types'

type TableSession = Database['public']['Tables']['table_sessions']['Row']
type Table = Database['public']['Tables']['tables']['Row']

export default function TablePage() {
  const params = useParams()
  const router = useRouter()
  const tableId = params.id as string

  const [loading, setLoading] = useState(true)
  const [table, setTable] = useState<Table | null>(null)
  const [activeSession, setActiveSession] = useState<TableSession | null>(null)
  const [alias, setAlias] = useState('')
  const [creatingSession, setCreatingSession] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTableData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let tableData: Table | null = null

      // Check if tableId is a UUID
      const isUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          tableId
        )

      if (isUUID) {
        const { data, error: tableError } = await supabase
          .from('tables')
          .select('*')
          .eq('id', tableId)
          .single()

        if (tableError) throw tableError
        tableData = data
      } else {
        // Try lookup by table_number
        const tableNum = parseInt(tableId)
        if (!isNaN(tableNum)) {
          const { data, error: tableError } = await supabase
            .from('tables')
            .select('*')
            .eq('table_number', tableNum)
            .single()

          if (!tableError && data) {
            // Redirect to the proper UUID path
            router.replace(`/tablet/${data.id}`)
            return
          }
        }
        throw new Error('Invalid table ID or number')
      }

      setTable(tableData)

      if (
        tableData &&
        tableData.status === 'OCCUPIED' &&
        tableData.current_session_id
      ) {
        const { data: sessionData, error: sessionError } = await supabase
          .from('table_sessions')
          .select('*')
          .eq('id', tableData.current_session_id)
          .single()

        if (sessionError && sessionError.code !== 'PGRST116') {
          // Ignore not found if sync issue
          console.error(sessionError)
        }
        setActiveSession(sessionData)
      } else {
        setActiveSession(null)
      }
    } catch (err: unknown) {
      setError('Failed to load table data.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [tableId, router])

  useEffect(() => {
    fetchTableData()

    // Realtime subscription for table updates (remote session close)
    const channel = supabase
      .channel(`table-${tableId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tables',
          filter: `id=eq.${tableId}`,
        },
        () => fetchTableData()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tableId, fetchTableData])

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!alias.trim()) return
    setCreatingSession(true)
    setError(null)

    try {
      // 1. Create active session
      const { data: session, error: createError } = await supabase
        .from('table_sessions')
        .insert({
          table_id: tableId,
          alias: alias,
          status: 'ACTIVE',
        })
        .select()
        .single()

      if (createError) throw createError

      // 2. Update table to OCCUPIED and link session
      const { error: updateError } = await supabase
        .from('tables')
        .update({
          status: 'OCCUPIED',
          current_session_id: session.id,
        })
        .eq('id', tableId)

      if (updateError) throw updateError

      // Redirect to menu
      router.push(`/tablet/${tableId}/menu`)
    } catch (err: unknown) {
      setError(
        (err as { message?: string })?.message || 'Failed to start session'
      )
      setCreatingSession(false)
    }
  }

  const handleResumeSession = () => {
    router.push(`/tablet/${tableId}/menu`)
  }

  if (loading)
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )

  if (!table)
    return <div className="p-8 text-center text-red-600">Table not found</div>

  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      {activeSession ? (
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="flex flex-col items-center gap-2 text-2xl font-bold">
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700">
                Table {table.table_number}
              </span>
              <span>Welcome Back, {activeSession.alias}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-gray-500">Your session is active.</div>
            <Button size="lg" className="w-full" onClick={handleResumeSession}>
              Order Now <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-fit rounded-full bg-indigo-100 p-3">
              <Users className="h-8 w-8 text-indigo-600" />
            </div>
            <CardTitle className="text-2xl">
              Start Your Meal at Table {table.table_number}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleStartSession} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="alias"
                  className="text-sm font-medium text-gray-700"
                >
                  What is your name or group name?
                </label>
                <Input
                  id="alias"
                  placeholder="e.g. The Smiths, John"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              {error && (
                <p className="rounded bg-red-50 p-2 text-sm text-red-600">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={creatingSession}
              >
                Start Ordering
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
