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
      alunos: {
        Row: {
          codigo: string | null
          created_at: string
          curso: string | null
          dias_apostila: number | null
          dias_supera: number | null
          email: string | null
          id: string
          idade: number | null
          indice: string | null
          matricula: string | null
          nome: string
          telefone: string | null
          turma_id: string
          ultimo_nivel: string | null
          vencimento_contrato: string | null
        }
        Insert: {
          codigo?: string | null
          created_at?: string
          curso?: string | null
          dias_apostila?: number | null
          dias_supera?: number | null
          email?: string | null
          id?: string
          idade?: number | null
          indice?: string | null
          matricula?: string | null
          nome: string
          telefone?: string | null
          turma_id: string
          ultimo_nivel?: string | null
          vencimento_contrato?: string | null
        }
        Update: {
          codigo?: string | null
          created_at?: string
          curso?: string | null
          dias_apostila?: number | null
          dias_supera?: number | null
          email?: string | null
          id?: string
          idade?: number | null
          indice?: string | null
          matricula?: string | null
          nome?: string
          telefone?: string | null
          turma_id?: string
          ultimo_nivel?: string | null
          vencimento_contrato?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alunos_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          ad_acc_id: number | null
          Ad_acc_stat: Database["public"]["Enums"]["ad_acc_status"]
          bairro: string | null
          cep: string | null
          cidade: string | null
          cnpj: number | null
          cobranca_meta: Database["public"]["Enums"]["Cobrança Meta"] | null
          contrato: Database["public"]["Enums"]["estado_contrato"] | null
          created_at: string
          creditos: number | null
          data_primeira_mensalidade: string | null
          desconto: number | null
          endereco: string | null
          estado: string | null
          facebook_page_id: string | null
          fim_do_contrato: string | null
          fim_do_desconto: string | null
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
          postagens_instagram_ativo: boolean | null
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
          valor_com_desconto: number | null
        }
        Insert: {
          ad_acc_id?: number | null
          Ad_acc_stat?: Database["public"]["Enums"]["ad_acc_status"]
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: number | null
          cobranca_meta?: Database["public"]["Enums"]["Cobrança Meta"] | null
          contrato?: Database["public"]["Enums"]["estado_contrato"] | null
          created_at?: string
          creditos?: number | null
          data_primeira_mensalidade?: string | null
          desconto?: number | null
          endereco?: string | null
          estado?: string | null
          facebook_page_id?: string | null
          fim_do_contrato?: string | null
          fim_do_desconto?: string | null
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
          postagens_instagram_ativo?: boolean | null
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
          valor_com_desconto?: number | null
        }
        Update: {
          ad_acc_id?: number | null
          Ad_acc_stat?: Database["public"]["Enums"]["ad_acc_status"]
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: number | null
          cobranca_meta?: Database["public"]["Enums"]["Cobrança Meta"] | null
          contrato?: Database["public"]["Enums"]["estado_contrato"] | null
          created_at?: string
          creditos?: number | null
          data_primeira_mensalidade?: string | null
          desconto?: number | null
          endereco?: string | null
          estado?: string | null
          facebook_page_id?: string | null
          fim_do_contrato?: string | null
          fim_do_desconto?: string | null
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
          postagens_instagram_ativo?: boolean | null
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
          valor_com_desconto?: number | null
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
      cursos: {
        Row: {
          data_atualizacao: string
          data_criacao: string
          descricao: string | null
          id: string
          instrutor_id: string | null
          ordem_exibicao: number
          publicado: boolean
          thumbnail_url: string | null
          titulo: string
        }
        Insert: {
          data_atualizacao?: string
          data_criacao?: string
          descricao?: string | null
          id?: string
          instrutor_id?: string | null
          ordem_exibicao?: number
          publicado?: boolean
          thumbnail_url?: string | null
          titulo: string
        }
        Update: {
          data_atualizacao?: string
          data_criacao?: string
          descricao?: string | null
          id?: string
          instrutor_id?: string | null
          ordem_exibicao?: number
          publicado?: boolean
          thumbnail_url?: string | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "cursos_instrutor_id_fkey"
            columns: ["instrutor_id"]
            isOneToOne: false
            referencedRelation: "instrutores"
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
      faturas: {
        Row: {
          cliente_id: number
          created_at: string
          data_emissao: string
          data_vencimento: string
          id: string
          observacoes: string | null
          status: string
          updated_at: string
          valor: number
        }
        Insert: {
          cliente_id: number
          created_at?: string
          data_emissao?: string
          data_vencimento: string
          id?: string
          observacoes?: string | null
          status?: string
          updated_at?: string
          valor: number
        }
        Update: {
          cliente_id?: number
          created_at?: string
          data_emissao?: string
          data_vencimento?: string
          id?: string
          observacoes?: string | null
          status?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "faturas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      instrutores: {
        Row: {
          bio: string | null
          data_atualizacao: string
          data_criacao: string
          especialidade: string | null
          foto_url: string | null
          id: string
          nome: string
        }
        Insert: {
          bio?: string | null
          data_atualizacao?: string
          data_criacao?: string
          especialidade?: string | null
          foto_url?: string | null
          id?: string
          nome: string
        }
        Update: {
          bio?: string | null
          data_atualizacao?: string
          data_criacao?: string
          especialidade?: string | null
          foto_url?: string | null
          id?: string
          nome?: string
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
          funcao: Database["public"]["Enums"]["funcao_membro"] | null
          id: number
          nome: string
          telefone: string | null
        }
        Insert: {
          cliente_id?: number | null
          email?: string | null
          funcao?: Database["public"]["Enums"]["funcao_membro"] | null
          id?: number
          nome: string
          telefone?: string | null
        }
        Update: {
          cliente_id?: number | null
          email?: string | null
          funcao?: Database["public"]["Enums"]["funcao_membro"] | null
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
      modulo_videos: {
        Row: {
          data_atualizacao: string
          data_criacao: string
          descricao: string | null
          duracao: number | null
          id: string
          modulo_id: string
          ordem: number
          titulo: string
          video_id: string
        }
        Insert: {
          data_atualizacao?: string
          data_criacao?: string
          descricao?: string | null
          duracao?: number | null
          id?: string
          modulo_id: string
          ordem?: number
          titulo: string
          video_id: string
        }
        Update: {
          data_atualizacao?: string
          data_criacao?: string
          descricao?: string | null
          duracao?: number | null
          id?: string
          modulo_id?: string
          ordem?: number
          titulo?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "modulo_videos_modulo_id_fkey"
            columns: ["modulo_id"]
            isOneToOne: false
            referencedRelation: "modulos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modulo_videos_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      modulos: {
        Row: {
          curso_id: string
          data_atualizacao: string
          data_criacao: string
          descricao: string | null
          id: string
          ordem: number
          titulo: string
        }
        Insert: {
          curso_id: string
          data_atualizacao?: string
          data_criacao?: string
          descricao?: string | null
          id?: string
          ordem?: number
          titulo: string
        }
        Update: {
          curso_id?: string
          data_atualizacao?: string
          data_criacao?: string
          descricao?: string | null
          id?: string
          ordem?: number
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "modulos_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamentos: {
        Row: {
          cliente_id: number
          comprovante_url: string | null
          created_at: string
          data_pagamento: string
          fatura_id: string | null
          id: string
          metodo_pagamento: string
          observacoes: string | null
          updated_at: string
          valor: number
        }
        Insert: {
          cliente_id: number
          comprovante_url?: string | null
          created_at?: string
          data_pagamento?: string
          fatura_id?: string | null
          id?: string
          metodo_pagamento: string
          observacoes?: string | null
          updated_at?: string
          valor: number
        }
        Update: {
          cliente_id?: number
          comprovante_url?: string | null
          created_at?: string
          data_pagamento?: string
          fatura_id?: string | null
          id?: string
          metodo_pagamento?: string
          observacoes?: string | null
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_fatura_id_fkey"
            columns: ["fatura_id"]
            isOneToOne: false
            referencedRelation: "faturas"
            referencedColumns: ["id"]
          },
        ]
      }
      presencas: {
        Row: {
          aluno_id: string
          created_at: string
          data_aula: string
          id: string
          observacao: string | null
          presente: boolean
        }
        Insert: {
          aluno_id: string
          created_at?: string
          data_aula: string
          id?: string
          observacao?: string | null
          presente?: boolean
        }
        Update: {
          aluno_id?: string
          created_at?: string
          data_aula?: string
          id?: string
          observacao?: string | null
          presente?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "presencas_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
        ]
      }
      professores: {
        Row: {
          created_at: string
          id: string
          nome: string
          unidade_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          unidade_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          unidade_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professores_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
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
      progresso_usuario: {
        Row: {
          concluido: boolean
          id: string
          porcentagem_assistida: number
          posicao_segundos: number | null
          ultima_visualizacao: string
          usuario_id: string
          video_id: string
        }
        Insert: {
          concluido?: boolean
          id?: string
          porcentagem_assistida?: number
          posicao_segundos?: number | null
          ultima_visualizacao?: string
          usuario_id: string
          video_id: string
        }
        Update: {
          concluido?: boolean
          id?: string
          porcentagem_assistida?: number
          posicao_segundos?: number | null
          ultima_visualizacao?: string
          usuario_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "progresso_usuario_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
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
      ticket_anexos: {
        Row: {
          data_upload: string
          id: string
          nome_arquivo: string
          tamanho_arquivo: number | null
          ticket_id: string
          tipo_arquivo: string | null
          url_arquivo: string
          usuario_id: string
        }
        Insert: {
          data_upload?: string
          id?: string
          nome_arquivo: string
          tamanho_arquivo?: number | null
          ticket_id: string
          tipo_arquivo?: string | null
          url_arquivo: string
          usuario_id: string
        }
        Update: {
          data_upload?: string
          id?: string
          nome_arquivo?: string
          tamanho_arquivo?: number | null
          ticket_id?: string
          tipo_arquivo?: string | null
          url_arquivo?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_anexos_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_comentarios: {
        Row: {
          conteudo: string
          data_atualizacao: string
          data_criacao: string
          id: string
          ticket_id: string
          usuario_id: string
        }
        Insert: {
          conteudo: string
          data_atualizacao?: string
          data_criacao?: string
          id?: string
          ticket_id: string
          usuario_id: string
        }
        Update: {
          conteudo?: string
          data_atualizacao?: string
          data_criacao?: string
          id?: string
          ticket_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_comentarios_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_historico: {
        Row: {
          campo_alterado: string
          data_alteracao: string
          id: string
          ticket_id: string
          usuario_id: string
          valor_anterior: string | null
          valor_novo: string | null
        }
        Insert: {
          campo_alterado: string
          data_alteracao?: string
          id?: string
          ticket_id: string
          usuario_id: string
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Update: {
          campo_alterado?: string
          data_alteracao?: string
          id?: string
          ticket_id?: string
          usuario_id?: string
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_historico_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          categoria: string | null
          cliente_id: number | null
          criado_por: string
          data_atualizacao: string
          data_criacao: string
          descricao: string | null
          id: string
          prazo: string | null
          prioridade: string | null
          responsavel_id: string | null
          status: string | null
          titulo: string
        }
        Insert: {
          categoria?: string | null
          cliente_id?: number | null
          criado_por: string
          data_atualizacao?: string
          data_criacao?: string
          descricao?: string | null
          id?: string
          prazo?: string | null
          prioridade?: string | null
          responsavel_id?: string | null
          status?: string | null
          titulo: string
        }
        Update: {
          categoria?: string | null
          cliente_id?: number | null
          criado_por?: string
          data_atualizacao?: string
          data_criacao?: string
          descricao?: string | null
          id?: string
          prazo?: string | null
          prioridade?: string | null
          responsavel_id?: string | null
          status?: string | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      turmas: {
        Row: {
          created_at: string
          dia_semana: Database["public"]["Enums"]["dia_semana"]
          horario: string
          id: string
          nome: string
          professor_id: string
        }
        Insert: {
          created_at?: string
          dia_semana: Database["public"]["Enums"]["dia_semana"]
          horario: string
          id?: string
          nome: string
          professor_id: string
        }
        Update: {
          created_at?: string
          dia_semana?: Database["public"]["Enums"]["dia_semana"]
          horario?: string
          id?: string
          nome?: string
          professor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "turmas_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professores"
            referencedColumns: ["id"]
          },
        ]
      }
      unidades: {
        Row: {
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
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
          error_message: string | null
          file_size: number | null
          hls_url: string | null
          id: string
          mime_type: string | null
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
          error_message?: string | null
          file_size?: number | null
          hls_url?: string | null
          id?: string
          mime_type?: string | null
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
          error_message?: string | null
          file_size?: number | null
          hls_url?: string | null
          id?: string
          mime_type?: string | null
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
        Args: { ultima_analise: string; prioridade: string }
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
      dia_semana:
        | "segunda"
        | "terca"
        | "quarta"
        | "quinta"
        | "sexta"
        | "sabado"
        | "domingo"
      estado_contrato: "assinado" | "esperando assinatura" | "esperando dados"
      funcao_membro: "Consultor" | "SDR" | "Financeiro" | "franqueado"
      page_token_status: "valid" | "expired" | "pending" | "failed"
      post_status: "pending" | "published" | "failed"
      Prioridade: "Baixo" | "Médio" | "Alto" | "Quarentena"
      Status:
        | "Fechado"
        | "Onboarding"
        | "Ativo"
        | "Desligamento Programado"
        | "Desistente"
      ticket_priority: "baixa" | "media" | "alta" | "critica"
      ticket_status:
        | "aberto"
        | "em_andamento"
        | "pendente"
        | "concluido"
        | "cancelado"
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
    Enums: {
      ad_acc_status: ["Ativa", "Inativa"],
      app_role: ["admin", "social_media", "financeiro", "padrao"],
      "Cobrança Meta": ["Boleto", "Cartão", "Não faz trafego"],
      dia_semana: [
        "segunda",
        "terca",
        "quarta",
        "quinta",
        "sexta",
        "sabado",
        "domingo",
      ],
      estado_contrato: ["assinado", "esperando assinatura", "esperando dados"],
      funcao_membro: ["Consultor", "SDR", "Financeiro", "franqueado"],
      page_token_status: ["valid", "expired", "pending", "failed"],
      post_status: ["pending", "published", "failed"],
      Prioridade: ["Baixo", "Médio", "Alto", "Quarentena"],
      Status: [
        "Fechado",
        "Onboarding",
        "Ativo",
        "Desligamento Programado",
        "Desistente",
      ],
      ticket_priority: ["baixa", "media", "alta", "critica"],
      ticket_status: [
        "aberto",
        "em_andamento",
        "pendente",
        "concluido",
        "cancelado",
      ],
    },
  },
} as const
