
import { Label } from "@/components/ui/label"
import { useActiveUnit } from "@/contexts/ActiveUnitContext"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface UnitSelectionProps {
  onUnitChange: (unitId: string) => void
  availableUnitsCount: number
  selectedUnitId?: string
  disabled?: boolean
}

export function UnitSelection({ 
  onUnitChange, 
  availableUnitsCount,
  selectedUnitId,
  disabled = false
}: UnitSelectionProps) {
  const { availableUnits } = useActiveUnit();
  
  return (
    <div className="space-y-2">
      <Label>Selecione a Unidade</Label>
      <div className="w-full max-w-xs">
        <Select
          value={selectedUnitId}
          onValueChange={onUnitChange}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Escolha uma unidade" />
          </SelectTrigger>
          <SelectContent>
            {availableUnits.map((unit) => (
              <SelectItem key={unit.id} value={unit.id}>
                Unidade {unit.unit_number} - {unit.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
