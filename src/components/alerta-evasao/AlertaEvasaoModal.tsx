
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertaEvasaoForm } from './AlertaEvasaoForm';
import { AulaZeroSidePanelView } from './AulaZeroSidePanelView';
import { useAlertasEvasao } from '@/hooks/use-alertas-evasao';
import { format } from 'date-fns';

interface AlertaEvasaoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AlertaEvasaoModal({ isOpen, onClose }: AlertaEvasaoModalProps) {
  const [showAulaZeroPanel, setShowAulaZeroPanel] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [alertasPendentes, setAlertasPendentes] = useState<any[]>([]);
  
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

  const handleFormSubmit = async () => {
    const resultado = await handleSubmit(onClose, false);
    
    if (resultado?.alertaPendenteExistente) {
      setAlertasPendentes(resultado.alertasPendentes);
      setShowConfirmDialog(true);
    }
  };

  const handleConfirmCriacao = async () => {
    setShowConfirmDialog(false);
    await handleSubmit(onClose, true);
  };

  const handleToggleAulaZero = () => {
    setShowAulaZeroPanel(!showAulaZeroPanel);
  };

  const handleCloseModal = () => {
    setShowAulaZeroPanel(false);
    setShowConfirmDialog(false);
    onClose();
  };

  return (
    <>
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

      {/* Dialog de confirmação para alerta duplicado */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alerta já existente</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Já existe {alertasPendentes.length === 1 ? 'um alerta de evasão pendente' : `${alertasPendentes.length} alertas de evasão pendentes`} para este aluno:</p>
              <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
                {alertasPendentes.map((alerta, index) => (
                  <div key={alerta.id || index} className="text-sm bg-muted p-2 rounded">
                    <span className="font-medium">
                      {alerta.data_alerta ? format(new Date(alerta.data_alerta), 'dd/MM/yyyy') : 'Data não informada'}
                    </span>
                    {alerta.descritivo && (
                      <span className="text-muted-foreground"> - {alerta.descritivo.substring(0, 50)}{alerta.descritivo.length > 50 ? '...' : ''}</span>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-2 font-medium">Deseja criar um novo alerta mesmo assim?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCriacao}>
              Criar mesmo assim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
