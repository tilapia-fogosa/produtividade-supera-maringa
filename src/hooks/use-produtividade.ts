
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

export function useProdutividade(pessoaId?: string) {
  const [registrando, setRegistrando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pessoaProdutividade, setPessoaProdutividade] = useState<Produtividade[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const buscarProdutividade = async (targetPessoaId?: string) => {
    try {
      const idToUse = targetPessoaId || pessoaId;
      
      // Verificar se o ID é válido antes de fazer a consulta
      if (!idToUse || idToUse.trim() === '') {
        console.log('ID da pessoa não fornecido ou vazio, pulando busca de produtividade');
        setPessoaProdutividade([]);
        return;
      }

      const { data, error } = await supabase
        .from('produtividade_abaco')
        .select('*')
        .eq('pessoa_id', idToUse)
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

  const registrarPresenca = async (presente: boolean, dataAula: string, motivoFalta?: string, targetPessoaId?: string) => {
    try {
      const idToUse = targetPessoaId || pessoaId;
      
      if (!idToUse) {
        console.error('ID da pessoa não fornecido');
        setError('ID da pessoa é obrigatório');
        return;
      }

      // Verificar se é aluno ou funcionário para atualizar a data da última falta
      if (!presente) {
        // Primeiro tentar atualizar na tabela alunos
        const { error: alunoUpdateError } = await supabase
          .from('alunos')
          .update({ ultima_falta: dataAula })
          .eq('id', idToUse);
          
        // Se falhar, tentar na tabela funcionários
        if (alunoUpdateError) {
          const { error: funcionarioUpdateError } = await supabase
            .from('funcionarios')
            .update({ ultima_falta: dataAula })
            .eq('id', idToUse);
            
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
        .eq('id', idToUse)
        .maybeSingle();

      const tipoPessoa = alunoExiste ? 'aluno' : 'funcionario';

      const { data, error } = await supabase
        .from('produtividade_abaco')
        .insert([
          { 
            pessoa_id: idToUse, 
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
      await buscarProdutividade(idToUse);
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
      
      console.log('🔄 excluirProdutividade: Iniciando exclusão do registro:', registroId);
      
      // Validar ID do registro
      if (!registroId || typeof registroId !== 'string' || registroId.trim() === '') {
        console.error('❌ excluirProdutividade: ID do registro inválido:', registroId);
        setError('ID do registro é obrigatório');
        toast({
          title: "Erro",
          description: "ID do registro não fornecido.",
          variant: "destructive"
        });
        return false;
      }
      
      console.log('✅ excluirProdutividade: ID válido, executando exclusão...');
      
      const { error } = await supabase
        .from('produtividade_abaco')
        .delete()
        .eq('id', registroId);
      
      if (error) {
        console.error("❌ excluirProdutividade: Erro no Supabase:", error);
        setError(error.message);
        toast({
          title: "Erro",
          description: "Não foi possível excluir o registro de produtividade.",
          variant: "destructive"
        });
        return false;
      }
      
      console.log('✅ excluirProdutividade: Registro excluído com sucesso');
      
      toast({
        title: "Sucesso",
        description: "Registro excluído com sucesso!",
      });
      
      return true;
    } catch (error: any) {
      console.error("❌ excluirProdutividade: Erro inesperado:", error);
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
