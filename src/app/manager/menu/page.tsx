'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { MenuCategory, MenuItem } from '@/types/menu'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Pencil, Plus, Utensils } from 'lucide-react'
import Image from 'next/image'

export default function ManagerMenuPage() {
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [addingToCategory, setAddingToCategory] = useState<string | null>(null)
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    stock: 0,
  })
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [creatingCategory, setCreatingCategory] = useState(false)

  const fetchMenu = useCallback(async () => {
    try {
      const { data: cats } = await supabase
        .from('menu_categories')
        .select('*')
        .order('sort_order', { ascending: true })
      const { data: items } = await supabase
        .from('menu_items')
        .select('*')
        .order('sort_order', { ascending: true })

      if (cats && items) {
        const menu: MenuCategory[] = cats.map((cat) => ({
          ...cat,
          items: items.filter((item) => item.category_id === cat.id),
        }))
        setCategories(menu)
      }
    } catch (error) {
      console.error('Error fetching menu:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMenu()
  }, [fetchMenu])

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return

    setCreatingCategory(true)
    try {
      const { error } = await supabase.from('menu_categories').insert({
        name: newCategoryName,
        sort_order: categories.length + 1,
        is_active: true,
      })

      if (error) throw error

      setNewCategoryName('')
      setShowCategoryForm(false)
      await fetchMenu()
    } catch (error: unknown) {
      console.error('Error creating category:', error)
      const message = error instanceof Error ? error.message : 'Unknown error'
      alert(`Error al crear categoría: ${message}`)
    } finally {
      setCreatingCategory(false)
    }
  }

  const handleAddItem = async (categoryId: string) => {
    if (!newItem.name || !newItem.price) {
      alert('Name and price are required')
      return
    }

    try {
      console.log('Attempting to add menu item:', {
        ...newItem,
        category_id: categoryId,
      })
      const { data, error } = await supabase
        .from('menu_items')
        .insert({
          category_id: categoryId,
          name: newItem.name,
          description: newItem.description,
          price: parseFloat(newItem.price),
          stock: newItem.stock,
          is_active: true,
          sort_order:
            (categories.find((c) => c.id === categoryId)?.items.length || 0) +
            1,
        })
        .select()

      if (error) {
        console.error('Database error adding item:', error)
        alert(`Error al añadir: ${error.message}`)
        return
      }

      console.log('Successfully added menu item:', data)
      setAddingToCategory(null)
      setNewItem({ name: '', description: '', price: '', stock: 0 })
      await fetchMenu()
    } catch (err: unknown) {
      console.error('Unexpected error adding item:', err)
      alert('Error inesperado al añadir el elemento')
    }
  }

  const updateItem = async (id: string, updates: Partial<MenuItem>) => {
    const { error } = await supabase
      .from('menu_items')
      .update(updates)
      .eq('id', id)
    if (error) {
      console.error('Error updating item:', error)
      alert('Error al actualizar item')
    } else {
      await fetchMenu()
    }
  }

  if (loading) return <div>Loading menu...</div>

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Menu Management</h1>
        <Button onClick={() => setShowCategoryForm(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </div>

      {showCategoryForm && (
        <Card className="border-2 border-indigo-200 bg-indigo-50">
          <CardContent className="flex items-end gap-4 p-4">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-bold text-indigo-700">
                Category Name
              </label>
              <Input
                placeholder="e.g. Drinks, Main Course..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCreateCategory}
                disabled={creatingCategory || !newCategoryName.trim()}
              >
                {creatingCategory ? 'Saving...' : 'Create Category'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowCategoryForm(false)
                  setNewCategoryName('')
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {categories.length === 0 && !showCategoryForm && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
          <Utensils className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900">
            No menu categories yet
          </h3>
          <p className="mb-6 text-gray-500">
            Start by creating your first category to add menu items.
          </p>
          <Button onClick={() => setShowCategoryForm(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create First Category
          </Button>
        </div>
      )}

      {categories.map((cat) => (
        <Card key={cat.id}>
          <CardHeader className="flex flex-row items-center justify-between bg-gray-50 py-3">
            <CardTitle className="text-lg">{cat.name}</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setAddingToCategory(addingToCategory === cat.id ? null : cat.id)
              }
            >
              <Plus className="mr-2 h-4 w-4" /> Add Item
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {addingToCategory === cat.id && (
              <div className="flex flex-wrap items-end gap-4 border-b border-indigo-100 bg-indigo-50 p-4">
                <div className="min-w-[200px] flex-1 space-y-1">
                  <label className="text-xs font-bold text-indigo-700">
                    Name
                  </label>
                  <Input
                    placeholder="Item Name"
                    value={newItem.name}
                    onChange={(e) =>
                      setNewItem({ ...newItem, name: e.target.value })
                    }
                  />
                </div>
                <div className="min-w-[200px] flex-1 space-y-1">
                  <label className="text-xs font-bold text-indigo-700">
                    Description
                  </label>
                  <Input
                    placeholder="Short description"
                    value={newItem.description}
                    onChange={(e) =>
                      setNewItem({ ...newItem, description: e.target.value })
                    }
                  />
                </div>
                <div className="w-24 space-y-1">
                  <label className="text-xs font-bold text-indigo-700">
                    Price
                  </label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={newItem.price}
                    onChange={(e) =>
                      setNewItem({ ...newItem, price: e.target.value })
                    }
                  />
                </div>
                <div className="w-24 space-y-1">
                  <label className="text-xs font-bold text-indigo-700">
                    Stock
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={newItem.stock}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        stock: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleAddItem(cat.id)}>
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setAddingToCategory(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
            <div className="divide-y">
              {cat.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 transition-colors hover:bg-gray-50"
                >
                  <div className="flex flex-1 items-center gap-4">
                    <div className="relative h-12 w-12 overflow-hidden rounded bg-gray-200">
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
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {item.name}
                        </h3>
                        {!item.is_active && (
                          <Badge variant="outline" className="text-gray-400">
                            Archived
                          </Badge>
                        )}
                      </div>
                      <p className="line-clamp-1 text-sm text-gray-500">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Stock:</span>
                      <Input
                        type="number"
                        className="h-8 w-20"
                        defaultValue={item.stock}
                        onBlur={(e) =>
                          updateItem(item.id, {
                            stock: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Active:</span>
                      <input
                        type="checkbox"
                        checked={item.is_active || false}
                        onChange={(e) =>
                          updateItem(item.id, { is_active: e.target.checked })
                        }
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                      />
                    </div>
                    <Button variant="ghost" size="sm">
                      <Pencil className="h-4 w-4 text-gray-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
