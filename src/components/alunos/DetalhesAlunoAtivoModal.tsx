
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
  const formatarValorMensalidade = (valor: number | null) => {
    if (valor === null || valor === undefined) return 'Não informado';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

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
              <InfoItem label="Ativo" value={aluno.active ? 'Sim' : 'Não'} />
              <InfoItem label="Dias no Supera" value={aluno.dias_supera?.toString() || 'Não informado'} />
              <InfoItem label="Idade" value={aluno.idade?.toString() || 'Não informado'} />
              <InfoItem label="Email" value={aluno.email || 'Não informado'} />
              <InfoItem label="Telefone" value={aluno.telefone || 'Não informado'} />
            </Section>

            <Section title="Turma e Professor">
              <InfoItem label="Nome da Turma" value={aluno.turma_nome || 'Não atribuído'} />
              <InfoItem label="Professor" value={aluno.professor_nome || 'Não atribuído'} />
            </Section>

            <Section title="Progresso Acadêmico">
              <InfoItem label="Última Apostila" value={aluno.ultima_apostila || 'Não registrado'} />
              <InfoItem label="Última Página" value={aluno.ultima_pagina?.toString() || 'Não registrado'} />
              <InfoItem label="Última Correção AH" value={aluno.ultima_correcao_ah ? new Date(aluno.ultima_correcao_ah).toLocaleDateString('pt-BR') : 'Não registrado'} />
            </Section>

            <Section title="Dados do Onboarding">
              <InfoItem label="Data de Onboarding" value={aluno.data_onboarding ? new Date(aluno.data_onboarding).toLocaleDateString('pt-BR') : 'Não registrado'} />
              <InfoItem label="Motivo da Procura" value={aluno.motivo_procura || 'Não registrado'} />
              <InfoItem label="Coordenador Responsável" value={aluno.coordenador_responsavel || 'Não registrado'} />
              <InfoItem label="Percepção do Coordenador" value={aluno.percepcao_coordenador || 'Não registrado'} />
              <InfoItem label="Pontos de Atenção" value={aluno.pontos_atencao || 'Não registrado'} />
            </Section>

            <Section title="Informações Contratuais">
              <InfoItem label="Início do Contrato" value={aluno.data_onboarding ? new Date(aluno.data_onboarding).toLocaleDateString('pt-BR') : 'Não informado'} />
              <InfoItem label="Vencimento do Contrato" value={aluno.vencimento_contrato || 'Não informado'} />
              <InfoItem label="Valor da Mensalidade" value={formatarValorMensalidade(aluno.valor_mensalidade)} />
              <InfoItem label="Última Falta" value={aluno.ultima_falta ? new Date(aluno.ultima_falta).toLocaleDateString('pt-BR') : 'Não registrado'} />
            </Section>

            <Section title="Status">
              <div className="flex gap-2 flex-wrap">
                <Badge variant={aluno.active ? "default" : "secondary"}>
                  {aluno.active ? 'Ativo' : 'Inativo'}
                </Badge>
                {aluno.is_funcionario && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    Funcionário
                  </Badge>
                )}
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
