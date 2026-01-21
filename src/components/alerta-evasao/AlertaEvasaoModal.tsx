
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AlertaEvasaoForm } from './AlertaEvasaoForm';
import { AulaZeroSidePanelView } from './AulaZeroSidePanelView';
import { useAlertasEvasao } from '@/hooks/use-alertas-evasao';

interface AlertaEvasaoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AlertaEvasaoModal({ isOpen, onClose }: AlertaEvasaoModalProps) {
  const [showAulaZeroPanel, setShowAulaZeroPanel] = useState(false);
  
  const {
    filtroAluno,
    setFiltroAluno,
    alunoSelecionado,
    setAlunoSelecionado,
    dataAlerta,
    setDataAlerta,
    origemAlerta,
    setOrigemAlerta,
    descritivo,
    setDescritivo,
    responsavelId,
    setResponsavelId,
    responsavelNome,
    alertasAnteriores,
    carregandoHistorico,
    historicoAlertas,
    dadosAulaZero,
    alunosFiltrados,
    isSubmitting,
    responsaveis,
    carregandoResponsaveis,
    handleSubmit,
  } = useAlertasEvasao();

  const handleFormSubmit = () => {
    handleSubmit(onClose);
  };

  const handleToggleAulaZero = () => {
    setShowAulaZeroPanel(!showAulaZeroPanel);
  };

  const handleCloseModal = () => {
    setShowAulaZeroPanel(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseModal}>
      <DialogContent className={`transition-all duration-300 ${showAulaZeroPanel ? 'max-w-5xl' : 'max-w-md'}`}>
        <DialogHeader>
          <DialogTitle>Registrar Alerta de Evasão</DialogTitle>
          <DialogDescription>
            Preencha os dados abaixo para registrar um novo alerta de evasão.
          </DialogDescription>
        </DialogHeader>

        <div className={`grid transition-all duration-300 ${showAulaZeroPanel ? 'grid-cols-2 gap-6' : 'grid-cols-1'}`}>
          {/* Formulário Principal */}
          <div className="space-y-4">
            <AlertaEvasaoForm
              filtroAluno={filtroAluno}
              setFiltroAluno={setFiltroAluno}
              alunoSelecionado={alunoSelecionado}
              setAlunoSelecionado={setAlunoSelecionado}
              dataAlerta={dataAlerta}
              setDataAlerta={setDataAlerta}
              origemAlerta={origemAlerta}
              setOrigemAlerta={setOrigemAlerta as (value: string) => void}
              descritivo={descritivo}
              setDescritivo={setDescritivo}
              responsavelId={responsavelId}
              setResponsavelId={setResponsavelId as (value: string) => void}
              responsavelNome={responsavelNome}
              alunosFiltrados={alunosFiltrados}
              alertasAnteriores={alertasAnteriores}
              historicoAlertas={historicoAlertas}
              carregandoHistorico={carregandoHistorico}
              dadosAulaZero={dadosAulaZero}
              isSubmitting={isSubmitting}
              responsaveis={responsaveis}
              carregandoResponsaveis={carregandoResponsaveis}
              onSubmit={handleFormSubmit}
              onCancel={handleCloseModal}
              onToggleAulaZero={handleToggleAulaZero}
              showAulaZeroPanel={showAulaZeroPanel}
            />
          </div>

          {/* Painel Lateral - Dados da Aula Zero */}
          {showAulaZeroPanel && (
            <div className="h-[500px]">
              <AulaZeroSidePanelView
                dadosAulaZero={dadosAulaZero}
                onClose={handleToggleAulaZero}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
