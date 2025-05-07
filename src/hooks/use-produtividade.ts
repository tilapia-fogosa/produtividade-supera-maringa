import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Produtividade {
  id: string;
  aluno_id: string;
  data_aula: string;
  presente: boolean;
  apostila: string | null;
  pagina: string | null;
  exercicios: number | null;
  erros: number | null;
  fez_desafio: boolean | null;
  comentario: string | null;
  is_reposicao: boolean;
  created_at: string;
  updated_at: string;
}

export function useProdutividade(alunoId: string) {
  const [registrando, setRegistrando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [alunoProdutividade, setAlunoProdutividade] = useState<Produtividade[]>([]);
  const { toast } = useToast();

  const buscarProdutividade = async () => {
    try {
      const { data, error } = await supabase
        .from('produtividade_abaco')
        .select('*')
        .eq('aluno_id', alunoId)
        .order('data_aula', { ascending: false });

      if (error) {
        console.error("Erro ao buscar produtividade:", error);
        setError(error.message);
        return;
      }

      setAlunoProdutividade(data || []);
    } catch (error: any) {
      console.error("Erro inesperado ao buscar produtividade:", error);
      setError(error.message || "Erro ao buscar produtividade");
    }
  };

  const registrarPresenca = async (presente: boolean, dataAula: string) => {
    try {
      // Se o aluno está ausente (falta), atualizamos o campo ultima_falta
      if (!presente) {
        const { error: updateError } = await supabase
          .from('alunos')
          .update({ ultima_falta: dataAula })
          .eq('id', alunoId);
          
        if (updateError) {
          console.error('Erro ao atualizar data da última falta:', updateError);
        }
      }
      
      setRegistrando(true);
      setError(null);
      setSuccess(null);

      const { data, error } = await supabase
        .from('produtividade_abaco')
        .insert([
          { aluno_id: alunoId, data_aula: dataAula, presente: presente }
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

      // Após registrar a presença, buscar novamente a produtividade do aluno
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

  return {
    registrando,
    error,
    success,
    registrarPresenca,
    alunoProdutividade,
    buscarProdutividade
  };
}
