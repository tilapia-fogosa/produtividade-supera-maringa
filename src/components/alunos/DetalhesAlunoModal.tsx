
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Aluno } from '@/hooks/use-alunos';
import { ScrollArea } from "@/components/ui/scroll-area";

interface DetalhesAlunoModalProps {
  aluno: Aluno;
  onClose: () => void;
}

export function DetalhesAlunoModal({ aluno, onClose }: DetalhesAlunoModalProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>{aluno.nome}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-full pr-4">
          <div className="space-y-6">
            <Section title="Informações do Onboarding">
              <InfoItem 
                label="Data do Onboarding" 
                value={aluno.data_onboarding 
                  ? new Date(aluno.data_onboarding).toLocaleDateString() 
                  : 'Não realizado'} 
              />
              <InfoItem 
                label="Coordenador Responsável" 
                value={aluno.coordenador_responsavel || '-'} 
              />
            </Section>

            <Section title="Avaliações">
              <InfoItem 
                label="Avaliação Ábaco" 
                value={aluno.avaliacao_abaco || '-'} 
                multiline 
              />
              <InfoItem 
                label="Avaliação AH" 
                value={aluno.avaliacao_ah || '-'} 
                multiline 
              />
            </Section>

            <Section title="Informações Adicionais">
              <InfoItem 
                label="Motivo da Procura" 
                value={aluno.motivo_procura || '-'} 
                multiline 
              />
              <InfoItem 
                label="Percepção do Coordenador" 
                value={aluno.percepcao_coordenador || '-'} 
                multiline 
              />
              <InfoItem 
                label="Pontos de Atenção" 
                value={aluno.pontos_atencao || '-'} 
                multiline 
              />
            </Section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="space-y-4 pl-4">{children}</div>
    </div>
  );
}

function InfoItem({ label, value, multiline = false }: { 
  label: string, 
  value: string, 
  multiline?: boolean 
}) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      {multiline ? (
        <p className="text-sm whitespace-pre-line">{value}</p>
      ) : (
        <p className="text-sm">{value}</p>
      )}
    </div>
  );
}
