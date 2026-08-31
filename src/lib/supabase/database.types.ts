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
      cohort_survival: {
        Row: {
          account_id: string; cohort_week: string; departed: number; exposure_days: number
          measured_at: string; measured_import_id: string; remaining: number; survival_rate: number
          horizon_days: number | null; rate_at_horizon: number | null; horizon_confidence: string | null
          horizon_confidence_reason: string | null
        }
        Insert: {
          account_id: string; cohort_week: string; departed: number; exposure_days: number
          measured_at: string; measured_import_id: string; remaining: number; survival_rate: number
          horizon_days?: number | null; rate_at_horizon?: number | null; horizon_confidence?: string | null
          horizon_confidence_reason?: string | null
        }
        Update: {
          account_id?: string; cohort_week?: string; departed?: number; exposure_days?: number
          measured_at?: string; measured_import_id?: string; remaining?: number; survival_rate?: number
          horizon_days?: number | null; rate_at_horizon?: number | null; horizon_confidence?: string | null
          horizon_confidence_reason?: string | null
        }
        Relationships: [
          { foreignKeyName: "cohort_survival_account_id_fkey"; columns: ["account_id"]; isOneToOne: false; referencedRelation: "instagram_accounts"; referencedColumns: ["id"] },
          { foreignKeyName: "cohort_survival_measured_import_id_fkey"; columns: ["measured_import_id"]; isOneToOne: false; referencedRelation: "imports"; referencedColumns: ["id"] },
        ]
      }
      cohorts: {
        Row: { account_id: string; cohort_week: string; is_spike_period: boolean; origin_import_id: string; size: number }
        Insert: { account_id: string; cohort_week: string; is_spike_period?: boolean; origin_import_id: string; size: number }
        Update: { account_id?: string; cohort_week?: string; is_spike_period?: boolean; origin_import_id?: string; size?: number }
        Relationships: [
          { foreignKeyName: "cohorts_account_id_fkey"; columns: ["account_id"]; isOneToOne: false; referencedRelation: "instagram_accounts"; referencedColumns: ["id"] },
          { foreignKeyName: "cohorts_origin_import_id_fkey"; columns: ["origin_import_id"]; isOneToOne: false; referencedRelation: "imports"; referencedColumns: ["id"] },
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
      follower_states: {
        Row: {
          account_id: string; cohort_week: string; computed_at: string
          departure_window_end: string | null; departure_window_start: string | null
          episode: number; first_import_id: string; followed_at: string; last_present_import_id: string
          profile_id: number; rename_candidate_of: number | null
          sig_digit_suffix: boolean; sig_long_handle: boolean; sig_many_underscores: boolean
          status: Database["public"]["Enums"]["follower_status"]; tenure_days: number | null
          is_latest_episode: boolean
        }
        Insert: {
          account_id: string; cohort_week: string; computed_at?: string
          departure_window_end?: string | null; departure_window_start?: string | null
          episode?: number; first_import_id: string; followed_at: string; last_present_import_id: string
          profile_id: number; rename_candidate_of?: number | null
          sig_digit_suffix?: boolean; sig_long_handle?: boolean; sig_many_underscores?: boolean
          status: Database["public"]["Enums"]["follower_status"]; tenure_days?: number | null
          is_latest_episode?: boolean
        }
        Update: {
          account_id?: string; cohort_week?: string; computed_at?: string
          departure_window_end?: string | null; departure_window_start?: string | null
          episode?: number; first_import_id?: string; followed_at?: string; last_present_import_id?: string
          profile_id?: number; rename_candidate_of?: number | null
          sig_digit_suffix?: boolean; sig_long_handle?: boolean; sig_many_underscores?: boolean
          status?: Database["public"]["Enums"]["follower_status"]; tenure_days?: number | null
          is_latest_episode?: boolean
        }
        Relationships: [
          { foreignKeyName: "follower_states_account_id_fkey"; columns: ["account_id"]; isOneToOne: false; referencedRelation: "instagram_accounts"; referencedColumns: ["id"] },
          { foreignKeyName: "follower_states_first_import_id_fkey"; columns: ["first_import_id"]; isOneToOne: false; referencedRelation: "imports"; referencedColumns: ["id"] },
          { foreignKeyName: "follower_states_last_present_import_id_fkey"; columns: ["last_present_import_id"]; isOneToOne: false; referencedRelation: "imports"; referencedColumns: ["id"] },
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
      following_states: {
        Row: {
          account_id: string; followed_at: string | null; is_mutual: boolean; profile_id: number
          removed_between_end: string | null; removed_between_start: string | null; status: string
        }
        Insert: {
          account_id: string; followed_at?: string | null; is_mutual?: boolean; profile_id: number
          removed_between_end?: string | null; removed_between_start?: string | null; status: string
        }
        Update: {
          account_id?: string; followed_at?: string | null; is_mutual?: boolean; profile_id?: number
          removed_between_end?: string | null; removed_between_start?: string | null; status?: string
        }
        Relationships: [
          { foreignKeyName: "following_states_account_id_fkey"; columns: ["account_id"]; isOneToOne: false; referencedRelation: "instagram_accounts"; referencedColumns: ["id"] },
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
      content: {
        Row: {
          id: string; account_id: string; media_key: string; permalink: string | null
          media_type: string; published_at: string; caption: string | null; thumb_path: string | null
          first_import_id: string
        }
        Insert: {
          id?: string; account_id: string; media_key: string; permalink?: string | null
          media_type: string; published_at: string; caption?: string | null; thumb_path?: string | null
          first_import_id: string
        }
        Update: {
          id?: string; account_id?: string; media_key?: string; permalink?: string | null
          media_type?: string; published_at?: string; caption?: string | null; thumb_path?: string | null
          first_import_id?: string
        }
        Relationships: [
          { foreignKeyName: "content_account_id_fkey"; columns: ["account_id"]; isOneToOne: false; referencedRelation: "instagram_accounts"; referencedColumns: ["id"] },
          { foreignKeyName: "content_first_import_id_fkey"; columns: ["first_import_id"]; isOneToOne: false; referencedRelation: "imports"; referencedColumns: ["id"] },
        ]
      }
      content_metrics: {
        Row: {
          content_id: string; import_id: string; account_id: string; reach: number | null
          impressions: number | null; likes: number | null; comments: number | null; shares: number | null
          saves: number | null; profile_visits: number | null; follows_gained: number | null
          external_taps: number | null; follow_conversion_rate: number | null; engagement_rate: number | null
        }
        Insert: {
          content_id: string; import_id: string; account_id: string; reach?: number | null
          impressions?: number | null; likes?: number | null; comments?: number | null; shares?: number | null
          saves?: number | null; profile_visits?: number | null; follows_gained?: number | null
          external_taps?: number | null; follow_conversion_rate?: number | null; engagement_rate?: number | null
        }
        Update: {
          content_id?: string; import_id?: string; account_id?: string; reach?: number | null
          impressions?: number | null; likes?: number | null; comments?: number | null; shares?: number | null
          saves?: number | null; profile_visits?: number | null; follows_gained?: number | null
          external_taps?: number | null; follow_conversion_rate?: number | null; engagement_rate?: number | null
        }
        Relationships: [
          { foreignKeyName: "content_metrics_content_id_fkey"; columns: ["content_id"]; isOneToOne: false; referencedRelation: "content"; referencedColumns: ["id"] },
          { foreignKeyName: "content_metrics_import_id_fkey"; columns: ["import_id"]; isOneToOne: false; referencedRelation: "imports"; referencedColumns: ["id"] },
        ]
      }
      content_classification: {
        Row: {
          content_id: string; account_id: string; territory: string | null; tags: string[] | null
          has_person: boolean | null; setting: string | null; model: string; model_version: string
          confidence: number | null; classified_at: string
        }
        Insert: {
          content_id: string; account_id: string; territory?: string | null; tags?: string[] | null
          has_person?: boolean | null; setting?: string | null; model: string; model_version: string
          confidence?: number | null; classified_at?: string
        }
        Update: {
          content_id?: string; account_id?: string; territory?: string | null; tags?: string[] | null
          has_person?: boolean | null; setting?: string | null; model?: string; model_version?: string
          confidence?: number | null; classified_at?: string
        }
        Relationships: [
          { foreignKeyName: "content_classification_content_id_fkey"; columns: ["content_id"]; isOneToOne: true; referencedRelation: "content"; referencedColumns: ["id"] },
        ]
      }
      ecosystem_profiles: {
        Row: {
          account_id: string; profile_id: number; is_creator: boolean; is_brand: boolean
          is_verified: boolean; is_follower: boolean; is_mutual: boolean; audience_bucket: number | null
          follow_started_at: string | null; has_replied: boolean | null; last_import_id: string
        }
        Insert: {
          account_id: string; profile_id: number; is_creator?: boolean; is_brand?: boolean
          is_verified?: boolean; is_follower?: boolean; is_mutual?: boolean; audience_bucket?: number | null
          follow_started_at?: string | null; has_replied?: boolean | null; last_import_id: string
        }
        Update: {
          account_id?: string; profile_id?: number; is_creator?: boolean; is_brand?: boolean
          is_verified?: boolean; is_follower?: boolean; is_mutual?: boolean; audience_bucket?: number | null
          follow_started_at?: string | null; has_replied?: boolean | null; last_import_id?: string
        }
        Relationships: [
          { foreignKeyName: "ecosystem_profiles_account_id_fkey"; columns: ["account_id"]; isOneToOne: false; referencedRelation: "instagram_accounts"; referencedColumns: ["id"] },
          { foreignKeyName: "ecosystem_profiles_last_import_id_fkey"; columns: ["last_import_id"]; isOneToOne: false; referencedRelation: "imports"; referencedColumns: ["id"] },
        ]
      }
      ecosystem_summary: {
        Row: {
          import_id: string; account_id: string; conversations_total: number; professional_count: number
          private_count: number; unanswered_pro_count: number
        }
        Insert: {
          import_id: string; account_id: string; conversations_total: number; professional_count: number
          private_count: number; unanswered_pro_count: number
        }
        Update: {
          import_id?: string; account_id?: string; conversations_total?: number; professional_count?: number
          private_count?: number; unanswered_pro_count?: number
        }
        Relationships: [
          { foreignKeyName: "ecosystem_summary_import_id_fkey"; columns: ["import_id"]; isOneToOne: true; referencedRelation: "imports"; referencedColumns: ["id"] },
        ]
      }
      cross_analyses: {
        Row: {
          id: string; account_id: string; import_id: string; code: string; dimension: string
          payload: Json; sample_size: number; window_start: string | null; window_end: string | null
          confidence: string; confidence_reason: string | null; computed_at: string
        }
        Insert: {
          id?: string; account_id: string; import_id: string; code: string; dimension?: string
          payload: Json; sample_size: number; window_start?: string | null; window_end?: string | null
          confidence: string; confidence_reason?: string | null; computed_at?: string
        }
        Update: {
          id?: string; account_id?: string; import_id?: string; code?: string; dimension?: string
          payload?: Json; sample_size?: number; window_start?: string | null; window_end?: string | null
          confidence?: string; confidence_reason?: string | null; computed_at?: string
        }
        Relationships: [
          { foreignKeyName: "cross_analyses_account_id_fkey"; columns: ["account_id"]; isOneToOne: false; referencedRelation: "instagram_accounts"; referencedColumns: ["id"] },
          { foreignKeyName: "cross_analyses_import_id_fkey"; columns: ["import_id"]; isOneToOne: false; referencedRelation: "imports"; referencedColumns: ["id"] },
        ]
      }
      content_attribution: {
        Row: {
          content_id: string; account_id: string; import_id: string; window_hours: number
          arrivals_in_window: number; baseline_expected: number; excess_arrivals: number
          meta_follows_gained: number | null; divergence_ratio: number | null; retained_at_horizon: number | null
          retention_rate: number | null; confidence: string
        }
        Insert: {
          content_id: string; account_id: string; import_id: string; window_hours?: number
          arrivals_in_window: number; baseline_expected: number; excess_arrivals: number
          meta_follows_gained?: number | null; divergence_ratio?: number | null; retained_at_horizon?: number | null
          retention_rate?: number | null; confidence: string
        }
        Update: {
          content_id?: string; account_id?: string; import_id?: string; window_hours?: number
          arrivals_in_window?: number; baseline_expected?: number; excess_arrivals?: number
          meta_follows_gained?: number | null; divergence_ratio?: number | null; retained_at_horizon?: number | null
          retention_rate?: number | null; confidence?: string
        }
        Relationships: [
          { foreignKeyName: "content_attribution_content_id_fkey"; columns: ["content_id"]; isOneToOne: false; referencedRelation: "content"; referencedColumns: ["id"] },
          { foreignKeyName: "content_attribution_import_id_fkey"; columns: ["import_id"]; isOneToOne: false; referencedRelation: "imports"; referencedColumns: ["id"] },
        ]
      }
      hazard_curve: {
        Row: {
          account_id: string; import_id: string; cohort_week: string; age_bucket: number
          at_risk: number; departed: number; hazard_rate: number
        }
        Insert: {
          account_id: string; import_id: string; cohort_week?: string; age_bucket: number
          at_risk: number; departed: number; hazard_rate: number
        }
        Update: {
          account_id?: string; import_id?: string; cohort_week?: string; age_bucket?: number
          at_risk?: number; departed?: number; hazard_rate?: number
        }
        Relationships: [
          { foreignKeyName: "hazard_curve_account_id_fkey"; columns: ["account_id"]; isOneToOne: false; referencedRelation: "instagram_accounts"; referencedColumns: ["id"] },
          { foreignKeyName: "hazard_curve_import_id_fkey"; columns: ["import_id"]; isOneToOne: false; referencedRelation: "imports"; referencedColumns: ["id"] },
        ]
      }
      acquisition_spikes: {
        Row: {
          id: string; account_id: string; import_id: string; spike_start: string; spike_end: string
          volume: number; baseline_daily: number; multiple: number; shape: string
          night_share: number | null; signal_share: number | null; retention_rate: number | null
          inferred_type: string; inference_confidence: string; linked_content_id: string | null
        }
        Insert: {
          id?: string; account_id: string; import_id: string; spike_start: string; spike_end: string
          volume: number; baseline_daily: number; multiple: number; shape: string
          night_share?: number | null; signal_share?: number | null; retention_rate?: number | null
          inferred_type: string; inference_confidence: string; linked_content_id?: string | null
        }
        Update: {
          id?: string; account_id?: string; import_id?: string; spike_start?: string; spike_end?: string
          volume?: number; baseline_daily?: number; multiple?: number; shape?: string
          night_share?: number | null; signal_share?: number | null; retention_rate?: number | null
          inferred_type?: string; inference_confidence?: string; linked_content_id?: string | null
        }
        Relationships: [
          { foreignKeyName: "acquisition_spikes_account_id_fkey"; columns: ["account_id"]; isOneToOne: false; referencedRelation: "instagram_accounts"; referencedColumns: ["id"] },
          { foreignKeyName: "acquisition_spikes_import_id_fkey"; columns: ["import_id"]; isOneToOne: false; referencedRelation: "imports"; referencedColumns: ["id"] },
          { foreignKeyName: "acquisition_spikes_linked_content_id_fkey"; columns: ["linked_content_id"]; isOneToOne: false; referencedRelation: "content"; referencedColumns: ["id"] },
        ]
      }
      manual_entries: {
        Row: {
          id: string; account_id: string; entity_type: string; entity_key: string; field: string
          value_numeric: number | null; value_text: string | null; updated_by: string | null; updated_at: string
        }
        Insert: {
          id?: string; account_id: string; entity_type: string; entity_key: string; field: string
          value_numeric?: number | null; value_text?: string | null; updated_by?: string | null; updated_at?: string
        }
        Update: {
          id?: string; account_id?: string; entity_type?: string; entity_key?: string; field?: string
          value_numeric?: number | null; value_text?: string | null; updated_by?: string | null; updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "manual_entries_account_id_fkey"; columns: ["account_id"]; isOneToOne: false; referencedRelation: "instagram_accounts"; referencedColumns: ["id"] },
        ]
      }
      inflow_geo_estimate: {
        Row: {
          account_id: string; import_id: string; country: string; estimated_pct: number
          error_margin: number; method: string; confidence: string
        }
        Insert: {
          account_id: string; import_id: string; country: string; estimated_pct: number
          error_margin: number; method?: string; confidence: string
        }
        Update: {
          account_id?: string; import_id?: string; country?: string; estimated_pct?: number
          error_margin?: number; method?: string; confidence?: string
        }
        Relationships: [
          { foreignKeyName: "inflow_geo_estimate_account_id_fkey"; columns: ["account_id"]; isOneToOne: false; referencedRelation: "instagram_accounts"; referencedColumns: ["id"] },
          { foreignKeyName: "inflow_geo_estimate_import_id_fkey"; columns: ["import_id"]; isOneToOne: false; referencedRelation: "imports"; referencedColumns: ["id"] },
        ]
      }
      reconciliation: {
        Row: {
          import_id: string; account_id: string; meta_gained: number | null; observed_arrivals: number | null
          arrivals_coverage: number | null; meta_lost: number | null; observed_departures: number | null
          departures_coverage: number | null; unobservable_reason: string | null
        }
        Insert: {
          import_id: string; account_id: string; meta_gained?: number | null; observed_arrivals?: number | null
          arrivals_coverage?: number | null; meta_lost?: number | null; observed_departures?: number | null
          departures_coverage?: number | null; unobservable_reason?: string | null
        }
        Update: {
          import_id?: string; account_id?: string; meta_gained?: number | null; observed_arrivals?: number | null
          arrivals_coverage?: number | null; meta_lost?: number | null; observed_departures?: number | null
          departures_coverage?: number | null; unobservable_reason?: string | null
        }
        Relationships: [
          { foreignKeyName: "reconciliation_import_id_fkey"; columns: ["import_id"]; isOneToOne: true; referencedRelation: "imports"; referencedColumns: ["id"] },
        ]
      }
    }
    Views: {
      acquisition_spikes_with_budget: {
        Row: {
          id: string; account_id: string; import_id: string; spike_start: string; spike_end: string
          volume: number; baseline_daily: number; multiple: number; shape: string
          night_share: number | null; signal_share: number | null; retention_rate: number | null
          inferred_type: string; inference_confidence: string; linked_content_id: string | null
          budget_eur: number | null; cout_brut_eur: number | null; cout_retenu_eur: number | null
        }
        Relationships: [
          { foreignKeyName: "acquisition_spikes_account_id_fkey"; columns: ["account_id"]; isOneToOne: false; referencedRelation: "instagram_accounts"; referencedColumns: ["id"] },
          { foreignKeyName: "acquisition_spikes_import_id_fkey"; columns: ["import_id"]; isOneToOne: false; referencedRelation: "imports"; referencedColumns: ["id"] },
        ]
      }
    }
    Functions: {
      can_manage_org: { Args: { p_org: string }; Returns: boolean }
      can_write: { Args: { p_brand: string }; Returns: boolean }
      can_write_account: { Args: { p_account: string }; Returns: boolean }
      cohort_rate_at_horizon: {
        Args: { p_account: string; p_cohort_week: string; p_horizon_days: number }
        Returns: number
      }
      create_organization: {
        Args: { p_name: string; p_slug: string }
        Returns: { created_at: string; id: string; name: string; slug: string }
      }
      ingest_resolve_usernames: {
        Args: { p_usernames: string[] }
        Returns: { profile_id: number; username: string }[]
      }
      is_platform_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
      recompute_account: { Args: { p_account_id: string }; Returns: undefined }
      reveal_usernames: {
        Args: { p_account: string; p_ids: number[] }
        Returns: { profile_id: number; username: string }[]
      }
      user_account_ids: { Args: Record<PropertyKey, never>; Returns: string[] }
      user_brand_ids: { Args: Record<PropertyKey, never>; Returns: string[] }
      user_org_ids: { Args: Record<PropertyKey, never>; Returns: string[] }
    }
    Enums: {
      follower_status: "present" | "gone" | "out_of_window" | "likely_rename"
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
