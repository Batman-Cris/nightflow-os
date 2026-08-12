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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      cash_entries: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: string
          note: string | null
          session_id: string
          time: string
          type: string
          user: string
        }
        Insert: {
          amount: number
          created_at?: string
          id: string
          method: string
          note?: string | null
          session_id: string
          time: string
          type: string
          user: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: string
          note?: string | null
          session_id?: string
          time?: string
          type?: string
          user?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_entries_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cash_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_sessions: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          counted_cash: number | null
          created_at: string
          id: string
          opened_at: string | null
          opened_by: string | null
          opening_float: number
          status: string
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          counted_cash?: number | null
          created_at?: string
          id: string
          opened_at?: string | null
          opened_by?: string | null
          opening_float?: number
          status: string
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          counted_cash?: number | null
          created_at?: string
          id?: string
          opened_at?: string | null
          opened_by?: string | null
          opening_float?: number
          status?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          cost: number
          id: string
          min_stock: number
          name: string
          price: number
          sold: number
          stock: number
          supplier: string
        }
        Insert: {
          category: string
          cost?: number
          id: string
          min_stock?: number
          name: string
          price?: number
          sold?: number
          stock?: number
          supplier: string
        }
        Update: {
          category?: string
          cost?: number
          id?: string
          min_stock?: number
          name?: string
          price?: number
          sold?: number
          stock?: number
          supplier?: string
        }
        Relationships: []
      }
      purchase_order_lines: {
        Row: {
          id: number
          order_id: string
          product_id: string
          qty: number
          unit_cost: number
        }
        Insert: {
          id?: never
          order_id: string
          product_id: string
          qty: number
          unit_cost: number
        }
        Update: {
          id?: never
          order_id?: string
          product_id?: string
          qty?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_lines_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string
          id: string
          received_at: string | null
          reference: string
          status: string
          supplier: string
        }
        Insert: {
          created_at: string
          id: string
          received_at?: string | null
          reference: string
          status: string
          supplier: string
        }
        Update: {
          created_at?: string
          id?: string
          received_at?: string | null
          reference?: string
          status?: string
          supplier?: string
        }
        Relationships: []
      }
      recipe_ingredients: {
        Row: {
          id: number
          product_id: string
          qty: number
          recipe_id: string
          unit: string
        }
        Insert: {
          id?: never
          product_id: string
          qty: number
          recipe_id: string
          unit: string
        }
        Update: {
          id?: never
          product_id?: string
          qty?: number
          recipe_id?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          id: string
          product_id: string
        }
        Insert: {
          id: string
          product_id: string
        }
        Update: {
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          cashier: string
          channel: string
          created_at: string
          id: string
          items: number
          method: string
          time: string
          total: number
        }
        Insert: {
          cashier: string
          channel: string
          created_at?: string
          id: string
          items: number
          method: string
          time: string
          total: number
        }
        Update: {
          cashier?: string
          channel?: string
          created_at?: string
          id?: string
          items?: number
          method?: string
          time?: string
          total?: number
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          created_at: string
          id: string
          item: string
          qty: number
          time: string
          type: string
          user: string
        }
        Insert: {
          created_at?: string
          id: string
          item: string
          qty: number
          time: string
          type: string
          user: string
        }
        Update: {
          created_at?: string
          id?: string
          item?: string
          qty?: number
          time?: string
          type?: string
          user?: string
        }
        Relationships: []
      }
      tickets: {
        Row: {
          checked_in_at: string | null
          checked_in_door: string | null
          code: string
          email: string
          event: string
          holder: string
          id: string
          price: number
          purchased_at: string
          status: string
          tier: string
        }
        Insert: {
          checked_in_at?: string | null
          checked_in_door?: string | null
          code: string
          email: string
          event: string
          holder: string
          id: string
          price?: number
          purchased_at: string
          status: string
          tier: string
        }
        Update: {
          checked_in_at?: string | null
          checked_in_door?: string | null
          code?: string
          email?: string
          event?: string
          holder?: string
          id?: string
          price?: number
          purchased_at?: string
          status?: string
          tier?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
