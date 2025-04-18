
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Turma } from '@/hooks/use-professor-turmas';
import ServiceSelectionMenu from './ServiceSelectionMenu';
import ProdutividadeScreen from './ProdutividadeScreen';
import AbindoHorizontesScreen from './AbindoHorizontesScreen';
import DiarioTurmaScreen from './DiarioTurmaScreen';
import TurmaHeader from './TurmaHeader';

interface TurmaDetailProps {
  turma: Turma;
  onBack: () => void;
}

type ServiceType = 'menu' | 'lista_alunos' | 'ah' | 'diario_turma';

const TurmaDetail: React.FC<TurmaDetailProps> = ({ turma, onBack }) => {
  const location = useLocation();
  const [activeService, setActiveService] = useState<ServiceType>('menu');
  
  useEffect(() => {
    // Verificar se há um serviço específico na navegação
    const state = location.state as any;
    if (state?.serviceType) {
      if (state.serviceType === 'produtividade') {
        setActiveService('lista_alunos');
      } else if (state.serviceType === 'abrindo_horizontes') {
        setActiveService('ah');
      } else if (state.serviceType === 'diario_turma') {
        setActiveService('diario_turma');
      }
    }
  }, [location.state]);

  const handleServiceSelection = (service: 'lista_alunos' | 'ah' | 'diario_turma') => {
    setActiveService(service);
  };

  const renderContent = () => {
    switch (activeService) {
      case 'menu':
        return <ServiceSelectionMenu onSelectService={handleServiceSelection} />;
      case 'lista_alunos':
        return <ProdutividadeScreen turma={turma} onBack={() => setActiveService('menu')} />;
      case 'ah':
        return <AbindoHorizontesScreen turma={turma} onBack={() => setActiveService('menu')} />;
      case 'diario_turma':
        return <DiarioTurmaScreen turma={turma} onBack={() => setActiveService('menu')} />;
      default:
        return <ServiceSelectionMenu onSelectService={handleServiceSelection} />;
    }
  };

  return (
    <div className="space-y-6">
      {activeService === 'menu' && (
        <TurmaHeader turma={turma} onBack={onBack} />
      )}
      {renderContent()}
    </div>
  );
};

export default TurmaDetail;
