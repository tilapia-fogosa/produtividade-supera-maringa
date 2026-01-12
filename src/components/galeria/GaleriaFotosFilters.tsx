import { useGaleriaTags } from '@/hooks/use-galeria-tags';
import { useTodasTurmas } from '@/hooks/use-todas-turmas';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface FiltrosGaleria {
  nome: string;
  turmaId: string;
  tagIds: string[];
  data: Date | undefined;
}

interface GaleriaFotosFiltersProps {
  filtros: FiltrosGaleria;
  onFiltrosChange: (filtros: FiltrosGaleria) => void;
}

export function GaleriaFotosFilters({ filtros, onFiltrosChange }: GaleriaFotosFiltersProps) {
  const { tags } = useGaleriaTags();
  const { turmas } = useTodasTurmas();

  const handleToggleTag = (tagId: string) => {
    const newTagIds = filtros.tagIds.includes(tagId)
      ? filtros.tagIds.filter(id => id !== tagId)
      : [...filtros.tagIds, tagId];
    
    onFiltrosChange({ ...filtros, tagIds: newTagIds });
  };

  const limparFiltros = () => {
    onFiltrosChange({
      nome: '',
      turmaId: '',
      tagIds: [],
      data: undefined
    });
  };

  const temFiltrosAtivos = filtros.nome || filtros.turmaId || filtros.tagIds.length > 0 || filtros.data;

  return (
    <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Filtros</Label>
        {temFiltrosAtivos && (
          <Button variant="ghost" size="sm" onClick={limparFiltros}>
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Filtro por nome */}
        <div className="space-y-2">
          <Label className="text-sm">Nome</Label>
          <Input
            placeholder="Buscar por nome..."
            value={filtros.nome}
            onChange={(e) => onFiltrosChange({ ...filtros, nome: e.target.value })}
          />
        </div>

        {/* Filtro por turma */}
        <div className="space-y-2">
          <Label className="text-sm">Turma</Label>
          <Select 
            value={filtros.turmaId} 
            onValueChange={(value) => onFiltrosChange({ ...filtros, turmaId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas as turmas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas as turmas</SelectItem>
              {turmas?.map((turma) => (
                <SelectItem key={turma.id} value={turma.id}>
                  {turma.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filtro por data */}
        <div className="space-y-2">
          <Label className="text-sm">Data</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filtros.data ? (
                  format(filtros.data, 'dd/MM/yyyy', { locale: ptBR })
                ) : (
                  <span className="text-muted-foreground">Selecionar data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filtros.data}
                onSelect={(date) => onFiltrosChange({ ...filtros, data: date })}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Filtro por tags */}
      {tags.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm">Tags</Label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge
                key={tag.id}
                variant={filtros.tagIds.includes(tag.id) ? 'default' : 'outline'}
                className="cursor-pointer"
                style={{
                  backgroundColor: filtros.tagIds.includes(tag.id) ? tag.cor : 'transparent',
                  borderColor: tag.cor,
                  color: filtros.tagIds.includes(tag.id) ? 'white' : tag.cor
                }}
                onClick={() => handleToggleTag(tag.id)}
              >
                {tag.nome}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
