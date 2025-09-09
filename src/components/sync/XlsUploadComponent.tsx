import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Download, FileSpreadsheet, Eye, EyeOff, Loader2, Archive, Save, RotateCcw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  
  // Estados para backup
  const [selectedBackupSlot, setSelectedBackupSlot] = useState<1 | 2>(1);
  const [backupName, setBackupName] = useState('');
  const [backupDescription, setBackupDescription] = useState('');
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const [backupsList, setBackupsList] = useState<any[]>([]);
  const [autoBackup, setAutoBackup] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carregar lista de backups
  const loadBackupsList = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('list-backups', {
        body: {
          unitId: '00000000-0000-0000-0000-000000000000' // Backup completo (todas as unidades)
        }
      });

      if (error) {
        console.error('Erro ao carregar backups:', error);
        return;
      }

      if (data.success) {
        setBackupsList(data.backups);
      }
    } catch (error) {
      console.error('Erro ao carregar backups:', error);
    }
  };

  useEffect(() => {
    loadBackupsList();
  }, []);

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

  const handleCreateBackup = async () => {
    if (!backupName.trim()) {
      toast.error("Nome do backup é obrigatório");
      return;
    }

    setIsCreatingBackup(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-backup', {
        body: {
          slotNumber: selectedBackupSlot,
          backupName: backupName.trim(),
          description: backupDescription.trim()
        }
      });

      if (error || !data.success) {
        toast.error("Erro ao criar backup: " + (error?.message || data.error));
        return;
      }

      toast.success(`Backup "${backupName}" criado no slot ${selectedBackupSlot}!`);

      setBackupName('');
      setBackupDescription('');
      await loadBackupsList();
      
    } catch (error) {
      console.error('Erro ao criar backup:', error);
      toast.error("Erro inesperado ao criar backup");
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleRestoreBackup = async (slotNumber: 1 | 2) => {
    if (!confirm(`Tem certeza que deseja restaurar o backup do slot ${slotNumber}?`)) {
      return;
    }

    setIsRestoringBackup(true);

    try {
      const { data, error } = await supabase.functions.invoke('restore-backup', {
        body: {
          slotNumber
        }
      });

      if (error || !data.success) {
        toast.error("Erro ao restaurar backup: " + (error?.message || data.error));
        return;
      }

      toast.success("Backup restaurado com sucesso!");
      
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      toast.error("Erro inesperado ao restaurar backup");
    } finally {
      setIsRestoringBackup(false);
    }
  };

  const handleUpload = async () => {
    if (!previewData) {
      toast.error("Nenhum arquivo selecionado para upload");
      return;
    }

    setIsUploading(true);

    // Criar backup automático se habilitado
    if (autoBackup) {
      try {
        toast.info("Criando backup automático antes da sincronização...");
        console.log('Iniciando backup automático no slot:', selectedBackupSlot);
        
        const { data: backupData, error: backupError } = await supabase.functions.invoke('create-backup', {
          body: {
            slotNumber: selectedBackupSlot,
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
          toast.success(`Backup automático criado no slot ${selectedBackupSlot} com ${backupData.statistics?.totalAlunos || 0} alunos, ${backupData.statistics?.totalProfessores || 0} professores, ${backupData.statistics?.totalTurmas || 0} turmas`);
          await loadBackupsList();
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

      // Limpar dados após sucesso
      setSelectedFile(null);
      setPreviewData(null);
      setShowPreview(false);
      
      // Recarregar lista de backups para mostrar mudanças
      await loadBackupsList();
      
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
      {/* Sistema de Backup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-6 w-6" />
            Sistema de Backup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Criar Backup */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Criar Backup</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Slot</Label>
                <Select value={selectedBackupSlot.toString()} onValueChange={(value) => setSelectedBackupSlot(Number(value) as 1 | 2)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Backup 1</SelectItem>
                    <SelectItem value="2">Backup 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Nome</Label>
                <Input
                  value={backupName}
                  onChange={(e) => setBackupName(e.target.value)}
                  placeholder="Nome do backup"
                />
              </div>
            </div>
            
            <div>
              <Label>Descrição</Label>
              <Input
                value={backupDescription}
                onChange={(e) => setBackupDescription(e.target.value)}
                placeholder="Descrição opcional"
              />
            </div>
            
            <Button onClick={handleCreateBackup} disabled={isCreatingBackup}>
              {isCreatingBackup ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Criar Backup
            </Button>
          </div>

          <Separator />

          {/* Lista de Backups */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Backups Disponíveis</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {backupsList.map((backup) => (
                <Card key={backup.slotNumber} className={backup.hasData ? "border-primary/20" : "border-muted"}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>Slot {backup.slotNumber}</span>
                      {backup.hasData && <Badge variant="secondary">Ativo</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {backup.hasData ? (
                      <div className="space-y-2">
                        <p className="font-medium text-sm">{backup.backupName}</p>
                        <p className="text-xs text-muted-foreground">
                          {backup.totalAlunos} alunos | {backup.totalProfessores} professores | {backup.totalTurmas} turmas
                        </p>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleRestoreBackup(backup.slotNumber)}
                          disabled={isRestoringBackup}
                          className="w-full"
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Restaurar
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Slot vazio</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Excel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6" />
            Importar Excel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="auto-backup"
              checked={autoBackup}
              onChange={(e) => setAutoBackup(e.target.checked)}
            />
            <Label htmlFor="auto-backup">
              Criar backup automático no slot {selectedBackupSlot} antes da sincronização
            </Label>
          </div>

          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls"
              className="hidden"
            />
            
            <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="flex-1">
              <Upload className="mr-2 h-4 w-4" />
              {selectedFile ? selectedFile.name : "Selecionar Excel"}
            </Button>
            
            <Button onClick={downloadTemplate} variant="secondary">
              <Download className="mr-2 h-4 w-4" />
              Template
            </Button>
          </div>

          {selectedFile && previewData && (
            <div className="space-y-2">
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="mr-2 h-4 w-4" />
                {showPreview ? 'Ocultar' : 'Mostrar'} Preview
              </Button>
              
              {showPreview && (
                <div className="bg-muted p-3 rounded text-sm">
                  <p>Turmas: {previewData.turmas.length}</p>
                  <p>Professores: {previewData.professores.length}</p>
                  <p>Alunos: {previewData.alunos.length}</p>
                </div>
              )}
              
              <Button 
                onClick={handleUpload} 
                disabled={isUploading}
                className="w-full"
              >
                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {isUploading ? "Sincronizando..." : "Sincronizar"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default XlsUploadComponent;