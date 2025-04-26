
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useKanbanCards } from "@/hooks/use-kanban-cards";
import { KanbanCard } from "./KanbanCard";
import { Loader2, Bell, MessageSquare, Calendar, Check } from "lucide-react";
import { toast } from "sonner";

interface PedagogicalKanbanProps {
  type: 'evasions' | 'absences';
}

const columns = {
  'todo': {
    title: 'Alerta criado',
    icon: Bell
  },
  'doing': {
    title: 'Em negociação',
    icon: MessageSquare
  },
  'scheduled': {
    title: 'Retenção agendada',
    icon: Calendar
  },
  'done': {
    title: 'Concluída',
    icon: Check
  }
};

export function PedagogicalKanban({ type }: PedagogicalKanbanProps) {
  const { cards, isLoading, updateCardColumn, updateCard } = useKanbanCards();

  const handleDragEnd = (result: DropResult) => {
    console.log("Drag finalizado:", result);
    if (!result.destination) {
      console.log("Sem destino válido, ignorando drag");
      return;
    }
    
    const { draggableId, destination } = result;
    
    console.log(`Movendo card ${draggableId} para ${destination.droppableId}`);
    
    updateCardColumn.mutate({
      cardId: draggableId,
      newColumnId: destination.droppableId
    }, {
      onSuccess: () => {
        toast.success("Card movido com sucesso!");
      },
      onError: (error) => {
        console.error("Erro ao mover card:", error);
        toast.error("Erro ao mover card");
      }
    });
  };

  const handleCardEdit = (cardId: string) => (values: { 
    title: string; 
    description: string; 
    responsavel: string;
    priority?: string;
    due_date?: string | null;
    tags?: string[];
    column_id?: string;
  }) => {
    console.log(`Editando card ${cardId} com valores:`, values);
    
    updateCard.mutate({ cardId, ...values }, {
      onSuccess: () => {
        toast.success("Card atualizado com sucesso!");
      },
      onError: (error) => {
        console.error("Erro ao atualizar card:", error);
        toast.error("Erro ao atualizar card");
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      <DragDropContext onDragEnd={handleDragEnd}>
        {Object.entries(columns).map(([id, { title, icon: Icon }]) => {
          const columnCards = cards.filter(card => card.column_id === id);
          
          return (
            <div key={id} className="flex-shrink-0 w-72">
              <div className="bg-orange-50 rounded-lg p-3">
                <div className="font-medium text-sm mb-3 text-azul-500 flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {title} ({columnCards.length})
                </div>
                
                <Droppable droppableId={id}>
                  {(provided) => (
                    <div 
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="space-y-2 min-h-[100px]"
                    >
                      {columnCards.map((card, index) => (
                        <Draggable 
                          key={card.id} 
                          draggableId={card.id} 
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <KanbanCard
                                id={card.id}
                                title={card.title}
                                description={card.description}
                                alunoNome={card.aluno_nome}
                                origem={card.origem}
                                responsavel={card.responsavel}
                                createdAt={card.created_at}
                                priority={card.priority}
                                due_date={card.due_date}
                                tags={card.tags}
                                historico={card.historico}
                                column_id={card.column_id}
                                onEdit={handleCardEdit(card.id)}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>
          );
        })}
      </DragDropContext>
    </div>
  );
}
