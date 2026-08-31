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
      audience_activity: {
        Row: { account_id: string; active_count: number; import_id: string; weekday: number }
        Insert: { account_id: string; active_count: number; import_id: string; weekday: number }
        Update: { account_id?: string; active_count?: number; import_id?: string; weekday?: number }
        Relationships: [
          { foreignKeyName: "audience_activity_account_id_fkey"; columns: ["account_id"]; isOneToOne: false; referencedRelation: "instagram_accounts"; referencedColumns: ["id"] },
          { foreignKeyName: "audience_activity_import_id_fkey"; columns: ["import_id"]; isOneToOne: false; referencedRelation: "imports"; referencedColumns: ["id"] },
        ]
      }
      audience_age: {
        Row: { account_id: string; age_bucket: string; gender: string; import_id: string; pct: number }
        Insert: { account_id: string; age_bucket: string; gender: string; import_id: string; pct: number }
        Update: { account_id?: string; age_bucket?: string; gender?: string; import_id?: string; pct?: number }
        Relationships: [
          { foreignKeyName: "audience_age_account_id_fkey"; columns: ["account_id"]; isOneToOne: false; referencedRelation: "instagram_accounts"; referencedColumns: ["id"] },
          { foreignKeyName: "audience_age_import_id_fkey"; columns: ["import_id"]; isOneToOne: false; referencedRelation: "imports"; referencedColumns: ["id"] },
        ]
      }
      audience_geo: {
        Row: { account_id: string; import_id: string; kind: string; name: string; pct: number }
        Insert: { account_id: string; import_id: string; kind: string; name: string; pct: number }
        Update: { account_id?: string; import_id?: string; kind?: string; name?: string; pct?: number }
        Relationships: [
          { foreignKeyName: "audience_geo_account_id_fkey"; columns: ["account_id"]; isOneToOne: false; referencedRelation: "instagram_accounts"; referencedColumns: ["id"] },
          { foreignKeyName: "audience_geo_import_id_fkey"; columns: ["import_id"]; isOneToOne: false; referencedRelation: "imports"; referencedColumns: ["id"] },
        ]
      }
      audience_insights: {
        Row: {
          account_id: string; female_pct: number | null; followers_gained: number | null
          followers_lost: number | null; followers_net: number | null; followers_total: number | null
          growth_pct: number | null; import_id: string; male_pct: number | null
          period_end: string; period_start: string
        }
        Insert: {
          account_id: string; female_pct?: number | null; followers_gained?: number | null
          followers_lost?: number | null; followers_net?: number | null; followers_total?: number | null
          growth_pct?: number | null; import_id: string; male_pct?: number | null
          period_end: string; period_start: string
        }
        Update: {
          account_id?: string; female_pct?: number | null; followers_gained?: number | null
          followers_lost?: number | null; followers_net?: number | null; followers_total?: number | null
          growth_pct?: number | null; import_id?: string; male_pct?: number | null
          period_end?: string; period_start?: string
        }
        Relationships: [
          { foreignKeyName: "audience_insights_account_id_fkey"; columns: ["account_id"]; isOneToOne: false; referencedRelation: "instagram_accounts"; referencedColumns: ["id"] },
          { foreignKeyName: "audience_insights_import_id_fkey"; columns: ["import_id"]; isOneToOne: true; referencedRelation: "imports"; referencedColumns: ["id"] },
        ]
      }
      audit_log: {
        Row: {
          account_id: string | null; action: string; created_at: string; id: number
          metadata: Json | null; target_count: number | null; user_id: string | null
        }
        Insert: {
          account_id?: string | null; action: string; created_at?: string; id?: number
          metadata?: Json | null; target_count?: number | null; user_id?: string | null
        }
        Update: {
          account_id?: string | null; action?: string; created_at?: string; id?: number
          metadata?: Json | null; target_count?: number | null; user_id?: string | null
        }
        Relationships: [
          { foreignKeyName: "audit_log_account_id_fkey"; columns: ["account_id"]; isOneToOne: false; referencedRelation: "instagram_accounts"; referencedColumns: ["id"] },
        ]
      }
      brand_members: {
        Row: { brand_id: string; can_view_identities: boolean; created_at: string; role: Database["public"]["Enums"]["member_role"]; user_id: string }
        Insert: { brand_id: string; can_view_identities?: boolean; created_at?: string; role?: Database["public"]["Enums"]["member_role"]; user_id: string }
        Update: { brand_id?: string; can_view_identities?: boolean; created_at?: string; role?: Database["public"]["Enums"]["member_role"]; user_id?: string }
        Relationships: [
          { foreignKeyName: "brand_members_brand_id_fkey"; columns: ["brand_id"]; isOneToOne: false; referencedRelation: "brands"; referencedColumns: ["id"] },
        ]
      }
      brands: {
        Row: { created_at: string; id: string; name: string; org_id: string; slug: string }
        Insert: { created_at?: string; id?: string; name: string; org_id: string; slug: string }
        Update: { created_at?: string; id?: string; name?: string; org_id?: string; slug?: string }
        Relationships: [
          { foreignKeyName: "brands_org_id_fkey"; columns: ["org_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
        ]
      }
      follower_observations: {
        Row: { account_id: string; followed_at: string; import_id: string; profile_id: number }
        Insert: { account_id: string; followed_at: string; import_id: string; profile_id: number }
        Update: { account_id?: string; followed_at?: string; import_id?: string; profile_id?: number }
        Relationships: [
          { foreignKeyName: "follower_observations_account_id_fkey"; columns: ["account_id"]; isOneToOne: false; referencedRelation: "instagram_accounts"; referencedColumns: ["id"] },
          { foreignKeyName: "follower_observations_import_id_fkey"; columns: ["import_id"]; isOneToOne: false; referencedRelation: "imports"; referencedColumns: ["id"] },
        ]
      }
      following_observations: {
        Row: { account_id: string; followed_at: string | null; import_id: string; profile_id: number }
        Insert: { account_id: string; followed_at?: string | null; import_id: string; profile_id: number }
        Update: { account_id?: string; followed_at?: string | null; import_id?: string; profile_id?: number }
        Relationships: [
          { foreignKeyName: "following_observations_account_id_fkey"; columns: ["account_id"]; isOneToOne: false; referencedRelation: "instagram_accounts"; referencedColumns: ["id"] },
          { foreignKeyName: "following_observations_import_id_fkey"; columns: ["import_id"]; isOneToOne: false; referencedRelation: "imports"; referencedColumns: ["id"] },
        ]
      }
      import_files: {
        Row: {
          bytes: number | null; category: string; error_message: string | null; id: string
          import_id: string; rows_ingested: number | null; sha256: string | null
          source_path: string; status: string; storage_path: string | null
        }
        Insert: {
          bytes?: number | null; category: string; error_message?: string | null; id?: string
          import_id: string; rows_ingested?: number | null; sha256?: string | null
          source_path: string; status?: string; storage_path?: string | null
        }
        Update: {
          bytes?: number | null; category?: string; error_message?: string | null; id?: string
          import_id?: string; rows_ingested?: number | null; sha256?: string | null
          source_path?: string; status?: string; storage_path?: string | null
        }
        Relationships: [
          { foreignKeyName: "import_files_import_id_fkey"; columns: ["import_id"]; isOneToOne: false; referencedRelation: "imports"; referencedColumns: ["id"] },
        ]
      }
      imports: {
        Row: {
          account_id: string; completed_at: string | null; created_at: string; error_message: string | null
          exported_at: string | null; files_expected: number | null; files_parsed: number; id: string
          parser_version: string; started_at: string | null; status: Database["public"]["Enums"]["import_status"]
          storage_prefix: string; uploaded_by: string | null; window_end: string | null; window_start: string | null
        }
        Insert: {
          account_id: string; completed_at?: string | null; created_at?: string; error_message?: string | null
          exported_at?: string | null; files_expected?: number | null; files_parsed?: number; id?: string
          parser_version: string; started_at?: string | null; status?: Database["public"]["Enums"]["import_status"]
          storage_prefix: string; uploaded_by?: string | null; window_end?: string | null; window_start?: string | null
        }
        Update: {
          account_id?: string; completed_at?: string | null; created_at?: string; error_message?: string | null
          exported_at?: string | null; files_expected?: number | null; files_parsed?: number; id?: string
          parser_version?: string; started_at?: string | null; status?: Database["public"]["Enums"]["import_status"]
          storage_prefix?: string; uploaded_by?: string | null; window_end?: string | null; window_start?: string | null
        }
        Relationships: [
          { foreignKeyName: "imports_account_id_fkey"; columns: ["account_id"]; isOneToOne: false; referencedRelation: "instagram_accounts"; referencedColumns: ["id"] },
        ]
      }
      instagram_accounts: {
        Row: {
          brand_id: string; created_at: string; display_name: string | null; handle: string
          id: string; ig_fbid: string | null; import_cadence: string
        }
        Insert: {
          brand_id: string; created_at?: string; display_name?: string | null; handle: string
          id?: string; ig_fbid?: string | null; import_cadence?: string
        }
        Update: {
          brand_id?: string; created_at?: string; display_name?: string | null; handle?: string
          id?: string; ig_fbid?: string | null; import_cadence?: string
        }
        Relationships: [
          { foreignKeyName: "instagram_accounts_brand_id_fkey"; columns: ["brand_id"]; isOneToOne: false; referencedRelation: "brands"; referencedColumns: ["id"] },
        ]
      }
      interaction_insights: {
        Row: {
          account_id: string; comments: number | null; delta_pct: number | null; format: string
          import_id: string; interactions: number | null; likes: number | null
          replies: number | null; saves: number | null; shares: number | null
        }
        Insert: {
          account_id: string; comments?: number | null; delta_pct?: number | null; format: string
          import_id: string; interactions?: number | null; likes?: number | null
          replies?: number | null; saves?: number | null; shares?: number | null
        }
        Update: {
          account_id?: string; comments?: number | null; delta_pct?: number | null; format?: string
          import_id?: string; interactions?: number | null; likes?: number | null
          replies?: number | null; saves?: number | null; shares?: number | null
        }
        Relationships: [
          { foreignKeyName: "interaction_insights_account_id_fkey"; columns: ["account_id"]; isOneToOne: false; referencedRelation: "instagram_accounts"; referencedColumns: ["id"] },
          { foreignKeyName: "interaction_insights_import_id_fkey"; columns: ["import_id"]; isOneToOne: false; referencedRelation: "imports"; referencedColumns: ["id"] },
        ]
      }
      organization_members: {
        Row: { created_at: string; org_id: string; role: Database["public"]["Enums"]["member_role"]; user_id: string }
        Insert: { created_at?: string; org_id: string; role: Database["public"]["Enums"]["member_role"]; user_id: string }
        Update: { created_at?: string; org_id?: string; role?: Database["public"]["Enums"]["member_role"]; user_id?: string }
        Relationships: [
          { foreignKeyName: "organization_members_org_id_fkey"; columns: ["org_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
        ]
      }
      organizations: {
        Row: { created_at: string; id: string; name: string; slug: string }
        Insert: { created_at?: string; id?: string; name: string; slug: string }
        Update: { created_at?: string; id?: string; name?: string; slug?: string }
        Relationships: []
      }
      reach_insights: {
        Row: {
          account_id: string; accounts_reached: number | null; external_taps: number | null
          external_taps_delta_pct: number | null; follower_reach_pct: number | null; import_id: string
          impressions: number | null; impressions_delta_pct: number | null; non_follower_reach_pct: number | null
          period_end: string; period_start: string; profile_visits: number | null
          profile_visits_delta_pct: number | null; reach_delta_pct: number | null
        }
        Insert: {
          account_id: string; accounts_reached?: number | null; external_taps?: number | null
          external_taps_delta_pct?: number | null; follower_reach_pct?: number | null; import_id: string
          impressions?: number | null; impressions_delta_pct?: number | null; non_follower_reach_pct?: number | null
          period_end: string; period_start: string; profile_visits?: number | null
          profile_visits_delta_pct?: number | null; reach_delta_pct?: number | null
        }
        Update: {
          account_id?: string; accounts_reached?: number | null; external_taps?: number | null
          external_taps_delta_pct?: number | null; follower_reach_pct?: number | null; import_id?: string
          impressions?: number | null; impressions_delta_pct?: number | null; non_follower_reach_pct?: number | null
          period_end?: string; period_start?: string; profile_visits?: number | null
          profile_visits_delta_pct?: number | null; reach_delta_pct?: number | null
        }
        Relationships: [
          { foreignKeyName: "reach_insights_account_id_fkey"; columns: ["account_id"]; isOneToOne: false; referencedRelation: "instagram_accounts"; referencedColumns: ["id"] },
          { foreignKeyName: "reach_insights_import_id_fkey"; columns: ["import_id"]; isOneToOne: true; referencedRelation: "imports"; referencedColumns: ["id"] },
        ]
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
        Returns: { created_at: string; id: string; name: string; slug: string }
      }
      ingest_resolve_usernames: {
        Args: { p_usernames: string[] }
        Returns: { profile_id: number; username: string }[]
      }
      is_platform_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
      reveal_usernames: {
        Args: { p_account: string; p_ids: number[] }
        Returns: { profile_id: number; username: string }[]
      }
      user_account_ids: { Args: Record<PropertyKey, never>; Returns: string[] }
      user_brand_ids: { Args: Record<PropertyKey, never>; Returns: string[] }
      user_org_ids: { Args: Record<PropertyKey, never>; Returns: string[] }
    }
    Enums: {
      import_status: "uploading" | "uploaded" | "parsing" | "computing" | "completed" | "failed"
      member_role: "platform_admin" | "agency_admin" | "agency_member" | "brand_viewer"
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
