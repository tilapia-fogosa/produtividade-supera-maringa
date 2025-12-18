/**
 * Hook para verificar status da conexão WhatsApp (MOCK Version)
 */
import { useQuery } from "@tanstack/react-query";

export function useWhatsappConnectionStatus() {
  console.log('useWhatsappConnectionStatus (MOCK): Retornando status conectado');

  return useQuery({
    queryKey: ['whatsapp-connection-status'],
    queryFn: async () => {
      // Simula delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return { isDisconnected: false };
    }
  });
}
