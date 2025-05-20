
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Funcionario } from '@/hooks/use-funcionarios';
import { Loader2 } from "lucide-react";
import { useTodasTurmas } from '@/hooks/use-todas-turmas';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Lista de cargos pré-definidos
const CARGOS = [
  'Estagiário',
  'SDR',
  'Consultor',
  'Recepcionista',
  'Familiar',
  'Outro'
];

interface FuncionarioFormProps {
  funcionario?: Partial<Funcionario>;
  onSubmit: (data: Partial<Funcionario>) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  tipoSelecionado?: string; // Adicionando a propriedade tipoSelecionado como opcional
}

export const FuncionarioForm = ({
  funcionario,
  onSubmit,
  onCancel,
  isSubmitting,
  tipoSelecionado
}: FuncionarioFormProps) => {
  const { turmas, loading: loadingTurmas } = useTodasTurmas();
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cargo: '',
    turma_id: '',
  });
  const [validationErrors, setValidationErrors] = useState({
    nome: false
  });

  useEffect(() => {
    if (funcionario) {
      setFormData({
        nome: funcionario.nome || '',
        email: funcionario.email || '',
        telefone: funcionario.telefone || '',
        cargo: funcionario.cargo || '',
        turma_id: funcionario.turma_id || '',
      });
    } else if (tipoSelecionado) {
      // Se não tiver funcionário, mas tiver tipo selecionado, inicializa o cargo
      setFormData(prev => ({
        ...prev,
        cargo: tipoSelecionado
      }));
    }
  }, [funcionario, tipoSelecionado]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpar erro de validação ao digitar
    if (name === 'nome' && value.trim() !== '') {
      setValidationErrors(prev => ({ ...prev, nome: false }));
    }
  };

  const handleCargoChange = (value: string) => {
    setFormData(prev => ({ ...prev, cargo: value }));
  };

  const handleTurmaChange = (value: string) => {
    // Se o valor for "sem-turma", definimos como string vazia para o formulário
    // (será convertido para null na função de submit)
    const turmaId = value === "sem-turma" ? "" : value;
    setFormData(prev => ({ ...prev, turma_id: turmaId }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Valida se nome está preenchido
    if (!formData.nome.trim()) {
      setValidationErrors(prev => ({ ...prev, nome: true }));
      return;
    }
    
    console.log("Enviando dados:", formData); // Debugging
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="nome">Nome</Label>
        <Input
          id="nome"
          name="nome"
          value={formData.nome}
          onChange={handleChange}
          required
          placeholder="Digite o nome do funcionário"
          className={`mt-1 ${validationErrors.nome ? 'border-red-500' : ''}`}
        />
        {validationErrors.nome && (
          <p className="text-red-500 text-sm mt-1">Nome é obrigatório</p>
        )}
      </div>
      
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email || ''}
          onChange={handleChange}
          placeholder="Digite o email do funcionário"
          className="mt-1"
        />
      </div>
      
      <div>
        <Label htmlFor="telefone">Telefone</Label>
        <Input
          id="telefone"
          name="telefone"
          value={formData.telefone || ''}
          onChange={handleChange}
          placeholder="Digite o telefone do funcionário"
          className="mt-1"
        />
      </div>
      
      <div>
        <Label htmlFor="cargo">Cargo</Label>
        <Select 
          value={formData.cargo || ''} 
          onValueChange={handleCargoChange}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Selecione um cargo" />
          </SelectTrigger>
          <SelectContent>
            {CARGOS.map((cargo) => (
              <SelectItem key={cargo} value={cargo}>
                {cargo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="turma">Turma</Label>
        <Select
          value={formData.turma_id || 'sem-turma'}
          onValueChange={handleTurmaChange}
          disabled={loadingTurmas}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Selecione uma turma" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sem-turma">Sem turma</SelectItem>
            {turmas.map((turma) => (
              <SelectItem key={turma.id} value={turma.id}>
                {turma.nome} - {turma.horario}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex justify-end gap-2 mt-6">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className="px-4"
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="px-4"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {funcionario ? 'Atualizar' : 'Adicionar'}
        </Button>
      </div>
    </form>
  );
};
