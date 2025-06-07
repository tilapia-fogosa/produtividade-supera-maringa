
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

const PROFESSOR_GUSTAVO_ID = '4cda6590-6e4d-4359-a88f-f5e0ce59c5f4';

interface DadosAbaco {
  ano_mes: string;
  nome_aluno: string;
  total_exercicios: number;
  total_erros: number;
  percentual_acerto: number;
  total_presencas: number;
}

interface DadosAH {
  ano_mes: string;
  nome_aluno: string;
  total_exercicios: number;
  total_erros: number;
  percentual_acerto: number;
}

export function useProjetoSaoRafaelDados(mesAno: string) {
  const [dadosAbaco, setDadosAbaco] = useState<DadosAbaco[]>([]);
  const [dadosAH, setDadosAH] = useState<DadosAH[]>([]);
  const [textoGeral, setTextoGeral] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDados = async () => {
      try {
        setLoading(true);
        
        console.log('Buscando dados para o mês:', mesAno);
        
        // Buscar dados do Ábaco usando RPC - usando chamada genérica para evitar erro de tipagem
        const { data: abacoData, error: abacoError } = await supabase.rpc(
          'buscar_dados_abaco_projeto_sao_rafael' as any,
          {
            p_mes_ano: mesAno,
            p_professor_id: PROFESSOR_GUSTAVO_ID
          }
        );

        if (abacoError) {
          console.error('Erro ao buscar dados do Ábaco:', abacoError);
        } else {
          console.log('Dados do Ábaco:', abacoData);
          setDadosAbaco((abacoData as DadosAbaco[]) || []);
        }

        // Buscar dados do Abrindo Horizontes usando RPC - usando chamada genérica para evitar erro de tipagem
        const { data: ahData, error: ahError } = await supabase.rpc(
          'buscar_dados_ah_projeto_sao_rafael' as any,
          {
            p_mes_ano: mesAno,
            p_professor_id: PROFESSOR_GUSTAVO_ID
          }
        );

        if (ahError) {
          console.error('Erro ao buscar dados do AH:', ahError);
        } else {
          console.log('Dados do AH:', ahData);
          setDadosAH((ahData as DadosAH[]) || []);
        }

        // Buscar texto geral
        const { data: textoData, error: textoError } = await supabase
          .from('projeto_sao_rafael_textos')
          .select('texto_geral')
          .eq('mes_ano', mesAno)
          .maybeSingle();
        
        if (!textoError && textoData) {
          setTextoGeral(textoData.texto_geral || '');
        } else {
          setTextoGeral('');
        }

      } catch (error) {
        console.error('Erro ao buscar dados do Projeto São Rafael:', error);
      } finally {
        setLoading(false);
      }
    };

    if (mesAno) {
      fetchDados();
    }
  }, [mesAno]);

  const salvarTextoGeral = async (texto: string) => {
    try {
      console.log('Salvando texto geral para o mês:', mesAno);
      console.log('Texto:', texto);

      // Verificar se já existe um registro para este mês
      const { data: existingRecord, error: checkError } = await supabase
        .from('projeto_sao_rafael_textos')
        .select('id')
        .eq('mes_ano', mesAno)
        .maybeSingle();

      if (checkError) {
        console.error('Erro ao verificar registro existente:', checkError);
        return false;
      }

      if (existingRecord) {
        // Registro existe, fazer UPDATE
        console.log('Registro existente encontrado, fazendo UPDATE');
        const { error: updateError } = await supabase
          .from('projeto_sao_rafael_textos')
          .update({ texto_geral: texto })
          .eq('mes_ano', mesAno);

        if (updateError) {
          console.error('Erro ao atualizar texto geral:', updateError);
          return false;
        }
      } else {
        // Registro não existe, fazer INSERT
        console.log('Nenhum registro existente, fazendo INSERT');
        const { error: insertError } = await supabase
          .from('projeto_sao_rafael_textos')
          .insert({
            mes_ano: mesAno,
            texto_geral: texto
          });

        if (insertError) {
          console.error('Erro ao inserir texto geral:', insertError);
          return false;
        }
      }

      console.log('Texto geral salvo com sucesso');
      setTextoGeral(texto);
      return true;
    } catch (error) {
      console.error('Erro ao salvar texto geral:', error);
      return false;
    }
  };

  return {
    dadosAbaco,
    dadosAH,
    textoGeral,
    loading,
    salvarTextoGeral
  };
}
