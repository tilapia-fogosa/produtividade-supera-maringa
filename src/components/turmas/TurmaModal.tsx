import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Calendar, Clock } from "lucide-react";
import { useTurmaModal } from "@/hooks/use-turma-modal";
import { Skeleton } from "@/components/ui/skeleton";

interface TurmaModalProps {
  turmaId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TurmaModal: React.FC<TurmaModalProps> = ({
  turmaId,
  isOpen,
  onClose,
}) => {
  const { data, isLoading, error } = useTurmaModal(turmaId);

  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-destructive">
              Erro ao carregar dados da turma
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Não foi possível carregar os dados da turma. Tente novamente.
          </p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              {isLoading ? (
                <Skeleton className="h-6 w-64" />
              ) : (
                `${data?.turma?.nome || 'Turma'} | ${data?.professor?.nome || 'Professor'}`
              )}
            </DialogTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                Lançar Reposição na Turma
              </Button>
              <Button variant="outline" size="sm" disabled>
                Lançar Aula Experimental na Turma
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info da Turma */}
          {isLoading ? (
            <div className="flex gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          ) : (
            <div className="flex gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{data?.turma?.dia_semana}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Sala {data?.turma?.sala}</span>
              </div>
            </div>
          )}

          {/* Lista de Alunos */}
          <div>
            <h3 className="text-lg font-medium mb-4">
              Alunos Ativos ({isLoading ? '...' : data?.alunos?.length || 0})
            </h3>
            
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data?.alunos?.map((aluno) => (
                  <div
                    key={aluno.id}
                    className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <User className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{aluno.nome}</p>
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        <span>{aluno.idade} anos</span>
                        <span>{aluno.dias_supera} dias no Supera</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isLoading && (!data?.alunos || data.alunos.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum aluno ativo encontrado nesta turma</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};