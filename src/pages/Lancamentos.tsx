
import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TrendingUp, AlertTriangle, School, Shield } from "lucide-react";
import { AlertaEvasaoModal } from '@/components/alerta-evasao/AlertaEvasaoModal';
import { RetencaoModal } from '@/components/retencao/RetencaoModal';

const Lancamentos = () => {
  const navigate = useNavigate();
  const [showAlertaModal, setShowAlertaModal] = useState(false);
  const [showRetencaoModal, setShowRetencaoModal] = useState(false);

  const handleProdutividadeClick = () => {
    navigate('/dias-lancamento', { state: { serviceType: 'produtividade' } });
  };

  const handleAula0Click = () => {
    navigate('/aula-zero');
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-roxo-DEFAULT dark:text-foreground">Lançamentos</h1>
      </div>
      
      <div className="grid grid-cols-1 gap-4 max-w-md mx-auto">
        <Button 
          size="lg" 
          className="py-8 text-lg bg-supera hover:bg-supera-600 dark:bg-primary dark:hover:bg-primary/80"
          onClick={handleProdutividadeClick}
        >
          <TrendingUp className="mr-2 h-6 w-6" />
          Lançar Produtividade de Sala
        </Button>

        <Button
          size="lg" 
          className="py-8 text-lg bg-green-500 hover:bg-green-600 text-white dark:bg-green-600 dark:hover:bg-green-700"
          onClick={handleAula0Click}
        >
          <School className="mr-2 h-6 w-6" />
          Lançar Aula Zero
        </Button>

        <Button 
          size="lg" 
          className="py-8 text-lg bg-red-500 hover:bg-red-600 text-white dark:bg-red-600 dark:hover:bg-red-700"
          onClick={() => setShowAlertaModal(true)}
        >
          <AlertTriangle className="mr-2 h-6 w-6" />
          Lançar Alerta de Evasão
        </Button>

        <Button 
          size="lg" 
          className="py-8 text-lg bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-600 dark:hover:bg-blue-700"
          onClick={() => setShowRetencaoModal(true)}
        >
          <Shield className="mr-2 h-6 w-6" />
          Lançar Retenção
        </Button>
      </div>

      <AlertaEvasaoModal 
        isOpen={showAlertaModal} 
        onClose={() => setShowAlertaModal(false)} 
      />

      <RetencaoModal 
        isOpen={showRetencaoModal} 
        onClose={() => setShowRetencaoModal(false)} 
      />
    </div>
  );
};

export default Lancamentos;
