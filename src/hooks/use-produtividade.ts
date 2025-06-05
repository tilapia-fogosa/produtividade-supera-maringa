
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Produtividade {
  id: string;
  pessoa_id: string; // Mudança de aluno_id para pessoa_id
  tipo_pessoa: string; // Novo campo
  data_aula: string;
  presente: boolean;
  apostila: string | null;
  pagina: string | null;
  exercicios: number | null;
  erros: number | null;
  fez_desafio: boolean | null;
  comentario: string | null;
  motivo_falta: string | null; // Novo campo
  is_reposicao: boolean;
  created_at: string;
  updated_at: string;
}

export function useProdutividade(pessoaId: string) {
  const [registrando, setRegistrando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pessoaProdutividade, setPessoaProdutividade] = useState<Produtividade[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const buscarProdutividade = async () => {
    try {
      const { data, error } = await supabase
        .from('produtividade_abaco')
        .select('*')
        .eq('pessoa_id', pessoaId) // Mudança para pessoa_id
        .order('data_aula', { ascending: false });

      if (error) {
        console.error("Erro ao buscar produtividade:", error);
        setError(error.message);
        return;
      }

      setPessoaProdutividade(data || []);
    } catch (error: any) {
      console.error("Erro inesperado ao buscar produtividade:", error);
      setError(error.message || "Erro ao buscar produtividade");
    }
  };

  const registrarPresenca = async (presente: boolean, dataAula: string, motivoFalta?: string) => {
    try {
      // Verificar se é aluno ou funcionário para atualizar a data da última falta
      if (!presente) {
        // Primeiro tentar atualizar na tabela alunos
        const { error: alunoUpdateError } = await supabase
          .from('alunos')
          .update({ ultima_falta: dataAula })
          .eq('id', pessoaId);
          
        // Se falhar, tentar na tabela funcionários
        if (alunoUpdateError) {
          const { error: funcionarioUpdateError } = await supabase
            .from('funcionarios')
            .update({ ultima_falta: dataAula })
            .eq('id', pessoaId);
            
          if (funcionarioUpdateError) {
            console.error('Erro ao atualizar data da última falta:', funcionarioUpdateError);
          }
        }
      }
      
      setRegistrando(true);
      setError(null);
      setSuccess(null);

      // Determinar tipo de pessoa
      const { data: alunoExiste } = await supabase
        .from('alunos')
        .select('id')
        .eq('id', pessoaId)
        .maybeSingle();

      const tipoPessoa = alunoExiste ? 'aluno' : 'funcionario';

      const { data, error } = await supabase
        .from('produtividade_abaco')
        .insert([
          { 
            pessoa_id: pessoaId, 
            tipo_pessoa: tipoPessoa,
            data_aula: dataAula, 
            presente: presente,
            motivo_falta: motivoFalta || null
          }
        ]);

      if (error) {
        console.error("Erro ao registrar presença:", error);
        setError(error.message);
        toast({
          title: "Erro",
          description: "Não foi possível registrar a presença.",
          variant: "destructive"
        });
        return;
      }

      setSuccess("Presença registrada com sucesso!");
      toast({
        title: "Sucesso",
        description: "Presença registrada com sucesso!",
      });

      // Após registrar a presença, buscar novamente a produtividade
      await buscarProdutividade();
    } catch (error: any) {
      console.error("Erro inesperado ao registrar presença:", error);
      setError(error.message || "Erro ao registrar presença");
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao registrar a presença.",
        variant: "destructive"
      });
    } finally {
      setRegistrando(false);
    }
  };

  const registrarProdutividade = async (produtividadeData: any) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('produtividade_abaco')
        .insert([produtividadeData])
        .select()
        .single();
      
      if (error) {
        console.error("Erro ao registrar produtividade:", error);
        setError(error.message);
        toast({
          title: "Erro",
          description: "Não foi possível registrar a produtividade.",
          variant: "destructive"
        });
        return null;
      }
      
      toast({
        title: "Sucesso",
        description: "Produtividade registrada com sucesso!",
      });
      
      // Atualizar a lista de produtividade
      await buscarProdutividade();
      
      return data;
    } catch (error: any) {
      console.error("Erro inesperado ao registrar produtividade:", error);
      setError(error.message || "Erro ao registrar produtividade");
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao registrar a produtividade.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const excluirProdutividade = async (registroId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { error } = await supabase
        .from('produtividade_abaco')
        .delete()
        .eq('id', registroId);
      
      if (error) {
        console.error("Erro ao excluir registro de produtividade:", error);
        setError(error.message);
        toast({
          title: "Erro",
          description: "Não foi possível excluir o registro de produtividade.",
          variant: "destructive"
        });
        return false;
      }
      
      toast({
        title: "Sucesso",
        description: "Registro de produtividade excluído com sucesso!",
      });
      
      // Atualizar a lista de produtividade
      await buscarProdutividade();
      
      return true;
    } catch (error: any) {
      console.error("Erro inesperado ao excluir produtividade:", error);
      setError(error.message || "Erro ao excluir produtividade");
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao excluir o registro de produtividade.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    registrando,
    error,
    success,
    isLoading,
    registrarPresenca,
    registrarProdutividade,
    excluirProdutividade,
    pessoaProdutividade,
    buscarProdutividade
  };
}
