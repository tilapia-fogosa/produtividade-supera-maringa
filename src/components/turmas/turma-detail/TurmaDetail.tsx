
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Turma } from '@/hooks/use-professor-turmas';
import ProdutividadeScreen from './ProdutividadeScreen';
import AbindoHorizontesScreen from './AbindoHorizontesScreen';
import DiarioTurmaScreen from './DiarioTurmaScreen';
import TurmaHeader from './TurmaHeader';

interface TurmaDetailProps {
  turma: Turma;
  onBack: () => void;
}

type ServiceType = 'lista_alunos' | 'ah' | 'diario_turma';

const TurmaDetail: React.FC<TurmaDetailProps> = ({ turma, onBack }) => {
  const location = useLocation();
  const state = location.state as any;
  const serviceType: ServiceType = 
    state?.serviceType === 'abrindo_horizontes' 
      ? 'ah' 
      : state?.serviceType === 'diario_turma'
        ? 'diario_turma'
        : 'lista_alunos';

  const renderContent = () => {
    switch (serviceType) {
      case 'lista_alunos':
        return <ProdutividadeScreen turma={turma} onBack={onBack} />;
      case 'ah':
        return <AbindoHorizontesScreen turma={turma} onBack={onBack} />;
      case 'diario_turma':
        return <DiarioTurmaScreen turma={turma} onBack={onBack} />;
      default:
        return <ProdutividadeScreen turma={turma} onBack={onBack} />;
    }
  };

  return (
    <div className="space-y-6">
      <TurmaHeader 
        turmaNome={turma.nome}
        onBack={onBack} 
      />
      {renderContent()}
    </div>
  );
};

export default TurmaDetail;
