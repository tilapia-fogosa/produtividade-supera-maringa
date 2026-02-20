import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RetencaoForm } from './RetencaoForm';

interface RetencaoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RetencaoModal: React.FC<RetencaoModalProps> = ({ isOpen, onClose }) => {
  const handleSubmit = () => {
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-primary">
            Lançar Retenção
          </DialogTitle>
          <DialogDescription>
            Registre uma retenção de aluno informando o responsável pela identificação e as ações tomadas.
            Todos os campos marcados com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>
        
        <RetencaoForm 
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
};