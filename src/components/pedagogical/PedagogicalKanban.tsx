
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

interface PedagogicalKanbanProps {
  type: 'evasions' | 'absences';
}

const columns = {
  'todo': 'A Fazer',
  'doing': 'Em Andamento',
  'done': 'Concluído'
};

export function PedagogicalKanban({ type }: PedagogicalKanbanProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {Object.entries(columns).map(([id, title]) => (
        <div key={id} className="flex-shrink-0 w-72">
          <div className="bg-orange-50 rounded-lg p-3">
            <h3 className="font-medium text-sm mb-3 text-azul-500">{title}</h3>
            <div className="space-y-2">
              {/* Cards virão aqui quando integrarmos com o backend */}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
