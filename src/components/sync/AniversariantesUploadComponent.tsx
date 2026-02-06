import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';

interface ResultadoSincronizacao {
  atualizados: number;
  naoEncontrados: string[];
  erros: string[];
}

const AniversariantesUploadComponent = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultado, setResultado] = useState<ResultadoSincronizacao | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResultado(null);
    }
  };

  const parseDate = (dateValue: any): string | null => {
    if (!dateValue) return null;
    
    // Se for um número, é um serial de data do Excel
    if (typeof dateValue === 'number') {
      // Excel usa 1/1/1900 como dia 1 (com bug do ano bissexto 1900)
      // Ajuste: subtrair 1 porque Excel conta a partir de 1, não 0
      // E subtrair mais 1 para corrigir o bug do Excel (considera 1900 bissexto)
      const excelEpoch = new Date(1899, 11, 30); // 30/12/1899
      const date = new Date(excelEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000);
      
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      
      return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }
    
    // Se for string, tentar parse no formato "M/D/YY" ou "DD/MM/YYYY"
    const dateStr = dateValue.toString().trim();
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    
    let day: number, month: number, year: number;
    
    // Detectar formato: se o primeiro número > 12, assume DD/MM/YYYY
    const first = parseInt(parts[0], 10);
    const second = parseInt(parts[1], 10);
    
    if (first > 12) {
      // Formato DD/MM/YYYY
      day = first;
      month = second;
      year = parseInt(parts[2], 10);
    } else if (second > 12) {
      // Formato MM/DD/YYYY
      month = first;
      day = second;
      year = parseInt(parts[2], 10);
    } else {
      // Ambíguo - assumir DD/MM/YYYY (padrão brasileiro)
      day = first;
      month = second;
      year = parseInt(parts[2], 10);
    }
    
    // Converter ano de 2 dígitos para 4 dígitos
    if (year >= 0 && year <= 29) {
      year += 2000;
    } else if (year >= 30 && year <= 99) {
      year += 1900;
    }
    
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsProcessing(true);
    setResultado(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      console.log('Dados do XLS:', jsonData);

      const resultados: ResultadoSincronizacao = {
        atualizados: 0,
        naoEncontrados: [],
        erros: []
      };

      for (const row of jsonData as any[]) {
        const nome = row['NOME']?.toString().trim();
        const dataNascStr = row['DATA_NASC']?.toString().trim();

        if (!nome || !dataNascStr) {
          resultados.erros.push(`Linha inválida: NOME ou DATA_NASC vazio`);
          continue;
        }

        const dataNascimento = parseDate(dataNascStr);
        if (!dataNascimento) {
          resultados.erros.push(`Data inválida para ${nome}: ${dataNascStr}`);
          continue;
        }

        // Buscar aluno pelo nome exato
        const { data: alunos, error: searchError } = await supabase
          .from('alunos')
          .select('id, nome')
          .ilike('nome', nome)
          .eq('active', true);

        if (searchError) {
          resultados.erros.push(`Erro ao buscar ${nome}: ${searchError.message}`);
          continue;
        }

        if (!alunos || alunos.length === 0) {
          resultados.naoEncontrados.push(nome);
          continue;
        }

        // Se encontrou mais de um, pegar o primeiro
        const aluno = alunos[0];

        // Atualizar data_nascimento
        const { error: updateError } = await supabase
          .from('alunos')
          .update({ data_nascimento: dataNascimento })
          .eq('id', aluno.id);

        if (updateError) {
          resultados.erros.push(`Erro ao atualizar ${nome}: ${updateError.message}`);
          continue;
        }

        resultados.atualizados++;
      }

      setResultado(resultados);
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      setResultado({
        atualizados: 0,
        naoEncontrados: [],
        erros: [`Erro ao processar arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`]
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileSpreadsheet className="h-5 w-5" />
          Sincronizar Datas de Nascimento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Faça upload de um arquivo XLS contendo as colunas <strong>NOME</strong> e <strong>DATA_NASC</strong>.
          O sistema irá buscar os alunos pelo nome e atualizar a data de nascimento.
        </p>

        <div className="flex items-center gap-4">
          <Input
            type="file"
            accept=".xls,.xlsx"
            onChange={handleFileChange}
            className="flex-1"
          />
          <Button
            onClick={handleUpload}
            disabled={!file || isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Sincronizar
              </>
            )}
          </Button>
        </div>

        {resultado && (
          <div className="space-y-3 mt-4">
            {resultado.atualizados > 0 && (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                <CheckCircle2 className="h-5 w-5" />
                <span>{resultado.atualizados} aluno(s) atualizado(s) com sucesso</span>
              </div>
            )}

            {resultado.naoEncontrados.length > 0 && (
              <div className="bg-yellow-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-700 mb-2">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">{resultado.naoEncontrados.length} aluno(s) não encontrado(s):</span>
                </div>
                <ul className="text-sm text-yellow-600 ml-7 list-disc">
                  {resultado.naoEncontrados.slice(0, 10).map((nome, i) => (
                    <li key={i}>{nome}</li>
                  ))}
                  {resultado.naoEncontrados.length > 10 && (
                    <li>... e mais {resultado.naoEncontrados.length - 10}</li>
                  )}
                </ul>
              </div>
            )}

            {resultado.erros.length > 0 && (
              <div className="bg-red-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-red-700 mb-2">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">{resultado.erros.length} erro(s):</span>
                </div>
                <ul className="text-sm text-red-600 ml-7 list-disc">
                  {resultado.erros.slice(0, 5).map((erro, i) => (
                    <li key={i}>{erro}</li>
                  ))}
                  {resultado.erros.length > 5 && (
                    <li>... e mais {resultado.erros.length - 5}</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AniversariantesUploadComponent;
