'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { AlertCircle } from 'lucide-react'

export default function TableAuth() {
  const [tableNumber, setTableNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleTableLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Check if user is logged in
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user)
        throw new Error(
          'Tablet not authenticated. Please login as a tablet user first.'
        )

      // Link table to this user via secure RPC
      // The RPC 'link_tablet_to_table' handles finding the table by number and updating the tablet_user_id
      // bypassing RLS for the 'tables' update operation.
      const { data: tableId, error: linkError } = await supabase.rpc(
        'link_tablet_to_table',
        { p_table_number: parseInt(tableNumber) }
      )

      if (linkError) throw linkError

      router.push(`/tablet/${tableId}`)
    } catch (err: unknown) {
      console.error(err)
      const message =
        err instanceof Error ? err.message : 'Failed to link table'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            Setup Tablet for Table
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTableLink} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="table-number" className="text-sm font-medium">
                Table Number
              </label>
              <Input
                id="table-number"
                type="number"
                placeholder="e.g. 5"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                required
              />
            </div>
            {/* Password field could be added for extra security if needed */}

            {error && (
              <div className="flex items-center rounded bg-red-50 p-2 text-sm text-red-600">
                <AlertCircle className="mr-2 h-4 w-4" />
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" isLoading={loading}>
              Link Tablet
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
