import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ListBackupsRequest {
  unitId: string;
}

interface BackupInfo {
  slotNumber: number;
  backupName: string;
  description: string;
  createdAt: string;
  totalAlunos: number;
  totalProfessores: number;
  totalTurmas: number;
  hasData: boolean;
}

interface ListBackupsResult {
  success: boolean;
  backups: BackupInfo[];
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

    const { unitId }: ListBackupsRequest = await req.json();

    console.log(`Listando backups para unidade ${unitId}`);

    if (!unitId) {
      throw new Error('ID da unidade é obrigatório');
    }

    // Buscar metadados dos backups
    const { data: metadataList, error: metadataError } = await supabase
      .from('backup_metadata')
      .select('*')
      .eq('unit_id', unitId)
      .order('slot_number', { ascending: true });

    if (metadataError) {
      console.error('Erro ao buscar metadados:', metadataError);
      throw new Error(`Erro ao buscar backups: ${metadataError.message}`);
    }

    // Criar array com informações dos dois slots
    const backups: BackupInfo[] = [];

    // Slot 1
    const slot1Metadata = metadataList?.find(m => m.slot_number === 1);
    backups.push({
      slotNumber: 1,
      backupName: slot1Metadata?.backup_name || 'Backup não criado',
      description: slot1Metadata?.description || '',
      createdAt: slot1Metadata?.created_at || '',
      totalAlunos: slot1Metadata?.total_alunos || 0,
      totalProfessores: slot1Metadata?.total_professores || 0,
      totalTurmas: slot1Metadata?.total_turmas || 0,
      hasData: !!slot1Metadata
    });

    // Slot 2
    const slot2Metadata = metadataList?.find(m => m.slot_number === 2);
    backups.push({
      slotNumber: 2,
      backupName: slot2Metadata?.backup_name || 'Backup não criado',
      description: slot2Metadata?.description || '',
      createdAt: slot2Metadata?.created_at || '',
      totalAlunos: slot2Metadata?.total_alunos || 0,
      totalProfessores: slot2Metadata?.total_professores || 0,
      totalTurmas: slot2Metadata?.total_turmas || 0,
      hasData: !!slot2Metadata
    });

    const result: ListBackupsResult = {
      success: true,
      backups
    };

    console.log('Backups listados com sucesso:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro ao listar backups:', error);
    
    const errorResult: ListBackupsResult = {
      success: false,
      backups: [],
      error: error.message
    };

    return new Response(JSON.stringify(errorResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});