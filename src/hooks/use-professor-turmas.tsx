import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Professor {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  unit_id: string;
}

export interface Turma {
  id: string;
  nome: string;
  professor_id: string;
  horario: string;
  sala: string | null;
  dia_semana: "segunda" | "terca" | "quarta" | "quinta" | "sexta" | "sabado" | "domingo";
  unit_id: string;
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
  niveldesafio?: string; // Alterado para string
  ultima_correcao_ah?: string;
  unit_id?: string;
}

export function useProfessorTurmas() {
  const navigate = useNavigate();
  const [professor, setProfessor] = useState<Professor | null>(null);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchProfessorTurmas = async () => {
      try {
        setLoading(true);
        
        const { data: professorData, error: professorError } = await supabase
          .from('professores')
          .select('*')
          .single();
          
        if (professorError) throw professorError;
        
        const { data: turmasData, error: turmasError } = await supabase
          .from('turmas')
          .select('*')
          .eq('professor_id', professorData.id)
          .eq('unit_id', professorData.unit_id);
          
        if (turmasError) throw turmasError;
        
        const professorCompleto: Professor = {
          ...professorData,
          email: professorData.email || '',
          telefone: professorData.telefone || ''
        };
        
        const turmasCompletas: Turma[] = (turmasData || []).map(turma => ({
          ...turma,
          sala: turma.sala || '',
          dia_semana: turma.dia_semana || 'segunda'
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
