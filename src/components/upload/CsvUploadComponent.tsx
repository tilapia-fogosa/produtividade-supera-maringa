
import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { useProdutividadeUpload } from '@/hooks/use-produtividade-upload';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

const CsvUploadComponent = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadCsv } = useProdutividadeUpload();
  const isMobile = useIsMobile();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setErrorMessage(null);
    
    if (file && file.type !== 'text/csv') {
      toast({
        title: "Formato inválido",
        description: "Apenas arquivos CSV são aceitos",
        variant: "destructive"
      });
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Por favor, selecione um arquivo CSV para upload",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    try {
      const text = await selectedFile.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',');
      
      // Verificar se o cabeçalho aluno_id está presente
      if (!headers.includes('aluno_id')) {
        throw new Error("O arquivo CSV deve conter uma coluna 'aluno_id'");
      }

      const data = lines.slice(1)
        .filter(line => line.trim() !== '')
        .map(line => {
          const values = line.split(',');
          const obj: Record<string, any> = {};
          headers.forEach((header, index) => {
            let value = values[index]?.trim() || null;
            
            // Garantir que aluno_id nunca seja nulo
            if (header.trim() === 'aluno_id' && !value) {
              throw new Error("Valor de aluno_id não pode ser vazio");
            }
            
            // Conversão de tipos
            if (header.trim() === 'presente' || header.trim() === 'fez_desafio' || header.trim() === 'is_reposicao') {
              obj[header.trim()] = value === 'true' || value === '1' || value === 'sim';
            } else if (header.trim() === 'exercicios' || header.trim() === 'erros') {
              obj[header.trim()] = value ? parseInt(value) : null;
            } else {
              obj[header.trim()] = value;
            }
          });
          return obj;
        });

      await uploadCsv(data);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      setErrorMessage(error instanceof Error ? error.message : "Erro ao processar o arquivo CSV");
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível processar o arquivo CSV",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="border-orange-200 bg-white">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg text-azul-500">Upload de Produtividade</CardTitle>
        <CardDescription className="text-azul-400">
          Faça upload de dados de produtividade via arquivo CSV
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button 
              variant="outline" 
              onClick={handleButtonClick}
              className="flex-1 border-orange-300 text-azul-500 hover:bg-orange-50"
            >
              <FileText className="mr-2 h-4 w-4" />
              {selectedFile ? selectedFile.name : "Selecionar arquivo CSV"}
            </Button>
            {selectedFile && (
              <Button 
                onClick={handleUpload} 
                disabled={isUploading}
                className="bg-supera hover:bg-supera-600"
              >
                <Upload className="mr-2 h-4 w-4" />
                {isUploading ? "Processando..." : "Enviar"}
              </Button>
            )}
          </div>
          {selectedFile && (
            <div className="text-xs text-center text-azul-400">
              Arquivo selecionado: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
            </div>
          )}
          {errorMessage && (
            <div className="text-xs text-center text-red-500 flex items-center justify-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              {errorMessage}
            </div>
          )}
          <div className="text-xs text-center text-azul-400 mt-2">
            <p className="font-semibold">O arquivo CSV deve conter as seguintes colunas:</p>
            <p>aluno_id, data_aula, presente, is_reposicao, apostila, pagina, exercicios, erros, fez_desafio, comentario</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CsvUploadComponent;

