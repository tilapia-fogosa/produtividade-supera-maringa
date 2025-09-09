import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BackupRequest {
  slotNumber: 1 | 2;
  backupName: string;
  description?: string;
}

interface BackupResult {
  success: boolean;
  backupId?: string;
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

    const { slotNumber, backupName, description }: BackupRequest = await req.json();

    console.log(`Iniciando backup completo no slot ${slotNumber}`);

    // Validar entrada
    if (!slotNumber || ![1, 2].includes(slotNumber)) {
      throw new Error('Slot number deve ser 1 ou 2');
    }

    if (!backupName) {
      throw new Error('Nome do backup é obrigatório');
    }

    const result: BackupResult = {
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

    console.log(`Limpando dados existentes do slot ${slotNumber}`);

    // Limpar dados existentes do slot
    await supabase.from(alunosTable).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from(professoresTable).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from(turmasTable).delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Copiar professores
    console.log('Copiando professores...');
    const { data: professores, error: profError } = await supabase
      .from('professores')
      .select('*');

    if (profError) {
      console.error('Erro ao buscar professores:', profError);
      throw new Error(`Erro ao buscar professores: ${profError.message}`);
    }

    if (professores && professores.length > 0) {
      const professoresBackup = professores.map(prof => {
        const { id, ...rest } = prof; // Remove o ID original
        return {
          ...rest,
          original_id: id,
          backup_created_at: new Date().toISOString(),
          backup_created_by: null
        };
      });

      const { error: insertProfError } = await supabase
        .from(professoresTable)
        .insert(professoresBackup);

      if (insertProfError) {
        console.error('Erro ao inserir professores backup:', insertProfError);
        throw new Error(`Erro ao criar backup dos professores: ${insertProfError.message}`);
      }

      result.statistics.totalProfessores = professores.length;
    }

    // Copiar turmas
    console.log('Copiando turmas...');
    const { data: turmas, error: turmasError } = await supabase
      .from('turmas')
      .select('*');

    if (turmasError) {
      console.error('Erro ao buscar turmas:', turmasError);
      throw new Error(`Erro ao buscar turmas: ${turmasError.message}`);
    }

    if (turmas && turmas.length > 0) {
      const turmasBackup = turmas.map(turma => {
        const { id, ...rest } = turma; // Remove o ID original
        return {
          ...rest,
          original_id: id,
          backup_created_at: new Date().toISOString(),
          backup_created_by: null
        };
      });

      const { error: insertTurmasError } = await supabase
        .from(turmasTable)
        .insert(turmasBackup);

      if (insertTurmasError) {
        console.error('Erro ao inserir turmas backup:', insertTurmasError);
        throw new Error(`Erro ao criar backup das turmas: ${insertTurmasError.message}`);
      }

      result.statistics.totalTurmas = turmas.length;
    }

    // Copiar alunos
    console.log('Copiando alunos...');
    const { data: alunos, error: alunosError } = await supabase
      .from('alunos')
      .select('*');

    if (alunosError) {
      console.error('Erro ao buscar alunos:', alunosError);
      throw new Error(`Erro ao buscar alunos: ${alunosError.message}`);
    }

    if (alunos && alunos.length > 0) {
      const alunosBackup = alunos.map(aluno => {
        const { id, ...rest } = aluno; // Remove o ID original
        return {
          ...rest,
          original_id: id,
          backup_created_at: new Date().toISOString(),
          backup_created_by: null
        };
      });

      const { error: insertAlunosError } = await supabase
        .from(alunosTable)
        .insert(alunosBackup);

      if (insertAlunosError) {
        console.error('Erro ao inserir alunos backup:', insertAlunosError);
        throw new Error(`Erro ao criar backup dos alunos: ${insertAlunosError.message}`);
      }

      result.statistics.totalAlunos = alunos.length;
    }

    // Salvar metadados do backup
    console.log('Salvando metadados do backup...');
    const { data: metadataData, error: metadataError } = await supabase
      .from('backup_metadata')
      .upsert({
        slot_number: slotNumber,
        unit_id: '00000000-0000-0000-0000-000000000000', // Valor dummy para backup completo
        backup_name: backupName,
        description: description || '',
        total_alunos: result.statistics.totalAlunos,
        total_professores: result.statistics.totalProfessores,
        total_turmas: result.statistics.totalTurmas,
        created_by: null
      }, {
        onConflict: 'slot_number,unit_id'
      })
      .select()
      .single();

    if (metadataError) {
      console.error('Erro ao salvar metadados:', metadataError);
      throw new Error(`Erro ao salvar metadados do backup: ${metadataError.message}`);
    }

    result.success = true;
    result.backupId = metadataData.id;
    result.message = `Backup criado com sucesso no slot ${slotNumber}`;

    console.log('Backup concluído com sucesso:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro no backup:', error);
    
    const errorResult: BackupResult = {
      success: false,
      message: 'Erro ao criar backup',
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