
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useKanbanCards } from "@/hooks/use-kanban-cards";
import { KanbanCard } from "./KanbanCard";
import { Loader2, Bell, MessageSquare, Calendar, Check } from "lucide-react";

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
    if (!result.destination) return;
    
    const { draggableId, destination } = result;
    
    updateCardColumn.mutate({
      cardId: draggableId,
      newColumnId: destination.droppableId
    });
  };

  const handleCardEdit = (cardId: string) => (values: { title: string; description: string; responsavel: string }) => {
    updateCard.mutate({ cardId, ...values });
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
                      className="space-y-2"
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
