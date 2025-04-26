
import React, { useState, useEffect } from 'react';
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
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AlertaEvasaoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Tipo para garantir que usamos os valores corretos do enum
type OrigemAlerta = 'conversa_indireta' | 'aviso_recepcao' | 'aviso_professor_coordenador' | 'aviso_whatsapp' | 'inadimplencia' | 'outro';

const origensAlerta = [
  { value: 'conversa_indireta' as OrigemAlerta, label: 'Conversa Indireta (entre alunos)' },
  { value: 'aviso_recepcao' as OrigemAlerta, label: 'Avisou na Recepção' },
  { value: 'aviso_professor_coordenador' as OrigemAlerta, label: 'Avisou ao Professor / Coordenador' },
  { value: 'aviso_whatsapp' as OrigemAlerta, label: 'Avisou no Whatsapp' },
  { value: 'inadimplencia' as OrigemAlerta, label: 'Inadimplência (2 Meses ou Mais)' },
  { value: 'outro' as OrigemAlerta, label: 'Outro' }
];

export function AlertaEvasaoModal({ isOpen, onClose }: AlertaEvasaoModalProps) {
  const { todosAlunos } = useAlunos();
  const [filtroAluno, setFiltroAluno] = useState('');
  const [alunoSelecionado, setAlunoSelecionado] = useState<string | null>(null);
  const [dataAlerta, setDataAlerta] = useState('');
  const [origemAlerta, setOrigemAlerta] = useState<OrigemAlerta | null>(null);
  const [descritivo, setDescritivo] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [dataRetencao, setDataRetencao] = useState('');
  const [historicoAlertas, setHistoricoAlertas] = useState<string | null>(null);
  const [alertasAnteriores, setAlertasAnteriores] = useState<any[]>([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);

  const alunosFiltrados = todosAlunos.filter(aluno => 
    aluno.nome.toLowerCase().includes(filtroAluno.toLowerCase())
  );

  // Buscar alertas anteriores quando o aluno é selecionado
  useEffect(() => {
    const buscarAlertasAnteriores = async () => {
      if (!alunoSelecionado) {
        setAlertasAnteriores([]);
        setHistoricoAlertas(null);
        return;
      }

      setCarregandoHistorico(true);
      try {
        const { data, error } = await supabase
          .from('alerta_evasao')
          .select('*')
          .eq('aluno_id', alunoSelecionado)
          .order('data_alerta', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          setAlertasAnteriores(data);
          
          // Construir texto de histórico
          const textoHistorico = data.map(alerta => {
            const data = new Date(alerta.data_alerta).toLocaleDateString();
            return `${data} - ${alerta.origem_alerta}: ${alerta.descritivo || 'Sem descrição'}`;
          }).join('\n\n');
          
          setHistoricoAlertas(textoHistorico);
        }
      } catch (error) {
        console.error('Erro ao buscar alertas anteriores:', error);
      } finally {
        setCarregandoHistorico(false);
      }
    };

    buscarAlertasAnteriores();
  }, [alunoSelecionado]);

  const resetForm = () => {
    setAlunoSelecionado(null);
    setDataAlerta('');
    setOrigemAlerta(null);
    setDescritivo('');
    setResponsavel('');
    setDataRetencao('');
    setFiltroAluno('');
    setHistoricoAlertas(null);
    setAlertasAnteriores([]);
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
      // Determinar a coluna inicial com base na presença de data de retenção
      const initialColumn = dataRetencao ? 'scheduled' : 'todo';
      
      // Primeiro salvar no banco de dados
      const { data: alertaData, error } = await supabase
        .from('alerta_evasao')
        .insert({
          aluno_id: alunoSelecionado,
          data_alerta: new Date(dataAlerta).toISOString(),
          origem_alerta: origemAlerta,
          descritivo,
          responsavel,
          data_retencao: dataRetencao ? new Date(dataRetencao).toISOString() : null,
          kanban_status: initialColumn, // Define a coluna inicial
        })
        .select();

      if (error) throw error;

      // Encontrar os dados do aluno selecionado
      const aluno = todosAlunos.find(a => a.id === alunoSelecionado);

      // Se temos uma data de retenção, enviar para o webhook de agendamento
      if (dataRetencao && alertaData && alertaData.length > 0) {
        const alertaId = alertaData[0].id;
        
        // Buscar o card criado pelo trigger
        const { data: cardData, error: cardError } = await supabase
          .from('kanban_cards')
          .select('*')
          .eq('alerta_evasao_id', alertaId)
          .single();
        
        if (cardError) {
          console.error('Erro ao buscar card criado:', cardError);
        } else if (cardData) {
          // Enviar para o webhook de retenção agendada
          try {
            const webhookUrl = 'https://hook.us1.make.com/0t4vimtrmnqu3wtpfskf7ooydbjsh300';
            await fetch(webhookUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                cardId: cardData.id,
                aluno: aluno?.nome,
                descricao: descritivo,
                dataRetencao: dataRetencao ? new Date(dataRetencao).toISOString() : null,
                responsavel: responsavel
              })
            });
          } catch (webhookError) {
            console.error('Erro ao enviar para webhook de retenção:', webhookError);
          }
        }
      }

      // Sempre envia para o webhook geral de alertas
      const webhookUrl = 'https://hook.us1.make.com/v8b7u98lehutsqqk9tox27b2bn7x1mmx';
      
      try {
        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            aluno: {
              id: alunoSelecionado,
              nome: aluno?.nome,
              codigo: aluno?.codigo,
              email: aluno?.email,
              telefone: aluno?.telefone
            },
            alerta: {
              data: new Date(dataAlerta).toISOString(),
              origem: origemAlerta,
              descritivo,
              responsavel,
              data_retencao: dataRetencao ? new Date(dataRetencao).toISOString() : null,
              historico: historicoAlertas
            }
          })
        });

        if (!webhookResponse.ok) {
          console.error('Erro ao enviar para webhook:', await webhookResponse.text());
        }
      } catch (webhookError) {
        console.error('Erro ao enviar para webhook:', webhookError);
      }

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
            <label htmlFor="data-alerta" className="block text-sm font-medium text-gray-700 mb-1">
              Data do Alerta
            </label>
            <Input
              id="data-alerta"
              type="datetime-local"
              value={dataAlerta}
              onChange={(e) => setDataAlerta(e.target.value)}
              className="w-full"
            />
          </div>

          <Select value={origemAlerta || ''} onValueChange={setOrigemAlerta as (value: string) => void}>
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

          <div>
            <p className="text-sm text-muted-foreground mb-1">
              Agendado Retenção (caso tenha)
            </p>
            <Input
              type="datetime-local"
              value={dataRetencao}
              onChange={(e) => setDataRetencao(e.target.value)}
              placeholder="Data da Retenção"
              className="w-full"
            />
          </div>

          {alertasAnteriores.length > 0 && (
            <div className="border rounded-md p-3 bg-orange-50">
              <p className="text-sm font-medium mb-2">
                Histórico de alertas anteriores ({alertasAnteriores.length})
              </p>
              {carregandoHistorico ? (
                <p className="text-xs text-gray-500">Carregando histórico...</p>
              ) : (
                <Textarea
                  className="h-24 text-xs"
                  readOnly
                  value={historicoAlertas || ''}
                />
              )}
            </div>
          )}

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
