
import React, { useCallback, memo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { KanbanCard as KanbanCardType } from "./types";
import { format, parseISO, isBefore, isAfter, startOfDay, isToday } from "date-fns";
import { WhatsAppIcon } from "./components/icons/WhatsAppIcon";
import { ValorizationButtons } from './components/ValorizationButtons';

/**
 * Determina a cor do próximo contato com base na data:
 * - Verde: data futura (após hoje)
 * - Amarelo: hoje, mas ainda não passou o horário
 * - Vermelho: atrasado (antes de agora)
 */
const getNextContactColor = (nextContactDate: Date | null): string => {
  if (!nextContactDate) return "text-muted-foreground";

  const now = new Date();
  const today = startOfDay(new Date());
  const contactDay = startOfDay(nextContactDate);

  // Data futura → verde
  if (isAfter(contactDay, today)) {
    return "text-[#00CC00]";
  }

  // Hoje → amarelo se ainda não passou, vermelho se já passou
  if (isToday(nextContactDate)) {
    if (isBefore(nextContactDate, now)) {
      return "text-[#FF3333]";
    }
    return "text-[#CCA405]";
  }

  // Passado → vermelho
  return "text-[#FF3333]";
}

/**
 * KanbanCardComponent - Card compacto do Kanban
 * 
 * Layout vertical em coluna única exibindo:
 * 1. Nome do cliente
 * 2. Próximo contato (com cores indicativas)
 * 3. Botões de valorização (quando há agendamento)
 * 4. Ícone do WhatsApp
 */
function KanbanCardComponent({
  card,
  onClick,
  onWhatsAppClick,
  onOpenSchedulingForm
}: {
  card: KanbanCardType;
  onClick: () => void;
  onWhatsAppClick: (e: React.MouseEvent) => void;
  onOpenSchedulingForm?: () => void;
}) {
  const nextContactDate = card.nextContactDate ? parseISO(card.nextContactDate) : null;
  const nextContactColor = getNextContactColor(nextContactDate);

  console.log(`[KanbanCard] Card ${card.id} - scheduledDate: ${card.scheduledDate}, valorizationConfirmed: ${card.valorizationConfirmed}`);

  /** Callback para atualizar estado de valorização no card */
  const handleValorizationChange = useCallback((confirmed: boolean) => {
    console.log(`[KanbanCard] Valorização mudou para: ${confirmed}`);
    card.valorizationConfirmed = confirmed;
  }, [card]);

  return (
    <Card
      className="group relative cursor-pointer bg-card hover:bg-orange-50/50 dark:hover:bg-orange-900/10 transition-all duration-300 rounded-xl border border-border hover:border-orange-500 hover:shadow-md hover:shadow-orange-500/20 overflow-hidden"
      onClick={onClick}
    >
      {/* Barra de cor topo (indicador sutil) */}
      <div className={`absolute top-0 left-0 w-full h-1 opacity-70 ${nextContactColor.replace('text-', 'bg-')}`}></div>

      <CardContent className="p-4 flex flex-col gap-3">
        {/* Cabeçalho do Card */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-[15px] font-semibold text-foreground/90 leading-tight line-clamp-2">
              {card.clientName}
            </span>
          </div>

          <div
            className="p-1.5 rounded-full bg-green-500/10 hover:bg-green-500/20 text-green-600 transition-colors flex-shrink-0"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onWhatsAppClick(e);
            }}
          >
            <WhatsAppIcon className="h-4 w-4" />
          </div>
        </div>

        {/* Data/Agendamento badge */}
        <div className="flex items-center">
          {nextContactDate ? (
            <div className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-md bg-muted/40 border border-border/50 ${nextContactColor}`}>
              <Clock className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{format(nextContactDate, 'dd/MM/yyyy • HH:mm')}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded-md border border-border/30">
              <Clock className="h-3.5 w-3.5 flex-shrink-0 opacity-50" />
              <span>Sem agendamento</span>
            </div>
          )}
        </div>

        {/* Ações de Base (Apenas se tiver agendamento/valorização para preencher) */}
        {card.scheduledDate && (
          <div
            className="pt-3 mt-1 flex border-t border-border/40 items-center justify-between w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <ValorizationButtons
              clientId={card.id}
              clientName={card.clientName}
              scheduledDate={card.scheduledDate}
              valorizationConfirmed={card.valorizationConfirmed || false}
              onValorizationChange={handleValorizationChange}
              onOpenSchedulingForm={onOpenSchedulingForm}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Memoização do KanbanCard
 * Compara apenas campos que afetam a renderização visual do card compacto
 */
export const KanbanCard = memo(KanbanCardComponent, (prevProps, nextProps) => {
  const prevCard = prevProps.card;
  const nextCard = nextProps.card;

  // Comparação via timestamp (mais eficiente)
  if (prevCard.lastUpdated && nextCard.lastUpdated) {
    return prevCard.lastUpdated === nextCard.lastUpdated;
  }

  // Fallback: comparação dos campos exibidos
  return (
    prevCard.id === nextCard.id &&
    prevCard.clientName === nextCard.clientName &&
    prevCard.nextContactDate === nextCard.nextContactDate &&
    prevCard.scheduledDate === nextCard.scheduledDate &&
    prevCard.valorizationConfirmed === nextCard.valorizationConfirmed
  );
});
