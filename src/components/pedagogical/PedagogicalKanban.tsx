
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useKanbanCards } from "@/hooks/use-kanban-cards";
import { KanbanCard } from "./KanbanCard";
import { Loader2 } from "lucide-react";

interface PedagogicalKanbanProps {
  type: 'evasions' | 'absences';
}

const columns = {
  'todo': 'A Fazer',
  'doing': 'Em Andamento',
  'done': 'Concluído'
};

export function PedagogicalKanban({ type }: PedagogicalKanbanProps) {
  const { cards, isLoading, updateCardColumn } = useKanbanCards();

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const { draggableId, destination } = result;
    
    updateCardColumn.mutate({
      cardId: draggableId,
      newColumnId: destination.droppableId
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
        {Object.entries(columns).map(([id, title]) => {
          const columnCards = cards.filter(card => card.column_id === id);
          
          return (
            <div key={id} className="flex-shrink-0 w-72">
              <div className="bg-orange-50 rounded-lg p-3">
                <h3 className="font-medium text-sm mb-3 text-azul-500">
                  {title} ({columnCards.length})
                </h3>
                
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
                                title={card.title}
                                description={card.description}
                                alunoNome={card.aluno_nome}
                                origem={card.origem}
                                responsavel={card.responsavel}
                                createdAt={card.created_at}
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
