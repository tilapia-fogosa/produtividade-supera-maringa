
import { supabase } from "@/integrations/supabase/client";

export const calcularPaginasRestantes = async (apostilaAtual: string | null | undefined, ultimaPagina: string | null | undefined): Promise<number | null> => {
  if (!apostilaAtual || !ultimaPagina) {
    return null;
  }

  try {
    const { data: apostila, error } = await supabase
      .from('apostilas')
      .select('total_paginas')
      .eq('nome', apostilaAtual)
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar total de páginas:', error);
      return null;
    }

    if (!apostila) {
      console.warn('Apostila não encontrada:', apostilaAtual);
      return null;
    }

    const paginaAtual = parseInt(ultimaPagina, 10);
    if (isNaN(paginaAtual)) {
      return null;
    }

    return Math.max(0, apostila.total_paginas - paginaAtual);
  } catch (error) {
    console.error('Erro ao calcular páginas restantes:', error);
    return null;
  }
};
