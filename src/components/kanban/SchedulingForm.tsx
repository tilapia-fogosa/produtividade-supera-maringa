
import { Scheduling } from "./types"
import { Input } from "@/components/ui/input"
import { useSchedulingForm } from "./hooks/useSchedulingForm"
import { SchedulingContactType } from "./components/scheduling/SchedulingContactType"
import { UnitSelection } from "./components/scheduling/UnitSelection"
import { ValorizationCheckbox } from "./components/scheduling/ValorizationCheckbox"
import { SchedulingActionButton } from "./components/scheduling/SchedulingActionButton"
import { NotesField } from "./components/contact-attempt/NotesField"
import { useActiveUnit } from "@/contexts/ActiveUnitContext"

interface SchedulingFormProps {
  onSubmit: (scheduling: Scheduling) => void
  cardId: string
  isDisabled?: boolean
}

export function SchedulingForm({ onSubmit, cardId, isDisabled = false }: SchedulingFormProps) {
  const { availableUnits } = useActiveUnit()

  // Utilizamos o hook personalizado para gerenciar o estado e lógica do formulário
  const {
    notes,
    scheduledDate,
    valorizacaoDiaAnterior,
    contactType,
    selectedUnitId,
    hasMultipleUnits,
    handleNotesChange,
    handleScheduledDateChange,
    handleValorizacaoChange,
    handleContactTypeChange,
    handleUnitChange,
    handleSubmit
  } = useSchedulingForm(cardId, onSubmit)

  // Log para rastreamento
  console.log('SchedulingForm - Renderizando com unitId:', selectedUnitId, 'disabled:', isDisabled)
  console.log('SchedulingForm - Usuário tem múltiplas unidades?', hasMultipleUnits ? 'Sim' : 'Não')

  return (
    <div className="space-y-4">
      <SchedulingContactType
        contactType={contactType}
        onContactTypeChange={handleContactTypeChange}
        disabled={isDisabled}
      />

      {/* Seleção de unidade - sempre exibida */}
      <UnitSelection
        onUnitChange={handleUnitChange}
        availableUnitsCount={availableUnits.length}
        selectedUnitId={selectedUnitId || undefined}
        disabled={isDisabled}
      />

      {/* Só exibe o seletor de data se uma unidade estiver selecionada */}
      {selectedUnitId ? (
        <div className="space-y-2">
          <Input
            type="datetime-local"
            onChange={(e) => handleScheduledDateChange(new Date(e.target.value))}
            className="w-full"
          />
        </div>
      ) : (
        <div className="p-4 bg-amber-50 text-amber-800 rounded-md text-sm">
          Selecione uma unidade para visualizar a agenda disponível
        </div>
      )}

      <NotesField
        notes={notes}
        onNotesChange={handleNotesChange}
        disabled={isDisabled}
      />

      <ValorizationCheckbox
        checked={valorizacaoDiaAnterior}
        onCheckedChange={handleValorizacaoChange}
        disabled={isDisabled}
      />

      <SchedulingActionButton
        onSubmit={handleSubmit}
        disabled={isDisabled || !selectedUnitId || !scheduledDate || !contactType}
      />
    </div>
  )
}
