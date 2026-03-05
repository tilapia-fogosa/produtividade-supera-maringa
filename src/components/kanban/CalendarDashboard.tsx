
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { CalendarHeader } from "./components/calendar/CalendarHeader"
import { CalendarGrid } from "./components/calendar/CalendarGrid"
import { CalendarFilters } from "./components/calendar/CalendarFilters"
import { ReschedulingDialog } from "./components/scheduling/ReschedulingDialog"
import { ClientHistoryDrawer } from "@/pages/clientes-unidade/components/ClientHistoryDrawer"
import { useCalendarData } from "./hooks/useCalendarData"
import { useState, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
interface CalendarDashboardProps {
  selectedUnitIds: string[]
  onOpenClient?: (clientId: string) => void
}

export function CalendarDashboard({ selectedUnitIds, onOpenClient }: CalendarDashboardProps) {
  console.log('📅 [CalendarDashboard] Renderizando com selectedUnitIds:', selectedUnitIds)
  console.log('📅 [CalendarDashboard] Quantidade de unidades selecionadas:', selectedUnitIds?.length || 0)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isReschedulingDialogOpen, setIsReschedulingDialogOpen] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [selectedClientName, setSelectedClientName] = useState<string>("")
  const lastRefetchRef = useRef<number>(0)

  const [isActivitySheetOpen, setIsActivitySheetOpen] = useState(false)
  const [activityClientId, setActivityClientId] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const {
    items: calendarItems,
    appointments,
    occupations,
    isLoading,
    currentDate,
    userUnits,
    isLoadingUnits,
    handlePreviousMonth,
    handleNextMonth,
    refetch
  } = useCalendarData(selectedUnitIds)

  console.log('📅 [CalendarDashboard] UserUnits disponíveis:', userUnits?.map(u => ({ id: u.unit_id, name: u.unit_name })))
  console.log('📅 [CalendarDashboard] Itens do calendário carregados:', {
    total: calendarItems?.length || 0,
    appointments: appointments?.length || 0,
    occupations: occupations?.length || 0
  })

  const handleReschedule = (clientId: string, clientName: string) => {
    console.log('📅 [CalendarDashboard] Abrindo dialog de reagendamento para:', clientName)
    setSelectedClientId(clientId)
    setSelectedClientName(clientName)
    setIsReschedulingDialogOpen(true)
  }

  const handleOpenClientClick = (clientId: string) => {
    console.log('📅 [CalendarDashboard] Abrindo histórico de atividades para cliente:', clientId)
    setActivityClientId(clientId)
    setIsActivitySheetOpen(true)
  }
  const handleRescheduleSuccess = async () => {
    console.log('📅 [CalendarDashboard] Reagendamento realizado com sucesso - atualizando dados')

    // Prevenir múltiplas chamadas em sequência
    const now = Date.now()
    if (now - lastRefetchRef.current < 1000) {
      console.log('📅 [CalendarDashboard] Ignorando refetch - muito recente')
      return
    }
    lastRefetchRef.current = now

    try {
      // Invalidar caches relacionados
      await queryClient.invalidateQueries({ queryKey: ['user-unit'] })
      await queryClient.invalidateQueries({ queryKey: ['infinite-clients'] })

      // Recarregar dados da agenda
      await refetch()

      // Fechar dialog de reagendamento
      setIsReschedulingDialogOpen(false)

      // Mostrar toast de sucesso
      toast({
        title: "Reagendamento realizado",
        description: `Agendamento de ${selectedClientName} foi atualizado com sucesso.`,
        variant: "default"
      })

      console.log('📅 [CalendarDashboard] Dados atualizados após reagendamento')
    } catch (error) {
      console.error('❌ [CalendarDashboard] Erro ao atualizar após reagendamento:', error)
    }
  }

  if (isLoadingUnits) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="flex flex-col items-center gap-1 h-auto py-2">
            <Calendar className="h-4 w-4" />
            <span className="text-xs">Agenda</span>
            <span className="text-xs">de Leads</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle className="sr-only">Agenda de Leads</DialogTitle>
          <div className="flex items-center justify-center p-8">
            <Skeleton className="h-[400px] w-full" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex flex-col items-center gap-1 h-auto py-2">
          <Calendar className="h-4 w-4" />
          <span className="text-xs">Agenda</span>
          <span className="text-xs">de Leads</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogTitle className="sr-only">Agenda de Leads</DialogTitle>
        <div className="flex justify-between items-start mb-6">
          <CalendarFilters
            userUnits={userUnits}
            selectedUnitIds={selectedUnitIds}
            isLoading={isLoadingUnits}
          />

          <CalendarHeader
            currentDate={currentDate}
            onPreviousMonth={handlePreviousMonth}
            onNextMonth={handleNextMonth}
            isLoading={isLoading}
          />
        </div>

        <CalendarGrid
          currentDate={currentDate}
          isLoadingItems={isLoading}
          calendarItems={calendarItems}
          onReschedule={handleReschedule}
          userUnits={userUnits}
          onOpenClient={handleOpenClientClick}
        />
      </DialogContent>

      {selectedClientId && (
        <ReschedulingDialog
          open={isReschedulingDialogOpen}
          onOpenChange={setIsReschedulingDialogOpen}
          clientId={selectedClientId}
          clientName={selectedClientName}
          onSubmit={handleRescheduleSuccess}
        />
      )}

      <ClientHistoryDrawer
        open={isActivitySheetOpen}
        onOpenChange={setIsActivitySheetOpen}
        clientId={activityClientId}
      />
    </Dialog>
  )
}
