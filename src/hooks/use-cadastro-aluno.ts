import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useActiveUnit } from "@/contexts/ActiveUnitContext";
import { toast } from "@/hooks/use-toast";

export interface CadastroAlunoForm {
  nome: string;
  telefone: string;
  descricao: string;
  turma_id: string;
  material_entregue: boolean;
  kit_sugerido: string;
  responsavel_financeiro: string;
  telefone_responsavel: string;
  foto_url?: string;
}

export function useCadastroAluno() {
  const [loading, setLoading] = useState(false);
  const { activeUnit } = useActiveUnit();

  const cadastrarAluno = async (dados: CadastroAlunoForm) => {
    if (!activeUnit?.id) {
      toast({
        title: "Erro",
        description: "Nenhuma unidade ativa selecionada",
        variant: "destructive",
      });
      return null;
    }

    setLoading(true);
    try {
      // Inserir o novo aluno
      const { data: novoAluno, error } = await supabase
        .from('alunos')
        .insert([
          {
            nome: dados.nome.trim(),
            telefone: dados.telefone,
            motivo_procura: dados.descricao,
            turma_id: dados.turma_id || null,
            material_entregue: dados.material_entregue,
            kit_sugerido: dados.kit_sugerido,
            responsavel: dados.responsavel_financeiro || 'o próprio',
            whatapp_contato: dados.telefone_responsavel,
            unit_id: activeUnit.id,
            active: true,
            foto_url: dados.foto_url || null,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: `Aluno ${dados.nome} cadastrado com sucesso`,
      });

      return novoAluno;
    } catch (error) {
      console.error('Erro ao cadastrar aluno:', error);
      toast({
        title: "Erro ao cadastrar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const validarFormulario = (dados: CadastroAlunoForm): string[] => {
    const erros: string[] = [];

    if (!dados.nome.trim() || dados.nome.trim().length < 3) {
      erros.push("Nome completo deve ter pelo menos 3 caracteres");
    }

    if (!dados.telefone.trim()) {
      erros.push("Telefone é obrigatório");
    }

    if (!dados.descricao.trim() || dados.descricao.trim().length < 10) {
      erros.push("Descrição deve ter pelo menos 10 caracteres");
    }

    if (!dados.turma_id) {
      erros.push("Turma é obrigatória");
    }

    if (!dados.kit_sugerido) {
      erros.push("Kit é obrigatório");
    }

    return erros;
  };

  return {
    cadastrarAluno,
    validarFormulario,
    loading,
  };
}