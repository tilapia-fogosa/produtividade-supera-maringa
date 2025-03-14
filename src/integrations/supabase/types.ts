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
      ad_account_logs: {
        Row: {
          cliente_id: number | null
          error_message: string | null
          id: number
          new_credits: number | null
          new_status: Database["public"]["Enums"]["ad_acc_status"] | null
          previous_credits: number | null
          previous_status: Database["public"]["Enums"]["ad_acc_status"] | null
          sync_date: string | null
          sync_type: string
        }
        Insert: {
          cliente_id?: number | null
          error_message?: string | null
          id?: number
          new_credits?: number | null
          new_status?: Database["public"]["Enums"]["ad_acc_status"] | null
          previous_credits?: number | null
          previous_status?: Database["public"]["Enums"]["ad_acc_status"] | null
          sync_date?: string | null
          sync_type: string
        }
        Update: {
          cliente_id?: number | null
          error_message?: string | null
          id?: number
          new_credits?: number | null
          new_status?: Database["public"]["Enums"]["ad_acc_status"] | null
          previous_credits?: number | null
          previous_status?: Database["public"]["Enums"]["ad_acc_status"] | null
          sync_date?: string | null
          sync_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_account_logs_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          ad_acc_id: number | null
          Ad_acc_stat: Database["public"]["Enums"]["ad_acc_status"]
          bairro: string | null
          cidade: string | null
          cnpj: number | null
          cobranca_meta: Database["public"]["Enums"]["Cobrança Meta"] | null
          created_at: string
          creditos: number | null
          data_primeira_mensalidade: string | null
          desconto: number | null
          endereco: string | null
          estado: string | null
          facebook_page_id: string | null
          fim_do_contrato: string | null
          id: number
          inicio_do_contrato: string | null
          instagram_page_id: string | null
          mensalidade_fee: number | null
          nome: string | null
          orcamento_mensal: number | null
          page_token: string | null
          page_token_expires_at: string | null
          page_token_status:
            | Database["public"]["Enums"]["page_token_status"]
            | null
          preco_do_lead_15d: number | null
          preco_do_lead_3d: number | null
          preco_do_lead_7d: number | null
          prioridade: Database["public"]["Enums"]["Prioridade"] | null
          responsavel_cpf: string | null
          responsavel_email: string | null
          responsavel_financeiro_id: number | null
          responsavel_nome: string | null
          responsavel_telefone: string | null
          status: Database["public"]["Enums"]["Status"]
          token_type: number | null
          ultima_analise: string | null
          ultima_atualizacao_preco_lead: string | null
          ultimo_boleto_enviado: string | null
          ultimo_envio: string | null
        }
        Insert: {
          ad_acc_id?: number | null
          Ad_acc_stat?: Database["public"]["Enums"]["ad_acc_status"]
          bairro?: string | null
          cidade?: string | null
          cnpj?: number | null
          cobranca_meta?: Database["public"]["Enums"]["Cobrança Meta"] | null
          created_at?: string
          creditos?: number | null
          data_primeira_mensalidade?: string | null
          desconto?: number | null
          endereco?: string | null
          estado?: string | null
          facebook_page_id?: string | null
          fim_do_contrato?: string | null
          id?: number
          inicio_do_contrato?: string | null
          instagram_page_id?: string | null
          mensalidade_fee?: number | null
          nome?: string | null
          orcamento_mensal?: number | null
          page_token?: string | null
          page_token_expires_at?: string | null
          page_token_status?:
            | Database["public"]["Enums"]["page_token_status"]
            | null
          preco_do_lead_15d?: number | null
          preco_do_lead_3d?: number | null
          preco_do_lead_7d?: number | null
          prioridade?: Database["public"]["Enums"]["Prioridade"] | null
          responsavel_cpf?: string | null
          responsavel_email?: string | null
          responsavel_financeiro_id?: number | null
          responsavel_nome?: string | null
          responsavel_telefone?: string | null
          status?: Database["public"]["Enums"]["Status"]
          token_type?: number | null
          ultima_analise?: string | null
          ultima_atualizacao_preco_lead?: string | null
          ultimo_boleto_enviado?: string | null
          ultimo_envio?: string | null
        }
        Update: {
          ad_acc_id?: number | null
          Ad_acc_stat?: Database["public"]["Enums"]["ad_acc_status"]
          bairro?: string | null
          cidade?: string | null
          cnpj?: number | null
          cobranca_meta?: Database["public"]["Enums"]["Cobrança Meta"] | null
          created_at?: string
          creditos?: number | null
          data_primeira_mensalidade?: string | null
          desconto?: number | null
          endereco?: string | null
          estado?: string | null
          facebook_page_id?: string | null
          fim_do_contrato?: string | null
          id?: number
          inicio_do_contrato?: string | null
          instagram_page_id?: string | null
          mensalidade_fee?: number | null
          nome?: string | null
          orcamento_mensal?: number | null
          page_token?: string | null
          page_token_expires_at?: string | null
          page_token_status?:
            | Database["public"]["Enums"]["page_token_status"]
            | null
          preco_do_lead_15d?: number | null
          preco_do_lead_3d?: number | null
          preco_do_lead_7d?: number | null
          prioridade?: Database["public"]["Enums"]["Prioridade"] | null
          responsavel_cpf?: string | null
          responsavel_email?: string | null
          responsavel_financeiro_id?: number | null
          responsavel_nome?: string | null
          responsavel_telefone?: string | null
          status?: Database["public"]["Enums"]["Status"]
          token_type?: number | null
          ultima_analise?: string | null
          ultima_atualizacao_preco_lead?: string | null
          ultimo_boleto_enviado?: string | null
          ultimo_envio?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_responsavel_financeiro_id_fkey"
            columns: ["responsavel_financeiro_id"]
            isOneToOne: false
            referencedRelation: "membros_unidade"
            referencedColumns: ["id"]
          },
        ]
      }
      dados_importantes: {
        Row: {
          data: string | null
          id: number
          key: string
        }
        Insert: {
          data?: string | null
          id?: number
          key: string
        }
        Update: {
          data?: string | null
          id?: number
          key?: string
        }
        Relationships: []
      }
      lead_price_logs: {
        Row: {
          cliente_id: number | null
          error_message: string | null
          id: number
          preco_anterior_15d: number | null
          preco_anterior_3d: number | null
          preco_anterior_7d: number | null
          preco_novo_15d: number | null
          preco_novo_3d: number | null
          preco_novo_7d: number | null
          sync_date: string | null
        }
        Insert: {
          cliente_id?: number | null
          error_message?: string | null
          id?: number
          preco_anterior_15d?: number | null
          preco_anterior_3d?: number | null
          preco_anterior_7d?: number | null
          preco_novo_15d?: number | null
          preco_novo_3d?: number | null
          preco_novo_7d?: number | null
          sync_date?: string | null
        }
        Update: {
          cliente_id?: number | null
          error_message?: string | null
          id?: number
          preco_anterior_15d?: number | null
          preco_anterior_3d?: number | null
          preco_anterior_7d?: number | null
          preco_novo_15d?: number | null
          preco_novo_3d?: number | null
          preco_novo_7d?: number | null
          sync_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_price_logs_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      membros_unidade: {
        Row: {
          cliente_id: number | null
          email: string | null
          funcao: string | null
          id: number
          nome: string
          telefone: string | null
        }
        Insert: {
          cliente_id?: number | null
          email?: string | null
          funcao?: string | null
          id?: number
          nome: string
          telefone?: string | null
        }
        Update: {
          cliente_id?: number | null
          email?: string | null
          funcao?: string | null
          id?: number
          nome?: string
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "membros_unidade_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      scheduled_posts: {
        Row: {
          clientes_ids: number[]
          created_at: string
          error_message: string | null
          failed_clientes: Json | null
          file_path: string
          file_type: string
          id: number
          platforms: string[] | null
          post_text: string
          published_at: string | null
          scheduled_for: string
          status: Database["public"]["Enums"]["post_status"]
        }
        Insert: {
          clientes_ids: number[]
          created_at?: string
          error_message?: string | null
          failed_clientes?: Json | null
          file_path: string
          file_type: string
          id?: never
          platforms?: string[] | null
          post_text: string
          published_at?: string | null
          scheduled_for: string
          status?: Database["public"]["Enums"]["post_status"]
        }
        Update: {
          clientes_ids?: number[]
          created_at?: string
          error_message?: string | null
          failed_clientes?: Json | null
          file_path?: string
          file_type?: string
          id?: never
          platforms?: string[] | null
          post_text?: string
          published_at?: string | null
          scheduled_for?: string
          status?: Database["public"]["Enums"]["post_status"]
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          cpf: string
          created_at: string
          email: string
          id: string
          nivel_acesso: string
          nome: string
          updated_at: string
        }
        Insert: {
          cpf: string
          created_at?: string
          email: string
          id?: string
          nivel_acesso: string
          nome: string
          updated_at?: string
        }
        Update: {
          cpf?: string
          created_at?: string
          email?: string
          id?: string
          nivel_acesso?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      videos: {
        Row: {
          created_at: string
          description: string | null
          duration: number | null
          hls_url: string | null
          id: string
          name: string
          original_filename: string
          status: string
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration?: number | null
          hls_url?: string | null
          id?: string
          name: string
          original_filename: string
          status?: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration?: number | null
          hls_url?: string | null
          id?: string
          name?: string
          original_filename?: string
          status?: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cliente_necessita_analise: {
        Args: {
          ultima_analise: string
          prioridade: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          user_id: string
          required_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      ad_acc_status: "Ativa" | "Inativa"
      app_role: "admin" | "social_media" | "financeiro" | "padrao"
      "Cobrança Meta": "Boleto" | "Cartão" | "Não faz trafego"
      page_token_status: "valid" | "expired" | "pending" | "failed"
      post_status: "pending" | "published" | "failed"
      Prioridade: "Baixo" | "Médio" | "Alto" | "Quarentena"
      Status:
        | "Fechado"
        | "Onboarding"
        | "Ativo"
        | "Desligamento Programado"
        | "Desistente"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
