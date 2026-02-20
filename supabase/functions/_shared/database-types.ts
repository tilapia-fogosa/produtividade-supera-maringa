export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      abrindo_horizontes: {
        Row: {
          aluno_id: string | null
          avaliacao_ah: string | null
          created_at: string
          id: string
          turma_id: string | null
        }
        Insert: {
          aluno_id?: string | null
          avaliacao_ah?: string | null
          created_at?: string
          id?: string
          turma_id?: string | null
        }
        Update: {
          aluno_id?: string | null
          avaliacao_ah?: string | null
          created_at?: string
          id?: string
          turma_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "abrindo_horizontes_aluno_id_fkey"
            columns: ["aluno_id"]
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "abrindo_horizontes_turma_id_fkey"
            columns: ["turma_id"]
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          }
        ]
      }
      alunos: {
        Row: {
          avaliacao_abaco: string | null
          avaliacao_ah: string | null
          created_at: string
          data_nascimento: string | null
          id: string
          matricula: string | null
          motivo_procura: string | null
          nome: string | null
          percepcao_coordenador: string | null
          pontos_atencao: string | null
          turma_id: string | null
          updated_at: string
        }
        Insert: {
          avaliacao_abaco?: string | null
          avaliacao_ah?: string | null
          created_at?: string
          data_nascimento?: string | null
          id?: string
          matricula?: string | null
          motivo_procura?: string | null
          nome?: string | null
          percepcao_coordenador?: string | null
          pontos_atencao?: string | null
          turma_id?: string | null
          updated_at?: string
        }
        Update: {
          avaliacao_abaco?: string | null
          avaliacao_ah?: string | null
          created_at?: string
          data_nascimento?: string | null
          id?: string
          matricula?: string | null
          motivo_procura?: string | null
          nome?: string | null
          percepcao_coordenador?: string | null
          pontos_atencao?: string | null
          turma_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alunos_turma_id_fkey"
            columns: ["turma_id"]
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          }
        ]
      }
      alerta_evasao: {
        Row: {
          id: string
          aluno_id: string
          descritivo: string | null
          data_alerta: string
          origem_alerta: string
          data_retencao: string | null
          responsavel: string | null
          created_at: string
          updated_at: string
          status: string
          kanban_status: string
        }
        Insert: {
          id?: string
          aluno_id: string
          descritivo?: string | null
          data_alerta?: string
          origem_alerta: string
          data_retencao?: string | null
          responsavel?: string | null
          created_at?: string
          updated_at?: string
          status?: string
          kanban_status?: string
        }
        Update: {
          id?: string
          aluno_id?: string
          descritivo?: string | null
          data_alerta?: string
          origem_alerta?: string
          data_retencao?: string | null
          responsavel?: string | null
          created_at?: string
          updated_at?: string
          status?: string
          kanban_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerta_evasao_aluno_id_fkey"
            columns: ["aluno_id"]
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          }
        ]
      }
      alertas_lancamento: {
        Row: {
          arquivado_em: string | null
          arquivado_por: string | null
          created_at: string
          data_aula: string | null
          id: string
          professor_id: string | null
          status: string | null
          turma_id: string | null
        }
        Insert: {
          arquivado_em?: string | null
          arquivado_por?: string | null
          created_at?: string
          data_aula?: string | null
          id?: string
          professor_id?: string | null
          status?: string | null
          turma_id?: string | null
        }
        Update: {
          arquivado_em?: string | null
          arquivado_por?: string | null
          created_at?: string
          data_aula?: string | null
          id?: string
          professor_id?: string | null
          status?: string | null
          turma_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alertas_lancamento_professor_id_fkey"
            columns: ["professor_id"]
            referencedRelation: "professores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_lancamento_turma_id_fkey"
            columns: ["turma_id"]
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          }
        ]
      }
      aula_experimental: {
        Row: {
          aluno_id: string | null
          created_at: string
          data_aula: string | null
          id: string
          observacoes: string | null
          professor_id: string | null
          turma_id: string | null
        }
        Insert: {
          aluno_id?: string | null
          created_at?: string
          data_aula?: string | null
          id?: string
          observacoes?: string | null
          professor_id?: string | null
          turma_id?: string | null
        }
        Update: {
          aluno_id?: string | null
          created_at?: string
          data_aula?: string | null
          id?: string
          observacoes?: string | null
          professor_id?: string | null
          turma_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aula_experimental_aluno_id_fkey"
            columns: ["aluno_id"]
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aula_experimental_professor_id_fkey"
            columns: ["professor_id"]
            referencedRelation: "professores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aula_experimental_turma_id_fkey"
            columns: ["turma_id"]
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          }
        ]
      }
      aula_zero: {
        Row: {
          aluno_id: string | null
          avaliacao_abaco: string | null
          avaliacao_ah: string | null
          created_at: string
          id: string
          motivo_procura: string | null
          observacoes: string | null
          percepcao_coordenador: string | null
          pontos_atencao: string | null
          turma_id: string | null
        }
        Insert: {
          aluno_id?: string | null
          avaliacao_abaco?: string | null
          avaliacao_ah?: string | null
          created_at?: string
          id?: string
          motivo_procura?: string | null
          observacoes?: string | null
          percepcao_coordenador?: string | null
          pontos_atencao?: string | null
          turma_id?: string | null
        }
        Update: {
          aluno_id?: string | null
          avaliacao_abaco?: string | null
          avaliacao_ah?: string | null
          created_at?: string
          id?: string
          motivo_procura?: string | null
          observacoes?: string | null
          percepcao_coordenador?: string | null
          pontos_atencao?: string | null
          turma_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aula_zero_aluno_id_fkey"
            columns: ["aluno_id"]
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aula_zero_turma_id_fkey"
            columns: ["turma_id"]
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          }
        ]
      }
      dados_importantes: {
        Row: {
          created_at: string
          data: string | null
          id: string
          key: string | null
        }
        Insert: {
          created_at?: string
          data?: string | null
          id?: string
          key?: string | null
        }
        Update: {
          created_at?: string
          data?: string | null
          id?: string
          key?: string | null
        }
        Relationships: []
      }
      devolutivas: {
        Row: {
          aluno_id: string | null
          conteudo: string | null
          created_at: string
          id: string
          turma_id: string | null
        }
        Insert: {
          aluno_id?: string | null
          conteudo?: string | null
          created_at?: string
          id?: string
          turma_id?: string | null
        }
        Update: {
          aluno_id?: string | null
          conteudo?: string | null
          created_at?: string
          id?: string
          turma_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "devolutivas_aluno_id_fkey"
            columns: ["aluno_id"]
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devolutivas_turma_id_fkey"
            columns: ["turma_id"]
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          }
        ]
      }
      diario_turma: {
        Row: {
          conteudo: string | null
          created_at: string
          data_aula: string | null
          id: string
          professor_id: string | null
          turma_id: string | null
        }
        Insert: {
          conteudo?: string | null
          created_at?: string
          data_aula?: string | null
          id?: string
          professor_id?: string | null
          turma_id?: string | null
        }
        Update: {
          conteudo?: string | null
          created_at?: string
          data_aula?: string | null
          id?: string
          professor_id?: string | null
          turma_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diario_turma_professor_id_fkey"
            columns: ["professor_id"]
            referencedRelation: "professores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diario_turma_turma_id_fkey"
            columns: ["turma_id"]
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          }
        ]
      }
      funcionarios: {
        Row: {
          created_at: string
          data_nascimento: string | null
          email: string | null
          id: string
          nome: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_nascimento?: string | null
          email?: string | null
          id?: string
          nome?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_nascimento?: string | null
          email?: string | null
          id?: string
          nome?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      kanban_cards: {
        Row: {
          alerta_evasao_id: string | null
          aluno_nome: string | null
          attached_files: Json[] | null
          column_id: string | null
          comments: Json[] | null
          created_at: string
          description: string | null
          due_date: string | null
          historico: string | null
          id: string
          last_activity: string | null
          origem: string | null
          priority: string | null
          responsavel: string | null
          retention_date: string | null
          tags: string[] | null
          title: string | null
          updated_at: string
        }
        Insert: {
          alerta_evasao_id?: string | null
          aluno_nome?: string | null
          attached_files?: Json[] | null
          column_id?: string | null
          comments?: Json[] | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          historico?: string | null
          id?: string
          last_activity?: string | null
          origem?: string | null
          priority?: string | null
          responsavel?: string | null
          retention_date?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          alerta_evasao_id?: string | null
          aluno_nome?: string | null
          attached_files?: Json[] | null
          column_id?: string | null
          comments?: Json[] | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          historico?: string | null
          id?: string
          last_activity?: string | null
          origem?: string | null
          priority?: string | null
          responsavel?: string | null
          retention_date?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kanban_cards_alerta_evasao_id_fkey"
            columns: ["alerta_evasao_id"]
            referencedRelation: "alerta_evasao"
            referencedColumns: ["id"]
          }
        ]
      }
      professores: {
        Row: {
          created_at: string
          data_nascimento: string | null
          email: string | null
          id: string
          nome: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_nascimento?: string | null
          email?: string | null
          id?: string
          nome?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_nascimento?: string | null
          email?: string | null
          id?: string
          nome?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      turmas: {
        Row: {
          created_at: string
          id: string
          nome: string | null
          professor_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome?: string | null
          professor_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string | null
          professor_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "turmas_professor_id_fkey"
            columns: ["professor_id"]
            referencedRelation: "professores"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
