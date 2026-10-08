export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          slug: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          slug: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          slug?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      diagnostic_answers: {
        Row: {
          answer_value: Json;
          created_at: string;
          id: string;
          question_id: string;
          session_id: string;
        };
        Insert: {
          answer_value: Json;
          created_at?: string;
          id?: string;
          question_id: string;
          session_id: string;
        };
        Update: {
          answer_value?: Json;
          created_at?: string;
          id?: string;
          question_id?: string;
          session_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "diagnostic_answers_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "diagnostic_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      diagnostic_contacts: {
        Row: {
          business_name: string | null;
          created_at: string;
          email: string;
          full_name: string;
          id: string;
          link: string | null;
          marketing_consent: boolean;
          phone: string;
          review_consent: boolean;
          review_request: string | null;
          session_id: string;
          status: string;
        };
        Insert: {
          business_name?: string | null;
          created_at?: string;
          email: string;
          full_name: string;
          id?: string;
          link?: string | null;
          marketing_consent?: boolean;
          phone: string;
          review_consent: boolean;
          review_request?: string | null;
          session_id: string;
          status?: string;
        };
        Update: {
          business_name?: string | null;
          created_at?: string;
          email?: string;
          full_name?: string;
          id?: string;
          link?: string | null;
          marketing_consent?: boolean;
          phone?: string;
          review_consent?: boolean;
          review_request?: string | null;
          session_id?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "diagnostic_contacts_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: true;
            referencedRelation: "diagnostic_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      diagnostic_events: {
        Row: {
          ai_fallback_reason: string | null;
          answer: Json | null;
          attribution: Json | null;
          created_at: string;
          event_name: string;
          id: string;
          lead_tier: string | null;
          occurred_at: string;
          primary_solution: string | null;
          question_id: string | null;
          session_id: string | null;
        };
        Insert: {
          ai_fallback_reason?: string | null;
          answer?: Json | null;
          attribution?: Json | null;
          created_at?: string;
          event_name: string;
          id?: string;
          lead_tier?: string | null;
          occurred_at: string;
          primary_solution?: string | null;
          question_id?: string | null;
          session_id?: string | null;
        };
        Update: {
          ai_fallback_reason?: string | null;
          answer?: Json | null;
          attribution?: Json | null;
          created_at?: string;
          event_name?: string;
          id?: string;
          lead_tier?: string | null;
          occurred_at?: string;
          primary_solution?: string | null;
          question_id?: string | null;
          session_id?: string | null;
        };
        Relationships: [];
      };
      diagnostic_lead_briefs: {
        Row: {
          client_audit_md: string | null;
          created_at: string;
          evidence_md: string | null;
          id: string;
          internal_brief_md: string | null;
          session_id: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          client_audit_md?: string | null;
          created_at?: string;
          evidence_md?: string | null;
          id?: string;
          internal_brief_md?: string | null;
          session_id: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          client_audit_md?: string | null;
          created_at?: string;
          evidence_md?: string | null;
          id?: string;
          internal_brief_md?: string | null;
          session_id?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "diagnostic_lead_briefs_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: true;
            referencedRelation: "diagnostic_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      diagnostic_sessions: {
        Row: {
          completed_at: string | null;
          created_at: string;
          id: string;
          is_test: boolean;
          lead_tier: string | null;
          primary_solution: string | null;
          result_snapshot: Json | null;
          scores: Json | null;
          started_at: string;
          utm: Json | null;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          is_test?: boolean;
          lead_tier?: string | null;
          primary_solution?: string | null;
          result_snapshot?: Json | null;
          scores?: Json | null;
          started_at?: string;
          utm?: Json | null;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          is_test?: boolean;
          lead_tier?: string | null;
          primary_solution?: string | null;
          result_snapshot?: Json | null;
          scores?: Json | null;
          started_at?: string;
          utm?: Json | null;
        };
        Relationships: [];
      };
      project_categories: {
        Row: {
          category_id: string;
          project_id: string;
        };
        Insert: {
          category_id: string;
          project_id: string;
        };
        Update: {
          category_id?: string;
          project_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_categories_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_categories_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          client: string | null;
          content: Json;
          cover_image_url: string | null;
          created_at: string;
          description: string | null;
          featured: boolean;
          headline: string | null;
          homepage_image_url: string | null;
          homepage_order: number | null;
          id: string;
          projects_image_url: string | null;
          projects_order: number | null;
          published: boolean;
          services: string[];
          short_description: string | null;
          show_on_homepage: boolean;
          show_on_projects: boolean;
          slug: string | null;
          title: string;
          updated_at: string;
          year: number | null;
        };
        Insert: {
          client?: string | null;
          content?: Json;
          cover_image_url?: string | null;
          created_at?: string;
          description?: string | null;
          featured?: boolean;
          headline?: string | null;
          homepage_image_url?: string | null;
          homepage_order?: number | null;
          id?: string;
          projects_image_url?: string | null;
          projects_order?: number | null;
          published?: boolean;
          services?: string[];
          short_description?: string | null;
          show_on_homepage?: boolean;
          show_on_projects?: boolean;
          slug?: string | null;
          title: string;
          updated_at?: string;
          year?: number | null;
        };
        Update: {
          client?: string | null;
          content?: Json;
          cover_image_url?: string | null;
          created_at?: string;
          description?: string | null;
          featured?: boolean;
          headline?: string | null;
          homepage_image_url?: string | null;
          homepage_order?: number | null;
          id?: string;
          projects_image_url?: string | null;
          projects_order?: number | null;
          published?: boolean;
          services?: string[];
          short_description?: string | null;
          show_on_homepage?: boolean;
          show_on_projects?: boolean;
          slug?: string | null;
          title?: string;
          updated_at?: string;
          year?: number | null;
        };
        Relationships: [];
      };
    };
    Views: {
      diagnostic_production_events: {
        Row: {
          ai_fallback_reason: string | null;
          answer: Json | null;
          attribution: Json | null;
          created_at: string | null;
          event_name: string | null;
          id: string | null;
          lead_tier: string | null;
          occurred_at: string | null;
          primary_solution: string | null;
          question_id: string | null;
          session_id: string | null;
        };
        Insert: {
          ai_fallback_reason?: string | null;
          answer?: Json | null;
          attribution?: Json | null;
          created_at?: string | null;
          event_name?: string | null;
          id?: string | null;
          lead_tier?: string | null;
          occurred_at?: string | null;
          primary_solution?: string | null;
          question_id?: string | null;
          session_id?: string | null;
        };
        Update: {
          ai_fallback_reason?: string | null;
          answer?: Json | null;
          attribution?: Json | null;
          created_at?: string | null;
          event_name?: string | null;
          id?: string | null;
          lead_tier?: string | null;
          occurred_at?: string | null;
          primary_solution?: string | null;
          question_id?: string | null;
          session_id?: string | null;
        };
        Relationships: [];
      };
      diagnostic_test_events: {
        Row: {
          ai_fallback_reason: string | null;
          answer: Json | null;
          attribution: Json | null;
          created_at: string | null;
          event_name: string | null;
          id: string | null;
          lead_tier: string | null;
          occurred_at: string | null;
          primary_solution: string | null;
          question_id: string | null;
          session_id: string | null;
        };
        Insert: {
          ai_fallback_reason?: string | null;
          answer?: Json | null;
          attribution?: Json | null;
          created_at?: string | null;
          event_name?: string | null;
          id?: string | null;
          lead_tier?: string | null;
          occurred_at?: string | null;
          primary_solution?: string | null;
          question_id?: string | null;
          session_id?: string | null;
        };
        Update: {
          ai_fallback_reason?: string | null;
          answer?: Json | null;
          attribution?: Json | null;
          created_at?: string | null;
          event_name?: string | null;
          id?: string | null;
          lead_tier?: string | null;
          occurred_at?: string | null;
          primary_solution?: string | null;
          question_id?: string | null;
          session_id?: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      cms_save_project: {
        Args: {
          category_ids: string[];
          project_data: Json;
          project_id: string;
        };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
