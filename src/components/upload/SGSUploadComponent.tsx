import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from "lucide-react";
import * as XLSX from 'xlsx';
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const SGSUploadComponent = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const { profile } = useAuth();

  // Colunas esperadas do SGS
  const expectedColumns = [
    'Índice', 'Código', 'Nome', 'Telefone', 'E-mail', 'Curso', 
    'Matrícula', 'Turma atual', 'Professor', 'Idade', 'Último nível', 
    'Dias na apostila', 'Dias no Supera', 'Vencimento do contrato'
  ];

  const validateColumns = (headers: string[]) => {
    const normalizedHeaders = headers.map(h => h.trim());
    const missingColumns = expectedColumns.filter(col => 
      !normalizedHeaders.some(header => 
        header.toLowerCase().includes(col.toLowerCase()) || 
        col.toLowerCase().includes(header.toLowerCase())
      )
    );
    return missingColumns;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setErrorMessage(null);
    
    if (file) {
      const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (!validTypes.includes(file.type) && !file.name.match(/\.(xls|xlsx)$/i)) {
        setErrorMessage('Por favor, selecione apenas arquivos .xls ou .xlsx');
        setSelectedFile(null);
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setErrorMessage('Por favor, selecione um arquivo antes de fazer o upload.');
      return;
    }

    if (!profile?.unit_ids || profile.unit_ids.length === 0) {
      setErrorMessage('Usuário não possui unidade associada. Entre em contato com o administrador.');
      return;
    }

    try {
      setIsUploading(true);
      setErrorMessage(null);
      setUploadResult(null);

      // Ler o arquivo Excel
      const arrayBuffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length < 2) {
        throw new Error('O arquivo deve conter pelo menos uma linha de cabeçalho e uma linha de dados.');
      }

      // Processar os dados do Excel
      const [headers, ...rows] = jsonData as any[][];
      
      // Validar colunas esperadas
      const missingColumns = validateColumns(headers);
      if (missingColumns.length > 0) {
        throw new Error(`Colunas obrigatórias não encontradas: ${missingColumns.join(', ')}`);
      }

      const processedData = rows
        .filter(row => row && row.some(cell => cell !== null && cell !== undefined && cell !== ''))
        .map((row: any[]) => {
          const rowData: any = {};
          headers.forEach((header: string, index: number) => {
            if (header && typeof header === 'string') {
              rowData[header.trim()] = row[index] || '';
            }
          });
          return rowData;
        });

      console.log(`Dados processados do Excel: ${processedData.length} registros`);

      // Chamar edge function para sincronizar
      const { data, error } = await supabase.functions.invoke('sync-students-sgs', {
        body: {
          studentsData: processedData,
          unitId: profile.unit_ids[0],
          uploadedBy: profile.id
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro na sincronização com SGS');
      }

      setUploadResult(data);
      
      toast({
        title: "Sincronização Concluída",
        description: `${data.processedCount} alunos processados com sucesso. ${data.newStudents} novos alunos adicionados.`,
      });

      // Limpar o arquivo selecionado
      setSelectedFile(null);
      const fileInput = document.getElementById('sgs-file-input') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      const mensagemErro = error instanceof Error 
        ? error.message 
        : "Não foi possível processar o arquivo";
        
      setErrorMessage(mensagemErro);
      toast({
        title: "Erro na Sincronização",
        description: mensagemErro,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleButtonClick = () => {
    const fileInput = document.getElementById('sgs-file-input');
    fileInput?.click();
  };

  return (
    <div className="space-y-4">
      <Card className="border-2 border-dashed border-muted-foreground/25 p-6">
        <div className="flex flex-col items-center justify-center space-y-4">
          <FileSpreadsheet className="h-12 w-12 text-muted-foreground" />
          
          <div className="text-center">
            <h3 className="text-lg font-medium">Selecione o arquivo do SGS</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Arquivos suportados: .xls, .xlsx
            </p>
          </div>

          <Input
            id="sgs-file-input"
            type="file"
            accept=".xls,.xlsx"
            onChange={handleFileChange}
            className="hidden"
          />
          
          <Button 
            onClick={handleButtonClick}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Selecionar Arquivo
          </Button>

          {selectedFile && (
            <div className="text-center p-3 bg-muted/50 rounded-md w-full">
              <p className="text-sm font-medium">Arquivo selecionado:</p>
              <p className="text-sm text-muted-foreground">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
          )}
        </div>
      </Card>

      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {uploadResult && (
        <Alert className="mb-4">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Resultado da Sincronização:</strong><br />
            • Total processado: {uploadResult.processedCount} alunos<br />
            • Novos alunos: {uploadResult.newStudents}<br />
            • Alunos atualizados: {uploadResult.updatedStudents}<br />
            {uploadResult.errors && uploadResult.errors.length > 0 && (
              <>• Erros encontrados: {uploadResult.errors.length}</>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-center">
        <Button 
          onClick={handleUpload} 
          disabled={!selectedFile || isUploading}
          className="flex items-center gap-2"
        >
          {isUploading ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Sincronizando...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Sincronizar SGS
            </>
          )}
        </Button>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Colunas esperadas no arquivo Excel (na ordem):</strong><br />
          Índice, Código, Nome, Telefone, E-mail, Curso, Matrícula, Turma atual, Professor, Idade, Último nível, Dias na apostila, Dias no Supera, Vencimento do contrato
          <br /><br />
          <strong>Importante:</strong> A primeira linha deve conter os cabeçalhos das colunas. Todos os alunos importados serão associados à sua unidade atual.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default SGSUploadComponent;