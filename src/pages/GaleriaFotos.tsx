import { useState, useMemo } from 'react';
import { useGaleriaFotos } from '@/hooks/use-galeria-fotos';
import { GaleriaFotosTable } from '@/components/galeria/GaleriaFotosTable';
import { GaleriaFotosFilters, FiltrosGaleria } from '@/components/galeria/GaleriaFotosFilters';
import { TagsDrawer } from '@/components/galeria/TagsDrawer';
import { UploadFotoModal } from '@/components/galeria/UploadFotoModal';
import { UploadLoteFotoModal } from '@/components/galeria/UploadLoteFotoModal';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Images, Tags } from 'lucide-react';
import { format, isSameDay } from 'date-fns';

export default function GaleriaFotos() {
  const { fotos, isLoading } = useGaleriaFotos();
  
  const [filtros, setFiltros] = useState<FiltrosGaleria>({
    nome: '',
    turmaId: '',
    tagIds: [],
    data: undefined
  });
  
  const [tagsDrawerOpen, setTagsDrawerOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadLoteModalOpen, setUploadLoteModalOpen] = useState(false);

  // Aplicar filtros
  const fotosFiltradas = useMemo(() => {
    return fotos.filter((foto) => {
      // Filtro por nome
      if (filtros.nome && !foto.nome.toLowerCase().includes(filtros.nome.toLowerCase())) {
        return false;
      }

      // Filtro por turma
      if (filtros.turmaId && foto.turma_id !== filtros.turmaId) {
        return false;
      }

      // Filtro por tags
      if (filtros.tagIds.length > 0) {
        const fotoTagIds = foto.tags?.map(t => t.id) || [];
        const temTodasAsTags = filtros.tagIds.every(tagId => fotoTagIds.includes(tagId));
        if (!temTodasAsTags) return false;
      }

      // Filtro por data
      if (filtros.data) {
        const fotoData = new Date(foto.created_at);
        if (!isSameDay(fotoData, filtros.data)) return false;
      }

      return true;
    });
  }, [fotos, filtros]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold">Galeria de Fotos</h1>
          <p className="text-muted-foreground text-sm">
            Gerencie todas as fotos do sistema
          </p>
        </div>

        {/* Botões de ação */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setUploadModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Foto
          </Button>
          <Button variant="outline" onClick={() => setUploadLoteModalOpen(true)}>
            <Images className="h-4 w-4 mr-2" />
            Lote
          </Button>
          <Button variant="outline" onClick={() => setTagsDrawerOpen(true)}>
            <Tags className="h-4 w-4 mr-2" />
            Tags
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <GaleriaFotosFilters
        filtros={filtros}
        onFiltrosChange={setFiltros}
      />

      {/* Contador */}
      <div className="text-sm text-muted-foreground">
        {fotosFiltradas.length} foto(s) encontrada(s)
        {fotosFiltradas.length !== fotos.length && ` de ${fotos.length} total`}
      </div>

      {/* Tabela */}
      <GaleriaFotosTable fotos={fotosFiltradas} />

      {/* Modais */}
      <TagsDrawer
        open={tagsDrawerOpen}
        onOpenChange={setTagsDrawerOpen}
      />
      <UploadFotoModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
      />
      <UploadLoteFotoModal
        open={uploadLoteModalOpen}
        onOpenChange={setUploadLoteModalOpen}
      />
    </div>
  );
}
