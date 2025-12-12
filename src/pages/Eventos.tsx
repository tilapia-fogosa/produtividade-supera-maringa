import { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, User, Plus, Edit, Users, Trash2, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useCurrentFuncionario } from "@/hooks/use-current-funcionario";


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

const EventCard = ({ evento, onEventoRemovido }: { evento: any; onEventoRemovido: (eventoId: string) => void }) => {
  const { data, hora } = formatarData(evento.data_evento || evento.data);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleRemoverEvento = async () => {
    if (confirm("Tem certeza que deseja remover este evento? Esta ação não pode ser desfeita.")) {
      try {
        const { error } = await supabase
          .from('eventos')
          .update({ active: false })
          .eq('id', evento.id);

        if (error) throw error;

        onEventoRemovido(evento.id);
        toast({
          title: "Evento removido",
          description: "O evento foi removido com sucesso.",
        });
      } catch (error) {
        console.error('Erro ao remover evento:', error);
        toast({
          title: "Erro",
          description: "Erro ao remover o evento. Tente novamente.",
          variant: "destructive"
        });
      }
    }
  };
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
          <div className="flex items-center gap-2">
            <Badge className={getTipoColor(evento.tipo)}>
              {evento.tipo}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/eventos/${evento.id}/editar`)}
              className="gap-1"
            >
              <Edit className="h-3 w-3" />
              Ver Detalhes
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemoverEvento}
              className="gap-1 text-red-600 hover:text-red-700 hover:border-red-300"
            >
              <Trash2 className="h-3 w-3" />
              Remover
            </Button>
          </div>
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
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>{evento.numero_vagas || evento.numeroVagas} vagas</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const NovoEventoModal = ({ onEventoCriado }: { onEventoCriado: (evento: any) => void }) => {
  const [open, setOpen] = useState(false);
  const { funcionarioId, funcionarioNome } = useCurrentFuncionario();
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    data: '',
    hora: '',
    local: '',
    tipo: '',
    numeroVagas: ''
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titulo || !formData.data || !formData.hora || !formData.tipo || !formData.numeroVagas) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const novoEvento = {
      titulo: formData.titulo,
      descricao: formData.descricao,
      data: formData.data,
      hora: formData.hora,
      local: formData.local,
      responsavel: funcionarioNome || 'Sistema',
      tipo: formData.tipo,
      numeroVagas: formData.numeroVagas,
      funcionario_registro_id: funcionarioId
    };

    try {
      await onEventoCriado(novoEvento);
      setFormData({
        titulo: '',
        descricao: '',
        data: '',
        hora: '',
        local: '',
        tipo: '',
        numeroVagas: ''
      });
      setOpen(false);
      
      toast({
        title: "Sucesso",
        description: "Evento criado com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar evento. Tente novamente.",
        variant: "destructive"
      });
    }
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

          {/* Responsável - automático */}
          <div className="space-y-2">
            <Label>Responsável</Label>
            <p className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md">
              {funcionarioNome || 'Carregando...'}
            </p>
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

          <div className="space-y-2">
            <Label htmlFor="numeroVagas">Número de Vagas *</Label>
            <Input
              id="numeroVagas"
              type="number"
              min="1"
              value={formData.numeroVagas}
              onChange={(e) => setFormData(prev => ({ ...prev, numeroVagas: e.target.value }))}
              placeholder="Número de vagas disponíveis"
            />
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
  const [eventosData, setEventosData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [mostrarEventosAnteriores, setMostrarEventosAnteriores] = useState(false);
  const agora = new Date();

  useEffect(() => {
    buscarEventos();
  }, []);

  const buscarEventos = async () => {
    try {
      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .eq('active', true)
        .order('data_evento');

      if (error) throw error;
      setEventosData(data || []);
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const adicionarEvento = async (novoEvento: any) => {
    console.log('Tentando criar evento:', novoEvento);
    try {
      // Primeiro, vamos buscar uma unit_id real
      const { data: units, error: unitsError } = await supabase
        .from('units')
        .select('id')
        .limit(1);

      if (unitsError) {
        console.error('Erro ao buscar units:', unitsError);
        throw unitsError;
      }

      const unitId = units && units.length > 0 ? units[0].id : null;
      
      if (!unitId) {
        throw new Error('Nenhuma unidade encontrada no sistema');
      }

      console.log('Unit ID encontrado:', unitId);

      const eventoData = {
        titulo: novoEvento.titulo,
        descricao: novoEvento.descricao,
        data_evento: `${novoEvento.data}T${novoEvento.hora}:00`,
        local: novoEvento.local,
        responsavel: novoEvento.responsavel,
        tipo: novoEvento.tipo,
        numero_vagas: parseInt(novoEvento.numeroVagas),
        unit_id: unitId,
        funcionario_registro_id: novoEvento.funcionario_registro_id
      };

      console.log('Dados do evento a ser inserido:', eventoData);

      const { data, error } = await supabase
        .from('eventos')
        .insert(eventoData)
        .select()
        .single();

      console.log('Resposta do insert:', { data, error });

      if (error) throw error;
      
      setEventosData(prev => [...prev, data]);
      console.log('Evento adicionado com sucesso:', data);
      
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      // Adicionar toast de erro para o usuário ver
      throw error;
    }
  };
  
  const removerEvento = (eventoId: string) => {
    setEventosData(prev => prev.filter(evento => evento.id !== eventoId));
  };
  
  // Filtrar eventos com base na pesquisa
  const eventosFiltrados = eventosData.filter(evento => {
    const termoBusca = searchTerm.toLowerCase();
    return (
      evento.titulo?.toLowerCase().includes(termoBusca) ||
      evento.descricao?.toLowerCase().includes(termoBusca) ||
      evento.local?.toLowerCase().includes(termoBusca) ||
      evento.responsavel?.toLowerCase().includes(termoBusca) ||
      evento.tipo?.toLowerCase().includes(termoBusca)
    );
  });
  
  const eventosFuturos = eventosFiltrados.filter(evento => 
    new Date(evento.data_evento) >= agora
  ).sort((a, b) => new Date(a.data_evento).getTime() - new Date(b.data_evento).getTime());
  
  const eventosAnteriores = eventosFiltrados.filter(evento => 
    new Date(evento.data_evento) < agora
  ).sort((a, b) => new Date(b.data_evento).getTime() - new Date(a.data_evento).getTime());

  if (loading) {
    return <div>Carregando eventos...</div>;
  }

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

      {/* Campo de Pesquisa */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Pesquisar eventos por título, descrição, local, responsável ou tipo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Eventos Futuros */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-primary">
          Próximos Eventos ({eventosFuturos.length})
        </h2>
        {eventosFuturos.length > 0 ? (
          <div className="space-y-4">
            {eventosFuturos.map(evento => (
              <EventCard key={evento.id} evento={evento} onEventoRemovido={removerEvento} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">
                {searchTerm ? 'Nenhum evento futuro encontrado com esses critérios' : 'Nenhum evento futuro agendado'}
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Eventos Anteriores */}
      {eventosAnteriores.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-muted-foreground">
              Eventos Anteriores ({eventosAnteriores.length})
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMostrarEventosAnteriores(!mostrarEventosAnteriores)}
            >
              {mostrarEventosAnteriores ? 'Ocultar' : 'Mostrar'} Eventos Anteriores
            </Button>
          </div>
          {mostrarEventosAnteriores && (
            <div className="space-y-4">
              {eventosAnteriores.map(evento => (
                <EventCard key={evento.id} evento={evento} onEventoRemovido={removerEvento} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}