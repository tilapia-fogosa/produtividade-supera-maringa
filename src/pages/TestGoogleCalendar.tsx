import { useState, useMemo } from "react";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday,
  parseISO
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Plus, Pencil, Trash2, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  useGoogleCalendarEvents,
  useCreateGoogleCalendarEvent,
  useUpdateGoogleCalendarEvent,
  useDeleteGoogleCalendarEvent,
} from "@/hooks/use-google-calendar";

type GoogleCalendarEvent = {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  location?: string;
  htmlLink?: string;
};

const TestGoogleCalendar = () => {
  const calendarId = '4443dba6908f1de63ed98aca1d9878ffff08b0a55c4189b230c86f88a81a8065@group.calendar.google.com';
  
  // Estado do mês atual do calendário
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Calcular timeMin e timeMax baseado no mês atual
  const { timeMin, timeMax } = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    return {
      timeMin: monthStart.toISOString(),
      timeMax: monthEnd.toISOString()
    };
  }, [currentMonth]);

  const { data: events, isLoading, error, refetch } = useGoogleCalendarEvents(
    calendarId,
    timeMin,
    timeMax
  );

  const createEvent = useCreateGoogleCalendarEvent();
  const updateEvent = useUpdateGoogleCalendarEvent();
  const deleteEvent = useDeleteGoogleCalendarEvent();

  // Form state for new event
  const [newEvent, setNewEvent] = useState({
    summary: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
  });

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<GoogleCalendarEvent | null>(null);
  const [editForm, setEditForm] = useState({
    summary: "",
    description: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
  });

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState<GoogleCalendarEvent | null>(null);

  // Gerar dias do calendário
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  // Mapear eventos por dia
  const eventsByDay = useMemo(() => {
    const map: Record<string, GoogleCalendarEvent[]> = {};
    
    if (events) {
      events.forEach((event) => {
        const dateStr = event.start.dateTime || event.start.date;
        if (dateStr) {
          const date = parseISO(dateStr);
          const dayKey = format(date, 'yyyy-MM-dd');
          if (!map[dayKey]) {
            map[dayKey] = [];
          }
          map[dayKey].push(event);
        }
      });
    }
    
    return map;
  }, [events]);

  const handleCreateEvent = async () => {
    if (!calendarId || !newEvent.summary || !newEvent.startDate || !newEvent.startTime || !newEvent.endDate || !newEvent.endTime) {
      return;
    }

    const startDateTime = `${newEvent.startDate}T${newEvent.startTime}:00`;
    const endDateTime = `${newEvent.endDate}T${newEvent.endTime}:00`;

    try {
      await createEvent.mutateAsync({
        calendarId,
        eventData: {
          summary: newEvent.summary,
          start: { dateTime: startDateTime, timeZone: "America/Sao_Paulo" },
          end: { dateTime: endDateTime, timeZone: "America/Sao_Paulo" },
        },
      });

      setNewEvent({
        summary: "",
        startDate: "",
        startTime: "",
        endDate: "",
        endTime: "",
      });
    } catch (err) {
      console.error("Erro ao criar evento:", err);
    }
  };

  const openEditModal = (event: GoogleCalendarEvent) => {
    const startDateTime = event.start.dateTime || event.start.date || "";
    const endDateTime = event.end.dateTime || event.end.date || "";

    const startDate = startDateTime.split("T")[0] || "";
    const startTime = startDateTime.includes("T") ? startDateTime.split("T")[1]?.substring(0, 5) || "" : "";
    const endDate = endDateTime.split("T")[0] || "";
    const endTime = endDateTime.includes("T") ? endDateTime.split("T")[1]?.substring(0, 5) || "" : "";

    setEditingEvent(event);
    setEditForm({
      summary: event.summary || "",
      description: event.description || "",
      startDate,
      startTime,
      endDate,
      endTime,
    });
    setEditModalOpen(true);
  };

  const handleUpdateEvent = async () => {
    if (!calendarId || !editingEvent || !editForm.summary || !editForm.startDate || !editForm.startTime || !editForm.endDate || !editForm.endTime) {
      return;
    }

    const startDateTime = `${editForm.startDate}T${editForm.startTime}:00`;
    const endDateTime = `${editForm.endDate}T${editForm.endTime}:00`;

    try {
      await updateEvent.mutateAsync({
        calendarId,
        eventId: editingEvent.id,
        eventData: {
          summary: editForm.summary,
          description: editForm.description || undefined,
          start: { dateTime: startDateTime, timeZone: "America/Sao_Paulo" },
          end: { dateTime: endDateTime, timeZone: "America/Sao_Paulo" },
        },
      });

      setEditModalOpen(false);
      setEditingEvent(null);
    } catch (err) {
      console.error("Erro ao atualizar evento:", err);
    }
  };

  const openDeleteDialog = (event: GoogleCalendarEvent) => {
    setDeletingEvent(event);
    setDeleteDialogOpen(true);
  };

  const handleDeleteEvent = async () => {
    if (!calendarId || !deletingEvent) return;

    try {
      await deleteEvent.mutateAsync({
        calendarId,
        eventId: deletingEvent.id,
      });

      setDeleteDialogOpen(false);
      setDeletingEvent(null);
    } catch (err) {
      console.error("Erro ao excluir evento:", err);
    }
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const getEventTime = (event: GoogleCalendarEvent) => {
    const dateStr = event.start.dateTime;
    if (dateStr) {
      const date = parseISO(dateStr);
      return format(date, 'HH:mm');
    }
    return '';
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  if (!calendarId) {
    return (
      <div className="space-y-4 p-4">
        <h1 className="text-xl font-bold">Teste Google Calendar</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              Você precisa configurar o ID do calendário no seu perfil antes de usar esta funcionalidade.
            </p>
            <Button className="mt-4" onClick={() => window.location.href = "/meu-perfil"}>
              Ir para Meu Perfil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Calendar className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-bold">Teste Google Calendar</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Formulário de criação compacto */}
        <Card className="lg:w-64 shrink-0">
          <CardHeader className="pb-2 px-3 pt-3">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Novo Evento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 px-3 pb-3">
            <div>
              <Label htmlFor="summary" className="text-xs">Título</Label>
              <Input
                id="summary"
                placeholder="Nome"
                value={newEvent.summary}
                onChange={(e) => setNewEvent({ ...newEvent, summary: e.target.value })}
                className="h-8 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <Label htmlFor="startDate" className="text-xs">Início</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={newEvent.startDate}
                  onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label htmlFor="startTime" className="text-xs opacity-0">Hora</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={newEvent.startTime}
                  onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <Label htmlFor="endDate" className="text-xs">Fim</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={newEvent.endDate}
                  onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label htmlFor="endTime" className="text-xs opacity-0">Hora</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={newEvent.endTime}
                  onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <Button
              onClick={handleCreateEvent}
              disabled={createEvent.isPending || !newEvent.summary || !newEvent.startDate || !newEvent.startTime || !newEvent.endDate || !newEvent.endTime}
              className="w-full h-8 text-sm"
              size="sm"
            >
              {createEvent.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                "Criar"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Calendário Mensal */}
        <Card className="flex-1">
          <CardHeader className="pb-2 px-3 pt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-7 px-2" onClick={goToPreviousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="h-7 px-2" onClick={goToNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium capitalize">
                  {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={goToToday}>
                  Hoje
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => refetch()}>
                  {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Atualizar"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            {error ? (
              <p className="text-destructive text-sm">Erro ao carregar eventos: {error.message}</p>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                {/* Header dos dias da semana */}
                <div className="grid grid-cols-7 bg-muted/50">
                  {weekDays.map((day) => (
                    <div key={day} className="text-center py-1.5 text-xs font-medium text-muted-foreground border-b">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Grid do calendário */}
                <div className="grid grid-cols-7">
                  {calendarDays.map((day, index) => {
                    const dayKey = format(day, 'yyyy-MM-dd');
                    const dayEvents = eventsByDay[dayKey] || [];
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isTodayDate = isToday(day);

                    return (
                      <div
                        key={index}
                        className={`min-h-[70px] border-b border-r p-1 ${
                          !isCurrentMonth ? 'bg-muted/30' : ''
                        } ${index % 7 === 6 ? 'border-r-0' : ''}`}
                      >
                        <div className={`text-xs font-medium mb-0.5 ${
                          isTodayDate 
                            ? 'bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center' 
                            : isCurrentMonth 
                              ? 'text-foreground' 
                              : 'text-muted-foreground'
                        }`}>
                          {format(day, 'd')}
                        </div>
                        <div className="space-y-0.5 overflow-hidden">
                          {dayEvents.slice(0, 3).map((event) => (
                            <button
                              key={event.id}
                              onClick={() => openEditModal(event)}
                              className="w-full text-left flex items-center gap-1 px-1 py-0.5 rounded text-[10px] bg-primary/10 hover:bg-primary/20 transition-colors truncate"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                              <span className="text-muted-foreground shrink-0">{getEventTime(event)}</span>
                              <span className="truncate">{event.summary}</span>
                            </button>
                          ))}
                          {dayEvents.length > 3 && (
                            <span className="text-[10px] text-muted-foreground px-1">
                              +{dayEvents.length - 3} mais
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de edição */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Evento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-summary">Título</Label>
              <Input
                id="edit-summary"
                value={editForm.summary}
                onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-startDate">Data Início</Label>
                <Input
                  id="edit-startDate"
                  type="date"
                  value={editForm.startDate}
                  onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-startTime">Hora Início</Label>
                <Input
                  id="edit-startTime"
                  type="time"
                  value={editForm.startTime}
                  onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-endDate">Data Fim</Label>
                <Input
                  id="edit-endDate"
                  type="date"
                  value={editForm.endDate}
                  onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-endTime">Hora Fim</Label>
                <Input
                  id="edit-endTime"
                  type="time"
                  value={editForm.endTime}
                  onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => {
                if (editingEvent) {
                  openDeleteDialog(editingEvent);
                  setEditModalOpen(false);
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Excluir
            </Button>
            <div className="flex-1" />
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateEvent} disabled={updateEvent.isPending}>
              {updateEvent.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir evento?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir o evento "{deletingEvent?.summary}". Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEvent} disabled={deleteEvent.isPending}>
              {deleteEvent.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TestGoogleCalendar;
