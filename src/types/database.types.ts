export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.1'
  }
  public: {
    Tables: {
      menu_categories: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          allergens: string[] | null
          category_id: string
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          price: number
          sort_order: number
          stock: number
        }
        Insert: {
          allergens?: string[] | null
          category_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          price: number
          sort_order?: number
          stock?: number
        }
        Update: {
          allergens?: string[] | null
          category_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          price?: number
          sort_order?: number
          stock?: number
        }
        Relationships: [
          {
            foreignKeyName: 'menu_items_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'menu_categories'
            referencedColumns: ['id']
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          menu_item_id: string
          order_id: string
          quantity: number
          status: Database['public']['Enums']['order_item_status']
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          menu_item_id: string
          order_id: string
          quantity?: number
          status?: Database['public']['Enums']['order_item_status']
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          menu_item_id?: string
          order_id?: string
          quantity?: number
          status?: Database['public']['Enums']['order_item_status']
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'order_items_menu_item_id_fkey'
            columns: ['menu_item_id']
            isOneToOne: false
            referencedRelation: 'menu_items'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'order_items_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
        ]
      }
      orders: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          session_id: string
          status: Database['public']['Enums']['order_status']
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          session_id: string
          status?: Database['public']['Enums']['order_status']
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          session_id?: string
          status?: Database['public']['Enums']['order_status']
        }
        Relationships: [
          {
            foreignKeyName: 'orders_session_id_fkey'
            columns: ['session_id']
            isOneToOne: false
            referencedRelation: 'table_sessions'
            referencedColumns: ['id']
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          confirmed_at: string | null
          confirmed_by_user_id: string | null
          created_at: string | null
          id: string
          session_id: string
          status: Database['public']['Enums']['payment_status']
        }
        Insert: {
          amount?: number
          confirmed_at?: string | null
          confirmed_by_user_id?: string | null
          created_at?: string | null
          id?: string
          session_id: string
          status?: Database['public']['Enums']['payment_status']
        }
        Update: {
          amount?: number
          confirmed_at?: string | null
          confirmed_by_user_id?: string | null
          created_at?: string | null
          id?: string
          session_id?: string
          status?: Database['public']['Enums']['payment_status']
        }
        Relationships: [
          {
            foreignKeyName: 'payments_session_id_fkey'
            columns: ['session_id']
            isOneToOne: false
            referencedRelation: 'table_sessions'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          role: Database['public']['Enums']['user_role']
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          role?: Database['public']['Enums']['user_role']
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          role?: Database['public']['Enums']['user_role']
          updated_at?: string | null
        }
        Relationships: []
      }
      restaurant_settings: {
        Row: {
          created_at: string | null
          currency: string
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      table_sessions: {
        Row: {
          alias: string
          checkout_requested_at: string | null
          closed_at: string | null
          id: string
          seated_at: string | null
          status: Database['public']['Enums']['session_status']
          table_id: string
        }
        Insert: {
          alias: string
          checkout_requested_at?: string | null
          closed_at?: string | null
          id?: string
          seated_at?: string | null
          status?: Database['public']['Enums']['session_status']
          table_id: string
        }
        Update: {
          alias?: string
          checkout_requested_at?: string | null
          closed_at?: string | null
          id?: string
          seated_at?: string | null
          status?: Database['public']['Enums']['session_status']
          table_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'table_sessions_table_id_fkey'
            columns: ['table_id']
            isOneToOne: false
            referencedRelation: 'tables'
            referencedColumns: ['id']
          },
        ]
      }
      tables: {
        Row: {
          created_at: string | null
          current_session_id: string | null
          id: string
          status: Database['public']['Enums']['table_status']
          table_number: number
          tablet_user_id: string | null
        }
        Insert: {
          created_at?: string | null
          current_session_id?: string | null
          id?: string
          status?: Database['public']['Enums']['table_status']
          table_number: number
          tablet_user_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_session_id?: string | null
          id?: string
          status?: Database['public']['Enums']['table_status']
          table_number?: number
          tablet_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'tables_current_session_id_fkey'
            columns: ['current_session_id']
            isOneToOne: false
            referencedRelation: 'table_sessions'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_role: {
        Args: never
        Returns: Database['public']['Enums']['user_role']
      }
    }
    Enums: {
      order_item_status:
        | 'PENDING'
        | 'IN_PREP'
        | 'DISPATCHED'
        | 'SERVED'
        | 'CANCELLED'
      order_status: 'IN_KITCHEN' | 'COMPLETED' | 'CANCELLED'
      payment_status: 'REQUESTED' | 'CONFIRMED'
      session_status: 'ACTIVE' | 'CHECKOUT_REQUESTED' | 'CLOSED'
      table_status: 'FREE' | 'OCCUPIED'
      user_role: 'MANAGER' | 'KITCHEN' | 'WAITER' | 'TABLET'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      order_item_status: [
        'PENDING',
        'IN_PREP',
        'DISPATCHED',
        'SERVED',
        'CANCELLED',
      ],
      order_status: ['IN_KITCHEN', 'COMPLETED', 'CANCELLED'],
      payment_status: ['REQUESTED', 'CONFIRMED'],
      session_status: ['ACTIVE', 'CHECKOUT_REQUESTED', 'CLOSED'],
      table_status: ['FREE', 'OCCUPIED'],
      user_role: ['MANAGER', 'KITCHEN', 'WAITER', 'TABLET'],
    },
  },
} as const
