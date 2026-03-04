import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Upload, FileSpreadsheet, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useActiveUnit } from "@/contexts/ActiveUnitContext";

interface SyncSgsInlineProps {
  onSyncComplete: () => void;
}

const SyncSgsInline = ({ onSyncComplete }: SyncSgsInlineProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { activeUnit } = useActiveUnit();

  const processAndUpload = async () => {
    if (!selectedFile || !activeUnit?.id) return;

    setIsUploading(true);
    try {
      const buffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "buffer" });

      let targetSheetName = "novo";
      if (!workbook.SheetNames.includes("novo")) {
        targetSheetName = workbook.SheetNames[0];
      }

      const sheet = workbook.Sheets[targetSheetName];
      const allData = XLSX.utils.sheet_to_json(sheet);

      const professoresUnicos = new Set<string>();
      const turmasUnicas = new Set<string>();
      const alunos: any[] = [];

      allData.forEach((row: any) => {
        const aluno = {
          nome: row["Nome"] || row.nome,
          telefone: row["Telefone"] || row.telefone,
          email: row["E-mail"] || row.email,
          idade: row["Idade"] || row.idade,
          turma_atual: row["Turma atual"] || row.turma_atual,
          professor: row["Professor"] || row.professor,
          matricula: row["Matrícula"] || row.matricula,
          responsavel: row["Responsável"] || row.responsavel || "o próprio",
          vencimento_contrato: row["Vencimento contrato"] || row.vencimento_contrato,
          ultimo_nivel: row["Último nível"] || row.ultimo_nivel,
          dias_apostila: row["Dias na apostila"] || row.dias_apostila,
          dias_supera: row["Dias no Supera"] || row.dias_supera,
          ...row,
        };
        alunos.push(aluno);
        if (aluno.professor?.trim()) professoresUnicos.add(aluno.professor.trim());
        if (aluno.turma_atual?.trim()) turmasUnicas.add(aluno.turma_atual.trim());
      });

      const professores = Array.from(professoresUnicos).map((nome) => ({
        nome,
        active: true,
        slack: "",
      }));

      const turmas = Array.from(turmasUnicas).map((nome) => {
        const alunoExemplo = alunos.find((a) => a.turma_atual === nome);
        return {
          nome,
          professor_nome: alunoExemplo?.professor || "",
          active: true,
          dia_semana: "segunda",
          horario_inicio: "14:00",
          sala: "",
        };
      });

      const { data, error } = await supabase.functions.invoke("sync-turmas-xls", {
        body: {
          xlsData: { turmas, professores, alunos },
          fileName: selectedFile.name,
          unitId: activeUnit.id,
        },
      });

      if (error) {
        console.error("Erro na sincronização SGS:", error);
        return;
      }

      if (data?.error) {
        console.error("Erro retornado:", data.error);
        return;
      }

      // Webhook
      try {
        await fetch("https://webhookn8n.agenciakadin.com.br/webhook/atualiza-contatos", { method: "GET" });
      } catch {}

      setIsSynced(true);
      onSyncComplete();
    } catch (error) {
      console.error("Erro ao sincronizar SGS:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && !file.name.match(/\.(xlsx|xls)$/i)) return;
    setSelectedFile(file);
    setIsSynced(false);
  };

  if (isSynced) {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle2 className="h-4 w-4" />
        <span className="text-sm font-medium">Dados SGS sincronizados</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold">Sincronizar dados SGS</Label>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="flex-shrink-0"
        >
          <FileSpreadsheet className="mr-1 h-4 w-4" />
          {selectedFile ? selectedFile.name : "Selecionar Excel"}
        </Button>

        <Button
          type="button"
          size="sm"
          onClick={processAndUpload}
          disabled={!selectedFile || isUploading || !activeUnit?.id}
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Upload className="mr-1 h-4 w-4" />
              Enviar
            </>
          )}
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default SyncSgsInline;
