import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Download, FileSpreadsheet, Eye, EyeOff, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';

interface XlsData {
  turmas: any[];
  professores: any[];
  alunos: any[];
}

const XlsUploadComponent = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<XlsData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (file && !file.name.match(/\.(xlsx|xls)$/i)) {
      toast.error("Apenas arquivos Excel (.xlsx, .xls) são aceitos");
      return;
    }
    
    setSelectedFile(file);
    
    if (file) {
      await processFilePreview(file);
    }
  };

  const processFilePreview = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      
      console.log('Abas encontradas:', workbook.SheetNames);
      
      const data: XlsData = {
        turmas: [],
        professores: [],
        alunos: []
      };

      // Procurar pela aba "novo" ou usar a primeira aba disponível
      let targetSheetName = 'novo';
      if (!workbook.SheetNames.includes('novo')) {
        targetSheetName = workbook.SheetNames[0];
        console.log(`Aba 'novo' não encontrada, usando: ${targetSheetName}`);
      }

      if (targetSheetName && workbook.Sheets[targetSheetName]) {
        const sheet = workbook.Sheets[targetSheetName];
        const allData = XLSX.utils.sheet_to_json(sheet);
        
        console.log(`Dados encontrados na aba ${targetSheetName}:`, allData.length, 'registros');
        console.log('Amostra dos dados:', allData.slice(0, 3));
        
        // Todos os dados são alunos - vamos extrair professores e turmas únicos
        const professoresUnicos = new Set<string>();
        const turmasUnicas = new Set<string>();
        
        // Processar todos os dados como alunos e extrair informações únicas
        allData.forEach((row: any) => {
          // Mapear campos do aluno corretamente
          const aluno = {
            nome: row['Nome'] || row.nome,
            telefone: row['Telefone'] || row.telefone,
            email: row['E-mail'] || row.email,
            idade: row['Idade'] || row.idade,
            turma_atual: row['Turma atual'] || row.turma_atual,
            professor: row['Professor'] || row.professor,
            matricula: row['Matrícula'] || row.matricula,
            responsavel: row['Responsável'] || row.responsavel || 'o próprio',
            vencimento_contrato: row['Vencimento contrato'] || row.vencimento_contrato,
            ultimo_nivel: row['Último nível'] || row.ultimo_nivel,
            dias_apostila: row['Dias na apostila'] || row.dias_apostila,
            dias_supera: row['Dias no Supera'] || row.dias_supera,
            // Manter outros campos que possam existir
            ...row
          };
          
          data.alunos.push(aluno);
          
          // Coletar professores únicos
          if (aluno.professor && aluno.professor.trim()) {
            professoresUnicos.add(aluno.professor.trim());
          }
          
          // Coletar turmas únicas
          if (aluno.turma_atual && aluno.turma_atual.trim()) {
            turmasUnicas.add(aluno.turma_atual.trim());
          }
        });
        
        // Criar estrutura de professores únicos
        professoresUnicos.forEach(nomeProfessor => {
          data.professores.push({
            nome: nomeProfessor,
            // Campos padrão para professores
            active: true,
            slack: '', // Será preenchido manualmente se necessário
          });
        });
        
        // Criar estrutura de turmas únicas
        turmasUnicas.forEach(nomeTurma => {
          // Encontrar o primeiro aluno desta turma para extrair informações do professor
          const alunoExemplo = data.alunos.find(a => a.turma_atual === nomeTurma);
          
          data.turmas.push({
            nome: nomeTurma,
            professor_nome: alunoExemplo?.professor || '',
            // Campos padrão para turmas
            active: true,
            dia_semana: 'segunda', // Padrão - será ajustado manualmente se necessário
            horario_inicio: '14:00', // Padrão
            sala: '', // Será preenchido manualmente
          });
        });
        
        console.log('Dados processados:', {
          turmas: data.turmas.length,
          professores: data.professores.length,
          alunos: data.alunos.length
        });
        console.log('Professores únicos:', Array.from(professoresUnicos));
        console.log('Turmas únicas:', Array.from(turmasUnicas));
      } else {
        toast.error(`Aba '${targetSheetName}' não encontrada no arquivo`);
        return;
      }

      setPreviewData(data);
      
      toast.success(`Arquivo processado: ${data.turmas.length} turmas, ${data.professores.length} professores, ${data.alunos.length} alunos`);

    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      toast.error("Erro ao processar o arquivo Excel");
    }
  };

  const handleUpload = async () => {
    if (!previewData) {
      toast.error("Nenhum arquivo selecionado para upload");
      return;
    }

    setIsUploading(true);

    // Criar backup automático obrigatório
    try {
      toast.info("Criando backup automático antes da sincronização...");
      console.log('Iniciando backup automático no slot 1');
      
      const { data: backupData, error: backupError } = await supabase.functions.invoke('create-backup', {
        body: {
          slotNumber: 1,
          backupName: `Auto-backup ${new Date().toLocaleString('pt-BR')}`,
          description: `Backup automático criado antes da sincronização do arquivo ${selectedFile?.name}`
        }
      });

      console.log('Resultado do backup:', { backupData, backupError });

      if (backupError) {
        console.error('Erro na função de backup:', backupError);
        toast.error("Erro ao criar backup automático: " + backupError.message);
        const continueWithoutBackup = confirm('Erro ao criar backup automático. Deseja continuar com a sincronização mesmo assim?');
        if (!continueWithoutBackup) {
          setIsUploading(false);
          return;
        }
      } else if (!backupData?.success) {
        console.error('Backup falhou:', backupData);
        toast.error("Erro ao criar backup automático: " + (backupData?.error || 'Erro desconhecido'));
        const continueWithoutBackup = confirm('Erro ao criar backup automático. Deseja continuar com a sincronização mesmo assim?');
        if (!continueWithoutBackup) {
          setIsUploading(false);
          return;
        }
      } else {
        toast.success(`Backup automático criado no slot 1 com ${backupData.statistics?.totalAlunos || 0} alunos, ${backupData.statistics?.totalProfessores || 0} professores, ${backupData.statistics?.totalTurmas || 0} turmas`);
      }
    } catch (error) {
      console.error('Erro inesperado no backup automático:', error);
      toast.error("Erro inesperado ao criar backup automático");
      const continueWithoutBackup = confirm('Erro inesperado ao criar backup automático. Deseja continuar com a sincronização mesmo assim?');
      if (!continueWithoutBackup) {
        setIsUploading(false);
        return;
      }
    }

    // Proceder com a sincronização
    try {
      toast.info("Iniciando sincronização dos dados...");
      
      const { data, error } = await supabase.functions.invoke('sync-turmas-xls', {
        body: {
          xlsData: previewData,
          fileName: selectedFile?.name || 'arquivo.xlsx'
        }
      });

      if (error) {
        console.error('Erro na função de sincronização:', error);
        toast.error("Erro ao sincronizar: " + error.message);
        return;
      }

      if (data?.error) {
        console.error('Erro retornado pela sincronização:', data.error);
        toast.error("Erro ao processar dados: " + data.error);
        return;
      }

      console.log('Resultado da sincronização:', data);
      
      const stats = data.result || {};
      const totalCriados = (stats.professoresCriados || 0) + (stats.turmasCriadas || 0) + (stats.alunosCriados || 0);
      const totalReativados = (stats.professoresReativados || 0) + (stats.turmasReativadas || 0) + (stats.alunosReativados || 0);
      
      toast.success(`Sincronização concluída! ${totalCriados} registros criados, ${totalReativados} reativados.`, { duration: 5000 });

      // Chamar webhook para atualizar contatos no n8n
      try {
        console.log('[Sync] Disparando webhook de atualização de contatos...');
        await fetch('https://webhookn8n.agenciakadin.com.br/webhook/atualiza-contatos', { method: 'GET' });
        console.log('[Sync] Webhook disparado com sucesso');
      } catch (webhookError) {
        console.error('[Sync] Erro ao disparar webhook:', webhookError);
        // Não interrompe o fluxo, apenas loga o erro
      }

      // Limpar dados após sucesso
      setSelectedFile(null);
      setPreviewData(null);
      setShowPreview(false);
      
    } catch (error) {
      console.error('Erro inesperado na sincronização:', error);
      toast.error("Erro inesperado durante a sincronização");
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    
    const turmasData = [
      ['nome', 'professor_nome', 'dia_semana', 'sala', 'horario_inicio', 'categoria'],
      ['Turma Exemplo', 'João Silva', 'segunda', 'Sala 1', '14:00', 'Supera']
    ];
    const turmasSheet = XLSX.utils.aoa_to_sheet(turmasData);
    XLSX.utils.book_append_sheet(wb, turmasSheet, 'Turmas');

    const professoresData = [
      ['nome', 'slack_username'],
      ['João Silva', 'joao.silva']
    ];
    const professoresSheet = XLSX.utils.aoa_to_sheet(professoresData);
    XLSX.utils.book_append_sheet(wb, professoresSheet, 'Professores');

    const alunosData = [
      ['nome', 'telefone', 'email', 'matricula', 'turma_atual', 'professor', 'idade', 'ultimo_nivel', 'dias_apostila', 'dias_supera', 'vencimento_contrato'],
      ['Maria Santos', '(44) 99999-9999', 'maria@email.com', 'MAT001', 'Turma Exemplo', 'João Silva', '8', 'Nível 2', '30', '120', '2024-12-31']
    ];
    const alunosSheet = XLSX.utils.aoa_to_sheet(alunosData);
    XLSX.utils.book_append_sheet(wb, alunosSheet, 'Alunos');

    XLSX.writeFile(wb, 'template-sincronizacao-turmas.xlsx');
  };

  return (
    <div className="space-y-6">
      {/* Importar Excel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6" />
            Importar Excel
          </CardTitle>
          <CardDescription>
            Importe turmas, professores e alunos via arquivo Excel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={() => fileInputRef.current?.click()} variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Selecionar Excel
            </Button>
            <Button onClick={downloadTemplate} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Baixar Template
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />

          {selectedFile && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>{selectedFile.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showPreview ? 'Ocultar' : 'Visualizar'}
                </Button>
              </div>

              {showPreview && previewData && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Turmas</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{previewData.turmas.length}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Professores</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{previewData.professores.length}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Alunos</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{previewData.alunos.length}</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              <Button 
                onClick={handleUpload} 
                disabled={isUploading || !previewData}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Sincronizar
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default XlsUploadComponent;