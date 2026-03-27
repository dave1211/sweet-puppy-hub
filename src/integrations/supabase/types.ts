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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          address: string
          created_at: string
          device_id: string
          direction: string
          enabled: boolean
          id: string
          kind: string
          threshold: number
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          created_at?: string
          device_id: string
          direction: string
          enabled?: boolean
          id?: string
          kind: string
          threshold: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          address?: string
          created_at?: string
          device_id?: string
          direction?: string
          enabled?: boolean
          id?: string
          kind?: string
          threshold?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      analytics_daily: {
        Row: {
          active_users: number | null
          alerts_created: number | null
          created_at: string
          date: string
          id: string
          launches_count: number | null
          metadata: Json | null
          new_users: number | null
          premium_users: number | null
          referral_signups: number | null
          revenue_sol: number | null
          sniper_uses: number | null
          top_tokens: Json | null
          total_users: number | null
        }
        Insert: {
          active_users?: number | null
          alerts_created?: number | null
          created_at?: string
          date: string
          id?: string
          launches_count?: number | null
          metadata?: Json | null
          new_users?: number | null
          premium_users?: number | null
          referral_signups?: number | null
          revenue_sol?: number | null
          sniper_uses?: number | null
          top_tokens?: Json | null
          total_users?: number | null
        }
        Update: {
          active_users?: number | null
          alerts_created?: number | null
          created_at?: string
          date?: string
          id?: string
          launches_count?: number | null
          metadata?: Json | null
          new_users?: number | null
          premium_users?: number | null
          referral_signups?: number | null
          revenue_sol?: number | null
          sniper_uses?: number | null
          top_tokens?: Json | null
          total_users?: number | null
        }
        Relationships: []
      }
      anomaly_events: {
        Row: {
          actor_id: string | null
          actor_type: string | null
          created_at: string
          description: string | null
          event_type: string
          id: string
          metadata: Json | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          actor_id?: string | null
          actor_type?: string | null
          created_at?: string
          description?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          actor_id?: string | null
          actor_type?: string | null
          created_at?: string
          description?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      burn_history: {
        Row: {
          account_closed: boolean
          amount: number
          created_at: string
          decimals: number
          id: string
          rent_reclaimed: number | null
          signature: string
          token_mint: string
          token_name: string
          token_symbol: string
          user_id: string
          wallet_address: string
        }
        Insert: {
          account_closed?: boolean
          amount: number
          created_at?: string
          decimals?: number
          id?: string
          rent_reclaimed?: number | null
          signature: string
          token_mint: string
          token_name: string
          token_symbol: string
          user_id?: string
          wallet_address: string
        }
        Update: {
          account_closed?: boolean
          amount?: number
          created_at?: string
          decimals?: number
          id?: string
          rent_reclaimed?: number | null
          signature?: string
          token_mint?: string
          token_name?: string
          token_symbol?: string
          user_id?: string
          wallet_address?: string
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          created_at: string
          description: string | null
          enabled: boolean
          id: string
          key: string
          metadata: Json | null
          min_tier: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          key: string
          metadata?: Json | null
          min_tier?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          key?: string
          metadata?: Json | null
          min_tier?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      growth_metrics: {
        Row: {
          active_users: number | null
          churn: number | null
          created_at: string | null
          date: string
          dau_over_mau: number | null
          id: string
          referral_signups: number | null
          revenue_usd: number | null
          signups: number | null
          upgrades: number | null
          wallet_connects: number | null
        }
        Insert: {
          active_users?: number | null
          churn?: number | null
          created_at?: string | null
          date: string
          dau_over_mau?: number | null
          id?: string
          referral_signups?: number | null
          revenue_usd?: number | null
          signups?: number | null
          upgrades?: number | null
          wallet_connects?: number | null
        }
        Update: {
          active_users?: number | null
          churn?: number | null
          created_at?: string | null
          date?: string
          dau_over_mau?: number | null
          id?: string
          referral_signups?: number | null
          revenue_usd?: number | null
          signups?: number | null
          upgrades?: number | null
          wallet_connects?: number | null
        }
        Relationships: []
      }
      invite_codes: {
        Row: {
          active: boolean
          allocated_to: string | null
          code: string
          created_at: string
          created_by: string | null
          current_uses: number
          expires_at: string | null
          id: string
          label: string | null
          max_uses: number
          metadata: Json | null
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          active?: boolean
          allocated_to?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          current_uses?: number
          expires_at?: string | null
          id?: string
          label?: string | null
          max_uses?: number
          metadata?: Json | null
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          active?: boolean
          allocated_to?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          current_uses?: number
          expires_at?: string | null
          id?: string
          label?: string | null
          max_uses?: number
          metadata?: Json | null
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      launches: {
        Row: {
          created_at: string
          creator_user_id: string | null
          featured: boolean
          fee_paid: boolean
          fee_sol: number
          id: string
          metadata: Json | null
          status: string
          token_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_user_id?: string | null
          featured?: boolean
          fee_paid?: boolean
          fee_sol?: number
          id?: string
          metadata?: Json | null
          status?: string
          token_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_user_id?: string | null
          featured?: boolean
          fee_paid?: boolean
          fee_sol?: number
          id?: string
          metadata?: Json | null
          status?: string
          token_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "launches_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      merch_products: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          in_stock: boolean
          name: string
          price: number
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean
          name: string
          price: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean
          name?: string
          price?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          body: string | null
          category: string
          created_at: string
          id: string
          metadata: Json | null
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          body?: string | null
          category?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          body?: string | null
          category?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      points_log: {
        Row: {
          action: string
          claim_date: string
          created_at: string
          id: string
          points: number
          user_id: string
        }
        Insert: {
          action: string
          claim_date?: string
          created_at?: string
          id?: string
          points: number
          user_id?: string
        }
        Update: {
          action?: string
          claim_date?: string
          created_at?: string
          id?: string
          points?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          onboarded: boolean
          tier: string
          updated_at: string
          wallet_address: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          onboarded?: boolean
          tier?: string
          updated_at?: string
          wallet_address?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          onboarded?: boolean
          tier?: string
          updated_at?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      referral_invites: {
        Row: {
          created_at: string | null
          id: string
          invite_code: string
          inviter_id: string
          tier: string | null
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          invite_code: string
          inviter_id: string
          tier?: string | null
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          invite_code?: string
          inviter_id?: string
          tier?: string | null
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      rewards: {
        Row: {
          created_at: string
          device_id: string
          id: string
          points: number
          referral_code: string
          referred_by: string | null
          total_referrals: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_id: string
          id?: string
          points?: number
          referral_code: string
          referred_by?: string | null
          total_referrals?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          device_id?: string
          id?: string
          points?: number
          referral_code?: string
          referred_by?: string | null
          total_referrals?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      risk_scores: {
        Row: {
          concentration_warning: boolean
          created_at: string
          factors: Json
          id: string
          liquidity_warning: boolean
          score: number
          summary: string | null
          suspicious_activity: boolean
          token_address: string
          updated_at: string
          verdict: string
        }
        Insert: {
          concentration_warning?: boolean
          created_at?: string
          factors?: Json
          id?: string
          liquidity_warning?: boolean
          score?: number
          summary?: string | null
          suspicious_activity?: boolean
          token_address: string
          updated_at?: string
          verdict?: string
        }
        Update: {
          concentration_warning?: boolean
          created_at?: string
          factors?: Json
          id?: string
          liquidity_warning?: boolean
          score?: number
          summary?: string | null
          suspicious_activity?: boolean
          token_address?: string
          updated_at?: string
          verdict?: string
        }
        Relationships: []
      }
      signal_events: {
        Row: {
          category: string
          confidence: number
          created_at: string
          id: string
          processed: boolean
          raw_data: Json | null
          score: number | null
          severity: string
          source: string
          source_type: string
          summary: string | null
          tags: string[] | null
          token_address: string | null
          wallet_address: string | null
        }
        Insert: {
          category: string
          confidence?: number
          created_at?: string
          id?: string
          processed?: boolean
          raw_data?: Json | null
          score?: number | null
          severity?: string
          source: string
          source_type?: string
          summary?: string | null
          tags?: string[] | null
          token_address?: string | null
          wallet_address?: string | null
        }
        Update: {
          category?: string
          confidence?: number
          created_at?: string
          id?: string
          processed?: boolean
          raw_data?: Json | null
          score?: number | null
          severity?: string
          source?: string
          source_type?: string
          summary?: string | null
          tags?: string[] | null
          token_address?: string | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      snipe_history: {
        Row: {
          amount_sol: number
          created_at: string
          device_id: string
          entry_price: number
          entry_time: string
          exit_price: number | null
          exit_time: string | null
          id: string
          pnl_percent: number | null
          risk: number
          score: number
          state: string
          status: string
          token_address: string
          token_name: string
          token_symbol: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_sol?: number
          created_at?: string
          device_id: string
          entry_price?: number
          entry_time?: string
          exit_price?: number | null
          exit_time?: string | null
          id?: string
          pnl_percent?: number | null
          risk?: number
          score?: number
          state?: string
          status?: string
          token_address: string
          token_name: string
          token_symbol: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          amount_sol?: number
          created_at?: string
          device_id?: string
          entry_price?: number
          entry_time?: string
          exit_price?: number | null
          exit_time?: string | null
          id?: string
          pnl_percent?: number | null
          risk?: number
          score?: number
          state?: string
          status?: string
          token_address?: string
          token_name?: string
          token_symbol?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sniper_opportunities: {
        Row: {
          action_label: string
          confidence: number
          created_at: string
          expires_at: string | null
          explanation: string | null
          freshness_score: number | null
          id: string
          liquidity_score: number | null
          momentum_score: number | null
          risk_score: number | null
          smart_money_score: number | null
          sniper_score: number
          tags: string[] | null
          token_address: string
          token_name: string | null
          token_symbol: string | null
          updated_at: string
          urgency: string
          whale_score: number | null
        }
        Insert: {
          action_label?: string
          confidence?: number
          created_at?: string
          expires_at?: string | null
          explanation?: string | null
          freshness_score?: number | null
          id?: string
          liquidity_score?: number | null
          momentum_score?: number | null
          risk_score?: number | null
          smart_money_score?: number | null
          sniper_score?: number
          tags?: string[] | null
          token_address: string
          token_name?: string | null
          token_symbol?: string | null
          updated_at?: string
          urgency?: string
          whale_score?: number | null
        }
        Update: {
          action_label?: string
          confidence?: number
          created_at?: string
          expires_at?: string | null
          explanation?: string | null
          freshness_score?: number | null
          id?: string
          liquidity_score?: number | null
          momentum_score?: number | null
          risk_score?: number | null
          smart_money_score?: number | null
          sniper_score?: number
          tags?: string[] | null
          token_address?: string
          token_name?: string | null
          token_symbol?: string | null
          updated_at?: string
          urgency?: string
          whale_score?: number | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          external_id: string | null
          id: string
          payment_provider: string | null
          started_at: string
          status: string
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          external_id?: string | null
          id?: string
          payment_provider?: string | null
          started_at?: string
          status?: string
          tier?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          external_id?: string | null
          id?: string
          payment_provider?: string | null
          started_at?: string
          status?: string
          tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tokens: {
        Row: {
          address: string
          chain: string
          created_at: string
          description: string | null
          dex_id: string | null
          first_seen_at: string
          id: string
          image_url: string | null
          name: string
          symbol: string
          telegram: string | null
          twitter: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address: string
          chain?: string
          created_at?: string
          description?: string | null
          dex_id?: string | null
          first_seen_at?: string
          id?: string
          image_url?: string | null
          name: string
          symbol: string
          telegram?: string | null
          twitter?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string
          chain?: string
          created_at?: string
          description?: string | null
          dex_id?: string | null
          first_seen_at?: string
          id?: string
          image_url?: string | null
          name?: string
          symbol?: string
          telegram?: string | null
          twitter?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      tracked_wallets: {
        Row: {
          address: string
          created_at: string
          device_id: string
          id: string
          label: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          created_at?: string
          device_id: string
          id?: string
          label?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          address?: string
          created_at?: string
          device_id?: string
          id?: string
          label?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      usage_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          session_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          session_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          session_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      wallet_profiles: {
        Row: {
          address: string
          chain: string
          created_at: string
          id: string
          is_primary: boolean
          is_watch_only: boolean
          label: string | null
          metadata: Json | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          chain?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          is_watch_only?: boolean
          label?: string | null
          metadata?: Json | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          chain?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          is_watch_only?: boolean
          label?: string | null
          metadata?: Json | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      watchlist: {
        Row: {
          address: string
          created_at: string
          device_id: string
          id: string
          label: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          created_at?: string
          device_id: string
          id?: string
          label?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          address?: string
          created_at?: string
          device_id?: string
          id?: string
          label?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_reward_points: { Args: { p_action: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      initialize_rewards: {
        Args: {
          p_device_id: string
          p_referral_code: string
          p_referred_by?: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
