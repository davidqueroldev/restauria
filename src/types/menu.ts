import { Database } from '@/types/database.types'

export type MenuItem = Database['public']['Tables']['menu_items']['Row']
export type MenuCategory =
  Database['public']['Tables']['menu_categories']['Row'] & {
    items: MenuItem[]
  }
