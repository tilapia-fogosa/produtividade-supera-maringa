
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Professor {
  id: string;
  nome: string;
  email: string;
  telefone: string;
}

export interface Turma {
  id: string;
  nome: string;
  professor_id: string;
  horario: string;
  sala: string;
  dia_semana?: "segunda" | "terca" | "quarta" | "quinta" | "sexta" | "sabado" | "domingo";
}

export interface Aluno {
  id: string;
  nome: string;
  turma_id: string;
  codigo?: string;
  email?: string;
  telefone?: string;
  active: boolean;
  ultimo_nivel?: string;
  ultima_pagina?: number;
  niveldesafio?: number;
  ultima_correcao_ah?: string;
}

// Função useProfessorTurmas
export function useProfessorTurmas() {
  const navigate = useNavigate();
  const [professor, setProfessor] = useState<Professor | null>(null);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchProfessorTurmas = async () => {
      try {
        setLoading(true);
        
        // Obtém o professor
        const { data: professorData, error: professorError } = await supabase
          .from('professores')
          .select('*')
          .single();
          
        if (professorError) throw professorError;
        
        // Obtém as turmas do professor
        const { data: turmasData, error: turmasError } = await supabase
          .from('turmas')
          .select('*')
          .eq('professor_id', professorData.id);
          
        if (turmasError) throw turmasError;
        
        // Garantir que o professor tenha todos os campos necessários
        const professorCompleto: Professor = {
          ...professorData,
          email: professorData.email || '',
          telefone: professorData.telefone || ''
        };
        
        // Garantir que as turmas tenham o campo sala
        const turmasCompletas: Turma[] = (turmasData || []).map(turma => ({
          ...turma,
          sala: turma.sala || ''
        }));
        
        setProfessor(professorCompleto);
        setTurmas(turmasCompletas);
      } catch (error) {
        console.error('Erro ao carregar professor e turmas:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfessorTurmas();
  }, []);

  return { professor, turmas, loading, navigate };
}
