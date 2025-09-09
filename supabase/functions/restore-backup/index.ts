import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RestoreRequest {
  slotNumber: 1 | 2;
}

interface RestoreResult {
  success: boolean;
  message: string;
  statistics: {
    totalAlunos: number;
    totalProfessores: number;
    totalTurmas: number;
  };
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { slotNumber }: RestoreRequest = await req.json();

    console.log(`Iniciando restauração completa do slot ${slotNumber}`);

    // Validar entrada
    if (!slotNumber || ![1, 2].includes(slotNumber)) {
      throw new Error('Slot number deve ser 1 ou 2');
    }

    // Verificar se existe backup no slot (usando unit_id dummy para backup completo)
    const { data: metadata, error: metadataError } = await supabase
      .from('backup_metadata')
      .select('*')
      .eq('slot_number', slotNumber)
      .eq('unit_id', '00000000-0000-0000-0000-000000000000') // Backup completo
      .single();

    if (metadataError || !metadata) {
      throw new Error(`Não há backup disponível no slot ${slotNumber} para esta unidade`);
    }

    const result: RestoreResult = {
      success: false,
      message: '',
      statistics: {
        totalAlunos: 0,
        totalProfessores: 0,
        totalTurmas: 0
      }
    };

    // Definir nomes das tabelas baseado no slot
    const alunosTable = `alunos_backup${slotNumber}`;
    const professoresTable = `professores_backup${slotNumber}`;
    const turmasTable = `turmas_backup${slotNumber}`;

    console.log('Inativando todos os dados atuais');

    // Inativar todos os dados atuais
    await supabase
      .from('alunos')
      .update({ active: false });

    await supabase
      .from('professores')
      .update({ active: false });

    await supabase
      .from('turmas')
      .update({ active: false });

    // Restaurar professores
    console.log('Restaurando professores...');
    const { data: professoresBackup, error: profBackupError } = await supabase
      .from(professoresTable)
      .select('*');

    if (profBackupError) {
      console.error('Erro ao buscar professores backup:', profBackupError);
      throw new Error(`Erro ao buscar backup dos professores: ${profBackupError.message}`);
    }

    if (professoresBackup && professoresBackup.length > 0) {
      // Primeiro, buscar professores existentes pelo nome para reutilizar IDs
      const { data: professoresExistentes } = await supabase
        .from('professores')
        .select('id, nome');

      const professoresMap = new Map(
        professoresExistentes?.map(p => [p.nome, p.id]) || []
      );

      const professoresRestore = professoresBackup.map(prof => {
        const existingId = professoresMap.get(prof.nome);
        return {
          ...prof,
          id: existingId || prof.original_id, // Usa ID existente ou original
          original_id: undefined,
          backup_created_at: undefined,
          backup_created_by: undefined,
          active: true,
          ultima_sincronizacao: new Date().toISOString()
        };
      });

      const { error: upsertProfError } = await supabase
        .from('professores')
        .upsert(professoresRestore, { onConflict: 'id' });

      if (upsertProfError) {
        console.error('Erro ao restaurar professores:', upsertProfError);
        throw new Error(`Erro ao restaurar professores: ${upsertProfError.message}`);
      }

      result.statistics.totalProfessores = professoresBackup.length;
    }

    // Restaurar turmas
    console.log('Restaurando turmas...');
    const { data: turmasBackup, error: turmasBackupError } = await supabase
      .from(turmasTable)
      .select('*');

    if (turmasBackupError) {
      console.error('Erro ao buscar turmas backup:', turmasBackupError);
      throw new Error(`Erro ao buscar backup das turmas: ${turmasBackupError.message}`);
    }

    if (turmasBackup && turmasBackup.length > 0) {
      // Buscar turmas existentes pelo nome
      const { data: turmasExistentes } = await supabase
        .from('turmas')
        .select('id, nome');

      const turmasMap = new Map(
        turmasExistentes?.map(t => [t.nome, t.id]) || []
      );

      const turmasRestore = turmasBackup.map(turma => {
        const existingId = turmasMap.get(turma.nome);
        return {
          ...turma,
          id: existingId || turma.original_id, // Usa ID existente ou original
          original_id: undefined,
          backup_created_at: undefined,
          backup_created_by: undefined,
          active: true,
          ultima_sincronizacao: new Date().toISOString()
        };
      });

      const { error: upsertTurmasError } = await supabase
        .from('turmas')
        .upsert(turmasRestore, { onConflict: 'id' });

      if (upsertTurmasError) {
        console.error('Erro ao restaurar turmas:', upsertTurmasError);
        throw new Error(`Erro ao restaurar turmas: ${upsertTurmasError.message}`);
      }

      result.statistics.totalTurmas = turmasBackup.length;
    }

    // Restaurar alunos
    console.log('Restaurando alunos...');
    const { data: alunosBackup, error: alunosBackupError } = await supabase
      .from(alunosTable)
      .select('*');

    if (alunosBackupError) {
      console.error('Erro ao buscar alunos backup:', alunosBackupError);
      throw new Error(`Erro ao buscar backup dos alunos: ${alunosBackupError.message}`);
    }

    if (alunosBackup && alunosBackup.length > 0) {
      // Buscar alunos existentes pelo nome
      const { data: alunosExistentes } = await supabase
        .from('alunos')
        .select('id, nome');

      const alunosMap = new Map(
        alunosExistentes?.map(a => [a.nome, a.id]) || []
      );

      const alunosRestore = alunosBackup.map(aluno => {
        const existingId = alunosMap.get(aluno.nome);
        return {
          ...aluno,
          id: existingId || aluno.original_id, // Usa ID existente ou original
          original_id: undefined,
          backup_created_at: undefined,
          backup_created_by: undefined,
          active: true,
          ultima_sincronizacao: new Date().toISOString()
        };
      });

      const { error: upsertAlunosError } = await supabase
        .from('alunos')
        .upsert(alunosRestore, { onConflict: 'id' });

      if (upsertAlunosError) {
        console.error('Erro ao restaurar alunos:', upsertAlunosError);
        throw new Error(`Erro ao restaurar alunos: ${upsertAlunosError.message}`);
      }

      result.statistics.totalAlunos = alunosBackup.length;
    }

    result.success = true;
    result.message = `Dados restaurados com sucesso do backup slot ${slotNumber}`;

    console.log('Restauração concluída com sucesso:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro na restauração:', error);
    
    const errorResult: RestoreResult = {
      success: false,
      message: 'Erro ao restaurar backup',
      statistics: {
        totalAlunos: 0,
        totalProfessores: 0,
        totalTurmas: 0
      },
      error: error.message
    };

    return new Response(JSON.stringify(errorResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});