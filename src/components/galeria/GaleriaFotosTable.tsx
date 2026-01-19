import { useState, useMemo } from 'react';
import { GaleriaFoto, useGaleriaFotos } from '@/hooks/use-galeria-fotos';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
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
import { Switch } from '@/components/ui/switch';
import { Pencil, Trash2, Loader2, ArrowUp, ArrowDown } from 'lucide-react';
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

type OrdenacaoCampo = 'nome' | 'turma' | 'data' | 'visivel';
type OrdenacaoDirecao = 'asc' | 'desc';

interface GaleriaFotosTableProps {
  fotos: GaleriaFoto[];
}

export function GaleriaFotosTable({ fotos }: GaleriaFotosTableProps) {
  const { deleteFoto, updateFoto, isDeleting, isUpdating } = useGaleriaFotos();
  
  const [fotoParaEditar, setFotoParaEditar] = useState<GaleriaFoto | null>(null);
  const [fotoParaExcluir, setFotoParaExcluir] = useState<GaleriaFoto | null>(null);
  const [atualizandoVisibilidade, setAtualizandoVisibilidade] = useState<string | null>(null);
  const [ordenacao, setOrdenacao] = useState<{ campo: OrdenacaoCampo; direcao: OrdenacaoDirecao }>({
    campo: 'data',
    direcao: 'desc'
  });

  const handleOrdenacao = (campo: OrdenacaoCampo) => {
    setOrdenacao(prev => ({
      campo,
      direcao: prev.campo === campo && prev.direcao === 'asc' ? 'desc' : 'asc'
    }));
  };

  const fotosOrdenadas = useMemo(() => {
    return [...fotos].sort((a, b) => {
      const direcao = ordenacao.direcao === 'asc' ? 1 : -1;
      
      switch (ordenacao.campo) {
        case 'nome':
          return direcao * a.nome.localeCompare(b.nome);
        case 'turma':
          const turmaA = a.turma?.nome || '';
          const turmaB = b.turma?.nome || '';
          return direcao * turmaA.localeCompare(turmaB);
        case 'data':
          return direcao * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        case 'visivel':
          return direcao * (Number(a.visivel) - Number(b.visivel));
        default:
          return 0;
      }
    });
  }, [fotos, ordenacao]);

  const renderSortIcon = (campo: OrdenacaoCampo) => {
    if (ordenacao.campo !== campo) return null;
    return ordenacao.direcao === 'asc' 
      ? <ArrowUp className="h-3 w-3 ml-1" /> 
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  const SortableHeader = ({ campo, children, className }: { campo: OrdenacaoCampo; children: React.ReactNode; className?: string }) => (
    <TableHead 
      className={`cursor-pointer hover:bg-muted/50 select-none ${className || ''}`}
      onClick={() => handleOrdenacao(campo)}
    >
      <div className="flex items-center">
        {children}
        {renderSortIcon(campo)}
      </div>
    </TableHead>
  );

  const handleExcluir = async () => {
    if (!fotoParaExcluir) return;

    try {
      await deleteFoto(fotoParaExcluir.id);
      setFotoParaExcluir(null);
    } catch (error) {
      console.error('Erro ao excluir foto:', error);
    }
  };

  const handleToggleVisibilidade = async (foto: GaleriaFoto) => {
    setAtualizandoVisibilidade(foto.id);
    try {
      await updateFoto({ id: foto.id, visivel: !foto.visivel });
    } catch (error) {
      console.error('Erro ao atualizar visibilidade:', error);
    } finally {
      setAtualizandoVisibilidade(null);
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
              <SortableHeader campo="nome">Nome</SortableHeader>
              <SortableHeader campo="turma" className="hidden sm:table-cell">Turma</SortableHeader>
              <TableHead className="hidden md:table-cell">Tags</TableHead>
              <SortableHeader campo="data" className="hidden sm:table-cell w-24">Data</SortableHeader>
              <SortableHeader campo="visivel" className="w-20 text-center">Visível</SortableHeader>
              <TableHead className="w-20">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fotosOrdenadas.map((foto) => (
              <TableRow key={foto.id}>
                {/* Miniatura */}
                <TableCell>
                  <HoverCard openDelay={200}>
                    <HoverCardTrigger asChild>
                      <img
                        src={foto.thumbnail_url || foto.url}
                        alt={foto.nome}
                        className="w-12 h-12 rounded object-cover cursor-pointer hover:scale-110 transition-transform duration-200"
                      />
                    </HoverCardTrigger>
                    <HoverCardContent side="right" className="w-auto p-2" sideOffset={10}>
                      <img
                        src={foto.url}
                        alt={foto.nome}
                        className="max-w-[500px] max-h-[500px] rounded object-contain"
                      />
                    </HoverCardContent>
                  </HoverCard>
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

                {/* Visível */}
                <TableCell className="text-center">
                  <Switch
                    checked={foto.visivel}
                    onCheckedChange={() => handleToggleVisibilidade(foto)}
                    disabled={atualizandoVisibilidade === foto.id}
                  />
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
