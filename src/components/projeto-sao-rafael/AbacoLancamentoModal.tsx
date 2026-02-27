import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useApostilas } from '@/hooks/use-apostilas';
import { useIsMobile } from '@/hooks/use-mobile';
import ApostilaSelector from '@/components/turmas/produtividade/ApostilaSelector';
import ApostilaSelectorDesktop from '@/components/turmas/produtividade/ApostilaSelectorDesktop';

interface AbacoLancamentoModalProps {
  isOpen: boolean;
  aluno: { id: string; nome: string; turma_nome: string };
  onClose: () => void;
  onSuccess?: () => void;
}

const AbacoLancamentoModal: React.FC<AbacoLancamentoModalProps> = ({
  isOpen,
  aluno,
  onClose,
  onSuccess
}) => {
  const isMobile = useIsMobile();
  const { apostilas, loading: carregandoApostilas, error: erroApostilas, getTotalPaginas } = useApostilas();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dataAula, setDataAula] = useState('');
  const [presente, setPresente] = useState(true);
  const [isReposicao, setIsReposicao] = useState(false);
  const [apostila, setApostila] = useState('');
  const [pagina, setPagina] = useState('');
  const [exercicios, setExercicios] = useState('');
  const [erros, setErros] = useState('');
  const [fezDesafio, setFezDesafio] = useState(false);
  const [comentario, setComentario] = useState('');
  const [motivoFalta, setMotivoFalta] = useState('');
  const [totalPaginas, setTotalPaginas] = useState(40);

  useEffect(() => {
    if (!isOpen) {
      setDataAula('');
      setPresente(true);
      setIsReposicao(false);
      setApostila('');
      setPagina('');
      setExercicios('');
      setErros('');
      setFezDesafio(false);
      setComentario('');
      setMotivoFalta('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (apostila) {
      setTotalPaginas(getTotalPaginas(apostila));
    }
  }, [apostila, getTotalPaginas]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!dataAula) return;

    try {
      setIsSubmitting(true);

      const insertData: Record<string, unknown> = {
        pessoa_id: aluno.id,
        data_aula: dataAula,
        presente,
        is_reposicao: isReposicao,
        fez_desafio: fezDesafio,
        apostila: apostila || null,
        pagina: pagina || null,
        exercicios: exercicios ? parseInt(exercicios) : null,
        erros: erros ? parseInt(erros) : null,
        comentario: comentario || null,
        motivo_falta: motivoFalta || null,
      };

      const { error } = await supabase
        .from('produtividade_abaco')
        .insert(insertData as any);

      if (error) throw error;

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Erro ao lançar ábaco:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`max-w-md ${isMobile ? "w-[95%] p-4" : ""}`}>
        <DialogHeader>
          <DialogTitle className={isMobile ? "text-lg" : ""}>
            Lançar Ábaco - {aluno.nome}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">Turma: {aluno.turma_nome}</p>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {/* Data da Aula */}
            <div className="space-y-2">
              <Label htmlFor="dataAula">Data da Aula *</Label>
              <Input
                id="dataAula"
                type="date"
                value={dataAula}
                onChange={(e) => setDataAula(e.target.value)}
                required
              />
            </div>

            {/* Presente e Reposição */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="presente"
                  checked={presente}
                  onCheckedChange={(v) => setPresente(!!v)}
                />
                <Label htmlFor="presente" className="cursor-pointer">Presente</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isReposicao"
                  checked={isReposicao}
                  onCheckedChange={(v) => setIsReposicao(!!v)}
                />
                <Label htmlFor="isReposicao" className="cursor-pointer">Reposição</Label>
              </div>
            </div>

            {/* Motivo da falta (se não presente) */}
            {!presente && (
              <div className="space-y-2">
                <Label htmlFor="motivoFalta">Motivo da Falta</Label>
                <Input
                  id="motivoFalta"
                  value={motivoFalta}
                  onChange={(e) => setMotivoFalta(e.target.value)}
                  placeholder="Motivo da falta"
                />
              </div>
            )}

            {/* Apostila */}
            <div className="space-y-2">
              <Label>Apostila do Ábaco</Label>
              {isMobile ? (
                <ApostilaSelector
                  apostilaAbaco={apostila}
                  apostilas={apostilas}
                  carregando={carregandoApostilas}
                  erro={erroApostilas}
                  totalPaginas={totalPaginas}
                  onApostilaChange={setApostila}
                />
              ) : (
                <ApostilaSelectorDesktop
                  apostilaAbaco={apostila}
                  apostilas={apostilas}
                  carregando={carregandoApostilas}
                  erro={erroApostilas}
                  onApostilaChange={setApostila}
                />
              )}
            </div>

            {/* Página e Exercícios */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pagina">Página</Label>
                <Input
                  id="pagina"
                  type="number"
                  min="1"
                  max={totalPaginas}
                  value={pagina}
                  onChange={(e) => setPagina(e.target.value)}
                  placeholder={`1-${totalPaginas}`}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exercicios">Exercícios</Label>
                <Input
                  id="exercicios"
                  type="number"
                  value={exercicios}
                  onChange={(e) => setExercicios(e.target.value)}
                  placeholder="Quantidade"
                />
              </div>
            </div>

            {/* Erros */}
            <div className="space-y-2">
              <Label htmlFor="erros">Erros</Label>
              <Input
                id="erros"
                type="number"
                value={erros}
                onChange={(e) => setErros(e.target.value)}
                placeholder="Quantidade de erros"
              />
            </div>

            {/* Fez Desafio */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="fezDesafio"
                checked={fezDesafio}
                onCheckedChange={(v) => setFezDesafio(!!v)}
              />
              <Label htmlFor="fezDesafio" className="cursor-pointer">Fez Desafio</Label>
            </div>

            {/* Comentário */}
            <div className="space-y-2">
              <Label htmlFor="comentario">Comentário (opcional)</Label>
              <Textarea
                id="comentario"
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Observações adicionais"
                rows={3}
              />
            </div>

            <DialogFooter className={isMobile ? "flex-col space-y-2" : ""}>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className={isMobile ? "w-full" : ""}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !dataAula}
                className={isMobile ? "w-full" : ""}
              >
                {isSubmitting ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default AbacoLancamentoModal;
