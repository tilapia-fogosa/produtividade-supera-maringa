
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
        <h1 className="text-2xl font-bold text-azul-500">Lançamentos</h1>
        <GoogleSheetsSync />
      </div>
      
      <div className="grid grid-cols-1 gap-4 max-w-md mx-auto">
        <Button 
          size="lg" 
          className="py-8 text-lg bg-supera hover:bg-supera-600"
          onClick={handleProdutividadeClick}
        >
          <TrendingUp className="mr-2 h-6 w-6" />
          Lançar Produtividade de Sala
        </Button>

        <Button 
          size="lg" 
          className="py-8 text-lg border-orange-300 text-azul-500 hover:bg-orange-100"
          onClick={handleAHClick}
          variant="outline"
        >
          <BookOpen className="mr-2 h-6 w-6" />
          Lançar Abrindo Horizontes
        </Button>

        <Button 
          size="lg" 
          className="py-8 text-lg bg-green-500 hover:bg-green-600 text-white"
          onClick={handleAula0Click}
        >
          <School className="mr-2 h-6 w-6" />
          Lançar Aula 0
        </Button>

        <Button 
          size="lg" 
          className="py-8 text-lg bg-red-500 hover:bg-red-600 text-white"
          onClick={() => setShowAlertaModal(true)}
        >
          <AlertTriangle className="mr-2 h-6 w-6" />
          Lançar Alerta de Evasão
        </Button>
      </div>

      <AlertaEvasaoModal 
        isOpen={showAlertaModal} 
        onClose={() => setShowAlertaModal(false)} 
      />
    </div>
  );
};

export default Lancamentos;
