import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import { ClienteMatriculado } from "@/hooks/use-pos-matricula";
import { useTodasTurmas } from "@/hooks/use-todas-turmas";
import { useSalvarDadosPedagogicos } from "@/hooks/use-salvar-dados-pedagogicos";
import { AulaInauguralSelector } from "./AulaInauguralSelector";

interface DadosPedagogicosFormProps {
  cliente: ClienteMatriculado;
  onCancel: () => void;
}

export function DadosPedagogicosForm({ cliente, onCancel }: DadosPedagogicosFormProps) {
  const { turmas, loading: loadingTurmas } = useTodasTurmas();
  const salvarDados = useSalvarDadosPedagogicos();

  const [turmaId, setTurmaId] = useState<string>("");
  const [responsavelPedagogico, setResponsavelPedagogico] = useState<string>("O próprio");
  const [telefoneResponsavel, setTelefoneResponsavel] = useState<string>("");
  
  // Estados da aula inaugural
  const [dataAulaInaugural, setDataAulaInaugural] = useState<Date | undefined>();
  const [horarioSelecionado, setHorarioSelecionado] = useState<string>("");
  const [professorSelecionado, setProfessorSelecionado] = useState<{ id: string; nome: string; prioridade: number } | null>(null);
  const [salaSelecionada, setSalaSelecionada] = useState<{ id: string; nome: string } | null>(null);

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
    await salvarDados.mutateAsync({
      clientId: cliente.id,
      turmaId: turmaId || undefined,
      responsavel: responsavelPedagogico !== "O próprio" ? responsavelPedagogico : undefined,
      whatsappContato: telefoneResponsavel || undefined,
      dataAulaInaugural: dataAulaInaugural,
      horarioAulaInaugural: horarioSelecionado || undefined,
      professorId: professorSelecionado?.id,
      salaId: salaSelecionada?.id,
    });
    
    onCancel();
  };

  const canSave = !salvarDados.isPending;

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
                <Input
                  value={responsavelPedagogico}
                  onChange={(e) => setResponsavelPedagogico(e.target.value)}
                  placeholder="Nome do responsável pedagógico"
                  className="h-9"
                />
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
            <div className="pt-2">
              <AulaInauguralSelector
                dataAulaInaugural={dataAulaInaugural}
                setDataAulaInaugural={setDataAulaInaugural}
                horarioSelecionado={horarioSelecionado}
                setHorarioSelecionado={setHorarioSelecionado}
                professorSelecionado={professorSelecionado}
                setProfessorSelecionado={setProfessorSelecionado}
                salaSelecionada={salaSelecionada}
                setSalaSelecionada={setSalaSelecionada}
              />
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
          disabled={!canSave}
          className="bg-orange-500 hover:bg-orange-600"
        >
          {salvarDados.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Dados
        </Button>
      </div>
    </div>
  );
}

