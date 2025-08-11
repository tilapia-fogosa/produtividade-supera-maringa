import { Calendar, Clock, MapPin, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const eventosExample = [
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

const EventCard = ({ evento }: { evento: typeof eventosExample[0] }) => {
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

export default function Eventos() {
  const agora = new Date();
  
  const eventosFuturos = eventosExample.filter(evento => 
    new Date(evento.data) >= agora
  ).sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  
  const eventosAnteriores = eventosExample.filter(evento => 
    new Date(evento.data) < agora
  ).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Eventos</h1>
        <p className="text-muted-foreground">
          Gerencie e acompanhe os eventos da unidade
        </p>
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