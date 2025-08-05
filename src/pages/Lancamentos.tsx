
import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TrendingUp, BookOpen, AlertTriangle, School } from "lucide-react";
import GoogleSheetsSync from '@/components/sync/GoogleSheetsSync';
import { AlertaEvasaoModal } from '@/components/alerta-evasao/AlertaEvasaoModal';

const Lancamentos = () => {
  const navigate = useNavigate();
  const [showAlertaModal, setShowAlertaModal] = useState(false);

  const handleProdutividadeClick = () => {
    navigate('/dias-lancamento', { state: { serviceType: 'produtividade' } });
  };

  const handleAHClick = () => {
    navigate('/dias-lancamento', { state: { serviceType: 'abrindo_horizontes' } });
  };

  const handleAula0Click = () => {
    navigate('/aula-zero');
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-roxo-DEFAULT dark:text-foreground">Lançamentos</h1>
        <div className="flex gap-2">
          <GoogleSheetsSync />
        </div>
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
          className="py-8 text-lg border-orange-300 text-roxo-DEFAULT hover:bg-orange-100 dark:border-primary dark:text-foreground dark:hover:bg-primary/20"
          onClick={handleAHClick}
          variant="outline"
        >
          <BookOpen className="mr-2 h-6 w-6" />
          Lançar Abrindo Horizontes
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
        
        <div className="text-center text-lg font-medium text-foreground">
          TESTE
        </div>
      </div>

      <AlertaEvasaoModal 
        isOpen={showAlertaModal} 
        onClose={() => setShowAlertaModal(false)} 
      />
    </div>
  );
};

export default Lancamentos;
