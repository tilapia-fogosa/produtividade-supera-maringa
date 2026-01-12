import { useState } from 'react';
import { useGaleriaTags, GaleriaTag } from '@/hooks/use-galeria-tags';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface TagsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CORES_DISPONIVEIS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', 
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#0ea5e9', '#3b82f6', '#64748b', '#000000'
];

export function TagsDrawer({ open, onOpenChange }: TagsDrawerProps) {
  const { tags, createTag, updateTag, deleteTag, isCreating, isUpdating, isDeleting } = useGaleriaTags();
  
  const [novaTag, setNovaTag] = useState({ nome: '', cor: CORES_DISPONIVEIS[0] });
  const [editandoTag, setEditandoTag] = useState<GaleriaTag | null>(null);
  const [tagParaExcluir, setTagParaExcluir] = useState<GaleriaTag | null>(null);

  const handleCriarTag = async () => {
    if (!novaTag.nome.trim()) return;
    
    try {
      await createTag(novaTag);
      setNovaTag({ nome: '', cor: CORES_DISPONIVEIS[0] });
    } catch (error) {
      console.error('Erro ao criar tag:', error);
    }
  };

  const handleAtualizarTag = async () => {
    if (!editandoTag || !editandoTag.nome.trim()) return;
    
    try {
      await updateTag({
        id: editandoTag.id,
        nome: editandoTag.nome,
        cor: editandoTag.cor
      });
      setEditandoTag(null);
    } catch (error) {
      console.error('Erro ao atualizar tag:', error);
    }
  };

  const handleExcluirTag = async () => {
    if (!tagParaExcluir) return;
    
    try {
      await deleteTag(tagParaExcluir.id);
      setTagParaExcluir(null);
    } catch (error) {
      console.error('Erro ao excluir tag:', error);
    }
  };

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="flex items-center justify-between">
            <DrawerTitle>Gerenciar Tags</DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </DrawerHeader>

          <div className="p-4 space-y-6 overflow-y-auto">
            {/* Formulário para nova tag */}
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <Label>Nova Tag</Label>
              <Input
                placeholder="Nome da tag"
                value={novaTag.nome}
                onChange={(e) => setNovaTag(prev => ({ ...prev, nome: e.target.value }))}
              />
              <div className="flex flex-wrap gap-2">
                {CORES_DISPONIVEIS.map((cor) => (
                  <button
                    key={cor}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      novaTag.cor === cor ? 'border-foreground scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: cor }}
                    onClick={() => setNovaTag(prev => ({ ...prev, cor }))}
                  />
                ))}
              </div>
              <Button 
                onClick={handleCriarTag} 
                disabled={!novaTag.nome.trim() || isCreating}
                className="w-full"
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Adicionar Tag
              </Button>
            </div>

            {/* Lista de tags */}
            <div className="space-y-2">
              <Label>Tags Existentes</Label>
              {tags.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Nenhuma tag criada ainda
                </p>
              ) : (
                <div className="space-y-2">
                  {tags.map((tag) => (
                    <div 
                      key={tag.id}
                      className="flex items-center justify-between p-3 bg-background rounded-lg border"
                    >
                      {editandoTag?.id === tag.id ? (
                        <div className="flex-1 space-y-2">
                          <Input
                            value={editandoTag.nome}
                            onChange={(e) => setEditandoTag(prev => prev ? { ...prev, nome: e.target.value } : null)}
                          />
                          <div className="flex flex-wrap gap-1">
                            {CORES_DISPONIVEIS.map((cor) => (
                              <button
                                key={cor}
                                type="button"
                                className={`w-6 h-6 rounded-full border-2 transition-all ${
                                  editandoTag.cor === cor ? 'border-foreground scale-110' : 'border-transparent'
                                }`}
                                style={{ backgroundColor: cor }}
                                onClick={() => setEditandoTag(prev => prev ? { ...prev, cor } : null)}
                              />
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleAtualizarTag} disabled={isUpdating}>
                              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditandoTag(null)}>
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: tag.cor }}
                            />
                            <span className="font-medium">{tag.nome}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditandoTag(tag)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setTagParaExcluir(tag)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={!!tagParaExcluir} onOpenChange={() => setTagParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tag?</AlertDialogTitle>
            <AlertDialogDescription>
              A tag "{tagParaExcluir?.nome}" será removida de todas as fotos. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleExcluirTag} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
