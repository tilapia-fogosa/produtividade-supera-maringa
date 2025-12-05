import { useState } from "react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
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
  // ID do calendário hardcoded para testes
  const calendarId = '4443dba6908f1de63ed98aca1d9878ffff08b0a55c4189b230c86f88a81a8065@group.calendar.google.com';

  const timeMin = new Date().toISOString();
  const timeMax = addDays(new Date(), 30).toISOString();

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
    description: "",
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
          description: newEvent.description || undefined,
          start: { dateTime: startDateTime, timeZone: "America/Sao_Paulo" },
          end: { dateTime: endDateTime, timeZone: "America/Sao_Paulo" },
        },
      });

      setNewEvent({
        summary: "",
        description: "",
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

  const formatEventDateTime = (event: GoogleCalendarEvent) => {
    const startStr = event.start.dateTime || event.start.date;
    const endStr = event.end.dateTime || event.end.date;

    if (!startStr || !endStr) return "";

    const start = new Date(startStr);
    const end = new Date(endStr);

    if (event.start.dateTime) {
      return `${format(start, "dd/MM/yyyy HH:mm", { locale: ptBR })} - ${format(end, "HH:mm", { locale: ptBR })}`;
    } else {
      return format(start, "dd/MM/yyyy", { locale: ptBR });
    }
  };

  if (!calendarId) {
    return (
      <div className="space-y-4">
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
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Calendar className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold">Teste Google Calendar</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        Calendário conectado: <span className="font-medium">{calendarId}</span>
      </p>

      {/* Formulário de criação */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Criar Novo Evento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="summary">Título</Label>
            <Input
              id="summary"
              placeholder="Nome do evento"
              value={newEvent.summary}
              onChange={(e) => setNewEvent({ ...newEvent, summary: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Descrição do evento"
              value={newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data Início</Label>
              <Input
                id="startDate"
                type="date"
                value={newEvent.startDate}
                onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Hora Início</Label>
              <Input
                id="startTime"
                type="time"
                value={newEvent.startTime}
                onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="endDate">Data Fim</Label>
              <Input
                id="endDate"
                type="date"
                value={newEvent.endDate}
                onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">Hora Fim</Label>
              <Input
                id="endTime"
                type="time"
                value={newEvent.endTime}
                onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
              />
            </div>
          </div>

          <Button
            onClick={handleCreateEvent}
            disabled={createEvent.isPending || !newEvent.summary || !newEvent.startDate || !newEvent.startTime || !newEvent.endDate || !newEvent.endTime}
            className="w-full"
          >
            {createEvent.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              "Criar Evento"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Lista de eventos */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Eventos Futuros (30 dias)</CardTitle>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <p className="text-destructive text-sm">Erro ao carregar eventos: {error.message}</p>
          ) : !events || events.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum evento encontrado nos próximos 30 dias.</p>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{event.summary}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatEventDateTime(event)}
                    </p>
                    {event.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {event.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openEditModal(event)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openDeleteDialog(event)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateEvent} disabled={updateEvent.isPending}>
              {updateEvent.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
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
