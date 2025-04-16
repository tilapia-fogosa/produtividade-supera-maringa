
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { getTotalPaginasPorApostila } from '@/components/turmas/constants/apostilas';

export interface Professor {
  id: string;
  nome: string;
}

export interface Turma {
  id: string;
  nome: string;
  dia_semana: 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado' | 'domingo';
  horario: string;
  alunos?: Aluno[]; // Tornando alunos opcional
}

export interface Aluno {
  id: string;
  nome: string;
  turma_id: string;
  codigo?: string | null;
  telefone?: string | null;
  email?: string | null;
  curso?: string | null;
  matricula?: string | null;
  idade?: number | null;
  ultimo_nivel?: string | null;
  dias_apostila?: number | null;
  dias_supera?: number | null;
  vencimento_contrato?: string | null;
  ultima_pagina?: number | null;
  paginas_restantes?: number | null;
  ultima_correcao_ah?: string | null;
}

export function useProfessorTurmas() {
  const { professorId } = useParams<{ professorId: string }>();
  const navigate = useNavigate();
  
  const [professor, setProfessor] = useState<Professor | null>(null);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!professorId) {
      navigate('/');
      return;
    }

    const fetchProfessorETurmas = async () => {
      try {
        setLoading(true);
        
        // Buscar informações do professor
        const { data: professorData, error: professorError } = await supabase
          .from('professores')
          .select('id, nome')
          .eq('id', professorId)
          .single();

        if (professorError) {
          throw professorError;
        }

        setProfessor(professorData);

        // Buscar turmas do professor
        const { data: turmasData, error: turmasError } = await supabase
          .from('turmas')
          .select('*')
          .eq('professor_id', professorId)
          .order('dia_semana, horario');

        if (turmasError) {
          throw turmasError;
        }

        // Inicialização das turmas sem alunos
        const turmasIniciais = turmasData || [];
        console.log('Turmas carregadas:', turmasIniciais);
        
        // Para cada turma, buscar seus alunos
        const turmasComAlunos = await Promise.all(turmasIniciais.map(async (turma) => {
          const { data: alunosData, error: alunosError } = await supabase
            .from('alunos')
            .select('*')
            .eq('turma_id', turma.id);
            
          if (alunosError) {
            console.error('Erro ao buscar alunos da turma:', alunosError);
            return { ...turma, alunos: [] };
          }

          // Calcular páginas restantes para cada aluno
          const alunosComPaginasRestantes = alunosData?.map(aluno => {
            const totalPaginas = aluno.ultimo_nivel 
              ? getTotalPaginasPorApostila(aluno.ultimo_nivel) 
              : null;
            
            const ultimaPagina = aluno.ultima_pagina; // Agora é diretamente um número
            
            const paginasRestantes = totalPaginas && ultimaPagina != null 
              ? totalPaginas - ultimaPagina 
              : null;

            return {
              ...aluno,
              paginas_restantes: paginasRestantes
            };
          }) || [];

          return { ...turma, alunos: alunosComPaginasRestantes };
        }));

        setTurmas(turmasComAlunos);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados do professor e turmas.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfessorETurmas();
  }, [professorId, navigate]);

  return {
    professorId,
    professor,
    turmas,
    loading,
    navigate
  };
}
