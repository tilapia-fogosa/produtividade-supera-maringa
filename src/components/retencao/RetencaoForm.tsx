import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, User } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useRetencoes } from '@/hooks/use-retencoes';
import { useAlunos } from '@/hooks/use-alunos.tsx';
import { useCurrentFuncionario } from '@/hooks/use-current-funcionario';

interface RetencaoFormProps {
  onSubmit: () => void;
  onCancel: () => void;
}

export const RetencaoForm: React.FC<RetencaoFormProps> = ({ onSubmit, onCancel }) => {
  const { 
    formData, 
    updateFormData, 
    isLoading, 
    salvarRetencao 
  } = useRetencoes();

  const { alunos, carregando: alunosLoading } = useAlunos();
  const { funcionarioId, funcionarioNome, isLoading: loadingFuncionario } = useCurrentFuncionario();
  const [searchAluno, setSearchAluno] = useState('');
  const [showAlunoList, setShowAlunoList] = useState(false);
  const [date, setDate] = useState<Date>();

  const filteredAlunos = alunos.filter(aluno => 
    aluno.nome?.toLowerCase().includes(searchAluno.toLowerCase()) ||
    aluno.codigo?.toLowerCase().includes(searchAluno.toLowerCase())
  ).slice(0, 10);

  // Atualizar responsável automaticamente com o funcionário logado
  useEffect(() => {
    if (funcionarioId && funcionarioNome) {
      updateFormData('responsavel_id', funcionarioId);
      updateFormData('responsavel_tipo', 'funcionario');
      updateFormData('responsavel_nome', funcionarioNome);
    }
  }, [funcionarioId, funcionarioNome, updateFormData]);

  useEffect(() => {
    if (date) {
      updateFormData('data_retencao', format(date, 'yyyy-MM-dd'));
    }
  }, [date, updateFormData]);

  const handleSelectAluno = (aluno: any) => {
    updateFormData('aluno_id', aluno.id);
    updateFormData('aluno_nome', aluno.nome);
    updateFormData('unit_id', aluno.unit_id);
    setSearchAluno(aluno.nome);
    setShowAlunoList(false);
  };

  const handleSubmit = async () => {
    const success = await salvarRetencao();
    if (success) {
      onSubmit();
    }
  };

  return (
    <div className="space-y-4">
      {/* Busca de Aluno */}
      <div className="space-y-2">
        <Label htmlFor="aluno">Aluno *</Label>
        <div className="relative">
          <div className="flex">
            <Input
              id="aluno"
              placeholder="Digite o nome ou código do aluno..."
              value={searchAluno}
              onChange={(e) => {
                setSearchAluno(e.target.value);
                setShowAlunoList(true);
              }}
              onFocus={() => setShowAlunoList(true)}
              className="pr-10"
            />
          </div>
          
          {showAlunoList && searchAluno && (
            <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
              {filteredAlunos.length > 0 ? (
                filteredAlunos.map((aluno) => (
                  <div
                    key={aluno.id}
                    className="p-3 hover:bg-muted cursor-pointer border-b border-border last:border-b-0"
                    onClick={() => handleSelectAluno(aluno)}
                  >
                    <div className="font-medium">{aluno.nome}</div>
                    {aluno.codigo && (
                      <div className="text-sm text-muted-foreground">Código: {aluno.codigo}</div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-3 text-muted-foreground">
                  {alunosLoading ? 'Carregando...' : 'Nenhum aluno encontrado'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Data da Retenção */}
      <div className="space-y-2">
        <Label>Data da Retenção *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, 'dd/MM/yyyy') : 'Selecione a data'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Responsável - Exibição automática */}
      <div className="space-y-2">
        <Label>Responsável</Label>
        <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-input bg-muted">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {loadingFuncionario ? 'Carregando...' : funcionarioNome || 'Funcionário não vinculado'}
          </span>
        </div>
      </div>

      {/* Descritivo do Responsável */}
      <div className="space-y-2">
        <Label htmlFor="descritivo">Descritivo do Responsável *</Label>
        <Textarea
          id="descritivo"
          placeholder="Descreva a situação identificada pelo responsável..."
          value={formData.descritivo_responsavel}
          onChange={(e) => updateFormData('descritivo_responsavel', e.target.value)}
          className="min-h-[80px]"
        />
        <div className="text-sm text-muted-foreground">
          Mínimo 10 caracteres ({formData.descritivo_responsavel.length}/10)
        </div>
      </div>

      {/* Ações Tomadas */}
      <div className="space-y-2">
        <Label htmlFor="acoes">Ações Tomadas *</Label>
        <Textarea
          id="acoes"
          placeholder="Descreva as ações que foram tomadas para a retenção..."
          value={formData.acoes_tomadas}
          onChange={(e) => updateFormData('acoes_tomadas', e.target.value)}
          className="min-h-[80px]"
        />
        <div className="text-sm text-muted-foreground">
          Mínimo 10 caracteres ({formData.acoes_tomadas.length}/10)
        </div>
      </div>

      {/* Botões */}
      <div className="flex gap-2 pt-4">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isLoading || !funcionarioId}
          className="flex-1"
        >
          {isLoading ? 'Salvando...' : 'Salvar Retenção'}
        </Button>
      </div>
    </div>
  );
};
