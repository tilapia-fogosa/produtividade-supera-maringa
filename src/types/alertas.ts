
export interface AlertaEvasao {
  id: string;
  aluno_id: string;
  data_alerta: string;
  origem_alerta: 'conversa_indireta' | 'aviso_recepcao' | 'aviso_professor_coordenador' | 'aviso_whatsapp' | 'inadimplencia' | 'outro';
  descritivo?: string;
  responsavel?: string;
  data_retencao?: string | null;
  kanban_status: string;
  created_at: string;
  updated_at: string;
}

export interface DadosAulaZero {
  motivo_procura?: string;
  percepcao_coordenador?: string;
  avaliacao_abaco?: string;
  avaliacao_ah?: string;
  pontos_atencao?: string;
}
