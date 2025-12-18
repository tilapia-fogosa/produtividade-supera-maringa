import { useQuery } from '@tanstack/react-query';

interface IpValidationResult {
  allowed: boolean;
  ip: string;
  message: string;
}

interface N8nCheckResponse {
  ok: boolean;
  requestIp: string;
  officeIp: string;
}

export function useValidateIp() {
  return useQuery({
    queryKey: ['validate-ip'],
    queryFn: async (): Promise<IpValidationResult> => {
      const response = await fetch('https://webhookn8n.agenciakadin.com.br/webhook/cb85ce4c-b305-49a7-9c00-8272c575b2af', {
        method: 'GET',
        headers: {
          'X-Ponto-Secret': 'abc123-supera',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao validar IP');
      }

      const data: N8nCheckResponse = await response.json();

      return {
        allowed: data.ok,
        ip: data.requestIp,
        message: data.ok 
          ? 'IP válido para registro de ponto' 
          : `Você precisa estar conectado ao WiFi da empresa para registrar ponto (seu IP: ${data.requestIp})`
      };
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}
