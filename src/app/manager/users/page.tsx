'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Plus, AlertCircle, CheckCircle } from 'lucide-react'

export default function CreateUserPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('WAITER')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, role }),
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error || 'Failed to create user')

      setMessage({
        type: 'success',
        text: `User ${email} created successfully!`,
      })
      // Reset form
      setEmail('')
      setPassword('')
      setFullName('')
      setRole('WAITER')
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unknown error occurred'
      setMessage({ type: 'error', text: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New User</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 text-sm text-gray-500">
            Create a new account for staff members. They will be able to log in
            immediately.
          </div>

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@restauria.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="******"
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <select
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="WAITER">Waiter</option>
                <option value="KITCHEN">Kitchen Staff</option>
                <option value="MANAGER">Manager</option>
                <option value="TABLET">Tablet (Device)</option>
              </select>
            </div>

            {message && (
              <div
                className={`flex items-center rounded p-3 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
              >
                {message.type === 'success' ? (
                  <CheckCircle className="mr-2 h-4 w-4" />
                ) : (
                  <AlertCircle className="mr-2 h-4 w-4" />
                )}
                {message.text}
              </div>
            )}

            <Button type="submit" className="w-full" isLoading={loading}>
              <Plus className="mr-2 h-4 w-4" /> Create User
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
