import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useActiveUnit } from "@/contexts/ActiveUnitContext";

export interface AlunoComFoto {
  id: string;
  nome: string;
  turma_id: string | null;
  turma_nome: string | null;
  foto_url: string | null;
  tem_foto: boolean;
  telefone: string | null;
  email: string | null;
}

export function useFotosAlunos() {
  const [alunos, setAlunos] = useState<AlunoComFoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroComFoto, setFiltroComFoto] = useState<boolean | null>(null); // null = todos, true = só com foto, false = só sem foto
  const { activeUnit } = useActiveUnit();

  const buscarAlunosComFotos = async () => {
    if (!activeUnit?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('alunos')
        .select(`
          id,
          nome,
          turma_id,
          foto_url,
          telefone,
          email,
          turmas (
            nome
          )
        `)
        .eq('active', true)
        .eq('unit_id', activeUnit.id)
        .order('nome');

      if (error) throw error;

      const alunosFormatados: AlunoComFoto[] = (data || []).map(aluno => ({
        id: aluno.id,
        nome: aluno.nome,
        turma_id: aluno.turma_id,
        turma_nome: aluno.turmas?.nome || null,
        foto_url: aluno.foto_url,
        tem_foto: !!(aluno.foto_url && aluno.foto_url.trim()),
        telefone: aluno.telefone,
        email: aluno.email,
      }));

      setAlunos(alunosFormatados);
    } catch (error) {
      console.error('Erro ao buscar alunos:', error);
    } finally {
      setLoading(false);
    }
  };

  const alunosFiltrados = alunos.filter(aluno => {
    if (filtroComFoto === null) return true; // Mostrar todos
    return aluno.tem_foto === filtroComFoto;
  });

  const contadores = {
    total: alunos.length,
    comFoto: alunos.filter(a => a.tem_foto).length,
    semFoto: alunos.filter(a => !a.tem_foto).length,
  };

  const atualizarFotoAluno = async (alunoId: string, novaFotoUrl: string | null) => {
    try {
      const { error } = await supabase
        .from('alunos')
        .update({ foto_url: novaFotoUrl })
        .eq('id', alunoId);

      if (error) throw error;

      // Atualizar estado local
      setAlunos(prev => prev.map(aluno => 
        aluno.id === alunoId 
          ? { ...aluno, foto_url: novaFotoUrl, tem_foto: !!(novaFotoUrl && novaFotoUrl.trim()) }
          : aluno
      ));

      return true;
    } catch (error) {
      console.error('Erro ao atualizar foto:', error);
      return false;
    }
  };

  useEffect(() => {
    buscarAlunosComFotos();
  }, [activeUnit?.id]);

  return {
    alunos: alunosFiltrados,
    todosAlunos: alunos,
    loading,
    contadores,
    filtroComFoto,
    setFiltroComFoto,
    atualizarFotoAluno,
    refetch: buscarAlunosComFotos,
  };
}