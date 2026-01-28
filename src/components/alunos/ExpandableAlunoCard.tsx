import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Pencil, Loader2 } from 'lucide-react';
import { AlunoAtivo } from '@/hooks/use-alunos-ativos';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FotoUpload } from './FotoUpload';

// Tipos das funções de atualização
interface UpdateFunctions {
  atualizarFoto: (id: string, fotoUrl: string | null) => Promise<boolean>;
  atualizarEmail: (id: string, email: string) => Promise<boolean>;
  atualizarTelefone: (id: string, telefone: string) => Promise<boolean>;
  atualizarCoordenadorResponsavel: (id: string, coordenador: string) => Promise<boolean>;
  atualizarValorMensalidade: (id: string, valor: number) => Promise<boolean>;
  atualizarVencimentoContrato: (id: string, vencimento: string) => Promise<boolean>;
  atualizarMotivoProcura: (id: string, motivo: string) => Promise<boolean>;
  atualizarPercepcaoCoordenador: (id: string, percepcao: string) => Promise<boolean>;
  atualizarPontosAtencao: (id: string, pontos: string) => Promise<boolean>;
  atualizarDataOnboarding: (id: string, data: string) => Promise<boolean>;
  atualizarValorMatricula: (id: string, valor: number) => Promise<boolean>;
  atualizarValorMaterial: (id: string, valor: number) => Promise<boolean>;
  atualizarKitSugerido: (id: string, kit: string) => Promise<boolean>;
}

interface ExpandableAlunoCardProps {
  aluno: AlunoAtivo | null;
  onClose: () => void;
  updateFunctions: UpdateFunctions;
}

const KIT_OPTIONS = ['Kit 1', 'Kit 2', 'Kit 3', 'Kit 4', 'Kit 5', 'Kit 6', 'Kit 7', 'Kit 8'];

