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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      acquisition_spikes: {
        Row: {
          account_id: string
          baseline_daily: number
          id: string
          import_id: string
          inference_confidence: string
          inferred_type: string
          linked_content_id: string | null
          multiple: number
          night_share: number | null
          retention_rate: number | null
          shape: string
          signal_share: number | null
          spike_end: string
          spike_start: string
          volume: number
        }
        Insert: {
          account_id: string
          baseline_daily: number
          id?: string
          import_id: string
          inference_confidence: string
          inferred_type: string
          linked_content_id?: string | null
          multiple: number
          night_share?: number | null
          retention_rate?: number | null
          shape: string
          signal_share?: number | null
          spike_end: string
          spike_start: string
          volume: number
        }
        Update: {
          account_id?: string
          baseline_daily?: number
          id?: string
          import_id?: string
          inference_confidence?: string
          inferred_type?: string
          linked_content_id?: string | null
          multiple?: number
          night_share?: number | null
          retention_rate?: number | null
          shape?: string
          signal_share?: number | null
          spike_end?: string
          spike_start?: string
          volume?: number
        }
        Relationships: [
          {
            foreignKeyName: "acquisition_spikes_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acquisition_spikes_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "import_comparability"
            referencedColumns: ["latest_import_id"]
          },
          {
            foreignKeyName: "acquisition_spikes_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "import_comparability"
            referencedColumns: ["previous_import_id"]
          },
          {
            foreignKeyName: "acquisition_spikes_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acquisition_spikes_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "latest_completed_import"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "acquisition_spikes_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "previous_completed_import"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "acquisition_spikes_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "v_cohort_totals"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "acquisition_spikes_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "v_organic_gained"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "acquisition_spikes_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "v_overview"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "acquisition_spikes_linked_content_id_fkey"
            columns: ["linked_content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
        ]
      }
      audience_activity: {
        Row: {
          account_id: string
          active_count: number
          import_id: string
          weekday: number
        }
        Insert: {
          account_id: string
          active_count: number
          import_id: string
          weekday: number
        }
        Update: {
          account_id?: string
          active_count?: number
          import_id?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "audience_activity_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audience_activity_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "import_comparability"
            referencedColumns: ["latest_import_id"]
          },
          {
            foreignKeyName: "audience_activity_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "import_comparability"
            referencedColumns: ["previous_import_id"]
          },
          {
            foreignKeyName: "audience_activity_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audience_activity_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "latest_completed_import"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "audience_activity_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "previous_completed_import"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "audience_activity_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "v_cohort_totals"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "audience_activity_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "v_organic_gained"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "audience_activity_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "v_overview"
            referencedColumns: ["import_id"]
          },
        ]
      }
      audience_age: {
        Row: {
          account_id: string
          age_bucket: string
          gender: string
          import_id: string
          pct: number
        }
        Insert: {
          account_id: string
          age_bucket: string
          gender: string
          import_id: string
          pct: number
        }
        Update: {
          account_id?: string
          age_bucket?: string
          gender?: string
          import_id?: string
          pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "audience_age_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audience_age_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "import_comparability"
            referencedColumns: ["latest_import_id"]
          },
          {
            foreignKeyName: "audience_age_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "import_comparability"
            referencedColumns: ["previous_import_id"]
          },
          {
            foreignKeyName: "audience_age_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audience_age_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "latest_completed_import"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "audience_age_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "previous_completed_import"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "audience_age_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "v_cohort_totals"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "audience_age_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "v_organic_gained"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "audience_age_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "v_overview"
            referencedColumns: ["import_id"]
          },
        ]
      }
      audience_geo: {
        Row: {
          account_id: string
          import_id: string
          kind: string
          name: string
          pct: number
        }
        Insert: {
          account_id: string
          import_id: string
          kind: string
          name: string
          pct: number
        }
        Update: {
          account_id?: string
          import_id?: string
          kind?: string
          name?: string
          pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "audience_geo_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audience_geo_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "import_comparability"
            referencedColumns: ["latest_import_id"]
          },
          {
            foreignKeyName: "audience_geo_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "import_comparability"
            referencedColumns: ["previous_import_id"]
          },
          {
            foreignKeyName: "audience_geo_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audience_geo_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "latest_completed_import"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "audience_geo_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "previous_completed_import"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "audience_geo_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "v_cohort_totals"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "audience_geo_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "v_organic_gained"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "audience_geo_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "v_overview"
            referencedColumns: ["import_id"]
          },
        ]
      }
      audience_insights: {
        Row: {
          account_id: string
          female_pct: number | null
          followers_gained: number | null
          followers_lost: number | null
          followers_net: number | null
          followers_total: number | null
          growth_pct: number | null
          import_id: string
          male_pct: number | null
          period_end: string
          period_start: string
        }
        Insert: {
          account_id: string
          female_pct?: number | null
          followers_gained?: number | null
          followers_lost?: number | null
          followers_net?: number | null
          followers_total?: number | null
          growth_pct?: number | null
          import_id: string
          male_pct?: number | null
          period_end: string
          period_start: string
        }
        Update: {
          account_id?: string
          female_pct?: number | null
          followers_gained?: number | null
          followers_lost?: number | null
          followers_net?: number | null
          followers_total?: number | null
          growth_pct?: number | null
          import_id?: string
          male_pct?: number | null
          period_end?: string
          period_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "audience_insights_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audience_insights_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: true
            referencedRelation: "import_comparability"
            referencedColumns: ["latest_import_id"]
          },
          {
            foreignKeyName: "audience_insights_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: true
            referencedRelation: "import_comparability"
            referencedColumns: ["previous_import_id"]
          },
          {
            foreignKeyName: "audience_insights_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: true
            referencedRelation: "imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audience_insights_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: true
            referencedRelation: "latest_completed_import"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "audience_insights_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: true
            referencedRelation: "previous_completed_import"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "audience_insights_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: true
            referencedRelation: "v_cohort_totals"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "audience_insights_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: true
            referencedRelation: "v_organic_gained"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "audience_insights_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: true
            referencedRelation: "v_overview"
            referencedColumns: ["import_id"]
          },
        ]
      }
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
      canary_accounts: {
        Row: {
          account_id: string
          expected_values: Json
          label: string
          last_check_diffs: Json | null
          last_check_passed: boolean | null
          last_checked_at: string | null
        }
        Insert: {
          account_id: string
          expected_values: Json
          label: string
          last_check_diffs?: Json | null
          last_check_passed?: boolean | null
          last_checked_at?: string | null
        }
        Update: {
          account_id?: string
          expected_values?: Json
          label?: string
          last_check_diffs?: Json | null
          last_check_passed?: boolean | null
          last_checked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "canary_accounts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: true
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      cohort_survival: {
        Row: {
          account_id: string
          cohort_week: string
          departed: number
          exposure_days: number
          horizon_confidence: string | null
          horizon_confidence_reason: string | null
          horizon_days: number | null
          measured_at: string
          measured_import_id: string
          rate_at_horizon: number | null
          remaining: number
          survival_rate: number
        }
        Insert: {
          account_id: string
          cohort_week: string
          departed: number
          exposure_days: number
          horizon_confidence?: string | null
          horizon_confidence_reason?: string | null
          horizon_days?: number | null
          measured_at: string
          measured_import_id: string
          rate_at_horizon?: number | null
          remaining: number
          survival_rate: number
        }
        Update: {
          account_id?: string
          cohort_week?: string
          departed?: number
          exposure_days?: number
          horizon_confidence?: string | null
          horizon_confidence_reason?: string | null
          horizon_days?: number | null
          measured_at?: string
          measured_import_id?: string
          rate_at_horizon?: number | null
          remaining?: number
          survival_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "cohort_survival_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohort_survival_measured_import_id_fkey"
            columns: ["measured_import_id"]
            isOneToOne: false
            referencedRelation: "import_comparability"
            referencedColumns: ["latest_import_id"]
          },
          {
            foreignKeyName: "cohort_survival_measured_import_id_fkey"
            columns: ["measured_import_id"]
            isOneToOne: false
            referencedRelation: "import_comparability"
            referencedColumns: ["previous_import_id"]
          },
          {
            foreignKeyName: "cohort_survival_measured_import_id_fkey"
            columns: ["measured_import_id"]
            isOneToOne: false
            referencedRelation: "imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohort_survival_measured_import_id_fkey"
            columns: ["measured_import_id"]
            isOneToOne: false
            referencedRelation: "latest_completed_import"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "cohort_survival_measured_import_id_fkey"
            columns: ["measured_import_id"]
            isOneToOne: false
            referencedRelation: "previous_completed_import"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "cohort_survival_measured_import_id_fkey"
            columns: ["measured_import_id"]
            isOneToOne: false
            referencedRelation: "v_cohort_totals"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "cohort_survival_measured_import_id_fkey"
            columns: ["measured_import_id"]
            isOneToOne: false
            referencedRelation: "v_organic_gained"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "cohort_survival_measured_import_id_fkey"
            columns: ["measured_import_id"]
            isOneToOne: false
            referencedRelation: "v_overview"
            referencedColumns: ["import_id"]
          },
        ]
      }
      cohorts: {
        Row: {
          account_id: string
          cohort_week: string
          is_spike_period: boolean
          origin_import_id: string
          size: number
        }
        Insert: {
          account_id: string
          cohort_week: string
          is_spike_period?: boolean
          origin_import_id: string
          size: number
        }
        Update: {
          account_id?: string
          cohort_week?: string
          is_spike_period?: boolean
          origin_import_id?: string
          size?: number
        }
        Relationships: [
          {
            foreignKeyName: "cohorts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohorts_origin_import_id_fkey"
            columns: ["origin_import_id"]
            isOneToOne: false
            referencedRelation: "import_comparability"
            referencedColumns: ["latest_import_id"]
          },
          {
            foreignKeyName: "cohorts_origin_import_id_fkey"
            columns: ["origin_import_id"]
            isOneToOne: false
            referencedRelation: "import_comparability"
            referencedColumns: ["previous_import_id"]
          },
          {
            foreignKeyName: "cohorts_origin_import_id_fkey"
            columns: ["origin_import_id"]
            isOneToOne: false
            referencedRelation: "imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohorts_origin_import_id_fkey"
            columns: ["origin_import_id"]
            isOneToOne: false
            referencedRelation: "latest_completed_import"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "cohorts_origin_import_id_fkey"
            columns: ["origin_import_id"]
            isOneToOne: false
            referencedRelation: "previous_completed_import"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "cohorts_origin_import_id_fkey"
            columns: ["origin_import_id"]
            isOneToOne: false
            referencedRelation: "v_cohort_totals"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "cohorts_origin_import_id_fkey"
            columns: ["origin_import_id"]
            isOneToOne: false
            referencedRelation: "v_organic_gained"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "cohorts_origin_import_id_fkey"
            columns: ["origin_import_id"]
            isOneToOne: false
            referencedRelation: "v_overview"
            referencedColumns: ["import_id"]
          },
        ]
      }
      content: {
        Row: {
          account_id: string
          caption: string | null
          first_import_id: string
          id: string
          media_key: string
          media_type: string
          permalink: string | null
          published_at: string
          thumb_path: string | null
        }
        Insert: {
          account_id: string
          caption?: string | null
          first_import_id: string
          id?: string
          media_key: string
          media_type: string
          permalink?: string | null
          published_at: string
          thumb_path?: string | null
        }
        Update: {
          account_id?: string
          caption?: string | null
          first_import_id?: string
          id?: string
          media_key?: string
          media_type?: string
          permalink?: string | null
          published_at?: string
          thumb_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_first_import_id_fkey"
            columns: ["first_import_id"]
            isOneToOne: false
            referencedRelation: "import_comparability"
            referencedColumns: ["latest_import_id"]
          },
          {
            foreignKeyName: "content_first_import_id_fkey"
            columns: ["first_import_id"]
            isOneToOne: false
            referencedRelation: "import_comparability"
            referencedColumns: ["previous_import_id"]
          },
          {
            foreignKeyName: "content_first_import_id_fkey"
            columns: ["first_import_id"]
            isOneToOne: false
            referencedRelation: "imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_first_import_id_fkey"
            columns: ["first_import_id"]
            isOneToOne: false
            referencedRelation: "latest_completed_import"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "content_first_import_id_fkey"
            columns: ["first_import_id"]
            isOneToOne: false
            referencedRelation: "previous_completed_import"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "content_first_import_id_fkey"
            columns: ["first_import_id"]
            isOneToOne: false
            referencedRelation: "v_cohort_totals"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "content_first_import_id_fkey"
            columns: ["first_import_id"]
            isOneToOne: false
            referencedRelation: "v_organic_gained"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "content_first_import_id_fkey"
            columns: ["first_import_id"]
            isOneToOne: false
            referencedRelation: "v_overview"
            referencedColumns: ["import_id"]
          },
        ]
      }
      content_attribution: {
        Row: {
          account_id: string
          arrivals_in_window: number
          baseline_expected: number
          confidence: string
          content_id: string
          divergence_ratio: number | null
          excess_arrivals: number
          import_id: string
          meta_follows_gained: number | null
          retained_at_horizon: number | null
          retention_rate: number | null
          window_hours: number
        }
        Insert: {
          account_id: string
          arrivals_in_window: number
          baseline_expected: number
          confidence: string
          content_id: string
          divergence_ratio?: number | null
          excess_arrivals: number
          import_id: string
          meta_follows_gained?: number | null
          retained_at_horizon?: number | null
          retention_rate?: number | null
          window_hours?: number
        }
        Update: {
          account_id?: string
          arrivals_in_window?: number
          baseline_expected?: number
          confidence?: string
          content_id?: string
          divergence_ratio?: number | null
          excess_arrivals?: number
          import_id?: string
          meta_follows_gained?: number | null
          retained_at_horizon?: number | null
          retention_rate?: number | null
          window_hours?: number
        }
        Relationships: [
          {
            foreignKeyName: "content_attribution_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_attribution_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_attribution_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "import_comparability"
            referencedColumns: ["latest_import_id"]
          },
          {
            foreignKeyName: "content_attribution_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "import_comparability"
            referencedColumns: ["previous_import_id"]
          },
          {
            foreignKeyName: "content_attribution_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_attribution_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "latest_completed_import"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "content_attribution_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "previous_completed_import"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "content_attribution_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "v_cohort_totals"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "content_attribution_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "v_organic_gained"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "content_attribution_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "v_overview"
            referencedColumns: ["import_id"]
          },
        ]
      }
      content_classification: {
        Row: {
          account_id: string
          classified_at: string
          confidence: number | null
          content_id: string
          has_person: boolean | null
          model: string
          model_version: string
          setting: string | null
          tags: string[] | null
          territory: string | null
        }
        Insert: {
          account_id: string
          classified_at?: string
          confidence?: number | null
          content_id: string
          has_person?: boolean | null
          model: string
          model_version: string
          setting?: string | null
          tags?: string[] | null
          territory?: string | null
        }
        Update: {
          account_id?: string
          classified_at?: string
          confidence?: number | null
          content_id?: string
          has_person?: boolean | null
          model?: string
          model_version?: string
          setting?: string | null
          tags?: string[] | null
          territory?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_classification_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_classification_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: true
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
        ]
      }
      content_metrics: {
        Row: {
          account_id: string
          comments: number | null
          content_id: string
          engagement_rate: number | null
          external_taps: number | null
          follow_conversion_rate: number | null
          follows_gained: number | null
          import_id: string
          impressions: number | null
          likes: number | null
          profile_visits: number | null
          reach: number | null
          saves: number | null
          shares: number | null
        }
        Insert: {
          account_id: string
          comments?: number | null
          content_id: string
          engagement_rate?: number | null
          external_taps?: number | null
          follow_conversion_rate?: number | null
          follows_gained?: number | null
          import_id: string
          impressions?: number | null
          likes?: number | null
          profile_visits?: number | null
          reach?: number | null
          saves?: number | null
          shares?: number | null
        }
        Update: {
          account_id?: string
          comments?: number | null
          content_id?: string
          engagement_rate?: number | null
          external_taps?: number | null
          follow_conversion_rate?: number | null
          follows_gained?: number | null
          import_id?: string
          impressions?: number | null
          likes?: number | null
          profile_visits?: number | null
          reach?: number | null
          saves?: number | null
          shares?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "content_metrics_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_metrics_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_metrics_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "import_comparability"
            referencedColumns: ["latest_import_id"]
          },
          {
            foreignKeyName: "content_metrics_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "import_comparability"
            referencedColumns: ["previous_import_id"]
          },
          {
            foreignKeyName: "content_metrics_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_metrics_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "latest_completed_import"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "content_metrics_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "previous_completed_import"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "content_metrics_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "v_cohort_totals"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "content_metrics_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "v_organic_gained"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "content_metrics_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "v_overview"
            referencedColumns: ["import_id"]
          },
        ]
      }
      cross_analyses: {
        Row: {
          account_id: string
          code: string
          computed_at: string
          confidence: string
          confidence_reason: string | null
          dimension: string
          id: string
          import_id: string
          payload: Json
          sample_size: number
          window_end: string | null
          window_start: string | null
        }
        Insert: {
          account_id: string
          code: string
          computed_at?: string
          confidence: string
          confidence_reason?: string | null
          dimension?: string
          id?: string
          import_id: string
          payload: Json
          sample_size: number
          window_end?: string | null
          window_start?: string | null
        }
        Update: {
          account_id?: string
          code?: string
          computed_at?: string
          confidence?: string
          confidence_reason?: string | null
          dimension?: string
          id?: string
          import_id?: string
          payload?: Json
          sample_size?: number
          window_end?: string | null
          window_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cross_analyses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cross_analyses_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "import_comparability"
            referencedColumns: ["latest_import_id"]
          },
          {
            foreignKeyName: "cross_analyses_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "import_comparability"
            referencedColumns: ["previous_import_id"]
          },
          {
            foreignKeyName: "cross_analyses_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cross_analyses_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "latest_completed_import"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "cross_analyses_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "previous_completed_import"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "cross_analyses_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "v_cohort_totals"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "cross_analyses_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "v_organic_gained"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "cross_analyses_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "v_overview"
            referencedColumns: ["import_id"]
          },
        ]
      }
      ecosystem_profiles: {
        Row: {
          account_id: string
          audience_bucket: number | null
          follow_started_at: string | null
          has_replied: boolean | null
          is_brand: boolean
          is_creator: boolean
          is_follower: boolean
          is_mutual: boolean
          is_verified: boolean
          last_import_id: string
          profile_id: number
        }
        Insert: {
          account_id: string
          audience_bucket?: number | null
          follow_started_at?: string | null
          has_replied?: boolean | null
          is_brand?: boolean
          is_creator?: boolean
          is_follower?: boolean
          is_mutual?: boolean
          is_verified?: boolean
          last_import_id: string
          profile_id: number
        }
        Update: {
          account_id?: string
          audience_bucket?: number | null
          follow_started_at?: string | null
          has_replied?: boolean | null
          is_brand?: boolean
          is_creator?: boolean
          is_follower?: boolean
          is_mutual?: boolean
          is_verified?: boolean
          last_import_id?: string
          profile_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "ecosystem_profiles_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecosystem_profiles_last_import_id_fkey"
            columns: ["last_import_id"]
            isOneToOne: false
            referencedRelation: "import_comparability"
            referencedColumns: ["latest_import_id"]
          },
          {
            foreignKeyName: "ecosystem_profiles_last_import_id_fkey"
            columns: ["last_import_id"]
            isOneToOne: false
            referencedRelation: "import_comparability"
            referencedColumns: ["previous_import_id"]
          },
          {
            foreignKeyName: "ecosystem_profiles_last_import_id_fkey"
            columns: ["last_import_id"]
            isOneToOne: false
            referencedRelation: "imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecosystem_profiles_last_import_id_fkey"
            columns: ["last_import_id"]
            isOneToOne: false
            referencedRelation: "latest_completed_import"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "ecosystem_profiles_last_import_id_fkey"
            columns: ["last_import_id"]
            isOneToOne: false
            referencedRelation: "previous_completed_import"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "ecosystem_profiles_last_import_id_fkey"
            columns: ["last_import_id"]
            isOneToOne: false
            referencedRelation: "v_cohort_totals"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "ecosystem_profiles_last_import_id_fkey"
            columns: ["last_import_id"]
            isOneToOne: false
            referencedRelation: "v_organic_gained"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "ecosystem_profiles_last_import_id_fkey"
            columns: ["last_import_id"]
            isOneToOne: false
            referencedRelation: "v_overview"
            referencedColumns: ["import_id"]
          },
        ]
      }
      ecosystem_summary: {
        Row: {
          account_id: string
          conversations_total: number
          import_id: string
          private_count: number
          professional_count: number
          unanswered_pro_count: number
        }
        Insert: {
          account_id: string
          conversations_total: number
          import_id: string
          private_count: number
          professional_count: number
          unanswered_pro_count: number
        }
        Update: {
          account_id?: string
          conversations_total?: number
          import_id?: string
          private_count?: number
          professional_count?: number
          unanswered_pro_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "ecosystem_summary_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecosystem_summary_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: true
            referencedRelation: "import_comparability"
            referencedColumns: ["latest_import_id"]
          },
          {
            foreignKeyName: "ecosystem_summary_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: true
            referencedRelation: "import_comparability"
            referencedColumns: ["previous_import_id"]
          },
          {
            foreignKeyName: "ecosystem_summary_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: true
            referencedRelation: "imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecosystem_summary_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: true
            referencedRelation: "latest_completed_import"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "ecosystem_summary_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: true
            referencedRelation: "previous_completed_import"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "ecosystem_summary_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: true
            referencedRelation: "v_cohort_totals"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "ecosystem_summary_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: true
            referencedRelation: "v_organic_gained"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "ecosystem_summary_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: true
            referencedRelation: "v_overview"
            referencedColumns: ["import_id"]
          },
        ]
      }
      follower_observations: {
        Row: {
          account_id: string
          followed_at: string
          import_id: string
          profile_id: number
        }
        Insert: {
          account_id: string
          followed_at: string
          import_id: string
          profile_id: number
        }
        Update: {
          account_id?: string
          followed_at?: string
          import_id?: string
          profile_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "follower_observations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follower_observations_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "import_comparability"
            referencedColumns: ["latest_import_id"]
          },
          {
            foreignKeyName: "follower_observations_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "import_comparability"
            referencedColumns: ["previous_import_id"]
          },
          {
            foreignKeyName: "follower_observations_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follower_observations_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "latest_completed_import"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "follower_observations_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "previous_completed_import"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "follower_observations_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "v_cohort_totals"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "follower_observations_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "v_organic_gained"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "follower_observations_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "v_overview"
            referencedColumns: ["import_id"]
          },
        ]
      }
      follower_states: {
        Row: {
          account_id: string
          cohort_week: string
          computed_at: string
          departure_window_end: string | null
          departure_window_start: string | null
          episode: number
          first_import_id: string
          followed_at: string
          is_latest_episode: boolean
          last_present_import_id: string
          profile_id: number
          rename_candidate_of: number | null
          sig_digit_suffix: boolean
          sig_long_handle: boolean
          sig_many_underscores: boolean
          status: Database["public"]["Enums"]["follower_status"]
          tenure_days: number | null
        }
        Insert: {
          account_id: string
          cohort_week: string
          computed_at?: string
          departure_window_end?: string | null
          departure_window_start?: string | null
          episode?: number
          first_import_id: string
          followed_at: string
          is_latest_episode?: boolean
          last_present_import_id: string
          profile_id: number
          rename_candidate_of?: number | null
          sig_digit_suffix?: boolean
          sig_long_handle?: boolean
          sig_many_underscores?: boolean
          status: Database["public"]["Enums"]["follower_status"]
          tenure_days?: number | null
        }
        Update: {
          account_id?: string
          cohort_week?: string
          computed_at?: string
          departure_window_end?: string | null
          departure_window_start?: string | null
          episode?: number
          first_import_id?: string
          followed_at?: string
          is_latest_episode?: boolean
          last_present_import_id?: string
          profile_id?: number
          rename_candidate_of?: number | null
          sig_digit_suffix?: boolean
          sig_long_handle?: boolean
          sig_many_underscores?: boolean
          status?: Database["public"]["Enums"]["follower_status"]
          tenure_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "follower_states_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follower_states_first_import_id_fkey"
            columns: ["first_import_id"]
            isOneToOne: false
            referencedRelation: "import_comparability"
            referencedColumns: ["latest_import_id"]
          },
          {
            foreignKeyName: "follower_states_first_import_id_fkey"
            columns: ["first_import_id"]
            isOneToOne: false
            referencedRelation: "import_comparability"
            referencedColumns: ["previous_import_id"]
          },
          {
            foreignKeyName: "follower_states_first_import_id_fkey"
            columns: ["first_import_id"]
            isOneToOne: false
            referencedRelation: "imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follower_states_first_import_id_fkey"
            columns: ["first_import_id"]
            isOneToOne: false
            referencedRelation: "latest_completed_import"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "follower_states_first_import_id_fkey"
            columns: ["first_import_id"]
            isOneToOne: false
            referencedRelation: "previous_completed_import"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "follower_states_first_import_id_fkey"
            columns: ["first_import_id"]
            isOneToOne: false
            referencedRelation: "v_cohort_totals"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "follower_states_first_import_id_fkey"
            columns: ["first_import_id"]
            isOneToOne: false
            referencedRelation: "v_organic_gained"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "follower_states_first_import_id_fkey"
            columns: ["first_import_id"]
            isOneToOne: false
            referencedRelation: "v_overview"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "follower_states_last_present_import_id_fkey"
            columns: ["last_present_import_id"]
            isOneToOne: false
            referencedRelation: "import_comparability"
            referencedColumns: ["latest_import_id"]
          },
          {
            foreignKeyName: "follower_states_last_present_import_id_fkey"
            columns: ["last_present_import_id"]
            isOneToOne: false
            referencedRelation: "import_comparability"
            referencedColumns: ["previous_import_id"]
          },
          {
            foreignKeyName: "follower_states_last_present_import_id_fkey"
            columns: ["last_present_import_id"]
            isOneToOne: false
            referencedRelation: "imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follower_states_last_present_import_id_fkey"
            columns: ["last_present_import_id"]
            isOneToOne: false
            referencedRelation: "latest_completed_import"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "follower_states_last_present_import_id_fkey"
            columns: ["last_present_import_id"]
            isOneToOne: false
            referencedRelation: "previous_completed_import"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "follower_states_last_present_import_id_fkey"
            columns: ["last_present_import_id"]
            isOneToOne: false
            referencedRelation: "v_cohort_totals"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "follower_states_last_present_import_id_fkey"
            columns: ["last_present_import_id"]
            isOneToOne: false
            referencedRelation: "v_organic_gained"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "follower_states_last_present_import_id_fkey"
            columns: ["last_present_import_id"]
            isOneToOne: false
            referencedRelation: "v_overview"
            referencedColumns: ["import_id"]
          },
        ]
      }
      following_observations: {
        Row: {
          account_id: string
          followed_at: string | null
          import_id: string
          profile_id: number
        }
        Insert: {
          account_id: string
          followed_at?: string | null
          import_id: string
          profile_id: number
        }
        Update: {
          account_id?: string
          followed_at?: string | null
          import_id?: string
          profile_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "following_observations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "following_observations_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "import_comparability"
            referencedColumns: ["latest_import_id"]
          },
          {
            foreignKeyName: "following_observations_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "import_comparability"
            referencedColumns: ["previous_import_id"]
          },
          {
            foreignKeyName: "following_observations_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "following_observations_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "latest_completed_import"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "following_observations_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "previous_completed_import"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "following_observations_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "v_cohort_totals"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "following_observations_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "v_organic_gained"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "following_observations_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "v_overview"
            referencedColumns: ["import_id"]
          },
        ]
      }
      following_states: {
        Row: {
          account_id: string
          followed_at: string | null
          is_mutual: boolean
          profile_id: number
          removed_between_end: string | null
          removed_between_start: string | null
          status: string
        }
        Insert: {
          account_id: string
          followed_at?: string | null
          is_mutual?: boolean
          profile_id: number
          removed_between_end?: string | null
          removed_between_start?: string | null
          status: string
        }
        Update: {
          account_id?: string
          followed_at?: string | null
          is_mutual?: boolean
          profile_id?: number
          removed_between_end?: string | null
          removed_between_start?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "following_states_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      hazard_curve: {
        Row: {
          account_id: string
          age_bucket: number
          at_risk: number
          cohort_week: string
          departed: number
          hazard_rate: number
          import_id: string
        }
        Insert: {
          account_id: string
          age_bucket: number
          at_risk: number
          cohort_week?: string
          departed: number
          hazard_rate: number
          import_id: string
        }
        Update: {
          account_id?: string
          age_bucket?: number
          at_risk?: number
          cohort_week?: string
          departed?: number
          hazard_rate?: number
          import_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hazard_curve_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hazard_curve_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "import_comparability"
            referencedColumns: ["latest_import_id"]
          },
          {
            foreignKeyName: "hazard_curve_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "import_comparability"
            referencedColumns: ["previous_import_id"]
          },
          {
            foreignKeyName: "hazard_curve_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hazard_curve_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "latest_completed_import"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "hazard_curve_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "previous_completed_import"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "hazard_curve_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "v_cohort_totals"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "hazard_curve_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "v_organic_gained"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "hazard_curve_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "v_overview"
            referencedColumns: ["import_id"]
          },
        ]
      }
      import_files: {
        Row: {
          bytes: number | null
          category: string
          error_message: string | null
          id: string
          import_id: string
          rows_ingested: number | null
          sha256: string | null
          source_path: string
          status: string
          storage_path: string | null
        }
        Insert: {
          bytes?: number | null
          category: string
          error_message?: string | null
          id?: string
          import_id: string
          rows_ingested?: number | null
          sha256?: string | null
          source_path: string
          status?: string
          storage_path?: string | null
        }
        Update: {
          bytes?: number | null
          category?: string
          error_message?: string | null
          id?: string
          import_id?: string
          rows_ingested?: number | null
          sha256?: string | null
          source_path?: string
          status?: string
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "import_files_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "import_comparability"
            referencedColumns: ["latest_import_id"]
          },
          {
            foreignKeyName: "import_files_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "import_comparability"
            referencedColumns: ["previous_import_id"]
          },
          {
            foreignKeyName: "import_files_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_files_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "latest_completed_import"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "import_files_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "previous_completed_import"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "import_files_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "v_cohort_totals"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "import_files_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "v_organic_gained"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "import_files_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "v_overview"
            referencedColumns: ["import_id"]
          },
        ]
      }
      import_schema_fingerprint: {
        Row: {
          account_id: string
          computed_at: string
          coverage_rate: number | null
          file_kind: string
          id: string
          import_id: string
          missing_required_fields: string[]
          observed_keys: string[]
          unmapped_keys: string[]
        }
        Insert: {
          account_id: string
          computed_at?: string
          coverage_rate?: number | null
          file_kind: string
          id?: string
          import_id: string
          missing_required_fields: string[]
          observed_keys: string[]
          unmapped_keys: string[]
        }
        Update: {
          account_id?: string
          computed_at?: string
          coverage_rate?: number | null
          file_kind?: string
          id?: string
          import_id?: string
          missing_required_fields?: string[]
          observed_keys?: string[]
          unmapped_keys?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "import_schema_fingerprint_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_schema_fingerprint_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "import_comparability"
            referencedColumns: ["latest_import_id"]
          },
          {
            foreignKeyName: "import_schema_fingerprint_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "import_comparability"
            referencedColumns: ["previous_import_id"]
          },
          {
            foreignKeyName: "import_schema_fingerprint_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_schema_fingerprint_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "latest_completed_import"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "import_schema_fingerprint_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "previous_completed_import"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "import_schema_fingerprint_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "v_cohort_totals"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "import_schema_fingerprint_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "v_organic_gained"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "import_schema_fingerprint_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "v_overview"
            referencedColumns: ["import_id"]
          },
        ]
      }
      imports: {
        Row: {
          account_id: string
          completed_at: string | null
          created_at: string
          error_message: string | null
          exported_at: string | null
          files_expected: number | null
          files_parsed: number
          id: string
          parser_version: string
          started_at: string | null
          status: Database["public"]["Enums"]["import_status"]
          storage_prefix: string
          uploaded_by: string | null
          window_end: string | null
          window_start: string | null
        }
        Insert: {
          account_id: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          exported_at?: string | null
          files_expected?: number | null
          files_parsed?: number
          id?: string
          parser_version: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["import_status"]
          storage_prefix: string
          uploaded_by?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Update: {
          account_id?: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          exported_at?: string | null
          files_expected?: number | null
          files_parsed?: number
          id?: string
          parser_version?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["import_status"]
          storage_prefix?: string
          uploaded_by?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "imports_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      inflow_geo_estimate: {
        Row: {
          account_id: string
          confidence: string
          country: string
          error_margin: number
          estimated_pct: number
          import_id: string
          method: string
        }
        Insert: {
          account_id: string
          confidence: string
          country: string
          error_margin: number
          estimated_pct: number
          import_id: string
          method?: string
        }
        Update: {
          account_id?: string
          confidence?: string
          country?: string
          error_margin?: number
          estimated_pct?: number
          import_id?: string
          method?: string
        }
        Relationships: [
          {
            foreignKeyName: "inflow_geo_estimate_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inflow_geo_estimate_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "import_comparability"
            referencedColumns: ["latest_import_id"]
          },
          {
            foreignKeyName: "inflow_geo_estimate_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "import_comparability"
            referencedColumns: ["previous_import_id"]
          },
          {
            foreignKeyName: "inflow_geo_estimate_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inflow_geo_estimate_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "latest_completed_import"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "inflow_geo_estimate_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "previous_completed_import"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "inflow_geo_estimate_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "v_cohort_totals"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "inflow_geo_estimate_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "v_organic_gained"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "inflow_geo_estimate_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "v_overview"
            referencedColumns: ["import_id"]
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
      interaction_insights: {
        Row: {
          account_id: string
          accounts_interacted: number | null
          accounts_interacted_delta_pct: number | null
          accounts_interacted_follower_pct: number | null
          accounts_interacted_non_follower_pct: number | null
          comments: number | null
          delta_pct: number | null
          format: string
          import_id: string
          interactions: number | null
          likes: number | null
          replies: number | null
          saves: number | null
          shares: number | null
        }
        Insert: {
          account_id: string
          accounts_interacted?: number | null
          accounts_interacted_delta_pct?: number | null
          accounts_interacted_follower_pct?: number | null
          accounts_interacted_non_follower_pct?: number | null
          comments?: number | null
          delta_pct?: number | null
          format: string
          import_id: string
          interactions?: number | null
          likes?: number | null
          replies?: number | null
          saves?: number | null
          shares?: number | null
        }
        Update: {
          account_id?: string
          accounts_interacted?: number | null
          accounts_interacted_delta_pct?: number | null
          accounts_interacted_follower_pct?: number | null
          accounts_interacted_non_follower_pct?: number | null
          comments?: number | null
          delta_pct?: number | null
          format?: string
          import_id?: string
          interactions?: number | null
          likes?: number | null
          replies?: number | null
          saves?: number | null
          shares?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "interaction_insights_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interaction_insights_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "import_comparability"
            referencedColumns: ["latest_import_id"]
          },
          {
            foreignKeyName: "interaction_insights_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "import_comparability"
            referencedColumns: ["previous_import_id"]
          },
          {
            foreignKeyName: "interaction_insights_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interaction_insights_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "latest_completed_import"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "interaction_insights_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "previous_completed_import"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "interaction_insights_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "v_cohort_totals"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "interaction_insights_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "v_organic_gained"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "interaction_insights_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "v_overview"
            referencedColumns: ["import_id"]
          },
        ]
      }
      manual_entries: {
        Row: {
          account_id: string
          entity_key: string
          entity_type: string
          field: string
          id: string
          updated_at: string
          updated_by: string | null
          value_numeric: number | null
          value_text: string | null
        }
        Insert: {
          account_id: string
          entity_key: string
          entity_type: string
          field: string
          id?: string
          updated_at?: string
          updated_by?: string | null
          value_numeric?: number | null
          value_text?: string | null
        }
        Update: {
          account_id?: string
          entity_key?: string
          entity_type?: string
          field?: string
          id?: string
          updated_at?: string
          updated_by?: string | null
          value_numeric?: number | null
          value_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manual_entries_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
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
      parser_label_map: {
        Row: {
          created_at: string
          field_name: string
          file_kind: string
          id: string
          is_required: boolean
          label_pattern: string
          match_type: string
          verified: boolean
        }
        Insert: {
          created_at?: string
          field_name: string
          file_kind: string
          id?: string
          is_required?: boolean
          label_pattern: string
          match_type: string
          verified?: boolean
        }
        Update: {
          created_at?: string
          field_name?: string
          file_kind?: string
          id?: string
          is_required?: boolean
          label_pattern?: string
          match_type?: string
          verified?: boolean
        }
        Relationships: []
      }
      reach_insights: {
        Row: {
          account_id: string
          accounts_reached: number | null
          external_taps: number | null
          external_taps_delta_pct: number | null
          follower_reach_pct: number | null
          import_id: string
          impressions: number | null
          impressions_delta_pct: number | null
          non_follower_reach_pct: number | null
          period_end: string
          period_start: string
          profile_visits: number | null
          profile_visits_delta_pct: number | null
          reach_delta_pct: number | null
        }
        Insert: {
          account_id: string
          accounts_reached?: number | null
          external_taps?: number | null
          external_taps_delta_pct?: number | null
          follower_reach_pct?: number | null
          import_id: string
          impressions?: number | null
          impressions_delta_pct?: number | null
          non_follower_reach_pct?: number | null
          period_end: string
          period_start: string
          profile_visits?: number | null
          profile_visits_delta_pct?: number | null
          reach_delta_pct?: number | null
        }
        Update: {
          account_id?: string
          accounts_reached?: number | null
          external_taps?: number | null
          external_taps_delta_pct?: number | null
          follower_reach_pct?: number | null
          import_id?: string
          impressions?: number | null
          impressions_delta_pct?: number | null
          non_follower_reach_pct?: number | null
          period_end?: string
          period_start?: string
          profile_visits?: number | null
          profile_visits_delta_pct?: number | null
          reach_delta_pct?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reach_insights_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reach_insights_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: true
            referencedRelation: "import_comparability"
            referencedColumns: ["latest_import_id"]
          },
          {
            foreignKeyName: "reach_insights_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: true
            referencedRelation: "import_comparability"
            referencedColumns: ["previous_import_id"]
          },
          {
            foreignKeyName: "reach_insights_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: true
            referencedRelation: "imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reach_insights_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: true
            referencedRelation: "latest_completed_import"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "reach_insights_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: true
            referencedRelation: "previous_completed_import"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "reach_insights_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: true
            referencedRelation: "v_cohort_totals"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "reach_insights_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: true
            referencedRelation: "v_organic_gained"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "reach_insights_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: true
            referencedRelation: "v_overview"
            referencedColumns: ["import_id"]
          },
        ]
      }
      reconciliation: {
        Row: {
          account_id: string
          arrivals_coverage: number | null
          departures_coverage: number | null
          import_id: string
          meta_gained: number | null
          meta_lost: number | null
          observed_arrivals: number | null
          observed_departures: number | null
          unobservable_reason: string | null
        }
        Insert: {
          account_id: string
          arrivals_coverage?: number | null
          departures_coverage?: number | null
          import_id: string
          meta_gained?: number | null
          meta_lost?: number | null
          observed_arrivals?: number | null
          observed_departures?: number | null
          unobservable_reason?: string | null
        }
        Update: {
          account_id?: string
          arrivals_coverage?: number | null
          departures_coverage?: number | null
          import_id?: string
          meta_gained?: number | null
          meta_lost?: number | null
          observed_arrivals?: number | null
          observed_departures?: number | null
          unobservable_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reconciliation_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: true
            referencedRelation: "import_comparability"
            referencedColumns: ["latest_import_id"]
          },
          {
            foreignKeyName: "reconciliation_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: true
            referencedRelation: "import_comparability"
            referencedColumns: ["previous_import_id"]
          },
          {
            foreignKeyName: "reconciliation_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: true
            referencedRelation: "imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: true
            referencedRelation: "latest_completed_import"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "reconciliation_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: true
            referencedRelation: "previous_completed_import"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "reconciliation_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: true
            referencedRelation: "v_cohort_totals"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "reconciliation_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: true
            referencedRelation: "v_organic_gained"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "reconciliation_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: true
            referencedRelation: "v_overview"
            referencedColumns: ["import_id"]
          },
        ]
      }
    }
    Views: {
      acquisition_spikes_with_budget: {
        Row: {
          account_id: string | null
          baseline_daily: number | null
          budget_eur: number | null
          cout_brut_eur: number | null
          cout_retenu_eur: number | null
          id: string | null
          import_id: string | null
          inference_confidence: string | null
          inferred_type: string | null
          linked_content_id: string | null
          multiple: number | null
          night_share: number | null
          retention_rate: number | null
          shape: string | null
          signal_share: number | null
          spike_end: string | null
          spike_start: string | null
          volume: number | null
        }
        Relationships: [
          {
            foreignKeyName: "acquisition_spikes_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acquisition_spikes_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "import_comparability"
            referencedColumns: ["latest_import_id"]
          },
          {
            foreignKeyName: "acquisition_spikes_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "import_comparability"
            referencedColumns: ["previous_import_id"]
          },
          {
            foreignKeyName: "acquisition_spikes_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acquisition_spikes_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "latest_completed_import"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "acquisition_spikes_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "previous_completed_import"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "acquisition_spikes_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "v_cohort_totals"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "acquisition_spikes_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "v_organic_gained"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "acquisition_spikes_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "v_overview"
            referencedColumns: ["import_id"]
          },
          {
            foreignKeyName: "acquisition_spikes_linked_content_id_fkey"
            columns: ["linked_content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
        ]
      }
      import_comparability: {
        Row: {
          account_id: string | null
          comparability_reason: string | null
          comparable: boolean | null
          is_single_import: boolean | null
          latest_import_id: string | null
          latest_window_end: string | null
          latest_window_start: string | null
          overlap_days: number | null
          overlap_ratio: number | null
          previous_import_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "imports_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      latest_completed_import: {
        Row: {
          account_id: string | null
          completed_at: string | null
          exported_at: string | null
          import_id: string | null
          window_end: string | null
          window_start: string | null
        }
        Relationships: [
          {
            foreignKeyName: "imports_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      previous_completed_import: {
        Row: {
          account_id: string | null
          completed_at: string | null
          exported_at: string | null
          import_id: string | null
          window_end: string | null
          window_start: string | null
        }
        Relationships: [
          {
            foreignKeyName: "imports_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      v_cohort_totals: {
        Row: {
          account_id: string | null
          departure_rate: number | null
          import_id: string | null
          total_departed: number | null
          total_measurable: number | null
          total_remaining: number | null
        }
        Relationships: [
          {
            foreignKeyName: "imports_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      v_growth_by_cohort: {
        Row: {
          account_id: string | null
          arrivals: number | null
          cohort_week: string | null
          departed: number | null
          is_spike_period: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "cohorts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      v_likely_renames: {
        Row: {
          account_id: string | null
          likely_rename_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "follower_states_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      v_organic_gained: {
        Row: {
          account_id: string | null
          import_id: string | null
          organic_gained: number | null
        }
        Relationships: [
          {
            foreignKeyName: "imports_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      v_overview: {
        Row: {
          account_id: string | null
          completed_at: string | null
          departure_rate: number | null
          followers_gained: number | null
          followers_lost: number | null
          followers_net: number | null
          followers_total: number | null
          growth_pct: number | null
          import_id: string | null
          insights_period_end: string | null
          insights_period_start: string | null
          organic_gained: number | null
          organic_share: number | null
          total_departed: number | null
          total_measurable: number | null
          total_remaining: number | null
          window_end: string | null
          window_start: string | null
        }
        Relationships: [
          {
            foreignKeyName: "imports_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      v_recent_departures: {
        Row: {
          account_id: string | null
          cohort_week: string | null
          departure_window_end: string | null
          departure_window_start: string | null
          followed_at: string | null
          profile_id: number | null
          tenure_days: number | null
        }
        Insert: {
          account_id?: string | null
          cohort_week?: string | null
          departure_window_end?: string | null
          departure_window_start?: string | null
          followed_at?: string | null
          profile_id?: number | null
          tenure_days?: number | null
        }
        Update: {
          account_id?: string | null
          cohort_week?: string | null
          departure_window_end?: string | null
          departure_window_start?: string | null
          followed_at?: string | null
          profile_id?: number | null
          tenure_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "follower_states_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_manage_org: { Args: { p_org: string }; Returns: boolean }
      can_view_identities: { Args: { p_account: string }; Returns: boolean }
      can_write: { Args: { p_brand: string }; Returns: boolean }
      can_write_account: { Args: { p_account: string }; Returns: boolean }
      check_canary_account: { Args: { p_account_id: string }; Returns: Json }
      cohort_rate_at_horizon: {
        Args: {
          p_account: string
          p_cohort_week: string
          p_horizon_days: number
        }
        Returns: number
      }
      create_organization: {
        Args: { p_name: string; p_slug: string }
        Returns: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        SetofOptions: {
          from: "*"
          to: "organizations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      ingest_resolve_usernames: {
        Args: { p_usernames: string[] }
        Returns: {
          profile_id: number
          username: string
        }[]
      }
      is_platform_admin: { Args: never; Returns: boolean }
      recompute_account: { Args: { p_account_id: string }; Returns: undefined }
      record_schema_fingerprint: {
        Args: {
          p_account_id: string
          p_file_kind: string
          p_import_id: string
          p_observed_keys: string[]
        }
        Returns: undefined
      }
      reveal_usernames: {
        Args: { p_account: string; p_ids: number[] }
        Returns: {
          profile_id: number
          username: string
        }[]
      }
      user_account_ids: { Args: never; Returns: string[] }
      user_brand_ids: { Args: never; Returns: string[] }
      user_org_ids: { Args: never; Returns: string[] }
    }
    Enums: {
      follower_status: "present" | "gone" | "out_of_window" | "likely_rename"
      import_status:
        | "uploading"
        | "uploaded"
        | "parsing"
        | "computing"
        | "completed"
        | "failed"
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
    Enums: {
      follower_status: ["present", "gone", "out_of_window", "likely_rename"],
      import_status: [
        "uploading",
        "uploaded",
        "parsing",
        "computing",
        "completed",
        "failed",
      ],
      member_role: [
        "platform_admin",
        "agency_admin",
        "agency_member",
        "brand_viewer",
      ],
    },
  },
} as const
