
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface Funcionario {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  cargo: string | null;
  turma_id: string | null;
  active: boolean;
  created_at: string;
}

export function useFuncionarios() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFuncionarios = async () => {
    try {
      setLoading(true);
      
      const { data: funcionariosData, error } = await supabase
        .from('funcionarios')
        .select('*, turma:turmas(id, nome)')
        .order('nome');

      if (error) {
        console.error('Erro ao buscar funcionários:', error);
        setError(error.message);
        return;
      }

      console.log('Funcionários encontrados:', funcionariosData);
      setFuncionarios(funcionariosData || []);
    } catch (error) {
      console.error('Erro ao buscar funcionários:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFuncionarios();
  }, []);

  const adicionarFuncionario = async (funcionario: Omit<Funcionario, 'id' | 'created_at' | 'active'>) => {
    try {
      const { data, error } = await supabase
        .from('funcionarios')
        .insert([{ 
          ...funcionario,
          active: true 
        }])
        .select()
        .single();

      if (error) {
        toast({
          title: "Erro",
          description: `Não foi possível adicionar o funcionário: ${error.message}`,
          variant: "destructive"
        });
        return null;
      }
      
      toast({
        title: "Sucesso",
        description: "Funcionário adicionado com sucesso!",
        variant: "default"
      });
      
      // Atualiza a lista de funcionários
      await fetchFuncionarios();
      
      return data;
    } catch (error) {
      console.error('Erro ao adicionar funcionário:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao adicionar o funcionário",
        variant: "destructive"
      });
      return null;
    }
  };

  const atualizarFuncionario = async (id: string, dados: Partial<Funcionario>) => {
    try {
      const { error } = await supabase
        .from('funcionarios')
        .update(dados)
        .eq('id', id);

      if (error) {
        toast({
          title: "Erro",
          description: `Não foi possível atualizar o funcionário: ${error.message}`,
          variant: "destructive"
        });
        return false;
      }
      
      toast({
        title: "Sucesso",
        description: "Funcionário atualizado com sucesso!",
        variant: "default"
      });
      
      // Atualiza a lista de funcionários
      await fetchFuncionarios();
      
      return true;
    } catch (error) {
      console.error('Erro ao atualizar funcionário:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao atualizar o funcionário",
        variant: "destructive"
      });
      return false;
    }
  };

  const removerFuncionario = async (id: string) => {
    try {
      // Em vez de excluir, apenas marca como inativo
      const { error } = await supabase
        .from('funcionarios')
        .update({ active: false })
        .eq('id', id);

      if (error) {
        toast({
          title: "Erro",
          description: `Não foi possível remover o funcionário: ${error.message}`,
          variant: "destructive"
        });
        return false;
      }
      
      toast({
        title: "Sucesso",
        description: "Funcionário removido com sucesso!",
        variant: "default"
      });
      
      // Atualiza a lista de funcionários
      await fetchFuncionarios();
      
      return true;
    } catch (error) {
      console.error('Erro ao remover funcionário:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao remover o funcionário",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    funcionarios,
    loading,
    error,
    adicionarFuncionario,
    atualizarFuncionario,
    removerFuncionario,
    recarregarFuncionarios: fetchFuncionarios
  };
}
