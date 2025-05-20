
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AlertaEvasaoForm } from './AlertaEvasaoForm';
import { useAlertasEvasao } from '@/hooks/use-alertas-evasao';

interface AlertaEvasaoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AlertaEvasaoModal({ isOpen, onClose }: AlertaEvasaoModalProps) {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Alerta de Evasão</DialogTitle>
          <DialogDescription>
            Preencha os dados abaixo para registrar um novo alerta de evasão.
          </DialogDescription>
        </DialogHeader>

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
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
