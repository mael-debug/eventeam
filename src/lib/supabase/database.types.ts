export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          account_id: string | null
          action: string
          created_at: string
          id: number
          metadata: Json | null
          target_count: number | null
          user_id: string | null
        }
        Insert: {
          account_id?: string | null
          action: string
          created_at?: string
          id?: number
          metadata?: Json | null
          target_count?: number | null
          user_id?: string | null
        }
        Update: {
          account_id?: string | null
          action?: string
          created_at?: string
          id?: number
          metadata?: Json | null
          target_count?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_members: {
        Row: {
          brand_id: string
          can_view_identities: boolean
          created_at: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Insert: {
          brand_id: string
          can_view_identities?: boolean
          created_at?: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Update: {
          brand_id?: string
          can_view_identities?: boolean
          created_at?: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_members_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          created_at: string
          id: string
          name: string
          org_id: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          org_id: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          org_id?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "brands_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      instagram_accounts: {
        Row: {
          brand_id: string
          created_at: string
          display_name: string | null
          handle: string
          id: string
          ig_fbid: string | null
          import_cadence: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          display_name?: string | null
          handle: string
          id?: string
          ig_fbid?: string | null
          import_cadence?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          display_name?: string | null
          handle?: string
          id?: string
          ig_fbid?: string | null
          import_cadence?: string
        }
        Relationships: [
          {
            foreignKeyName: "instagram_accounts_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          org_id: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          org_id: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          org_id?: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage_org: { Args: { p_org: string }; Returns: boolean }
      can_write: { Args: { p_brand: string }; Returns: boolean }
      can_write_account: { Args: { p_account: string }; Returns: boolean }
      create_organization: {
        Args: { p_name: string; p_slug: string }
        Returns: {
          created_at: string
          id: string
          name: string
          slug: string
        }
      }
      is_platform_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
      reveal_usernames: {
        Args: { p_account: string; p_ids: number[] }
        Returns: {
          profile_id: number
          username: string
        }[]
      }
      user_account_ids: { Args: Record<PropertyKey, never>; Returns: string[] }
      user_brand_ids: { Args: Record<PropertyKey, never>; Returns: string[] }
      user_org_ids: { Args: Record<PropertyKey, never>; Returns: string[] }
    }
    Enums: {
      member_role:
        | "platform_admin"
        | "agency_admin"
        | "agency_member"
        | "brand_viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database["public"]

export type Tables<
  T extends keyof DefaultSchema["Tables"],
> = DefaultSchema["Tables"][T]["Row"]

export type TablesInsert<
  T extends keyof DefaultSchema["Tables"],
> = DefaultSchema["Tables"][T]["Insert"]

export type TablesUpdate<
  T extends keyof DefaultSchema["Tables"],
> = DefaultSchema["Tables"][T]["Update"]

export type Enums<T extends keyof DefaultSchema["Enums"]> = DefaultSchema["Enums"][T]
