
import { useState } from 'react';
import { useAlunos } from "@/hooks/use-alunos";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AlertaEvasaoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const origensAlerta = [
  { value: 'conversa_indireta', label: 'Conversa Indireta (entre alunos)' },
  { value: 'aviso_recepcao', label: 'Avisou na Recepção' },
  { value: 'aviso_professor_coordenador', label: 'Avisou ao Professor / Coordenador' },
  { value: 'aviso_whatsapp', label: 'Avisou no Whatsapp' },
  { value: 'inadimplencia', label: 'Inadimplência (2 Meses ou Mais)' },
  { value: 'outro', label: 'Outro' }
];

export function AlertaEvasaoModal({ isOpen, onClose }: AlertaEvasaoModalProps) {
  const { todosAlunos } = useAlunos();
  const [filtroAluno, setFiltroAluno] = useState('');
  const [alunoSelecionado, setAlunoSelecionado] = useState<string | null>(null);
  const [dataAlerta, setDataAlerta] = useState('');
  const [origemAlerta, setOrigemAlerta] = useState<string | null>(null);
  const [descritivo, setDescritivo] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [dataRetencao, setDataRetencao] = useState('');

  const alunosFiltrados = todosAlunos.filter(aluno => 
    aluno.nome.toLowerCase().includes(filtroAluno.toLowerCase())
  );

  const resetForm = () => {
    setAlunoSelecionado(null);
    setDataAlerta('');
    setOrigemAlerta(null);
    setDescritivo('');
    setResponsavel('');
    setDataRetencao('');
    setFiltroAluno('');
  };

  const handleSubmit = async () => {
    if (!alunoSelecionado || !origemAlerta || !dataAlerta) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('alerta_evasao')
        .insert({
          aluno_id: alunoSelecionado,
          data_alerta: new Date(dataAlerta).toISOString(),
          origem_alerta: origemAlerta,
          descritivo,
          responsavel,
          data_retencao: dataRetencao ? new Date(dataRetencao).toISOString() : null,
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Alerta de evasão registrado com sucesso!",
      });
      
      resetForm();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar alerta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o alerta de evasão.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Alerta de Evasão</DialogTitle>
          <DialogDescription>
            Preencha os dados abaixo para registrar um novo alerta de evasão.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Input
              placeholder="Filtrar alunos..."
              value={filtroAluno}
              onChange={(e) => setFiltroAluno(e.target.value)}
              className="mb-2"
            />
            <Select value={alunoSelecionado || ''} onValueChange={setAlunoSelecionado}>
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
            <Input
              type="datetime-local"
              value={dataAlerta}
              onChange={(e) => setDataAlerta(e.target.value)}
              className="w-full"
            />
          </div>

          <Select value={origemAlerta || ''} onValueChange={setOrigemAlerta}>
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

          <Input
            placeholder="Responsável"
            value={responsavel}
            onChange={(e) => setResponsavel(e.target.value)}
          />

          <Input
            type="datetime-local"
            value={dataRetencao}
            onChange={(e) => setDataRetencao(e.target.value)}
            placeholder="Data da Retenção (opcional)"
          />

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
