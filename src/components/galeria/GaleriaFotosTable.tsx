import { useState } from 'react';
import { GaleriaFoto, useGaleriaFotos } from '@/hooks/use-galeria-fotos';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Loader2 } from 'lucide-react';
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
import { EditarFotoModal } from './EditarFotoModal';

interface GaleriaFotosTableProps {
  fotos: GaleriaFoto[];
}

export function GaleriaFotosTable({ fotos }: GaleriaFotosTableProps) {
  const { deleteFoto, isDeleting } = useGaleriaFotos();
  
  const [fotoParaEditar, setFotoParaEditar] = useState<GaleriaFoto | null>(null);
  const [fotoParaExcluir, setFotoParaExcluir] = useState<GaleriaFoto | null>(null);

  const handleExcluir = async () => {
    if (!fotoParaExcluir) return;

    try {
      await deleteFoto(fotoParaExcluir.id);
      setFotoParaExcluir(null);
    } catch (error) {
      console.error('Erro ao excluir foto:', error);
    }
  };

  if (fotos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Nenhuma foto encontrada</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Foto</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden sm:table-cell">Turma</TableHead>
              <TableHead className="hidden md:table-cell">Tags</TableHead>
              <TableHead className="hidden sm:table-cell w-24">Data</TableHead>
              <TableHead className="w-20">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fotos.map((foto) => (
              <TableRow key={foto.id}>
                {/* Miniatura */}
                <TableCell>
                  <img
                    src={foto.thumbnail_url || foto.url}
                    alt={foto.nome}
                    className="w-12 h-12 rounded object-cover"
                  />
                </TableCell>

                {/* Nome */}
                <TableCell>
                  <div>
                    <p className="font-medium truncate max-w-[150px]">{foto.nome}</p>
                    {foto.aluno && (
                      <p className="text-xs text-muted-foreground truncate">
                        {foto.aluno.nome}
                      </p>
                    )}
                    {/* Mobile: mostrar turma e data */}
                    <div className="sm:hidden text-xs text-muted-foreground mt-1">
                      {foto.turma?.nome && <span>{foto.turma.nome} • </span>}
                      {format(new Date(foto.created_at), 'dd/MM/yy', { locale: ptBR })}
                    </div>
                  </div>
                </TableCell>

                {/* Turma */}
                <TableCell className="hidden sm:table-cell">
                  {foto.turma?.nome || '-'}
                </TableCell>

                {/* Tags */}
                <TableCell className="hidden md:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {foto.tags && foto.tags.length > 0 ? (
                      foto.tags.slice(0, 2).map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="secondary"
                          className="text-xs"
                          style={{ backgroundColor: tag.cor, color: 'white' }}
                        >
                          {tag.nome}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                    {foto.tags && foto.tags.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{foto.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>

                {/* Data */}
                <TableCell className="hidden sm:table-cell">
                  {format(new Date(foto.created_at), 'dd/MM/yy', { locale: ptBR })}
                </TableCell>

                {/* Ações */}
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setFotoParaEditar(foto)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setFotoParaExcluir(foto)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Modal de edição */}
      <EditarFotoModal
        foto={fotoParaEditar}
        open={!!fotoParaEditar}
        onOpenChange={(open) => !open && setFotoParaEditar(null)}
      />

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={!!fotoParaExcluir} onOpenChange={() => setFotoParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir foto?</AlertDialogTitle>
            <AlertDialogDescription>
              A foto "{fotoParaExcluir?.nome}" será excluída permanentemente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleExcluir} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
