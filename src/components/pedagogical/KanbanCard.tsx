
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { AlertTriangle, CalendarClock, User } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EditKanbanCardModal } from "./EditKanbanCardModal";

interface KanbanCardProps {
  id: string;
  title: string;
  description?: string | null;
  alunoNome?: string | null;
  origem?: string | null;
  responsavel?: string | null;
  createdAt: string;
  onEdit: (values: { title: string; description: string; responsavel: string }) => void;
}

export function KanbanCard({ 
  id,
  title, 
  description, 
  alunoNome, 
  origem, 
  responsavel, 
  createdAt,
  onEdit
}: KanbanCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  return (
    <>
      <Card 
        className="p-3 mb-2 bg-white shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
        onClick={() => setIsEditModalOpen(true)}
      >
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h4 className="text-sm font-medium text-gray-900 line-clamp-2">{title}</h4>
            <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0" />
          </div>
          
          {alunoNome && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <User className="h-3 w-3" />
              <span>{alunoNome}</span>
            </div>
          )}
          
          {origem && (
            <div className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700">
              {origem}
            </div>
          )}
          
          {description && (
            <p className="text-xs text-gray-600 line-clamp-2">{description}</p>
          )}
          
          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
            <div className="flex items-center gap-1">
              <CalendarClock className="h-3 w-3" />
              <span>{formatDistanceToNow(new Date(createdAt), { locale: ptBR, addSuffix: true })}</span>
            </div>
            {responsavel && <span className="text-orange-600">{responsavel}</span>}
          </div>
        </div>
      </Card>

      <EditKanbanCardModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        card={{ id, title, description, responsavel }}
        onSave={onEdit}
      />
    </>
  );
}
