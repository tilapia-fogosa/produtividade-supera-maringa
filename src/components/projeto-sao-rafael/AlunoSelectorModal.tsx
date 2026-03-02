import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, BookOpen, Calculator } from 'lucide-react';
import { useAlunosProjetoSaoRafael } from '@/hooks/use-alunos-projeto-sao-rafael';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AlunoSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAluno: (aluno: { id: string; nome: string; turma_nome: string }) => void;
  tipo?: 'ah' | 'abaco';
}

export const AlunoSelectorModal = ({ isOpen, onClose, onSelectAluno, tipo = 'ah' }: AlunoSelectorModalProps) => {
  const { alunos, loading, filtro, setFiltro } = useAlunosProjetoSaoRafael({ includeInactive: true });

  const isAH = tipo === 'ah';
  const titulo = isAH ? 'Selecionar Aluno para Lançamento AH' : 'Selecionar Aluno para Lançamento Ábaco';
  const botaoLabel = isAH ? 'Lançar AH' : 'Lançar Ábaco';
  const BotaoIcon = isAH ? BookOpen : Calculator;

  const formatarUltimaCorrecao = (data: string | null) => {
    if (!data) return 'Nunca';
    try {
      return format(new Date(data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Buscar por nome do aluno..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              {alunos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum aluno encontrado
                </div>
              ) : (
                <div className="space-y-2">
                  {alunos.map((aluno) => (
                    <div
                      key={aluno.id}
                      className="border rounded-lg p-4 hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">
                            {aluno.nome}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Turma: {aluno.turma_nome}
                          </p>
                          {isAH && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Última correção: {formatarUltimaCorrecao(aluno.ultima_correcao_ah)}
                            </p>
                          )}
                        </div>
                        <Button
                          onClick={() => {
                            onSelectAluno({
                              id: aluno.id,
                              nome: aluno.nome,
                              turma_nome: aluno.turma_nome
                            });
                          }}
                          size="sm"
                          className={`shrink-0 ${isAH ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-azul-500 hover:bg-azul-600 text-white'}`}
                        >
                          <BotaoIcon className="h-4 w-4 mr-2" />
                          {botaoLabel}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
