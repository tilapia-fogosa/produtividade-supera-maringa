import React from 'react';
import { Check, ChevronsUpDown, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useActiveUnit } from '@/contexts/ActiveUnitContext';
import { cn } from '@/lib/utils';

export const UnitSelector: React.FC = () => {
  const { activeUnit, availableUnits, setActiveUnit, loading } = useActiveUnit();
  const [open, setOpen] = React.useState(false);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4" />
        Carregando...
      </div>
    );
  }

  if (availableUnits.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4" />
        Nenhuma unidade disponível
      </div>
    );
  }

  if (availableUnits.length === 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm">
        <Building2 className="h-4 w-4" />
        <span className="font-medium">
          Unidade {availableUnits[0].unit_number} - {availableUnits[0].name}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[280px] justify-between"
          >
            {activeUnit ? (
              <span className="truncate">
                Unidade {activeUnit.unit_number} - {activeUnit.name}
              </span>
            ) : (
              "Selecionar unidade..."
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0">
          <Command>
            <CommandInput placeholder="Buscar unidade..." />
            <CommandList>
              <CommandEmpty>Nenhuma unidade encontrada.</CommandEmpty>
              <CommandGroup>
                {availableUnits.map((unit) => (
                  <CommandItem
                    key={unit.id}
                    value={`${unit.unit_number} ${unit.name}`}
                    onSelect={() => {
                      setActiveUnit(unit);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        activeUnit?.id === unit.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div>
                      <div className="font-medium">
                        Unidade {unit.unit_number}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {unit.name}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};