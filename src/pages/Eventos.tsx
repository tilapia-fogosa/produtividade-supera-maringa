import { useState } from "react";
import { Calendar, Clock, MapPin, User, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const eventosIniciais = [
  {
    id: 1,
    titulo: "Reunião Pedagógica Mensal",
    descricao: "Revisão de metodologias e planejamento do próximo mês",
    data: "2024-01-25T14:00:00",
    local: "Sala de Reuniões - Unidade Centro",
    responsavel: "Ana Silva",
    tipo: "Reunião"
  },
  {
    id: 2,
    titulo: "Workshop AH Avançado",
    descricao: "Treinamento para novos educadores sobre metodologia AH",
    data: "2024-01-20T09:00:00",
    local: "Auditório Principal",
    responsavel: "Carlos Santos",
    tipo: "Treinamento"
  },
  {
    id: 3,
    titulo: "Avaliação Trimestral",
    descricao: "Apresentação dos resultados do trimestre",
    data: "2023-12-15T16:00:00",
    local: "Sala de Reuniões - Unidade Norte",
    responsavel: "Maria Oliveira",
    tipo: "Avaliação"
  },
  {
    id: 4,
    titulo: "Capacitação Ábaco",
    descricao: "Curso de capacitação para uso avançado do ábaco",
    data: "2023-11-28T08:30:00",
    local: "Laboratório de Matemática",
    responsavel: "João Costa",
    tipo: "Treinamento"
  }
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

const EventCard = ({ evento }: { evento: typeof eventosIniciais[0] }) => {
  const { data, hora } = formatarData(evento.data);
  
  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{evento.titulo}</CardTitle>
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
        <div className="space-y-2 text-sm text-muted-foreground">
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
        </div>
      </CardContent>
    </Card>
  );
};

const NovoEventoModal = ({ onEventoCriado }: { onEventoCriado: (evento: any) => void }) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    data: '',
    hora: '',
    local: '',
    responsavel: '',
    tipo: ''
  });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titulo || !formData.data || !formData.hora || !formData.tipo) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const novoEvento = {
      id: Date.now(),
      titulo: formData.titulo,
      descricao: formData.descricao,
      data: `${formData.data}T${formData.hora}:00`,
      local: formData.local,
      responsavel: formData.responsavel,
      tipo: formData.tipo
    };

    onEventoCriado(novoEvento);
    setFormData({
      titulo: '',
      descricao: '',
      data: '',
      hora: '',
      local: '',
      responsavel: '',
      tipo: ''
    });
    setOpen(false);
    
    toast({
      title: "Sucesso",
      description: "Evento criado com sucesso!"
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Evento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Evento</DialogTitle>
          <DialogDescription>
            Preencha as informações do evento abaixo.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
              placeholder="Nome do evento"
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data">Data *</Label>
              <Input
                id="data"
                type="date"
                value={formData.data}
                onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hora">Hora *</Label>
              <Input
                id="hora"
                type="time"
                value={formData.hora}
                onChange={(e) => setFormData(prev => ({ ...prev, hora: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="local">Local</Label>
            <Input
              id="local"
              value={formData.local}
              onChange={(e) => setFormData(prev => ({ ...prev, local: e.target.value }))}
              placeholder="Local do evento"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsavel">Responsável</Label>
            <Input
              id="responsavel"
              value={formData.responsavel}
              onChange={(e) => setFormData(prev => ({ ...prev, responsavel: e.target.value }))}
              placeholder="Nome do responsável"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo *</Label>
            <Select value={formData.tipo} onValueChange={(value) => setFormData(prev => ({ ...prev, tipo: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Reunião">Reunião</SelectItem>
                <SelectItem value="Treinamento">Treinamento</SelectItem>
                <SelectItem value="Avaliação">Avaliação</SelectItem>
                <SelectItem value="Workshop">Workshop</SelectItem>
                <SelectItem value="Apresentação">Apresentação</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Criar Evento
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default function Eventos() {
  const [eventosData, setEventosData] = useState(eventosIniciais);
  const agora = new Date();
  
  const adicionarEvento = (novoEvento: any) => {
    setEventosData(prev => [...prev, novoEvento]);
  };
  
  const eventosFuturos = eventosData.filter(evento => 
    new Date(evento.data) >= agora
  ).sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  
  const eventosAnteriores = eventosData.filter(evento => 
    new Date(evento.data) < agora
  ).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Eventos</h1>
          <p className="text-muted-foreground">
            Gerencie e acompanhe os eventos da unidade
          </p>
        </div>
        <NovoEventoModal onEventoCriado={adicionarEvento} />
      </div>

      {/* Eventos Futuros */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-primary">
          Próximos Eventos ({eventosFuturos.length})
        </h2>
        {eventosFuturos.length > 0 ? (
          <div className="space-y-4">
            {eventosFuturos.map(evento => (
              <EventCard key={evento.id} evento={evento} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">
                Nenhum evento futuro agendado
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Eventos Anteriores */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-muted-foreground">
          Eventos Anteriores ({eventosAnteriores.length})
        </h2>
        {eventosAnteriores.length > 0 ? (
          <div className="space-y-4">
            {eventosAnteriores.map(evento => (
              <EventCard key={evento.id} evento={evento} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">
                Nenhum evento anterior encontrado
              </p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}