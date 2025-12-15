
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { origensAlerta } from '@/hooks/use-alertas-evasao';
import { HistoricoAlertasView } from './HistoricoAlertasView';
import { Responsavel } from '@/hooks/use-responsaveis';

interface AlertaEvasaoFormProps {
  filtroAluno: string;
  setFiltroAluno: (valor: string) => void;
  alunoSelecionado: string | null;
  setAlunoSelecionado: (id: string) => void;
  dataAlerta: string;
  setDataAlerta: (data: string) => void;
  origemAlerta: string | null;
  setOrigemAlerta: (origem: string) => void;
  descritivo: string;
  setDescritivo: (texto: string) => void;
  responsavelId: string | null;
  setResponsavelId: (id: string) => void;
  responsavelNome: string;
  dataRetencao: string;
  setDataRetencao: (data: string) => void;
  alunosFiltrados: any[];
  alertasAnteriores: any[];
  historicoAlertas: string | null;
  carregandoHistorico: boolean;
  dadosAulaZero: any | null;
  isSubmitting: boolean;
  responsaveis: Responsavel[];
  carregandoResponsaveis: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  onToggleAulaZero: () => void;
  showAulaZeroPanel: boolean;
}

export function AlertaEvasaoForm({
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
  alunosFiltrados,
  alertasAnteriores,
  historicoAlertas,
  carregandoHistorico,
  dadosAulaZero,
  isSubmitting,
  responsaveis,
  carregandoResponsaveis,
  onSubmit,
  onCancel,
  onToggleAulaZero,
  showAulaZeroPanel
}: AlertaEvasaoFormProps) {
  return (
    <div className="space-y-4 mt-4">
      <div>
        <Input
          placeholder="Filtrar alunos..."
          value={filtroAluno}
          onChange={(e) => setFiltroAluno(e.target.value)}
          className="mb-2"
        />
        <Select 
          value={alunoSelecionado || ''} 
          onValueChange={setAlunoSelecionado}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o aluno" />
          </SelectTrigger>
          <SelectContent>
            {alunosFiltrados.map((aluno) => (
              <SelectItem key={aluno.id} value={aluno.id}>
                {aluno.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label htmlFor="data-alerta" className="block text-sm font-medium text-gray-700 mb-1">
          Data do Alerta
        </label>
        <Input
          id="data-alerta"
          type="date"
          value={dataAlerta}
          onChange={(e) => setDataAlerta(e.target.value)}
          className="w-full"
        />
      </div>

      <Select 
        value={origemAlerta || ''} 
        onValueChange={(value: string) => setOrigemAlerta(value)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Selecione a origem do alerta" />
        </SelectTrigger>
        <SelectContent>
          {origensAlerta.map((origem) => (
            <SelectItem key={origem.value} value={origem.value}>
              {origem.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Textarea
        placeholder="Descritivo"
        value={descritivo}
        onChange={(e) => setDescritivo(e.target.value)}
      />

      <div>
        <label htmlFor="data-retencao" className="block text-sm font-medium text-gray-700 mb-1">
          Agendado Retenção (caso tenha)
        </label>
        <Input
          id="data-retencao"
          type="datetime-local"
          value={dataRetencao}
          onChange={(e) => setDataRetencao(e.target.value)}
          className="w-full"
        />
      </div>

      <HistoricoAlertasView
        alertasAnteriores={alertasAnteriores}
        historicoAlertas={historicoAlertas}
        carregandoHistorico={carregandoHistorico}
      />

      {/* Botão para ver Dados da Aula Zero */}
      {alunoSelecionado && (
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            onClick={onToggleAulaZero}
            className="w-full"
          >
            {showAulaZeroPanel ? 'Ocultar' : 'Ver'} Dados da Aula Zero
          </Button>
        </div>
      )}

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </div>
  );
}
