import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Upload, FileText, AlertCircle, Download, Eye } from "lucide-react";
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';

interface XlsData {
  turmas: any[];
  professores: any[];
  alunos: any[];
}

const XlsUploadComponent = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<XlsData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setErrorMessage(null);
    setPreviewData(null);
    setShowPreview(false);
    
    if (file && !file.name.match(/\.(xlsx|xls)$/i)) {
      toast({
        title: "Formato inválido",
        description: "Apenas arquivos Excel (.xlsx, .xls) são aceitos",
        variant: "destructive"
      });
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
      
      const data: XlsData = {
        turmas: [],
        professores: [],
        alunos: []
      };

      // Processar aba Turmas
      if (workbook.SheetNames.includes('Turmas')) {
        const turmasSheet = workbook.Sheets['Turmas'];
        data.turmas = XLSX.utils.sheet_to_json(turmasSheet);
      }

      // Processar aba Professores
      if (workbook.SheetNames.includes('Professores')) {
        const professoresSheet = workbook.Sheets['Professores'];
        data.professores = XLSX.utils.sheet_to_json(professoresSheet);
      }

      // Processar aba Alunos
      if (workbook.SheetNames.includes('Alunos')) {
        const alunosSheet = workbook.Sheets['Alunos'];
        data.alunos = XLSX.utils.sheet_to_json(alunosSheet);
      }

      setPreviewData(data);
      
      toast({
        title: "Arquivo processado",
        description: `Encontradas ${data.turmas.length} turmas, ${data.professores.length} professores, ${data.alunos.length} alunos`,
      });

    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      setErrorMessage("Erro ao processar o arquivo Excel. Verifique o formato.");
      toast({
        title: "Erro",
        description: "Não foi possível processar o arquivo Excel",
        variant: "destructive"
      });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !previewData) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Por favor, selecione um arquivo Excel válido",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('sync-turmas-xls', {
        body: { 
          xlsData: previewData,
          fileName: selectedFile.name 
        }
      });

      if (error) throw error;

      toast({
        title: "Sincronização concluída",
        description: `${data.professores_reativados + data.professores_criados} professores, ${data.turmas_reativadas + data.turmas_criadas} turmas, ${data.alunos_reativados + data.alunos_criados} alunos processados`,
      });

      setSelectedFile(null);
      setPreviewData(null);
      setShowPreview(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Erro na sincronização:', error);
      const errorMsg = error instanceof Error ? error.message : "Erro durante a sincronização";
      setErrorMessage(errorMsg);
      toast({
        title: "Erro",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const downloadTemplate = () => {
    // Criar template Excel
    const wb = XLSX.utils.book_new();
    
    // Aba Turmas
    const turmasData = [
      ['nome', 'professor_nome', 'dia_semana', 'sala', 'horario_inicio', 'categoria'],
      ['Turma Exemplo', 'João Silva', 'segunda', 'Sala 1', '14:00', 'Supera']
    ];
    const turmasSheet = XLSX.utils.aoa_to_sheet(turmasData);
    XLSX.utils.book_append_sheet(wb, turmasSheet, 'Turmas');

    // Aba Professores
    const professoresData = [
      ['nome', 'slack_username'],
      ['João Silva', 'joao.silva']
    ];
    const professoresSheet = XLSX.utils.aoa_to_sheet(professoresData);
    XLSX.utils.book_append_sheet(wb, professoresSheet, 'Professores');

    // Aba Alunos (11 campos - excluindo índice, código e curso)
    const alunosData = [
      ['nome', 'telefone', 'email', 'matricula', 'turma_atual', 'professor', 'idade', 'ultimo_nivel', 'dias_apostila', 'dias_supera', 'vencimento_contrato'],
      ['Maria Santos', '(44) 99999-9999', 'maria@email.com', 'MAT001', 'Turma Exemplo', 'João Silva', '8', 'Nível 2', '30', '120', '2024-12-31']
    ];
    const alunosSheet = XLSX.utils.aoa_to_sheet(alunosData);
    XLSX.utils.book_append_sheet(wb, alunosSheet, 'Alunos');

    XLSX.writeFile(wb, 'template-sincronizacao-turmas.xlsx');
  };

  return (
    <Card className="border-orange-200 bg-white">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg text-azul-500">Sincronização via Excel</CardTitle>
        <CardDescription className="text-azul-400">
          Sincronize turmas, professores e alunos via arquivo Excel
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button 
              variant="outline" 
              onClick={handleButtonClick}
              className="flex-1 border-orange-300 text-azul-500 hover:bg-orange-50"
            >
              <FileText className="mr-2 h-4 w-4" />
              {selectedFile ? selectedFile.name : "Selecionar arquivo Excel"}
            </Button>
            <Button 
              variant="outline"
              onClick={downloadTemplate}
              className="border-orange-300 text-azul-500 hover:bg-orange-50"
            >
              <Download className="mr-2 h-4 w-4" />
              Template
            </Button>
          </div>

          {selectedFile && previewData && (
            <div className="space-y-2">
              <div className="text-xs text-center text-azul-400">
                Arquivo: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex-1"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  {showPreview ? 'Ocultar' : 'Visualizar'} Dados
                </Button>
                <Button 
                  onClick={handleUpload} 
                  disabled={isUploading}
                  className="flex-1 bg-supera hover:bg-supera-600"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {isUploading ? "Sincronizando..." : "Sincronizar"}
                </Button>
              </div>

              {showPreview && (
                <div className="bg-gray-50 p-3 rounded text-xs">
                  <p><strong>Turmas:</strong> {previewData.turmas.length}</p>
                  <p><strong>Professores:</strong> {previewData.professores.length}</p>
                  <p><strong>Alunos:</strong> {previewData.alunos.length}</p>
                </div>
              )}
            </div>
          )}
          
          {errorMessage && (
            <div className="text-xs text-center text-red-500 flex items-center justify-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              {errorMessage}
            </div>
          )}
          
          <div className="text-xs text-center text-azul-400 mt-2 space-y-1">
            <p className="font-semibold">Estrutura obrigatória do arquivo Excel:</p>
            <p><strong>Aba "Turmas":</strong> nome, professor_nome, dia_semana, sala, horario_inicio, categoria</p>
            <p><strong>Aba "Professores":</strong> nome, slack_username (opcional)</p>
            <p><strong>Aba "Alunos":</strong> nome, telefone, email, matricula, turma_atual, professor, idade, ultimo_nivel, dias_apostila, dias_supera, vencimento_contrato</p>
            <p><em>Nota: Os campos índice, código e curso são ignorados caso existam na planilha</em></p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default XlsUploadComponent;