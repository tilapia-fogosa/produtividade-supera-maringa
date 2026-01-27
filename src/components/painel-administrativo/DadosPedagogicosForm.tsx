import React, { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { ClienteMatriculado } from "@/hooks/use-pos-matricula";
import { useTodasTurmas } from "@/hooks/use-todas-turmas";
import { useResponsaveis } from "@/hooks/use-responsaveis";

interface DadosPedagogicosFormProps {
  cliente: ClienteMatriculado;
  onCancel: () => void;
}

export function DadosPedagogicosForm({ cliente, onCancel }: DadosPedagogicosFormProps) {
  const { turmas, loading: loadingTurmas } = useTodasTurmas();
  const { responsaveis, isLoading: loadingResponsaveis } = useResponsaveis();

  const [turmaId, setTurmaId] = useState<string>("");
  const [responsavelPedagogico, setResponsavelPedagogico] = useState<string>("o_proprio");
  const [telefoneResponsavel, setTelefoneResponsavel] = useState<string>("");
  const [dataAulaInaugural, setDataAulaInaugural] = useState<Date | undefined>();
  const [isSaving, setIsSaving] = useState(false);

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTelefoneResponsavel(formatPhone(e.target.value));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Implementar salvamento dos dados pedagógicos
      console.log("Salvando dados pedagógicos:", {
        turmaId,
        responsavelPedagogico,
        telefoneResponsavel,
        dataAulaInaugural,
      });
      
      // Simular delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      onCancel();
    } catch (error) {
      console.error("Erro ao salvar dados pedagógicos:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Accordion type="multiple" defaultValue={["turma", "responsavel", "aula"]} className="w-full">
        {/* Seção Turma */}
        <AccordionItem value="turma">
          <AccordionTrigger className="text-sm font-medium">
            Turma
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Selecione a Turma</Label>
                <Select value={turmaId} onValueChange={setTurmaId}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder={loadingTurmas ? "Carregando..." : "Selecione uma turma"} />
                  </SelectTrigger>
                  <SelectContent>
                    {turmas.map((turma) => (
                      <SelectItem key={turma.id} value={turma.id}>
                        {turma.nome} {turma.professor_nome ? `- ${turma.professor_nome}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Seção Responsável Pedagógico */}
        <AccordionItem value="responsavel">
          <AccordionTrigger className="text-sm font-medium">
            Responsável Pedagógico
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Responsável</Label>
                <Select value={responsavelPedagogico} onValueChange={setResponsavelPedagogico}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder={loadingResponsaveis ? "Carregando..." : "Selecione"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="o_proprio">O próprio</SelectItem>
                    {responsaveis.map((resp) => (
                      <SelectItem key={resp.id} value={resp.id}>
                        {resp.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Telefone do Responsável</Label>
                <Input
                  value={telefoneResponsavel}
                  onChange={handlePhoneChange}
                  placeholder="(00) 00000-0000"
                  className="h-9"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Seção Aula Inaugural */}
        <AccordionItem value="aula">
          <AccordionTrigger className="text-sm font-medium">
            Aula Inaugural
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Data da Aula Inaugural</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-9 justify-start text-left font-normal",
                        !dataAulaInaugural && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dataAulaInaugural
                        ? format(dataAulaInaugural, "dd/MM/yyyy", { locale: ptBR })
                        : "Selecione uma data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[9999]" align="start">
                    <Calendar
                      mode="single"
                      selected={dataAulaInaugural}
                      onSelect={setDataAulaInaugural}
                      locale={ptBR}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Botões de ação */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isSaving}
          className="bg-orange-500 hover:bg-orange-600"
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Dados
        </Button>
      </div>
    </div>
  );
}
