import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface Unit {
  id: string;
  name: string;
  unit_number: number;
}

interface ActiveUnitContextType {
  activeUnit: Unit | null;
  availableUnits: Unit[];
  setActiveUnit: (unit: Unit) => void;
  loading: boolean;
}

const ActiveUnitContext = createContext<ActiveUnitContextType | undefined>(undefined);

export const useActiveUnit = () => {
  const context = useContext(ActiveUnitContext);
  if (context === undefined) {
    throw new Error('useActiveUnit deve ser usado dentro de um ActiveUnitProvider');
  }
  return context;
};

export const ActiveUnitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeUnit, setActiveUnitState] = useState<Unit | null>(null);
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile, user } = useAuth();

  // Buscar unidades disponíveis para o usuário
  const fetchAvailableUnits = async () => {
    if (!user || !profile?.unit_ids?.length) {
      setAvailableUnits([]);
      setLoading(false);
      return;
    }

    try {
      const { data: units, error } = await supabase
        .from('units')
        .select('id, name, unit_number')
        .in('id', profile.unit_ids)
        .eq('active', true)
        .order('unit_number');

      if (error) {
        console.error('Erro ao buscar unidades:', error);
        return;
      }

      setAvailableUnits(units || []);

      // Se não há unidade ativa selecionada, pegar do localStorage ou usar a primeira
      if (!activeUnit && units && units.length > 0) {
        const savedUnitId = localStorage.getItem('activeUnitId');
        const savedUnit = savedUnitId ? units.find(u => u.id === savedUnitId) : null;
        const unitToSet = savedUnit || units[0];
        setActiveUnitState(unitToSet);
      }
    } catch (error) {
      console.error('Erro ao buscar unidades:', error);
    } finally {
      setLoading(false);
    }
  };

  // Definir unidade ativa e salvar no localStorage
  const setActiveUnit = (unit: Unit) => {
    setActiveUnitState(unit);
    localStorage.setItem('activeUnitId', unit.id);
  };

  useEffect(() => {
    if (profile) {
      fetchAvailableUnits();
    } else {
      setLoading(false);
    }
  }, [profile, user]);

  const value: ActiveUnitContextType = {
    activeUnit,
    availableUnits,
    setActiveUnit,
    loading
  };

  return (
    <ActiveUnitContext.Provider value={value}>
      {children}
    </ActiveUnitContext.Provider>
  );
};