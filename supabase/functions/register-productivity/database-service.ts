
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { ProdutividadeData } from './types.ts';

// Função para criar o cliente Supabase
export function createSupabaseClient(authHeader: string) {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  );
}

// Função para registrar dados do aluno no banco de dados
export async function registrarDadosAluno(
  supabaseClient: any, 
  data: ProdutividadeData
): Promise<boolean> {
  try {
    // Atualizar dados do aluno se presente e com apostila e página
    if (data.presente) {
      const updateData: any = {};
      
      // Verificar se há dados da apostila e página para atualizar
      if (data.apostila_abaco) {
        updateData.ultimo_nivel = data.apostila_abaco;
        console.log('Atualizando último nível do aluno para:', data.apostila_abaco);
      } else if (data.apostila_atual) {
        updateData.ultimo_nivel = data.apostila_atual;
        console.log('Usando apostila_atual:', data.apostila_atual);
      }
      
      // Verificar se há dados da página para atualizar
      // CORREÇÃO: Converter o valor da página para inteiro antes de salvar
      if (data.pagina_abaco) {
        // Converter para número inteiro usando parseInt
        const paginaInt = parseInt(data.pagina_abaco, 10);
        if (!isNaN(paginaInt)) {
          updateData.ultima_pagina = paginaInt;
          console.log('Atualizando última página do aluno para:', paginaInt);
        } else {
          console.error('Erro: valor de pagina_abaco não é um número válido:', data.pagina_abaco);
        }
      } else if (data.ultima_pagina) {
        // Converter para número inteiro usando parseInt
        const paginaInt = parseInt(data.ultima_pagina, 10);
        if (!isNaN(paginaInt)) {
          updateData.ultima_pagina = paginaInt;
          console.log('Usando ultima_pagina existente (convertida para inteiro):', paginaInt);
        } else {
          console.error('Erro: valor de ultima_pagina não é um número válido:', data.ultima_pagina);
        }
      }
      
      // Adicionar última correção AH, se houver
      if (data.data_ultima_correcao_ah) {
        updateData.ultima_correcao_ah = data.data_ultima_correcao_ah;
      }
      
      // Adicionar nível do desafio, se houver e se fez desafio
      if (data.fez_desafio && data.nivel_desafio) {
        updateData.niveldesafio = data.nivel_desafio;
        console.log('Atualizando nível de desafio do aluno para:', data.nivel_desafio);
      }
      
      // Só atualiza se houver algum dado para atualizar
      if (Object.keys(updateData).length > 0) {
        console.log('Atualizando dados do aluno:', updateData);
        
        const { error: updateError } = await supabaseClient
          .from('alunos')
          .update(updateData)
          .eq('id', data.aluno_id);

        if (updateError) {
          console.error('Erro ao atualizar dados do aluno:', updateError);
          return false;
        }
        
        console.log('Dados do aluno atualizados com sucesso!');
      } else {
        console.log('Nenhum dado para atualizar na tabela alunos');
      }
    }
    
    return true;
  } catch (error) {
    console.error("Erro ao registrar dados do aluno:", error);
    return false;
  }
}

