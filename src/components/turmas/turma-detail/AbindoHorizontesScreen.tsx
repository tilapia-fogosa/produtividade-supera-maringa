
import React from 'react';
import { Button } from "@/components/ui/button";

interface AbindoHorizontesScreenProps {
  onBackToMenu: () => void;
}

const AbindoHorizontesScreen: React.FC<AbindoHorizontesScreenProps> = ({ onBackToMenu }) => {
  return (
    <div className="text-center py-6">
      <h2 className="text-xl font-semibold mb-4">Lançamento de Abrindo Horizontes</h2>
      <p className="mb-6">Funcionalidade em desenvolvimento</p>
      <Button onClick={onBackToMenu}>
        Voltar para o Menu
      </Button>
    </div>
  );
};

export default AbindoHorizontesScreen;
