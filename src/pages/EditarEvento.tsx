import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Calendar, Clock, MapPin, User, Users, Plus, Trash2, Search, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useResponsaveis } from "@/hooks/use-responsaveis";

export default function EditarEvento() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { responsaveis, isLoading: isLoadingResponsaveis } = useResponsaveis();
  const [evento, setEvento] = useState<any>(null);
  const [alunosEvento, setAlunosEvento] = useState<any[]>([]);
  const [convidadosNaoAlunos, setConvidadosNaoAlunos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      buscarEvento();
    }
  }, [id]);

  const buscarEvento = async () => {
    setLoading(true);
    try {
      // Buscar evento
      const { data: eventoData, error: eventoError } = await supabase
        .from('eventos')
        .select('*')
        .eq('id', id)
        .eq('active', true)
        .single();

      if (eventoError) throw eventoError;

      if (eventoData) {
        setEvento(eventoData);
        
        // Buscar participantes alunos do evento
        const { data: participantesData, error: participantesError } = await supabase
          .from('evento_participantes')
          .select(`
            id,
            forma_pagamento,
            aluno_id,
            alunos!inner(
              id,
              nome,
              turma_id,
              turmas(id, nome, professor_id, professores!turmas_professor_fkey(id, nome))
            )
          `)
          .eq('evento_id', id);

        if (participantesError) throw participantesError;

        const participantesFormatados = participantesData.map((p: any) => ({
          id: p.alunos.id,
          nome: p.alunos.nome,
          turma: p.alunos.turmas?.nome || 'Sem turma',
          professor: p.alunos.turmas?.professores?.nome || 'Sem professor',
          formaPagamento: p.forma_pagamento,
          tipo: 'aluno'
        }));

        setAlunosEvento(participantesFormatados);

        // Buscar convidados não alunos
        const { data: convidadosData, error: convidadosError } = await supabase
          .from('convidados_eventos')
          .select('*')
          .eq('evento_id', id)
          .eq('active', true);

        if (convidadosError) throw convidadosError;

        const convidadosFormatados = (convidadosData || []).map((c: any) => ({
          id: c.id,
          nome: c.nome_completo,
          telefone: c.telefone_contato,
          quemConvidou: c.quem_convidou_nome,
          responsavel: c.responsavel_nome,
          valorPago: c.valor_pago,
          formaPagamento: c.forma_pagamento,
          tipo: 'nao_aluno'
        }));

        setConvidadosNaoAlunos(convidadosFormatados);
      } else {
        toast({
          title: "Evento não encontrado",
          description: "O evento solicitado não existe.",
          variant: "destructive"
        });
        navigate('/eventos');
      }
    } catch (error) {
      console.error('Erro ao buscar evento:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do evento",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };


const getTipoColor = (tipo: string) => {
  switch (tipo) {
    case "Reunião":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "Treinamento":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "Avaliação":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  }
};

const formatarData = (dataString: string) => {
  const data = new Date(dataString);
  return {
    data: data.toLocaleDateString("pt-BR"),
    hora: data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  };
};

const EditarEventoModal = ({ evento, onEventoAtualizado, responsaveis }: { 
  evento: any;
  onEventoAtualizado: () => void;
  responsaveis: any[];
}) => {
  const [open, setOpen] = useState(false);
  
  // Função para converter data UTC para local no formato datetime-local
  const getLocalDateTimeString = (dateString: string) => {
    const date = new Date(dateString);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().slice(0, 16);
  };
  
  const [formData, setFormData] = useState({
    titulo: evento.titulo || '',
    descricao: evento.descricao || '',
    data_evento: evento.data_evento ? getLocalDateTimeString(evento.data_evento) : '',
    local: evento.local || '',
    responsavel: evento.responsavel || '',
    numero_vagas: evento.numero_vagas || 0,
    tipo: evento.tipo || ''
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titulo || !formData.data_evento || !formData.local || !formData.tipo) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      // Converter a data local para UTC para salvar no banco
      const localDate = new Date(formData.data_evento);
      const utcDate = localDate.toISOString();
      
      const { error } = await supabase
        .from('eventos')
        .update({
          titulo: formData.titulo,
          descricao: formData.descricao,
          data_evento: utcDate,
          local: formData.local,
          responsavel: formData.responsavel,
          numero_vagas: Number(formData.numero_vagas),
          tipo: formData.tipo
        })
        .eq('id', evento.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Evento atualizado com sucesso!"
      });
      
      setOpen(false);
      onEventoAtualizado();
    } catch (error) {
      console.error('Erro ao atualizar evento:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar evento",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Edit className="h-4 w-4" />
          Editar Informações
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Evento</DialogTitle>
          <DialogDescription>
            Atualize as informações do evento.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
              placeholder="Título do evento"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              placeholder="Descrição do evento"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo *</Label>
            <Select 
              value={formData.tipo} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, tipo: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Reunião">Reunião</SelectItem>
                <SelectItem value="Treinamento">Treinamento</SelectItem>
                <SelectItem value="Avaliação">Avaliação</SelectItem>
                <SelectItem value="Outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="data_evento">Data e Hora *</Label>
            <Input
              id="data_evento"
              type="datetime-local"
              value={formData.data_evento}
              onChange={(e) => setFormData(prev => ({ ...prev, data_evento: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="local">Local *</Label>
            <Input
              id="local"
              value={formData.local}
              onChange={(e) => setFormData(prev => ({ ...prev, local: e.target.value }))}
              placeholder="Local do evento"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsavel">Responsável</Label>
            <Select 
              value={formData.responsavel} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, responsavel: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o responsável" />
              </SelectTrigger>
              <SelectContent>
                {responsaveis.map((resp) => (
                  <SelectItem key={resp.id} value={resp.nome}>
                    {resp.nome} ({resp.tipo})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="numero_vagas">Número de Vagas *</Label>
            <Input
              id="numero_vagas"
              type="number"
              min="0"
              value={formData.numero_vagas}
              onChange={(e) => setFormData(prev => ({ ...prev, numero_vagas: Number(e.target.value) }))}
              placeholder="Número de vagas"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Salvar Alterações
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const AdicionarNaoAlunoModal = ({ 
  onConvidadoAdicionado, 
  responsaveis 
}: { 
  onConvidadoAdicionado: (convidado: any) => void;
  responsaveis: any[];
}) => {
  const [open, setOpen] = useState(false);
  const [pessoas, setPessoas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    nomeCompleto: '',
    telefone: '',
    quemConvidouTipo: '',
    quemConvidouId: '',
    quemConvidouNome: '',
    responsavelId: '',
    valorPago: '',
    formaPagamento: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      buscarDados();
    }
  }, [open]);

  const buscarDados = async () => {
    setLoading(true);
    try {
      // Buscar alunos
      const { data: alunosData, error: alunosError } = await supabase
        .from('alunos')
        .select('id, nome')
        .eq('active', true)
        .order('nome');

      if (alunosError) throw alunosError;

      // Buscar funcionários
      const { data: funcData, error: funcError } = await supabase
        .from('funcionarios')
        .select('id, nome')
        .eq('active', true)
        .order('nome');

      if (funcError) throw funcError;

      // Combinar alunos e funcionários em uma única lista
      const alunosFormatados = (alunosData || []).map(a => ({
        id: a.id,
        nome: a.nome,
        tipo: 'aluno' as const
      }));

      const funcionariosFormatados = (funcData || []).map(f => ({
        id: f.id,
        nome: f.nome,
        tipo: 'funcionario' as const
      }));

      const todasPessoas = [...alunosFormatados, ...funcionariosFormatados].sort((a, b) => 
        a.nome.localeCompare(b.nome)
      );

      setPessoas(todasPessoas);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nomeCompleto || !formData.telefone || !formData.quemConvidouId || 
        !formData.responsavelId || !formData.formaPagamento) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const responsavelNome = responsaveis.find(r => r.id === formData.responsavelId)?.nome;

    const novoConvidado = {
      nomeCompleto: formData.nomeCompleto,
      telefone: formData.telefone,
      quemConvidouTipo: formData.quemConvidouTipo,
      quemConvidouId: formData.quemConvidouId,
      quemConvidouNome: formData.quemConvidouNome,
      responsavelId: formData.responsavelId,
      responsavelNome,
      valorPago: formData.valorPago ? parseFloat(formData.valorPago) : null,
      formaPagamento: formData.formaPagamento
    };

    onConvidadoAdicionado(novoConvidado);
    setFormData({
      nomeCompleto: '',
      telefone: '',
      quemConvidouTipo: '',
      quemConvidouId: '',
      quemConvidouNome: '',
      responsavelId: '',
      valorPago: '',
      formaPagamento: ''
    });
    setSearchTerm('');
    setOpen(false);
  };

  const adicionarEuMesmo = () => {
    // TODO: Implementar com usuário logado real
    toast({
      title: "Info",
      description: "Função 'Adicionar eu mesmo' será implementada em breve",
    });
  };

  const pessoasFiltradas = pessoas.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-purple-600 hover:bg-purple-700 text-white">
          <Plus className="h-4 w-4" />
          Adicionar Não Aluno
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Não Aluno ao Evento</DialogTitle>
          <DialogDescription>
            Cadastre um participante que não é aluno.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nomeCompleto">Nome Completo *</Label>
            <Input
              id="nomeCompleto"
              value={formData.nomeCompleto}
              onChange={(e) => setFormData(prev => ({ ...prev, nomeCompleto: e.target.value }))}
              placeholder="Nome completo do participante"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone para Contato *</Label>
            <Input
              id="telefone"
              value={formData.telefone}
              onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
              placeholder="(00) 00000-0000"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="quemConvidou">Quem Convidou *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={adicionarEuMesmo}
                className="h-7 text-xs"
              >
                Adicionar eu mesmo
              </Button>
            </div>
            <div className="mb-2">
              <Input
                placeholder="Buscar aluno ou funcionário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select 
              value={formData.quemConvidouId} 
              onValueChange={(value) => {
                const pessoaSelecionada = pessoas.find(p => p.id === value);
                if (pessoaSelecionada) {
                  setFormData(prev => ({ 
                    ...prev, 
                    quemConvidouId: value,
                    quemConvidouTipo: pessoaSelecionada.tipo,
                    quemConvidouNome: pessoaSelecionada.nome
                  }));
                }
              }}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Carregando..." : "Selecione quem convidou"} />
              </SelectTrigger>
              <SelectContent>
                {pessoasFiltradas.length === 0 && !loading ? (
                  <div className="p-2 text-center text-muted-foreground text-sm">
                    Nenhuma pessoa encontrada
                  </div>
                ) : (
                  pessoasFiltradas.map(pessoa => (
                    <SelectItem key={`${pessoa.tipo}-${pessoa.id}`} value={pessoa.id}>
                      <div className="flex items-center gap-2">
                        <span>{pessoa.nome}</span>
                        <Badge 
                          variant="secondary" 
                          className={pessoa.tipo === 'aluno' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'}
                        >
                          {pessoa.tipo === 'aluno' ? 'Aluno' : 'Funcionário'}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsavel">Responsável *</Label>
            <Select 
              value={formData.responsavelId} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, responsavelId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o responsável" />
              </SelectTrigger>
              <SelectContent>
                {responsaveis.map(resp => (
                  <SelectItem key={resp.id} value={resp.id}>
                    {resp.nome} ({resp.tipo})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="valorPago">Valor Pago (R$)</Label>
            <Input
              id="valorPago"
              type="number"
              step="0.01"
              min="0"
              value={formData.valorPago}
              onChange={(e) => setFormData(prev => ({ ...prev, valorPago: e.target.value }))}
              placeholder="0,00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="formaPagamento">Forma de Pagamento *</Label>
            <Select 
              value={formData.formaPagamento} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, formaPagamento: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a forma de pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                <SelectItem value="boleto">Boleto</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="evento_gratuito">Evento Gratuito</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Adicionar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const AdicionarAlunoModal = ({ onAlunoAdicionado, alunosJaCadastrados, responsaveis }: {
  onAlunoAdicionado: (aluno: any) => void;
  alunosJaCadastrados: any[];
  responsaveis: any[];
}) => {
  const [open, setOpen] = useState(false);
  const [alunos, setAlunos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    alunoId: '',
    responsavelId: '',
    valorPago: '',
    formaPagamento: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      buscarAlunos();
    }
  }, [open]);

  const buscarAlunos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('alunos')
        .select(`
          id,
          nome,
          turma_id,
          turmas(id, nome, professor_id, professores!turmas_professor_fkey(id, nome))
        `)
        .eq('active', true)
        .order('nome');

      if (error) throw error;

      const alunosFormatados = data.map((aluno: any) => ({
        id: aluno.id,
        nome: aluno.nome,
        turma: aluno.turmas?.nome || 'Sem turma',
        professor: aluno.turmas?.professores?.nome || 'Sem professor'
      }));

      setAlunos(alunosFormatados);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar alunos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const alunosDisponivelsFiltrados = alunos
    .filter(aluno => !alunosJaCadastrados.some(cadastrado => cadastrado.id === aluno.id))
    .filter(aluno => aluno.nome.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.alunoId || !formData.formaPagamento || !formData.responsavelId) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const alunoSelecionado = alunos.find(a => a.id === formData.alunoId);
    if (alunoSelecionado) {
      const novoAlunoEvento = {
        ...alunoSelecionado,
        responsavelId: formData.responsavelId,
        valorPago: formData.valorPago ? parseFloat(formData.valorPago) : null,
        formaPagamento: formData.formaPagamento
      };

      onAlunoAdicionado(novoAlunoEvento);
      setFormData({ alunoId: '', responsavelId: '', valorPago: '', formaPagamento: '' });
      setSearchTerm('');
      setOpen(false);
      
      toast({
        title: "Sucesso",
        description: "Aluno adicionado ao evento!"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Aluno
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Aluno ao Evento</DialogTitle>
          <DialogDescription>
            Selecione um aluno e a forma de pagamento.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search">Buscar Aluno</Label>
            <Input
              placeholder="Digite o nome do aluno..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="aluno">Aluno * {loading && "(Carregando...)"}</Label>
            <Select 
              value={formData.alunoId} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, alunoId: value }))}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Carregando alunos..." : "Selecione um aluno"} />
              </SelectTrigger>
              <SelectContent>
                {alunosDisponivelsFiltrados.length === 0 && !loading ? (
                  <div className="p-2 text-center text-muted-foreground">Nenhum aluno encontrado</div>
                ) : (
                  alunosDisponivelsFiltrados.map(aluno => (
                    <SelectItem key={aluno.id} value={aluno.id.toString()}>
                      {aluno.nome} - {aluno.turma} ({aluno.professor})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsavel">Responsável *</Label>
            <Select 
              value={formData.responsavelId} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, responsavelId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o responsável" />
              </SelectTrigger>
              <SelectContent>
                {responsaveis.map((resp) => (
                  <SelectItem key={resp.id} value={resp.id}>
                    {resp.nome} ({resp.tipo})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="formaPagamento">Forma de Pagamento *</Label>
            <Select value={formData.formaPagamento} onValueChange={(value) => setFormData(prev => ({ ...prev, formaPagamento: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a forma de pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                <SelectItem value="pix">Pix</SelectItem>
                <SelectItem value="boleto">Boleto</SelectItem>
                <SelectItem value="carimbo">Carimbo</SelectItem>
                <SelectItem value="evento_gratuito">Evento Gratuito</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="valorPago">Valor Pago</Label>
            <Input
              id="valorPago"
              type="number"
              step="0.01"
              min="0"
              value={formData.valorPago}
              onChange={(e) => setFormData(prev => ({ ...prev, valorPago: e.target.value }))}
              placeholder="0.00"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Adicionar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

  const adicionarAluno = async (novoAluno: any) => {
    try {
      const { error } = await supabase
        .from('evento_participantes')
        .insert({
          evento_id: id,
          aluno_id: novoAluno.id,
          forma_pagamento: novoAluno.formaPagamento
        });

      if (error) throw error;

      setAlunosEvento(prev => [...prev, { ...novoAluno, tipo: 'aluno' }]);
      
      toast({
        title: "Sucesso",
        description: "Aluno adicionado ao evento!"
      });
    } catch (error) {
      console.error('Erro ao adicionar aluno:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar aluno ao evento",
        variant: "destructive"
      });
    }
  };

  const adicionarConvidadoNaoAluno = async (convidado: any) => {
    try {
      // TODO: Pegar o ID do usuário logado para responsavel_cadastro
      const responsavelCadastroTipo = responsaveis.find(r => r.id === convidado.responsavelId)?.tipo || 'funcionario';
      
      const { error } = await supabase
        .from('convidados_eventos')
        .insert({
          evento_id: id,
          nome_completo: convidado.nomeCompleto,
          telefone_contato: convidado.telefone,
          quem_convidou_tipo: convidado.quemConvidouTipo,
          quem_convidou_id: convidado.quemConvidouId,
          quem_convidou_nome: convidado.quemConvidouNome,
          responsavel_cadastro_id: convidado.responsavelId, // TODO: mudar para usuário logado
          responsavel_cadastro_tipo: responsavelCadastroTipo,
          responsavel_cadastro_nome: convidado.responsavelNome,
          responsavel_id: convidado.responsavelId,
          responsavel_nome: convidado.responsavelNome,
          valor_pago: convidado.valorPago,
          forma_pagamento: convidado.formaPagamento
        });

      if (error) throw error;

      const novoConvidado = {
        id: crypto.randomUUID(), // temporário
        nome: convidado.nomeCompleto,
        telefone: convidado.telefone,
        quemConvidou: convidado.quemConvidouNome,
        responsavel: convidado.responsavelNome,
        valorPago: convidado.valorPago,
        formaPagamento: convidado.formaPagamento,
        tipo: 'nao_aluno'
      };

      setConvidadosNaoAlunos(prev => [...prev, novoConvidado]);
      
      toast({
        title: "Sucesso",
        description: "Convidado não aluno adicionado ao evento!"
      });
    } catch (error) {
      console.error('Erro ao adicionar convidado:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar convidado ao evento",
        variant: "destructive"
      });
    }
  };

  const removerAluno = async (alunoId: string) => {
    try {
      const { error } = await supabase
        .from('evento_participantes')
        .delete()
        .eq('evento_id', id)
        .eq('aluno_id', alunoId);

      if (error) throw error;

      setAlunosEvento(prev => prev.filter(aluno => aluno.id !== alunoId));
      
      toast({
        title: "Aluno removido",
        description: "Aluno removido do evento com sucesso."
      });
    } catch (error) {
      console.error('Erro ao remover aluno:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover aluno do evento",
        variant: "destructive"
      });
    }
  };

  const removerConvidadoNaoAluno = async (convidadoId: string) => {
    try {
      const { error } = await supabase
        .from('convidados_eventos')
        .delete()
        .eq('id', convidadoId);

      if (error) throw error;

      setConvidadosNaoAlunos(prev => prev.filter(c => c.id !== convidadoId));
      
      toast({
        title: "Convidado removido",
        description: "Convidado não aluno removido do evento com sucesso."
      });
    } catch (error) {
      console.error('Erro ao remover convidado:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover convidado do evento",
        variant: "destructive"
      });
    }
  };

  const totalConvidados = alunosEvento.length + convidadosNaoAlunos.length;
  const vagasDisponiveis = evento ? evento.numero_vagas - totalConvidados : 0;
  const { data, hora } = evento ? formatarData(evento.data_evento) : { data: '', hora: '' };

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!evento) {
    return <div>Evento não encontrado</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/eventos')}
            className="mb-4"
          >
            ← Voltar para Eventos
          </Button>
          <h1 className="text-3xl font-bold">Editar Evento</h1>
          <p className="text-muted-foreground">
            Gerencie as informações do evento e participantes
          </p>
        </div>
      </div>

      {/* Informações do Evento */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl">{evento.titulo}</CardTitle>
              <CardDescription className="mt-1">
                {evento.descricao}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getTipoColor(evento.tipo)}>
                {evento.tipo}
              </Badge>
              <EditarEventoModal evento={evento} onEventoAtualizado={buscarEvento} responsaveis={responsaveis} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{data}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{hora}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{evento.local}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{evento.responsavel}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>{evento.numero_vagas} vagas totais</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className={vagasDisponiveis > 0 ? "text-green-600" : "text-red-600"}>
                {vagasDisponiveis} vagas disponíveis
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Convidados */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Convidados ({totalConvidados})</CardTitle>
              <CardDescription>
                Lista de participantes inscritos no evento
              </CardDescription>
            </div>
            {vagasDisponiveis > 0 && (
              <div className="flex gap-2">
                <AdicionarAlunoModal 
                  onAlunoAdicionado={adicionarAluno}
                  alunosJaCadastrados={alunosEvento}
                  responsaveis={responsaveis}
                />
                <AdicionarNaoAlunoModal 
                  onConvidadoAdicionado={adicionarConvidadoNaoAluno}
                  responsaveis={responsaveis}
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {totalConvidados > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Informações</TableHead>
                  <TableHead>Forma de Pagamento</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alunosEvento.map((aluno) => (
                  <TableRow key={`aluno-${aluno.id}`}>
                    <TableCell className="font-medium">{aluno.nome}</TableCell>
                    <TableCell>
                      <Badge variant="default">Aluno</Badge>
                    </TableCell>
                    <TableCell>
                      {aluno.turma} - {aluno.professor}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {aluno.formaPagamento}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removerAluno(aluno.id)}
                        className="gap-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {convidadosNaoAlunos.map((convidado) => (
                  <TableRow key={`convidado-${convidado.id}`}>
                    <TableCell className="font-medium">
                      {convidado.nome}
                      <div className="text-xs text-muted-foreground">{convidado.telefone}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                        Não Aluno
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Convidou: {convidado.quemConvidou}</div>
                        <div>Responsável: {convidado.responsavel}</div>
                        {convidado.valorPago && (
                          <div>Valor: R$ {Number(convidado.valorPago).toFixed(2)}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {convidado.formaPagamento.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removerConvidadoNaoAluno(convidado.id)}
                        className="gap-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum convidado cadastrado ainda
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}