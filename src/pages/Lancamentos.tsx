import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { TrendingUp, AlertTriangle, School, Shield } from "lucide-react";
import { AlertaEvasaoModal } from '@/components/alerta-evasao/AlertaEvasaoModal';
import { RetencaoModal } from '@/components/retencao/RetencaoModal';
import { motion, AnimatePresence } from "framer-motion";

const Lancamentos = () => {
  const navigate = useNavigate();
  const [showAlertaModal, setShowAlertaModal] = useState(false);
  const [showRetencaoModal, setShowRetencaoModal] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handleProdutividadeClick = () => {
    navigate('/sala/dias-lancamento');
  };

  const handleAula0Click = () => {
    navigate('/aula-zero');
  };

  const lancamentos = [
    {
      id: 'produtividade',
      title: 'Produtividade de Sala',
      icon: TrendingUp,
      color: 'bg-orange-100/80',
      borderColor: 'border-orange-300',
      textColor: 'text-orange-700',
      iconColor: 'text-orange-600',
      onClick: handleProdutividadeClick
    },
    {
      id: 'aula-zero',
      title: 'Aula Zero',
      icon: School,
      color: 'bg-green-100/80',
      borderColor: 'border-green-300',
      textColor: 'text-green-700',
      iconColor: 'text-green-600',
      onClick: handleAula0Click
    },
    {
      id: 'alerta-evasao',
      title: 'Alerta de Evasão',
      icon: AlertTriangle,
      color: 'bg-red-100/80',
      borderColor: 'border-red-300',
      textColor: 'text-red-700',
      iconColor: 'text-red-600',
      onClick: () => setShowAlertaModal(true)
    },
    {
      id: 'retencao',
      title: 'Retenção',
      icon: Shield,
      color: 'bg-blue-100/80',
      borderColor: 'border-blue-300',
      textColor: 'text-blue-700',
      iconColor: 'text-blue-600',
      onClick: () => setShowRetencaoModal(true)
    }
  ];

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-roxo-DEFAULT dark:text-foreground">Lançamentos</h1>
      </div>
      
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-2 gap-6">
          {lancamentos.map((lancamento, idx) => (
            <div
              key={lancamento.id}
              className="relative group block p-2 h-full w-full"
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <AnimatePresence>
                {hoveredIndex === idx && (
                  <motion.span
                    className="absolute inset-0 h-full w-full bg-muted/50 dark:bg-muted/30 block rounded-2xl"
                    layoutId="hoverBackground"
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: 1,
                      transition: { duration: 0.15 },
                    }}
                    exit={{
                      opacity: 0,
                      transition: { duration: 0.15, delay: 0.2 },
                    }}
                  />
                )}
              </AnimatePresence>
              
              <div 
                className={`
                  rounded-2xl h-full w-full p-8 overflow-hidden 
                  ${lancamento.color} 
                  border border-transparent 
                  group-hover:${lancamento.borderColor} 
                  relative z-50 
                  cursor-pointer 
                  transition-all duration-200
                  flex flex-col items-center justify-center
                  min-h-[180px]
                  hover:shadow-lg
                `}
                onClick={lancamento.onClick}
              >
                <div className="relative z-50 flex flex-col items-center gap-4">
                  <lancamento.icon className={`h-12 w-12 ${lancamento.iconColor}`} />
                  <h4 className={`${lancamento.textColor} font-bold tracking-wide text-center text-lg`}>
                    {lancamento.title}
                  </h4>
                </div>
              </div>
            </div>
          ))}
        </div>
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