// Função para inserir dados de produtividade no banco de dados
export async function registrarProdutividade(
  supabaseClient: any,
  data: ProdutividadeData
): Promise<boolean> {
  try {
    console.log('Registrando produtividade para aluno:', data.aluno_id);
    
    // Se aluno estiver presente, registrar produtividade do ábaco
    if (data.presente !== undefined) {
      console.log(`Registrando ${data.presente ? 'presença' : 'falta'} para o aluno:`, data.aluno_id);
      
      // Usar apostila_abaco se fornecida, caso contrário usar a apostila_atual
      const apostilaFinal = data.apostila_abaco || data.apostila_atual;
      
      // Se ainda assim não tiver uma apostila, buscar da tabela de alunos
      let apostila = apostilaFinal;
      let pagina = data.pagina_abaco || data.ultima_pagina;
      
      if (!apostila) {
        console.log('Apostila não fornecida, buscando dados do aluno...');
        const { data: alunoData, error: alunoError } = await supabaseClient
          .from('alunos')
          .select('ultimo_nivel, ultima_pagina')
          .eq('id', data.aluno_id)
          .single();
          
        if (!alunoError && alunoData) {
          apostila = alunoData.ultimo_nivel;
          if (!pagina) {
            pagina = alunoData.ultima_pagina?.toString();
          }
          console.log('Dados recuperados do aluno:', { apostila, pagina });
        } else if (alunoError) {
          console.error('Erro ao buscar dados do aluno:', alunoError);
        }
      }
      
      if (!apostila) {
        console.warn('Não foi possível determinar a apostila do aluno. Usando valor padrão.');
        apostila = 'Não especificada';
      }
      
      const produtividadeData = {
        aluno_id: data.aluno_id,
        data_aula: data.data_aula || data.data_registro,
        presente: data.presente,
        is_reposicao: data.is_reposicao || false,
        apostila: apostila,
        pagina: pagina,
        exercicios: data.exercicios_abaco ? parseInt(data.exercicios_abaco) : null,
        erros: data.erros_abaco ? parseInt(data.erros_abaco) : null,
        fez_desafio: data.fez_desafio || false,
        comentario: data.motivo_falta || data.comentario // Usando motivo_falta como comentário se existir
      };
      
      console.log('Dados de produtividade a salvar:', produtividadeData);
      
      const { error: produtividadeError } = await supabaseClient
        .from('produtividade_abaco')
        .insert(produtividadeData);
      
      if (produtividadeError) {
        console.error('Erro ao registrar produtividade ábaco:', produtividadeError);
        console.error('Detalhes do erro produtividade:', JSON.stringify(produtividadeError));
        return false;
      }
      
      // Se foi registrada uma falta, verificar critérios de alerta
      if (!data.presente) {
        const alertasGerados = await verificarAlertasFalta(supabaseClient, data.aluno_id);
        if (alertasGerados > 0) {
          console.log(`Foram gerados ${alertasGerados} alertas de falta para o aluno ${data.aluno_id}`);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error("Erro ao registrar produtividade:", error);
    return false;
  }
}

// Nova função para verificar alertas de falta
export async function verificarAlertasFalta(
  supabaseClient: any,
  alunoId: string
): Promise<number> {
  try {
    console.log('Verificando critérios de alerta de falta para aluno:', alunoId);

    // Chamar a função RPC para verificar critérios de alerta
    const { data: criterios, error } = await supabaseClient.rpc(
      'verificar_criterios_alerta_falta',
      { p_aluno_id: alunoId }
    );

    if (error) {
      console.error('Erro ao verificar critérios de alerta de falta:', error);
      return 0;
    }

    if (!criterios || criterios.length === 0) {
      console.log('Nenhum critério de alerta encontrado para o aluno', alunoId);
      return 0;
    }

    console.log(`Encontrados ${criterios.length} critérios de alerta para o aluno ${alunoId}:`, criterios);

    // Para cada critério encontrado, criar alerta e enviar para Slack
    let alertasGerados = 0;
    for (const criterio of criterios) {
      const { success, slack_mensagem_id } = await criarAlertaEEnviarSlack(supabaseClient, criterio);
      if (success) alertasGerados++;
    }

    return alertasGerados;
  } catch (error) {
    console.error('Erro ao verificar alertas de falta:', error);
    return 0;
  }
}

// Nova função para criar alerta no banco e enviar para o Slack
export async function criarAlertaEEnviarSlack(
  supabaseClient: any,
  criterio: any
): Promise<{ success: boolean, slack_mensagem_id?: string }> {
  try {
    console.log('Criando alerta de falta para critério:', criterio.tipo_criterio);
    
    // Buscar token do Slack
    const { data: configData, error: configError } = await supabaseClient
      .from('dados_importantes')
      .select('data')
      .eq('key', 'SLACK_BOT_TOKEN')
      .single();
      
    if (configError || !configData || !configData.data) {
      console.error('Erro ao buscar token do Slack:', configError || 'Token não encontrado');
      return { success: false };
    }
    
    const slackToken = configData.data;
    
    // Buscar canal do Slack para alertas
    const { data: canalData, error: canalError } = await supabaseClient
      .from('dados_importantes')
      .select('data')
      .eq('key', 'canal_alertas_falta')
      .single();
      
    const SLACK_CHANNEL_ID = canalData && canalData.data ? canalData.data : "C05UB69SDU7"; // Canal padrão se não configurado
    
    // Formatar mensagem com base no tipo de critério
    let tituloAlerta = 'Alerta de Falta';
    let descricaoAlerta = '';
    
    switch (criterio.tipo_criterio) {
      case 'consecutiva':
        tituloAlerta = '🚨 Alerta: Faltas Consecutivas';
        descricaoAlerta = `O aluno ${criterio.aluno_nome} faltou ${criterio.detalhes.num_faltas_consecutivas} vezes consecutivas.`;
        break;
      case 'frequencia_baixa':
        tituloAlerta = '📉 Alerta: Frequência Baixa';
        descricaoAlerta = `O aluno ${criterio.aluno_nome} tem frequência baixa: ${criterio.detalhes.percentual_faltas}% de faltas (${criterio.detalhes.total_faltas} faltas em ${criterio.detalhes.total_aulas} aulas) no ${criterio.detalhes.periodo}.`;
        break;
      case 'primeira_apos_periodo':
        tituloAlerta = '⚠️ Alerta: Primeira Falta após Período';
        descricaoAlerta = `O aluno ${criterio.aluno_nome} faltou após ${criterio.detalhes.dias_sem_falta} dias sem faltar.`;
        break;
      case 'aluno_recente':
        tituloAlerta = '🆕 Alerta: Aluno Recente com Falta';
        descricaoAlerta = `O aluno ${criterio.aluno_nome} é novo (${criterio.detalhes.dias_na_supera} dias) e registrou uma falta.`;
        break;
    }
    
    // Informações adicionais para a mensagem
    const dataFaltaFormatada = criterio.data_falta ? new Date(criterio.data_falta).toLocaleDateString('pt-BR') : 'Não informada';
    const motivoFalta = criterio.motivo_falta || 'Não especificado';
    
    // Montar mensagem para o Slack
    const mencoes = [];
    if (criterio.professor_slack) {
      mencoes.push(`<@${criterio.professor_slack}>`);
    }
    mencoes.push('<@chriskulza>'); // Adicionar responsável padrão
    
    const mensagem = `${tituloAlerta}
*Aluno:* ${criterio.aluno_nome}
*Data da falta:* ${dataFaltaFormatada}
*Motivo:* ${motivoFalta}

${descricaoAlerta}

${mencoes.join(' e ')} para acompanhamento.`;
    
    // Salvar alerta no banco de dados
    const { data: alertaData, error: alertaError } = await supabaseClient
      .from('alertas_falta')
      .insert({
        aluno_id: criterio.aluno_id,
        turma_id: criterio.turma_id,
        professor_id: criterio.professor_id,
        unit_id: criterio.unit_id,
        data_falta: criterio.data_falta,
        tipo_criterio: criterio.tipo_criterio,
        detalhes: criterio.detalhes,
        status: 'enviado'
      })
      .select()
      .single();
      
    if (alertaError) {
      console.error('Erro ao salvar alerta de falta:', alertaError);
      return { success: false };
    }
    
    // Enviar para o Slack
    try {
      console.log('Enviando alerta para o Slack...');
      const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${slackToken}`
        },
        body: JSON.stringify({
          channel: SLACK_CHANNEL_ID,
          text: mensagem
        })
      });
      
      const responseData = await response.json();
      
      if (!responseData.ok) {
        console.error('Erro ao enviar mensagem para o Slack:', responseData.error);
        return { success: true, slack_mensagem_id: null };
      }
      
      // Atualizar o alerta com o ID da mensagem do Slack
      if (responseData.ts) {
        await supabaseClient
          .from('alertas_falta')
          .update({ slack_mensagem_id: responseData.ts })
          .eq('id', alertaData.id);
      }
      
      console.log('Alerta enviado com sucesso para o Slack');
      return { success: true, slack_mensagem_id: responseData.ts };
    } catch (slackError) {
      console.error('Erro ao enviar para o Slack:', slackError);
      return { success: true, slack_mensagem_id: null };
    }
  } catch (error) {
    console.error('Erro ao criar alerta e enviar para o Slack:', error);
    return { success: false };
  }
}

// Nova função para excluir registro de produtividade
export async function excluirProdutividade(
  supabaseClient: any,
  registroId: string
): Promise<boolean> {
  try {
    console.log('Excluindo registro de produtividade:', registroId);
    
    const { error } = await supabaseClient
      .from('produtividade_abaco')
      .delete()
      .eq('id', registroId);
    
    if (error) {
      console.error('Erro ao excluir produtividade:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Erro ao excluir produtividade:", error);
    return false;
  }
}

// Nova função para atualizar registro de produtividade
export async function atualizarProdutividade(
  supabaseClient: any,
  data: any
): Promise<boolean> {
  try {
    console.log('Atualizando registro de produtividade:', data.id);
    
    // Preparar dados para atualização de produtividade
    const updateData = {
      presente: data.presente,
      apostila: data.apostila,
      pagina: data.pagina,
      exercicios: data.exercicios ? parseInt(data.exercicios) : null,
      erros: data.erros ? parseInt(data.erros) : null,
      fez_desafio: data.fez_desafio,
      comentario: data.comentario,
      updated_at: new Date().toISOString()
    };
    
    // Primeiro atualiza o registro de produtividade
    const { error } = await supabaseClient
      .from('produtividade_abaco')
      .update(updateData)
      .eq('id', data.id);
    
    if (error) {
      console.error('Erro ao atualizar produtividade:', error);
      return false;
    }
    
    // Em seguida, também atualiza os dados do aluno se necessário
    if (data.presente && data.apostila && data.pagina) {
      const updateData = {
        ultimo_nivel: data.apostila,
        ultima_pagina: parseInt(data.pagina, 10) // Convertendo para inteiro
      };
      
      console.log('Atualizando dados do aluno após edição:', updateData);
      
      const { error: updateError } = await supabaseClient
        .from('alunos')
        .update(updateData)
        .eq('id', data.aluno_id);
        
      if (updateError) {
        console.error('Erro ao atualizar dados do aluno após edição:', updateError);
        // Não falha completamente se apenas a atualização do aluno falhar
      } else {
        console.log('Dados do aluno atualizados com sucesso após edição!');
      }
    }
    
    return true;
  } catch (error) {
    console.error("Erro ao atualizar produtividade:", error);
    return false;
  }
}
