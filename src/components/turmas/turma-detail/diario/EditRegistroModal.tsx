
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Turma } from '@/hooks/use-professor-turmas';
import { usePessoasTurma } from '@/hooks/use-pessoas-turma';
import { DatePicker } from '@/components/ui/calendar';
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { apostilas } from '@/components/constants/apostilas';

export interface EditRegistroModalProps {
  isOpen: boolean;
  onClose: () => void;
  registroSelecionado: any | null;
  dataSelecionada: Date;
  turma: Turma;
  onSuccess: () => void;
  modo: 'editar' | 'criar';
}

const EditRegistroModal: React.FC<EditRegistroModalProps> = ({
  isOpen,
  onClose,
  registroSelecionado,
  dataSelecionada,
  turma,
  onSuccess,
  modo
}) => {
  const { pessoasTurma } = usePessoasTurma();
  const [enviando, setEnviando] = useState(false);
  
  const [formData, setFormData] = useState({
    id: '',
    aluno_id: '',
    data_aula: new Date(),
    presente: true,
    apostila: '',
    pagina: '',
    exercicios: '',
    erros: '',
    comentario: '',
    fez_desafio: false
  });

  useEffect(() => {
    if (registroSelecionado) {
      // Edição - preencher formulário com dados existentes
      setFormData({
        id: registroSelecionado.id,
        aluno_id: registroSelecionado.aluno_id,
        data_aula: dataSelecionada,
        presente: registroSelecionado.presente || false,
        apostila: registroSelecionado.apostila || '',
        pagina: registroSelecionado.pagina || '',
        exercicios: registroSelecionado.exercicios ? String(registroSelecionado.exercicios) : '',
        erros: registroSelecionado.erros ? String(registroSelecionado.erros) : '',
        comentario: registroSelecionado.comentario || '',
        fez_desafio: registroSelecionado.fez_desafio || false
      });
    } else {
      // Criação - limpar formulário
      setFormData({
        id: '',
        aluno_id: '',
        data_aula: dataSelecionada,
        presente: true,
        apostila: '',
        pagina: '',
        exercicios: '',
        erros: '',
        comentario: '',
        fez_desafio: false
      });
    }
  }, [registroSelecionado, dataSelecionada]);

  const handleChange = (field: string, value: any) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const handleSubmit = async () => {
    try {
      setEnviando(true);
      
      if (!formData.aluno_id) {
        toast({
          title: "Erro",
          description: "Por favor, selecione um aluno/funcionário.",
          variant: "destructive"
        });
        setEnviando(false);
        return;
      }
      
      // Formatar a data para YYYY-MM-DD
      const dataFormatada = formData.data_aula.toISOString().split('T')[0];
      
      const payload = {
        action: modo === 'editar' ? 'update' : 'create',
        data: {
          ...formData,
          data_aula: dataFormatada
        }
      };
      
      // Chamar a função do Supabase
      const response = await fetch('/functions/v1/register-productivity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar registro');
      }
      
      toast({
        title: "Sucesso",
        description: modo === 'editar' ? "Registro atualizado com sucesso!" : "Registro criado com sucesso!",
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar registro:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar registro",
        variant: "destructive"
      });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{modo === 'editar' ? 'Editar Registro' : 'Novo Registro'}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 gap-2">
            <Label htmlFor="aluno_id">Aluno/Funcionário</Label>
            <Select
              value={formData.aluno_id}
              onValueChange={(value) => handleChange('aluno_id', value)}
              disabled={modo === 'editar'}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {pessoasTurma.map((pessoa) => (
                  <SelectItem key={pessoa.id} value={pessoa.id}>
                    {pessoa.nome} {pessoa.origem === 'funcionario' ? '(Funcionário)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <Label htmlFor="data_aula">Data</Label>
            <DatePicker
              selected={formData.data_aula}
              onSelect={(date) => date && handleChange('data_aula', date)}
              disabled={modo === 'editar'}
              className="border rounded-md p-2"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="presente"
              checked={formData.presente}
              onCheckedChange={(checked) => handleChange('presente', Boolean(checked))}
            />
            <Label htmlFor="presente">Presente</Label>
          </div>

          {formData.presente && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="apostila">Apostila</Label>
                  <Select
                    value={formData.apostila}
                    onValueChange={(value) => handleChange('apostila', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {apostilas.map((apostila) => (
                        <SelectItem key={apostila} value={apostila}>
                          {apostila}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="pagina">Página</Label>
                  <Input
                    id="pagina"
                    value={formData.pagina}
                    onChange={(e) => handleChange('pagina', e.target.value)}
                    placeholder="Ex: 23"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="exercicios">Exercícios</Label>
                  <Input
                    id="exercicios"
                    value={formData.exercicios}
                    onChange={(e) => handleChange('exercicios', e.target.value)}
                    placeholder="Ex: 10"
                    type="number"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="erros">Erros</Label>
                  <Input
                    id="erros"
                    value={formData.erros}
                    onChange={(e) => handleChange('erros', e.target.value)}
                    placeholder="Ex: 2"
                    type="number"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="fez_desafio"
                  checked={formData.fez_desafio}
                  onCheckedChange={(checked) => handleChange('fez_desafio', Boolean(checked))}
                />
                <Label htmlFor="fez_desafio">Fez desafio</Label>
              </div>
            </>
          )}

          <div className="grid gap-2">
            <Label htmlFor="comentario">Comentário</Label>
            <Textarea
              id="comentario"
              value={formData.comentario}
              onChange={(e) => handleChange('comentario', e.target.value)}
              placeholder="Adicione um comentário..."
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={enviando}>
            {enviando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {modo === 'editar' ? 'Atualizar' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditRegistroModal;
