import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Calendar, Clock, MapPin, User, Users, Plus, Trash2 } from "lucide-react";
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

// Mock data - seria substituído por dados reais
const eventosIniciais = [
  {
    id: 1,
    titulo: "Reunião Pedagógica Mensal",
    descricao: "Revisão de metodologias e planejamento do próximo mês",
    data: "2024-01-25T14:00:00",
    local: "Sala de Reuniões - Unidade Centro",
    responsavel: "Ana Silva",
    tipo: "Reunião",
    numeroVagas: 20
  },
  {
    id: 2,
    titulo: "Workshop AH Avançado",
    descricao: "Treinamento para novos educadores sobre metodologia AH",
    data: "2024-01-20T09:00:00",
    local: "Auditório Principal",
    responsavel: "Carlos Santos",
    tipo: "Treinamento",
    numeroVagas: 15
  }
];

const alunosDisponiveis = [
  { id: 1, nome: "João Silva", turma: "Turma A", professor: "Prof. Ana" },
  { id: 2, nome: "Maria Santos", turma: "Turma B", professor: "Prof. Carlos" },
  { id: 3, nome: "Pedro Costa", turma: "Turma A", professor: "Prof. Ana" },
  { id: 4, nome: "Ana Oliveira", turma: "Turma C", professor: "Prof. Maria" },
  { id: 5, nome: "Lucas Ferreira", turma: "Turma B", professor: "Prof. Carlos" }
];

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

const AdicionarAlunoModal = ({ onAlunoAdicionado, alunosJaCadastrados }: { 
  onAlunoAdicionado: (aluno: any) => void;
  alunosJaCadastrados: any[];
}) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    alunoId: '',
    formaPagamento: ''
  });
  const { toast } = useToast();

  const alunosDisponivelsFiltrados = alunosDisponiveis.filter(
    aluno => !alunosJaCadastrados.some(cadastrado => cadastrado.id === aluno.id)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.alunoId || !formData.formaPagamento) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive"
      });
      return;
    }

    const alunoSelecionado = alunosDisponiveis.find(a => a.id === parseInt(formData.alunoId));
    if (alunoSelecionado) {
      const novoAlunoEvento = {
        ...alunoSelecionado,
        formaPagamento: formData.formaPagamento
      };

      onAlunoAdicionado(novoAlunoEvento);
      setFormData({ alunoId: '', formaPagamento: '' });
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
            <Label htmlFor="aluno">Aluno *</Label>
            <Select value={formData.alunoId} onValueChange={(value) => setFormData(prev => ({ ...prev, alunoId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um aluno" />
              </SelectTrigger>
              <SelectContent>
                {alunosDisponivelsFiltrados.map(aluno => (
                  <SelectItem key={aluno.id} value={aluno.id.toString()}>
                    {aluno.nome} - {aluno.turma}
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
                <SelectItem value="Cartão">Cartão</SelectItem>
                <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                <SelectItem value="PIX">PIX</SelectItem>
                <SelectItem value="Carimbo">Carimbo</SelectItem>
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

export default function EditarEvento() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [evento, setEvento] = useState<any>(null);
  const [alunosEvento, setAlunosEvento] = useState<any[]>([]);

  useEffect(() => {
    // Simular busca do evento - seria substituído por chamada real
    const eventoEncontrado = eventosIniciais.find(e => e.id === parseInt(id || ''));
    if (eventoEncontrado) {
      setEvento(eventoEncontrado);
    } else {
      toast({
        title: "Evento não encontrado",
        description: "O evento solicitado não existe.",
        variant: "destructive"
      });
      navigate('/eventos');
    }
  }, [id]); // Removido navigate e toast das dependências

  const adicionarAluno = (novoAluno: any) => {
    setAlunosEvento(prev => [...prev, novoAluno]);
  };

  const removerAluno = (alunoId: number) => {
    setAlunosEvento(prev => prev.filter(aluno => aluno.id !== alunoId));
    toast({
      title: "Aluno removido",
      description: "Aluno removido do evento com sucesso."
    });
  };

  const vagasDisponiveis = evento ? evento.numeroVagas - alunosEvento.length : 0;
  const { data, hora } = evento ? formatarData(evento.data) : { data: '', hora: '' };

  if (!evento) {
    return <div>Carregando...</div>;
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
            <Badge className={getTipoColor(evento.tipo)}>
              {evento.tipo}
            </Badge>
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
              <span>{evento.numeroVagas} vagas totais</span>
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

      {/* Alunos Cadastrados */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Alunos Cadastrados ({alunosEvento.length})</CardTitle>
              <CardDescription>
                Lista de alunos inscritos no evento
              </CardDescription>
            </div>
            {vagasDisponiveis > 0 && (
              <AdicionarAlunoModal 
                onAlunoAdicionado={adicionarAluno}
                alunosJaCadastrados={alunosEvento}
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {alunosEvento.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead>Professor</TableHead>
                  <TableHead>Forma de Pagamento</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alunosEvento.map((aluno) => (
                  <TableRow key={aluno.id}>
                    <TableCell className="font-medium">{aluno.nome}</TableCell>
                    <TableCell>{aluno.turma}</TableCell>
                    <TableCell>{aluno.professor}</TableCell>
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
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum aluno cadastrado ainda
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}