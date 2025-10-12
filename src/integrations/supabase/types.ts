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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      checklist_answers: {
        Row: {
          checklist_record_id: string
          created_at: string | null
          id: string
          item_id: string
          observation: string | null
          value: string
        }
        Insert: {
          checklist_record_id: string
          created_at?: string | null
          id?: string
          item_id: string
          observation?: string | null
          value: string
        }
        Update: {
          checklist_record_id?: string
          created_at?: string | null
          id?: string
          item_id?: string
          observation?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_answers_checklist_record_id_fkey"
            columns: ["checklist_record_id"]
            isOneToOne: false
            referencedRelation: "checklist_records"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_approvals: {
        Row: {
          checklist_record_id: string
          comment: string | null
          created_at: string | null
          id: string
          mechanic_name: string
          timestamp: string | null
        }
        Insert: {
          checklist_record_id: string
          comment?: string | null
          created_at?: string | null
          id?: string
          mechanic_name: string
          timestamp?: string | null
        }
        Update: {
          checklist_record_id?: string
          comment?: string | null
          created_at?: string | null
          id?: string
          mechanic_name?: string
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_approvals_checklist_record_id_fkey"
            columns: ["checklist_record_id"]
            isOneToOne: false
            referencedRelation: "checklist_records"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_photos: {
        Row: {
          checklist_record_id: string
          created_at: string | null
          id: string
          item_id: string
          photo_url: string
        }
        Insert: {
          checklist_record_id: string
          created_at?: string | null
          id?: string
          item_id: string
          photo_url: string
        }
        Update: {
          checklist_record_id?: string
          created_at?: string | null
          id?: string
          item_id?: string
          photo_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_photos_checklist_record_id_fkey"
            columns: ["checklist_record_id"]
            isOneToOne: false
            referencedRelation: "checklist_records"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_records: {
        Row: {
          checklist_type: string
          conforme_items: number
          created_at: string | null
          equipment_code: string
          equipment_id: string
          equipment_model: string
          equipment_model_type: string | null
          equipment_number: string | null
          equipment_series: string | null
          has_critical_issues: boolean | null
          hour_meter: number | null
          id: string
          location: string | null
          nao_conforme_items: number
          operator_id: string
          operator_name: string
          signature: string
          status: string
          timestamp: string | null
          total_items: number
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          checklist_type?: string
          conforme_items: number
          created_at?: string | null
          equipment_code: string
          equipment_id: string
          equipment_model: string
          equipment_model_type?: string | null
          equipment_number?: string | null
          equipment_series?: string | null
          has_critical_issues?: boolean | null
          hour_meter?: number | null
          id?: string
          location?: string | null
          nao_conforme_items: number
          operator_id: string
          operator_name: string
          signature: string
          status: string
          timestamp?: string | null
          total_items: number
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          checklist_type?: string
          conforme_items?: number
          created_at?: string | null
          equipment_code?: string
          equipment_id?: string
          equipment_model?: string
          equipment_model_type?: string | null
          equipment_number?: string | null
          equipment_series?: string | null
          has_critical_issues?: boolean | null
          hour_meter?: number | null
          id?: string
          location?: string | null
          nao_conforme_items?: number
          operator_id?: string
          operator_name?: string
          signature?: string
          status?: string
          timestamp?: string | null
          total_items?: number
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_records_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_rejections: {
        Row: {
          checklist_record_id: string
          created_at: string | null
          id: string
          mechanic_name: string
          reason: string
          timestamp: string | null
        }
        Insert: {
          checklist_record_id: string
          created_at?: string | null
          id?: string
          mechanic_name: string
          reason: string
          timestamp?: string | null
        }
        Update: {
          checklist_record_id?: string
          created_at?: string | null
          id?: string
          mechanic_name?: string
          reason?: string
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_rejections_checklist_record_id_fkey"
            columns: ["checklist_record_id"]
            isOneToOne: false
            referencedRelation: "checklist_records"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          brand: string
          business_unit: string | null
          code: string
          cost_center: string | null
          created_at: string | null
          equipment_number: string | null
          equipment_series: string | null
          hour_meter: string | null
          id: string
          last_check: string | null
          last_checklist_id: string | null
          last_operation_start: string | null
          location: string | null
          model: string
          next_maintenance: string | null
          observations: string | null
          operator_id: string | null
          operator_name: string | null
          photo: string | null
          sector: string
          status: string
          unit: string | null
          updated_at: string | null
          year: number
        }
        Insert: {
          brand: string
          business_unit?: string | null
          code: string
          cost_center?: string | null
          created_at?: string | null
          equipment_number?: string | null
          equipment_series?: string | null
          hour_meter?: string | null
          id?: string
          last_check?: string | null
          last_checklist_id?: string | null
          last_operation_start?: string | null
          location?: string | null
          model: string
          next_maintenance?: string | null
          observations?: string | null
          operator_id?: string | null
          operator_name?: string | null
          photo?: string | null
          sector: string
          status: string
          unit?: string | null
          updated_at?: string | null
          year: number
        }
        Update: {
          brand?: string
          business_unit?: string | null
          code?: string
          cost_center?: string | null
          created_at?: string | null
          equipment_number?: string | null
          equipment_series?: string | null
          hour_meter?: string | null
          id?: string
          last_check?: string | null
          last_checklist_id?: string | null
          last_operation_start?: string | null
          location?: string | null
          model?: string
          next_maintenance?: string | null
          observations?: string | null
          operator_id?: string | null
          operator_name?: string | null
          photo?: string | null
          sector?: string
          status?: string
          unit?: string | null
          updated_at?: string | null
          year?: number
        }
        Relationships: []
      }
      equipment_issues: {
        Row: {
          created_at: string | null
          description: string
          equipment_id: string
          id: string
          photo: string
          timestamp: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          equipment_id: string
          id?: string
          photo: string
          timestamp?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          equipment_id?: string
          id?: string
          photo?: string
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_issues_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          matricula: string | null
          name: string
          profile: string
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          id: string
          matricula?: string | null
          name: string
          profile: string
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          id?: string
          matricula?: string | null
          name?: string
          profile?: string
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "mecanico" | "operador"
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
      app_role: ["admin", "mecanico", "operador"],
    },
  },
} as const
