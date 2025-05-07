
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
      alerta_evasao: {
        Row: {
          aluno_id: string
          created_at: string
          data_alerta: string
          data_retencao: string | null
          descritivo: string | null
          id: string
          kanban_status: string
          origem_alerta: string
          responsavel: string | null
          status: string
          updated_at: string
        }
        Insert: {
          aluno_id: string
          created_at?: string
          data_alerta?: string
          data_retencao?: string | null
          descritivo?: string | null
          id?: string
          kanban_status?: string
          origem_alerta: string
          responsavel?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          aluno_id?: string
          created_at?: string
          data_alerta?: string
          data_retencao?: string | null
          descritivo?: string | null
          id?: string
          kanban_status?: string
          origem_alerta?: string
          responsavel?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerta_evasao_aluno_id_fkey"
            columns: ["aluno_id"]
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          }
        ]
      },
      alertas_falta: {
        Row: {
          aluno_id: string
          created_at: string
          data_alerta: string
          data_falta: string
          detalhes: Json | null
          id: string
          professor_id: string
          resolvido_em: string | null
          resolvido_por: string | null
          slack_mensagem_id: string | null
          status: string
          tipo_criterio: string
          turma_id: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          aluno_id: string
          created_at?: string
          data_alerta?: string
          data_falta: string
          detalhes?: Json | null
          id?: string
          professor_id: string
          resolvido_em?: string | null
          resolvido_por?: string | null
          slack_mensagem_id?: string | null
          status?: string
          tipo_criterio: string
          turma_id: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          aluno_id?: string
          created_at?: string
          data_alerta?: string
          data_falta?: string
          detalhes?: Json | null
          id?: string
          professor_id?: string
          resolvido_em?: string | null
          resolvido_por?: string | null
          slack_mensagem_id?: string | null
          status?: string
          tipo_criterio?: string
          turma_id?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alertas_falta_aluno_id_fkey"
            columns: ["aluno_id"]
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_falta_professor_id_fkey"
            columns: ["professor_id"]
            referencedRelation: "professores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_falta_resolvido_por_fkey"
            columns: ["resolvido_por"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_falta_turma_id_fkey"
            columns: ["turma_id"]
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_falta_unit_id_fkey"
            columns: ["unit_id"]
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          }
        ]
      },
      alunos: {
        Row: {
          active: boolean
          avaliacao_abaco: string | null
          avaliacao_ah: string | null
          codigo: string | null
          coordenador_responsavel: string | null
          created_at: string
          curso: string | null
          data_onboarding: string | null
          dias_apostila: number | null
          dias_supera: number | null
          email: string | null
          id: string
          idade: number | null
          indice: string | null
          is_funcionario: boolean | null
          matricula: string | null
          motivo_procura: string | null
          niveldesafio: string | null
          nome: string
          percepcao_coordenador: string | null
          pontos_atencao: string | null
          telefone: string | null
          texto_devolutiva: string | null
          turma_id: string
          ultima_correcao_ah: string | null
          ultima_falta: string | null
          ultima_pagina: number | null
          ultimo_nivel: string | null
          unit_id: string
          vencimento_contrato: string | null
        }
        Insert: {
          active?: boolean
          avaliacao_abaco?: string | null
          avaliacao_ah?: string | null
          codigo?: string | null
          coordenador_responsavel?: string | null
          created_at?: string
          curso?: string | null
          data_onboarding?: string | null
          dias_apostila?: number | null
          dias_supera?: number | null
          email?: string | null
          id?: string
          idade?: number | null
          indice?: string | null
          is_funcionario?: boolean | null
          matricula?: string | null
          motivo_procura?: string | null
          niveldesafio?: string | null
          nome: string
          percepcao_coordenador?: string | null
          pontos_atencao?: string | null
          telefone?: string | null
          texto_devolutiva?: string | null
          turma_id: string
          ultima_correcao_ah?: string | null
          ultima_falta?: string | null
          ultima_pagina?: number | null
          ultimo_nivel?: string | null
          unit_id: string
          vencimento_contrato?: string | null
        }
        Update: {
          active?: boolean
          avaliacao_abaco?: string | null
          avaliacao_ah?: string | null
          codigo?: string | null
          coordenador_responsavel?: string | null
          created_at?: string
          curso?: string | null
          data_onboarding?: string | null
          dias_apostila?: number | null
          dias_supera?: number | null
          email?: string | null
          id?: string
          idade?: number | null
          indice?: string | null
          is_funcionario?: boolean | null
          matricula?: string | null
          motivo_procura?: string | null
          niveldesafio?: string | null
          nome?: string
          percepcao_coordenador?: string | null
          pontos_atencao?: string | null
          telefone?: string | null
          texto_devolutiva?: string | null
          turma_id?: string
          ultima_correcao_ah?: string | null
          ultima_falta?: string | null
          ultima_pagina?: number | null
          ultimo_nivel?: string | null
          unit_id?: string
          vencimento_contrato?: string | null
        }
        Relationships: []
      },
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
      },
      professores: {
        Row: {
          created_at: string
          email: string | null
          id: string
          nome: string
          slack_username: string | null
          telefone: string | null
          unit_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          nome: string
          slack_username?: string | null
          telefone?: string | null
          unit_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          slack_username?: string | null
          telefone?: string | null
          unit_id?: string
        }
        Relationships: []
      },
      produtividade_abaco: {
        Row: {
          aluno_id: string
          apostila: string | null
          comentario: string | null
          created_at: string
          data_aula: string
          erros: number | null
          exercicios: number | null
          fez_desafio: boolean | null
          id: string
          is_reposicao: boolean
          pagina: string | null
          presente: boolean
          updated_at: string
        }
        Insert: {
          aluno_id: string
          apostila?: string | null
          comentario?: string | null
          created_at?: string
          data_aula: string
          erros?: number | null
          exercicios?: number | null
          fez_desafio?: boolean | null
          id?: string
          is_reposicao?: boolean
          pagina?: string | null
          presente?: boolean
          updated_at?: string
        }
        Update: {
          aluno_id?: string
          apostila?: string | null
          comentario?: string | null
          created_at?: string
          data_aula?: string
          erros?: number | null
          exercicios?: number | null
          fez_desafio?: boolean | null
          id?: string
          is_reposicao?: boolean
          pagina?: string | null
          presente?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "produtividade_abaco_aluno_id_fkey"
            columns: ["aluno_id"]
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          }
        ]
      },
      turmas: {
        Row: {
          created_at: string
          dia_semana: string
          horario: string
          id: string
          nome: string
          professor_id: string
          sala: string | null
          unit_id: string
        }
        Insert: {
          created_at?: string
          dia_semana: string
          horario: string
          id?: string
          nome: string
          professor_id: string
          sala?: string | null
          unit_id: string
        }
        Update: {
          created_at?: string
          dia_semana?: string
          horario?: string
          id?: string
          nome?: string
          professor_id?: string
          sala?: string | null
          unit_id?: string
        }
        Relationships: []
      },
    }
  }
}
