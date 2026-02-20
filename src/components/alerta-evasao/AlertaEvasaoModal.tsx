
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
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertaEvasaoForm } from './AlertaEvasaoForm';
import { AulaZeroSidePanelView } from './AulaZeroSidePanelView';
import { useAlertasEvasao } from '@/hooks/use-alertas-evasao';
import { useCurrentFuncionario } from '@/hooks/use-current-funcionario';
import { useActiveUnit } from '@/contexts/ActiveUnitContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface AlertaEvasaoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AlertaEvasaoModal({ isOpen, onClose }: AlertaEvasaoModalProps) {
  const [showAulaZeroPanel, setShowAulaZeroPanel] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [alertasPendentes, setAlertasPendentes] = useState<any[]>([]);
  const [showComentarioForm, setShowComentarioForm] = useState(false);
  const [comentarioTexto, setComentarioTexto] = useState('');
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const { activeUnit } = useActiveUnit();
  
  const { funcionarioNome } = useCurrentFuncionario();
  
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

  const handleAdicionarComentario = () => {
    setShowComentarioForm(true);
  };

  const handleEnviarComentario = async () => {
    if (!comentarioTexto.trim() || !alertasPendentes[0]?.id) return;
    
    setEnviandoComentario(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const nomeResponsavel = funcionarioNome || user?.email || 'Usuário';
      
      await supabase
        .from('atividades_alerta_evasao')
        .insert({
          alerta_evasao_id: alertasPendentes[0].id,
          tipo_atividade: 'comentario' as any,
          descricao: comentarioTexto.trim(),
          status: 'concluida',
          responsavel_id: user?.id || null,
          responsavel_nome: nomeResponsavel,
          concluido_por_id: user?.id || null,
          concluido_por_nome: nomeResponsavel,
          unit_id: activeUnit?.id || alertasPendentes[0].unit_id || '0df79a04-444e-46ee-b218-59e4b1835f4a',
        });
      
      setShowConfirmDialog(false);
      setShowComentarioForm(false);
      setComentarioTexto('');
      onClose();
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
    } finally {
      setEnviandoComentario(false);
    }
  };

  const handleToggleAulaZero = () => {
    setShowAulaZeroPanel(!showAulaZeroPanel);
  };

  const handleCloseModal = () => {
    setShowAulaZeroPanel(false);
    setShowConfirmDialog(false);
    setShowComentarioForm(false);
    setComentarioTexto('');
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
      <AlertDialog open={showConfirmDialog} onOpenChange={(open) => {
        setShowConfirmDialog(open);
        if (!open) {
          setShowComentarioForm(false);
          setComentarioTexto('');
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alerta já existente</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2" asChild>
              <div>
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
                
                {showComentarioForm && (
                  <div className="mt-3 space-y-2">
                    <Textarea
                      placeholder="Digite seu comentário..."
                      value={comentarioTexto}
                      onChange={(e) => setComentarioTexto(e.target.value)}
                      className="min-h-[80px] text-sm"
                    />
                  </div>
                )}
                
                {!showComentarioForm && (
                  <p className="mt-2 font-medium">Deseja criar um novo alerta mesmo assim?</p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            {!showComentarioForm ? (
              <>
                <Button variant="outline" onClick={handleAdicionarComentario}>
                  Adicionar Comentário
                </Button>
                <Button onClick={handleConfirmCriacao}>
                  Criar mesmo assim
                </Button>
              </>
            ) : (
              <Button
                onClick={handleEnviarComentario}
                disabled={!comentarioTexto.trim() || enviandoComentario}
              >
                {enviandoComentario ? 'Enviando...' : 'Enviar Comentário'}
              </Button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
