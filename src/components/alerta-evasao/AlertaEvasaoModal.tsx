
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
    dataRetencao,
    setDataRetencao,
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
    <>
      <Dialog open={isOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Alerta de Evasão</DialogTitle>
            <DialogDescription>
              Preencha os dados abaixo para registrar um novo alerta de evasão.
            </DialogDescription>
          </DialogHeader>

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
              dataRetencao={dataRetencao}
              setDataRetencao={setDataRetencao}
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
        </DialogContent>
      </Dialog>

      {/* Sheet lateral para Dados da Aula Zero */}
      <Sheet open={showAulaZeroPanel} onOpenChange={setShowAulaZeroPanel}>
        <SheetContent side="right" className="w-[400px] sm:w-[500px]">
          <SheetHeader>
            <SheetTitle>Dados da Aula Zero</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <AulaZeroSidePanelView
              dadosAulaZero={dadosAulaZero}
              onClose={handleToggleAulaZero}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
