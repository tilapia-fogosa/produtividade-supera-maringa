import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useKanbanCards } from "@/hooks/use-kanban-cards";
import { KanbanCard } from "./KanbanCard";
import { Loader2, Bell, MessageSquare, Calendar, Check, Clock } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface PedagogicalKanbanProps {
  type: 'evasions' | 'absences';
  showHibernating?: boolean;
  searchQuery?: string;
  filtroResultado?: 'todos' | 'evadiu' | 'retido' | 'pendente';
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
  },
  'hibernating': {
    title: 'Hibernando',
    icon: Clock
  }
};

export function PedagogicalKanban({ type, showHibernating = false, searchQuery = "", filtroResultado = 'todos' }: PedagogicalKanbanProps) {
  const { cards, isLoading, updateCardColumn, updateCard, finalizarAlerta } = useKanbanCards(showHibernating);

  const filteredCards = cards.filter(card => {
    // Filtra por termo de busca
    const matchesSearch = searchQuery 
      ? card.aluno_nome?.toLowerCase().includes(searchQuery.toLowerCase()) 
      : true;
    
    // Filtra por hibernating
    const matchesHibernating = showHibernating
      ? card.column_id === 'hibernating'
      : card.column_id !== 'hibernating';
    
    // Filtra por resultado
    const matchesResultado = filtroResultado === 'todos'
      ? true
      : filtroResultado === 'pendente'
        ? !card.resultado
        : card.resultado === filtroResultado;
    
    return matchesSearch && matchesHibernating && matchesResultado;
  });

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }
    
    const { draggableId, destination } = result;
    const card = cards.find(c => c.id === draggableId);
    
    // Não permite mover cards que já foram finalizados
    if (card?.resultado) {
      toast.error("Este alerta já foi finalizado e não pode ser movido");
      return;
    }
    
    if (destination.droppableId === 'scheduled' && (!card?.retention_date)) {
      toast.error("É necessário preencher a data de retenção antes de mover para Retenção agendada");
      return;
    }
    
    updateCardColumn.mutate({
      cardId: draggableId,
      newColumnId: destination.droppableId
    }, {
      onSuccess: async () => {
        toast.success("Card movido com sucesso!");

        if (destination.droppableId === 'scheduled') {
          try {
            const response = await fetch('https://hook.us1.make.com/0t4vimtrmnqu3wtpfskf7ooydbjsh300', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                cardId: draggableId,
                aluno: card?.aluno_nome,
                descricao: card?.description,
                dataRetencao: card?.retention_date,
                responsavel: card?.responsavel
              })
            });

            if (!response.ok) {
              console.error('Erro ao enviar webhook');
            }
          } catch (error) {
            console.error('Erro ao enviar webhook:', error);
          }
        }
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
  
  const handleFinalizar = (params: {
    cardId: string;
    alertaId: string;
    resultado: 'evadiu' | 'retido';
    alunoNome?: string | null;
  }) => {
    finalizarAlerta.mutate(params);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
      </div>
    );
  }

  const columnsToShow = showHibernating 
    ? { hibernating: columns.hibernating }
    : Object.fromEntries(
        Object.entries(columns).filter(([key]) => key !== 'hibernating')
      );
  
  return (
    <div className="space-y-4">
      <div className="flex gap-4 overflow-x-auto pb-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          {Object.entries(columnsToShow).map(([id, { title, icon: Icon }]) => {
            const columnCards = filteredCards.filter(card => card.column_id === id);
            
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
                            isDragDisabled={!!card.resultado} // Desabilita drag se finalizado
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
                                  alerta_evasao_id={card.alerta_evasao_id}
                                  retention_date={card.retention_date}
                                  resultado={card.resultado}
                                  onEdit={handleCardEdit(card.id)}
                                  onFinalizar={handleFinalizar}
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
    </div>
  );
}
