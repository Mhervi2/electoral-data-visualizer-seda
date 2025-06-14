export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      autonomous_communities: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      elections: {
        Row: {
          created_at: string | null
          id: string
          name: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      electoral_acts: {
        Row: {
          blank_votes: number
          census_total: number
          created_at: string | null
          district: string
          election_id: string | null
          id: string
          image_url: string | null
          municipality_idm: number | null
          null_votes: number
          section: string
          source_type: string
          submitted_by: string | null
          table_letter: string
          total_voters: number
        }
        Insert: {
          blank_votes?: number
          census_total: number
          created_at?: string | null
          district: string
          election_id?: string | null
          id?: string
          image_url?: string | null
          municipality_idm?: number | null
          null_votes?: number
          section: string
          source_type: string
          submitted_by?: string | null
          table_letter: string
          total_voters: number
        }
        Update: {
          blank_votes?: number
          census_total?: number
          created_at?: string | null
          district?: string
          election_id?: string | null
          id?: string
          image_url?: string | null
          municipality_idm?: number | null
          null_votes?: number
          section?: string
          source_type?: string
          submitted_by?: string | null
          table_letter?: string
          total_voters?: number
        }
        Relationships: [
          {
            foreignKeyName: "electoral_acts_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "elections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_electoral_acts_municipality"
            columns: ["municipality_idm"]
            isOneToOne: false
            referencedRelation: "mpca"
            referencedColumns: ["idm"]
          },
        ]
      }
      mpca: {
        Row: {
          ca: string | null
          id: string | null
          idca: number | null
          idm: number
          idp: number | null
          municipio: string | null
          provincia: string | null
        }
        Insert: {
          ca?: string | null
          id?: string | null
          idca?: number | null
          idm?: number
          idp?: number | null
          municipio?: string | null
          provincia?: string | null
        }
        Update: {
          ca?: string | null
          id?: string | null
          idca?: number | null
          idm?: number
          idp?: number | null
          municipio?: string | null
          provincia?: string | null
        }
        Relationships: []
      }
      municipalities: {
        Row: {
          created_at: string | null
          id: string
          name: string
          province_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          province_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          province_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "municipalities_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
        ]
      }
      party_suggestions: {
        Row: {
          created_at: string | null
          id: string
          name: string
          reviewed_at: string | null
          siglas: string
          status: string
          suggested_by: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          reviewed_at?: string | null
          siglas: string
          status?: string
          suggested_by?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          reviewed_at?: string | null
          siglas?: string
          status?: string
          suggested_by?: string | null
        }
        Relationships: []
      }
      party_votes: {
        Row: {
          created_at: string | null
          electoral_act_id: string | null
          id: string
          party_id: string | null
          votes: number
        }
        Insert: {
          created_at?: string | null
          electoral_act_id?: string | null
          id?: string
          party_id?: string | null
          votes?: number
        }
        Update: {
          created_at?: string | null
          electoral_act_id?: string | null
          id?: string
          party_id?: string | null
          votes?: number
        }
        Relationships: [
          {
            foreignKeyName: "party_votes_electoral_act_id_fkey"
            columns: ["electoral_act_id"]
            isOneToOne: false
            referencedRelation: "electoral_acts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "party_votes_electoral_act_id_fkey"
            columns: ["electoral_act_id"]
            isOneToOne: false
            referencedRelation: "electoral_acts_with_municipalities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "party_votes_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "political_parties"
            referencedColumns: ["id"]
          },
        ]
      }
      political_parties: {
        Row: {
          color: string
          created_at: string | null
          id: string
          name: string
          siglas: string
        }
        Insert: {
          color?: string
          created_at?: string | null
          id: string
          name: string
          siglas: string
        }
        Update: {
          color?: string
          created_at?: string | null
          id?: string
          name?: string
          siglas?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_admin: boolean | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          is_admin?: boolean | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_admin?: boolean | null
        }
        Relationships: []
      }
      provinces: {
        Row: {
          autonomous_community_id: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          autonomous_community_id?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          autonomous_community_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "provinces_autonomous_community_id_fkey"
            columns: ["autonomous_community_id"]
            isOneToOne: false
            referencedRelation: "autonomous_communities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      electoral_acts_with_municipalities: {
        Row: {
          blank_votes: number | null
          census_total: number | null
          comunidad_autonoma: string | null
          created_at: string | null
          district: string | null
          election_id: string | null
          id: string | null
          image_url: string | null
          municipality_idm: number | null
          municipio: string | null
          null_votes: number | null
          provincia: string | null
          section: string | null
          source_type: string | null
          submitted_by: string | null
          table_letter: string | null
          total_voters: number | null
        }
        Relationships: [
          {
            foreignKeyName: "electoral_acts_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "elections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_electoral_acts_municipality"
            columns: ["municipality_idm"]
            isOneToOne: false
            referencedRelation: "mpca"
            referencedColumns: ["idm"]
          },
        ]
      }
    }
    Functions: {
      log_audit_action: {
        Args: {
          p_action: string
          p_table_name: string
          p_record_id?: string
          p_old_values?: Json
          p_new_values?: Json
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