export function ExpandableAlunoCard({ aluno, onClose, updateFunctions }: ExpandableAlunoCardProps) {
  const [editando, setEditando] = useState<string | null>(null);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState<string | null>(null);

  if (!aluno) return null;

  const formatarValorMensalidade = (valor: number | null) => {
    if (valor === null || valor === undefined) return 'Não informado';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const handleEditar = (campo: string, valorAtual: string | number | null) => {
    setEditando(campo);
    setValores({ ...valores, [campo]: valorAtual?.toString() || '' });
  };

  const handleCancelar = () => {
    setEditando(null);
    setValores({});
  };

  const handleSalvar = async (campo: string) => {
    setSalvando(campo);
    const valor = valores[campo];
    let sucesso = false;

    switch (campo) {
      case 'email':
        sucesso = await updateFunctions.atualizarEmail(aluno.id, valor);
        break;
      case 'telefone':
        sucesso = await updateFunctions.atualizarTelefone(aluno.id, valor);
        break;
      case 'coordenador_responsavel':
        sucesso = await updateFunctions.atualizarCoordenadorResponsavel(aluno.id, valor);
        break;
      case 'valor_mensalidade':
        sucesso = await updateFunctions.atualizarValorMensalidade(aluno.id, parseFloat(valor) || 0);
        break;
      case 'valor_matricula':
        sucesso = await updateFunctions.atualizarValorMatricula(aluno.id, parseFloat(valor) || 0);
        break;
      case 'valor_material':
        sucesso = await updateFunctions.atualizarValorMaterial(aluno.id, parseFloat(valor) || 0);
        break;
      case 'vencimento_contrato':
        sucesso = await updateFunctions.atualizarVencimentoContrato(aluno.id, valor);
        break;
      case 'motivo_procura':
        sucesso = await updateFunctions.atualizarMotivoProcura(aluno.id, valor);
        break;
      case 'percepcao_coordenador':
        sucesso = await updateFunctions.atualizarPercepcaoCoordenador(aluno.id, valor);
        break;
      case 'pontos_atencao':
        sucesso = await updateFunctions.atualizarPontosAtencao(aluno.id, valor);
        break;
      case 'data_onboarding':
        sucesso = await updateFunctions.atualizarDataOnboarding(aluno.id, valor);
        break;
      case 'kit_sugerido':
        sucesso = await updateFunctions.atualizarKitSugerido(aluno.id, valor);
        break;
    }

    if (sucesso) {
      setEditando(null);
    }
    setSalvando(null);
  };

  const handleKitChange = async (kit: string) => {
    setSalvando('kit_sugerido');
    const sucesso = await updateFunctions.atualizarKitSugerido(aluno.id, kit);
    if (sucesso) {
      setEditando(null);
    }
    setSalvando(null);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed top-4 bottom-4 md:top-8 md:bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] md:w-[calc(100%-4rem)] max-w-5xl bg-background rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-bold">{aluno.nome}</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
              {/* Foto - Entre o cabeçalho e as informações básicas */}
              <div className="flex justify-center pb-4 border-b">
                <FotoUpload
                  alunoId={aluno.id}
                  alunoNome={aluno.nome}
                  fotoUrl={aluno.foto_url}
                  onFotoUpdate={(novaFotoUrl) => updateFunctions.atualizarFoto(aluno.id, novaFotoUrl)}
                />
              </div>

              {/* Informações */}
              <div className="space-y-6">
                {/* Informações Básicas */}
                <Section title="Informações Básicas">
                  <InfoItem label="Nome" value={aluno.nome} />
                  <InfoItem label="Ativo" value={aluno.active ? 'Sim' : 'Não'} />
                  <InfoItem label="Dias no Supera" value={aluno.dias_supera?.toString() || 'Não informado'} />
                  <InfoItem label="Idade" value={aluno.idade?.toString() || 'Não informado'} />
                  
                  <EditableInfoItem
                    label="Email"
                    value={aluno.email || 'Não informado'}
                    campo="email"
                    editando={editando === 'email'}
                    salvando={salvando === 'email'}
                    valorTemp={valores.email || ''}
                    onEditar={() => handleEditar('email', aluno.email)}
                    onSalvar={() => handleSalvar('email')}
                    onCancelar={handleCancelar}
                    onChange={(v) => setValores({ ...valores, email: v })}
                  />
                  
                  <EditableInfoItem
                    label="Telefone"
                    value={aluno.telefone || 'Não informado'}
                    campo="telefone"
                    editando={editando === 'telefone'}
                    salvando={salvando === 'telefone'}
                    valorTemp={valores.telefone || ''}
                    onEditar={() => handleEditar('telefone', aluno.telefone)}
                    onSalvar={() => handleSalvar('telefone')}
                    onCancelar={handleCancelar}
                    onChange={(v) => setValores({ ...valores, telefone: v })}
                  />
                </Section>

                {/* Progresso Acadêmico */}
                <Section title="Progresso Acadêmico">
                  <InfoItem label="Última Apostila" value={aluno.ultima_apostila || 'Não registrado'} />
                  <InfoItem label="Última Página" value={aluno.ultima_pagina?.toString() || 'Não registrado'} />
                  <InfoItem label="Última Correção AH" value={aluno.ultima_correcao_ah ? new Date(aluno.ultima_correcao_ah).toLocaleDateString('pt-BR') : 'Não registrado'} />
                </Section>

                {/* Informações Contratuais */}
                <Section title="Informações Contratuais">
                  <EditableInfoItem
                    label="Início do Contrato"
                    value={aluno.data_onboarding ? new Date(aluno.data_onboarding).toLocaleDateString('pt-BR') : 'Não informado'}
                    campo="data_onboarding"
                    editando={editando === 'data_onboarding'}
                    salvando={salvando === 'data_onboarding'}
                    valorTemp={valores.data_onboarding || ''}
                    onEditar={() => handleEditar('data_onboarding', aluno.data_onboarding)}
                    onSalvar={() => handleSalvar('data_onboarding')}
                    onCancelar={handleCancelar}
                    onChange={(v) => setValores({ ...valores, data_onboarding: v })}
                    type="date"
                  />
                  
                  <EditableInfoItem
                    label="Vencimento do Contrato"
                    value={aluno.vencimento_contrato || 'Não informado'}
                    campo="vencimento_contrato"
                    editando={editando === 'vencimento_contrato'}
                    salvando={salvando === 'vencimento_contrato'}
                    valorTemp={valores.vencimento_contrato || ''}
                    onEditar={() => handleEditar('vencimento_contrato', aluno.vencimento_contrato)}
                    onSalvar={() => handleSalvar('vencimento_contrato')}
                    onCancelar={handleCancelar}
                    onChange={(v) => setValores({ ...valores, vencimento_contrato: v })}
                  />
                  
                  <EditableInfoItem
                    label="Valor da Mensalidade"
                    value={formatarValorMensalidade(aluno.valor_mensalidade)}
                    campo="valor_mensalidade"
                    editando={editando === 'valor_mensalidade'}
                    salvando={salvando === 'valor_mensalidade'}
                    valorTemp={valores.valor_mensalidade || ''}
                    onEditar={() => handleEditar('valor_mensalidade', aluno.valor_mensalidade)}
                    onSalvar={() => handleSalvar('valor_mensalidade')}
                    onCancelar={handleCancelar}
                    onChange={(v) => setValores({ ...valores, valor_mensalidade: v })}
                    type="number"
                  />

                  <EditableInfoItem
                    label="Valor da Matrícula"
                    value={formatarValorMensalidade(aluno.valor_matricula)}
                    campo="valor_matricula"
                    editando={editando === 'valor_matricula'}
                    salvando={salvando === 'valor_matricula'}
                    valorTemp={valores.valor_matricula || ''}
                    onEditar={() => handleEditar('valor_matricula', aluno.valor_matricula)}
                    onSalvar={() => handleSalvar('valor_matricula')}
                    onCancelar={handleCancelar}
                    onChange={(v) => setValores({ ...valores, valor_matricula: v })}
                    type="number"
                  />

                  <EditableInfoItem
                    label="Valor do Material"
                    value={formatarValorMensalidade(aluno.valor_material)}
                    campo="valor_material"
                    editando={editando === 'valor_material'}
                    salvando={salvando === 'valor_material'}
                    valorTemp={valores.valor_material || ''}
                    onEditar={() => handleEditar('valor_material', aluno.valor_material)}
                    onSalvar={() => handleSalvar('valor_material')}
                    onCancelar={handleCancelar}
                    onChange={(v) => setValores({ ...valores, valor_material: v })}
                    type="number"
                  />
                  
                  <InfoItem label="Última Falta" value={aluno.ultima_falta ? new Date(aluno.ultima_falta).toLocaleDateString('pt-BR') : 'Não registrado'} />
                </Section>

                {/* Turma e Professor */}
                <Section title="Turma e Professor">
                  <InfoItem label="Nome da Turma" value={aluno.turma_nome || 'Não atribuído'} />
                  <InfoItem label="Professor" value={aluno.professor_nome || 'Não atribuído'} />
                </Section>

                {/* Dados do Onboarding */}
                <Section title="Dados do Onboarding">
                  <EditableInfoItem
                    label="Data de Onboarding"
                    value={aluno.data_onboarding ? new Date(aluno.data_onboarding).toLocaleDateString('pt-BR') : 'Não registrado'}
                    campo="data_onboarding"
                    editando={editando === 'data_onboarding'}
                    salvando={salvando === 'data_onboarding'}
                    valorTemp={valores.data_onboarding || ''}
                    onEditar={() => handleEditar('data_onboarding', aluno.data_onboarding)}
                    onSalvar={() => handleSalvar('data_onboarding')}
                    onCancelar={handleCancelar}
                    onChange={(v) => setValores({ ...valores, data_onboarding: v })}
                    type="date"
                  />
                  
                  <EditableInfoItem
                    label="Coordenador Responsável"
                    value={aluno.coordenador_responsavel || 'Não registrado'}
                    campo="coordenador_responsavel"
                    editando={editando === 'coordenador_responsavel'}
                    salvando={salvando === 'coordenador_responsavel'}
                    valorTemp={valores.coordenador_responsavel || ''}
                    onEditar={() => handleEditar('coordenador_responsavel', aluno.coordenador_responsavel)}
                    onSalvar={() => handleSalvar('coordenador_responsavel')}
                    onCancelar={handleCancelar}
                    onChange={(v) => setValores({ ...valores, coordenador_responsavel: v })}
                  />

                  {/* Kit Inicial com Select */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Kit Inicial:</p>
                    <div className="md:col-span-2">
                      <Select
                        value={aluno.kit_sugerido || ''}
                        onValueChange={handleKitChange}
                        disabled={salvando === 'kit_sugerido'}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione o kit" />
                        </SelectTrigger>
                        <SelectContent>
                          {KIT_OPTIONS.map((kit) => (
                            <SelectItem key={kit} value={kit}>
                              {kit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <EditableInfoItem
                    label="Motivo da Procura"
                    value={aluno.motivo_procura || 'Não registrado'}
                    campo="motivo_procura"
                    editando={editando === 'motivo_procura'}
                    salvando={salvando === 'motivo_procura'}
                    valorTemp={valores.motivo_procura || ''}
                    onEditar={() => handleEditar('motivo_procura', aluno.motivo_procura)}
                    onSalvar={() => handleSalvar('motivo_procura')}
                    onCancelar={handleCancelar}
                    onChange={(v) => setValores({ ...valores, motivo_procura: v })}
                    multiline
                  />
                  
                  <EditableInfoItem
                    label="Percepção do Coordenador"
                    value={aluno.percepcao_coordenador || 'Não registrado'}
                    campo="percepcao_coordenador"
                    editando={editando === 'percepcao_coordenador'}
                    salvando={salvando === 'percepcao_coordenador'}
                    valorTemp={valores.percepcao_coordenador || ''}
                    onEditar={() => handleEditar('percepcao_coordenador', aluno.percepcao_coordenador)}
                    onSalvar={() => handleSalvar('percepcao_coordenador')}
                    onCancelar={handleCancelar}
                    onChange={(v) => setValores({ ...valores, percepcao_coordenador: v })}
                    multiline
                  />
                  
                  <EditableInfoItem
                    label="Pontos de Atenção"
                    value={aluno.pontos_atencao || 'Não registrado'}
                    campo="pontos_atencao"
                    editando={editando === 'pontos_atencao'}
                    salvando={salvando === 'pontos_atencao'}
                    valorTemp={valores.pontos_atencao || ''}
                    onEditar={() => handleEditar('pontos_atencao', aluno.pontos_atencao)}
                    onSalvar={() => handleSalvar('pontos_atencao')}
                    onCancelar={handleCancelar}
                    onChange={(v) => setValores({ ...valores, pontos_atencao: v })}
                    multiline
                  />
                </Section>

                {/* Status */}
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
            </div>
          </ScrollArea>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
      <div className="space-y-3 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
        {children}
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}:</p>
      <p className="text-sm text-gray-900 dark:text-gray-100 md:col-span-2">{value}</p>
    </div>
  );
}

interface EditableInfoItemProps {
  label: string;
  value: string;
  campo: string;
  editando: boolean;
  salvando: boolean;
  valorTemp: string;
  onEditar: () => void;
  onSalvar: () => void;
  onCancelar: () => void;
  onChange: (value: string) => void;
  multiline?: boolean;
  type?: string;
}

function EditableInfoItem({
  label,
  value,
  editando,
  salvando,
  valorTemp,
  onEditar,
  onSalvar,
  onCancelar,
  onChange,
  multiline = false,
  type = 'text'
}: EditableInfoItemProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}:</p>
      <div className="md:col-span-2">
        {editando ? (
          <div className="flex items-start gap-2">
            {multiline ? (
              <Textarea
                value={valorTemp}
                onChange={(e) => onChange(e.target.value)}
                className="text-sm min-h-[80px]"
                autoFocus
              />
            ) : (
              <Input
                type={type}
                value={valorTemp}
                onChange={(e) => onChange(e.target.value)}
                className="text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !multiline) onSalvar();
                  if (e.key === 'Escape') onCancelar();
                }}
              />
            )}
            <div className="flex gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={onSalvar}
                disabled={salvando}
                className="h-8 w-8"
              >
                {salvando ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 text-green-600" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onCancelar}
                disabled={salvando}
                className="h-8 w-8"
              >
                <X className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 -m-2 rounded transition-colors" onClick={onEditar}>
            <p className="text-sm text-gray-900 dark:text-gray-100 flex-1">{value}</p>
            <Pencil className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </div>
        )}
      </div>
    </div>
  );
}
