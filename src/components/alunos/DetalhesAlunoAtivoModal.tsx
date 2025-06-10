
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlunoAtivo } from '@/hooks/use-alunos-ativos';
import { Badge } from "@/components/ui/badge";

interface DetalhesAlunoAtivoModalProps {
  aluno: AlunoAtivo;
  onClose: () => void;
}

export function DetalhesAlunoAtivoModal({ aluno, onClose }: DetalhesAlunoAtivoModalProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{aluno.nome}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-full pr-4">
          <div className="space-y-6">
            <Section title="Informações Básicas">
              <InfoItem label="Nome" value={aluno.nome} />
              <InfoItem label="ID" value={aluno.id} />
              <InfoItem label="Ativo" value={aluno.active ? 'Sim' : 'Não'} />
              <InfoItem label="Dias no Supera" value={aluno.dias_supera?.toString() || 'Não informado'} />
            </Section>

            <Section title="Turma e Professor">
              <InfoItem label="ID da Turma" value={aluno.turma_id || 'Não atribuído'} />
              <InfoItem label="Nome da Turma" value={aluno.turma_nome || 'Não atribuído'} />
              <InfoItem label="Professor" value={aluno.professor_nome || 'Não atribuído'} />
            </Section>

            <Section title="Progresso Acadêmico">
              <InfoItem label="Última Apostila" value={aluno.ultima_apostila || 'Não registrado'} />
            </Section>

            <Section title="Status">
              <div className="flex gap-2 flex-wrap">
                <Badge variant={aluno.active ? "default" : "secondary"}>
                  {aluno.active ? 'Ativo' : 'Inativo'}
                </Badge>
                {aluno.dias_supera && (
                  <Badge 
                    variant={aluno.dias_supera > 90 ? "default" : "secondary"}
                    className={
                      aluno.dias_supera < 90 
                        ? "bg-orange-200 text-orange-800 border-orange-300" 
                        : aluno.dias_supera > 180 
                          ? "bg-green-100 text-green-800" 
                          : ""
                    }
                  >
                    {aluno.dias_supera} dias no Supera
                  </Badge>
                )}
              </div>
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
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      <div className="space-y-3 pl-4 border-l-2 border-gray-200">{children}</div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
      <p className="text-sm font-medium text-gray-600">{label}:</p>
      <p className="text-sm text-gray-900 md:col-span-2">{value}</p>
    </div>
  );
}
