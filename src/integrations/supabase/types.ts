export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      biometric_credentials: {
        Row: {
          counter: number
          created_at: string
          credential_id: string
          device_name: string | null
          id: string
          last_used_at: string | null
          public_key: string
          user_email: string
        }
        Insert: {
          counter?: number
          created_at?: string
          credential_id: string
          device_name?: string | null
          id?: string
          last_used_at?: string | null
          public_key: string
          user_email: string
        }
        Update: {
          counter?: number
          created_at?: string
          credential_id?: string
          device_name?: string | null
          id?: string
          last_used_at?: string | null
          public_key?: string
          user_email?: string
        }
        Relationships: []
      }
      data_export_logs: {
        Row: {
          created_at: string
          error_message: string | null
          export_date: string
          file_checksum: string | null
          file_size: number | null
          id: string
          ip_address: unknown | null
          success: boolean
          tables_included: string[]
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          export_date?: string
          file_checksum?: string | null
          file_size?: number | null
          id?: string
          ip_address?: unknown | null
          success?: boolean
          tables_included: string[]
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          export_date?: string
          file_checksum?: string | null
          file_size?: number | null
          id?: string
          ip_address?: unknown | null
          success?: boolean
          tables_included?: string[]
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      election_parties: {
        Row: {
          created_at: string
          election_id: string
          id: string
          party_id: string
        }
        Insert: {
          created_at?: string
          election_id: string
          id?: string
          party_id: string
        }
        Update: {
          created_at?: string
          election_id?: string
          id?: string
          party_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "election_parties_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "elections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "election_parties_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "political_parties"
            referencedColumns: ["id"]
          },
        ]
      }
      elections: {
        Row: {
          created_at: string | null
          election_date: string | null
          election_type: string | null
          id: string
          name: string
          scope: string | null
          status: string
          total_seats: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          election_date?: string | null
          election_type?: string | null
          id?: string
          name: string
          scope?: string | null
          status?: string
          total_seats?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          election_date?: string | null
          election_type?: string | null
          id?: string
          name?: string
          scope?: string | null
          status?: string
          total_seats?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      electoral_acts: {
        Row: {
          blank_votes: number
          census_total: number | null
          completion_status: string
          created_at: string | null
          election_id: string | null
          id: string
          image_url: string | null
          mesa_identifier: string | null
          mesa_identifier_full: string | null
          municipality_idm: number | null
          null_votes: number
          source_type: string
          submitted_by: string | null
          total_voters: number | null
          updated_at: string | null
          updated_by: string | null
          version: number
        }
        Insert: {
          blank_votes?: number
          census_total?: number | null
          completion_status?: string
          created_at?: string | null
          election_id?: string | null
          id?: string
          image_url?: string | null
          mesa_identifier?: string | null
          mesa_identifier_full?: string | null
          municipality_idm?: number | null
          null_votes?: number
          source_type?: string
          submitted_by?: string | null
          total_voters?: number | null
          updated_at?: string | null
          updated_by?: string | null
          version?: number
        }
        Update: {
          blank_votes?: number
          census_total?: number | null
          completion_status?: string
          created_at?: string | null
          election_id?: string | null
          id?: string
          image_url?: string | null
          mesa_identifier?: string | null
          mesa_identifier_full?: string | null
          municipality_idm?: number | null
          null_votes?: number
          source_type?: string
          submitted_by?: string | null
          total_voters?: number | null
          updated_at?: string | null
          updated_by?: string | null
          version?: number
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
            foreignKeyName: "electoral_acts_municipality_idm_fkey"
            columns: ["municipality_idm"]
            isOneToOne: false
            referencedRelation: "mpca"
            referencedColumns: ["idm"]
          },
        ]
      }
      electoral_acts_audit_log: {
        Row: {
          action: string
          changed_at: string
          changed_by: string
          electoral_act_id: string
          field_name: string
          id: string
          new_value: string | null
          old_value: string | null
          version: number
        }
        Insert: {
          action: string
          changed_at?: string
          changed_by: string
          electoral_act_id: string
          field_name: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          version: number
        }
        Update: {
          action?: string
          changed_at?: string
          changed_by?: string
          electoral_act_id?: string
          field_name?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "electoral_acts_audit_log_electoral_act_id_fkey"
            columns: ["electoral_act_id"]
            isOneToOne: false
            referencedRelation: "electoral_acts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "electoral_acts_audit_log_electoral_act_id_fkey"
            columns: ["electoral_act_id"]
            isOneToOne: false
            referencedRelation: "electoral_acts_with_municipalities"
            referencedColumns: ["id"]
          },
        ]
      }
      mail_votes: {
        Row: {
          created_at: string | null
          dni: string
          electoral_act_id: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          dni: string
          electoral_act_id?: string | null
          id?: string
        }
        Update: {
          created_at?: string | null
          dni?: string
          electoral_act_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mail_votes_electoral_act_id_fkey"
            columns: ["electoral_act_id"]
            isOneToOne: false
            referencedRelation: "electoral_acts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mail_votes_electoral_act_id_fkey"
            columns: ["electoral_act_id"]
            isOneToOne: false
            referencedRelation: "electoral_acts_with_municipalities"
            referencedColumns: ["id"]
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
      political_party_provincial_order: {
        Row: {
          created_at: string
          id: string
          order_position: number
          party_id: string
          provincia: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_position: number
          party_id: string
          provincia: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          order_position?: number
          party_id?: string
          provincia?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_admin: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          is_admin?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_admin?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      provincial_seats: {
        Row: {
          created_at: string
          election_id: string | null
          id: string
          provincia: string
          seats: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          election_id?: string | null
          id?: string
          provincia: string
          seats: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          election_id?: string | null
          id?: string
          provincia?: string
          seats?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provincial_seats_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "elections"
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
          election_id: string | null
          id: string | null
          image_url: string | null
          mesa_identifier: string | null
          municipality_idm: number | null
          municipio: string | null
          null_votes: number | null
          provincia: string | null
          source_type: string | null
          submitted_by: string | null
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
            foreignKeyName: "electoral_acts_municipality_idm_fkey"
            columns: ["municipality_idm"]
            isOneToOne: false
            referencedRelation: "mpca"
            referencedColumns: ["idm"]
          },
        ]
      }
    }
    Functions: {
      update_territorial_name: {
        Args: { p_type: string; p_old_name: string; p_new_name: string }
        Returns: number
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
