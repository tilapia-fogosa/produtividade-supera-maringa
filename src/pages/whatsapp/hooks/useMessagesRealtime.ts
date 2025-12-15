/**
 * Hook de realtime para mensagens WhatsApp (MOCK Version)
 */
import { useEffect } from "react";

export function useMessagesRealtime() {
  console.log('🔔 [useMessagesRealtime] MOCK: Hook inicializado (Realtime desativado)');

  useEffect(() => {
    // Nada a fazer no modo mock
    return () => { };
  }, []);
}
