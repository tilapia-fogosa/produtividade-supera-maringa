import { useState, useEffect, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

// Função para converter base64 em Blob (compatível com navegador)
function base64ToBlob(base64: string, contentType: string): Blob {
  const byteCharacters = atob(base64);
  const byteArrays: BlobPart[] = [];
  
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  
  return new Blob(byteArrays, { type: contentType });
}
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, Check, ChevronsUpDown, X } from "lucide-react";
import { ClienteMatriculado } from "@/hooks/use-pos-matricula";
import { useAlunosSemVinculo, useAlunoVinculado } from "@/hooks/use-alunos-sem-vinculo";
import { WebcamCapture } from "./WebcamCapture";
import { AulaInauguralSelector } from "./AulaInauguralSelector";
import { DescritivoComercialField } from "./DescritivoComercialField";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface DadosFinaisFormProps {
  cliente: ClienteMatriculado;
  onCancel: () => void;
}

interface ChecklistItem {
  id: string;
  label: string;
  field: string;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  { id: "lancar_sgs", label: "Lançar SGS", field: "check_lancar_sgs" },
  { id: "assinar_contrato", label: "Assinar Contrato", field: "check_assinar_contrato" },
  { id: "entregar_kit", label: "Entregar Kit", field: "check_entregar_kit" },
  { id: "cadastrar_pagamento", label: "Cadastrar forma de pagamento", field: "check_cadastrar_pagamento" },
  { id: "sincronizar_sgs", label: "Sincronizar dados SGS", field: "check_sincronizar_sgs" },
];

export function DadosFinaisForm({ cliente, onCancel }: DadosFinaisFormProps) {
  const queryClient = useQueryClient();
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    check_lancar_sgs: false,
    check_assinar_contrato: false,
    check_entregar_kit: false,
    check_cadastrar_pagamento: false,
    check_sincronizar_sgs: false,
    check_grupo_whatsapp: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [openAlunoPopover, setOpenAlunoPopover] = useState(false);
  const [selectedAlunoId, setSelectedAlunoId] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [fotoCapturada, setFotoCapturada] = useState<string | null>(null);
  const [fotoUrlExistente, setFotoUrlExistente] = useState<string | null>(null);
  const [descritivoComercial, setDescritivoComercial] = useState("");

  // Estados da aula inaugural
  const [dataAulaInaugural, setDataAulaInaugural] = useState<Date | undefined>();
  const [horarioSelecionado, setHorarioSelecionado] = useState<string>("");
  const [professorSelecionado, setProfessorSelecionado] = useState<{ id: string; nome: string; prioridade: number } | null>(null);
  const [salaSelecionada, setSalaSelecionada] = useState<{ id: string; nome: string } | null>(null);

  // Hooks para alunos
  const { data: alunosDisponiveis = [], isLoading: isLoadingAlunos } = useAlunosSemVinculo(cliente.id);
  const { data: alunoVinculado, isLoading: isLoadingVinculado } = useAlunoVinculado(cliente.id);

  // Atualizar o aluno selecionado quando carregar o vinculado
  useEffect(() => {
    if (alunoVinculado) {
      setSelectedAlunoId(alunoVinculado.id);
    }
  }, [alunoVinculado]);

  // Filtrar alunos pela busca
  const alunosFiltrados = useMemo(() => {
    if (!searchFilter) return alunosDisponiveis;
    return alunosDisponiveis.filter(aluno =>
      aluno.nome.toLowerCase().includes(searchFilter.toLowerCase())
    );
  }, [alunosDisponiveis, searchFilter]);

  // Encontrar o aluno selecionado
  const alunoSelecionado = useMemo(() => {
    if (!selectedAlunoId) return null;
    return alunosDisponiveis.find(a => a.id === selectedAlunoId) || alunoVinculado;
  }, [selectedAlunoId, alunosDisponiveis, alunoVinculado]);

  // Carregar dados existentes
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data } = await supabase
          .from("atividade_pos_venda")
          .select(`
            check_lancar_sgs,
            check_assinar_contrato,
            check_entregar_kit,
            check_cadastrar_pagamento,
            check_sincronizar_sgs,
            check_grupo_whatsapp,
            photo_url,
            data_aula_inaugural,
            informacoes_onboarding
          `)
          .eq("client_id", cliente.id)
          .maybeSingle();

        if (data) {
          setChecklist({
            check_lancar_sgs: data.check_lancar_sgs ?? false,
            check_assinar_contrato: data.check_assinar_contrato ?? false,
            check_entregar_kit: data.check_entregar_kit ?? false,
            check_cadastrar_pagamento: data.check_cadastrar_pagamento ?? false,
            check_sincronizar_sgs: (data as any).check_sincronizar_sgs ?? false,
            check_grupo_whatsapp: data.check_grupo_whatsapp ?? false,
          });
          if (data.photo_url) {
            setFotoUrlExistente(data.photo_url);
          }
          if ((data as any).informacoes_onboarding) {
            setDescritivoComercial((data as any).informacoes_onboarding);
          }
          if (data.data_aula_inaugural) {
            const dataHora = new Date(data.data_aula_inaugural);
            setDataAulaInaugural(dataHora);
            const horas = dataHora.getHours().toString().padStart(2, '0');
            const minutos = dataHora.getMinutes().toString().padStart(2, '0');
            if (horas !== '00' || minutos !== '00') {
              setHorarioSelecionado(`${horas}:${minutos}`);
            }
          }
        }
      } catch (error) {
        console.error("Erro ao carregar dados finais:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [cliente.id]);

  const mutation = useMutation({
    mutationFn: async (data: { checklist: Record<string, boolean>; alunoId: string | null; fotoBase64: string | null }) => {
      let photoUrl = fotoUrlExistente;

      // Upload da foto se houver nova captura
      if (data.fotoBase64) {
        const base64Data = data.fotoBase64.split(',')[1];
        const fileName = `${cliente.id}-${Date.now()}.jpg`;
        
        const blob = base64ToBlob(base64Data, 'image/jpeg');
        const { error: uploadError } = await supabase.storage
          .from('alunos-fotos')
          .upload(fileName, blob, {
            contentType: 'image/jpeg',
            upsert: true
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('alunos-fotos')
          .getPublicUrl(fileName);
        
        photoUrl = urlData.publicUrl;
      }

      // Atualizar checklist, foto e aula inaugural na atividade_pos_venda
      const updateData: Record<string, any> = { ...data.checklist };
      if (photoUrl) {
        updateData.photo_url = photoUrl;
      }
      updateData.informacoes_onboarding = descritivoComercial || null;

      // Salvar data da aula inaugural
      if (dataAulaInaugural && horarioSelecionado) {
        const year = dataAulaInaugural.getFullYear();
        const month = String(dataAulaInaugural.getMonth() + 1).padStart(2, '0');
        const day = String(dataAulaInaugural.getDate()).padStart(2, '0');
        const dataStr = `${year}-${month}-${day}`;
        const horarioLimpo = horarioSelecionado.length === 8 ? horarioSelecionado : `${horarioSelecionado}:00`;
        updateData.data_aula_inaugural = `${dataStr}T${horarioLimpo}`;
      }

      const { error: checklistError } = await supabase
        .from("atividade_pos_venda")
        .update(updateData)
        .eq("client_id", cliente.id);

      if (checklistError) throw checklistError;

      // Se mudou o aluno vinculado
      if (data.alunoId !== alunoVinculado?.id) {
        // Remover vínculo do aluno anterior (se existir)
        if (alunoVinculado?.id) {
          const { error: removeError } = await supabase
            .from("alunos")
            .update({ client_id: null })
            .eq("id", alunoVinculado.id);

          if (removeError) throw removeError;
        }

        // Adicionar vínculo ao novo aluno (se selecionado)
        if (data.alunoId) {
          const updateAluno: Record<string, any> = { client_id: cliente.id, foto_url: photoUrl };
          if (dataAulaInaugural) {
            updateAluno.data_onboarding = `${dataAulaInaugural.getFullYear()}-${String(dataAulaInaugural.getMonth() + 1).padStart(2, '0')}-${String(dataAulaInaugural.getDate()).padStart(2, '0')}`;
          }
          const { error: addError } = await supabase
            .from("alunos")
            .update(updateAluno)
            .eq("id", data.alunoId);

          if (addError) throw addError;
        }
      } else if (data.alunoId) {
        // Atualizar foto e data_onboarding do aluno vinculado existente
        const updateAluno: Record<string, any> = {};
        if (photoUrl) updateAluno.foto_url = photoUrl;
        if (dataAulaInaugural) updateAluno.data_onboarding = `${dataAulaInaugural.getFullYear()}-${String(dataAulaInaugural.getMonth() + 1).padStart(2, '0')}-${String(dataAulaInaugural.getDate()).padStart(2, '0')}`;
        
        if (Object.keys(updateAluno).length > 0) {
          await supabase
            .from("alunos")
            .update(updateAluno)
            .eq("id", data.alunoId);
        }
      }

      // Criar evento na agenda do professor (se aula inaugural preenchida)
      if (dataAulaInaugural && horarioSelecionado && professorSelecionado) {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id ?? null;

        const [hora, minuto] = horarioSelecionado.split(':').map(Number);
        const totalMinutos = hora * 60 + minuto + 60;
        const horarioFim = `${String(Math.floor(totalMinutos / 60)).padStart(2, '0')}:${String(totalMinutos % 60).padStart(2, '0')}`;

        // Remover evento anterior de aula inaugural deste cliente
        await supabase
          .from('eventos_professor')
          .delete()
          .eq('client_id', cliente.id)
          .eq('tipo_evento', 'aula_zero');

        const eventoData = {
          professor_id: professorSelecionado.id,
          tipo_evento: 'aula_zero',
          titulo: 'Aula Inaugural',
          descricao: 'Aula inaugural agendada via painel administrativo',
          data: `${dataAulaInaugural.getFullYear()}-${String(dataAulaInaugural.getMonth() + 1).padStart(2, '0')}-${String(dataAulaInaugural.getDate()).padStart(2, '0')}`,
          horario_inicio: horarioSelecionado,
          horario_fim: horarioFim,
          recorrente: false,
          created_by: userId,
          client_id: cliente.id,
        };

        const { error: eventoError } = await supabase
          .from('eventos_professor')
          .insert(eventoData);

        if (eventoError) throw eventoError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos-matricula"] });
      queryClient.invalidateQueries({ queryKey: ["pos-matriculas-incompletas"] });
      queryClient.invalidateQueries({ queryKey: ["alunos-sem-vinculo"] });
      queryClient.invalidateQueries({ queryKey: ["aluno-vinculado"] });
      queryClient.invalidateQueries({ queryKey: ["agenda-professores"] });
      setTimeout(() => onCancel(), 1500);
    },
  });

  const handleToggle = (field: string) => {
    setChecklist((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ checklist, alunoId: selectedAlunoId, fotoBase64: fotoCapturada });
  };

  const handleRemoveAluno = () => {
    setSelectedAlunoId(null);
  };

  if (isLoading || isLoadingVinculado) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Seção: Aula Inaugural (primeiro campo) */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Aula Inaugural</Label>
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

      {/* Seção: Descritivo Comercial */}
      <DescritivoComercialField
        value={descritivoComercial}
        onChange={setDescritivoComercial}
      />

      {/* Seção: Foto do Aluno */}
      <WebcamCapture
        capturedImage={fotoCapturada}
        existingImageUrl={fotoUrlExistente}
        onCapture={setFotoCapturada}
        onClear={() => {
          setFotoCapturada(null);
          setFotoUrlExistente(null);
        }}
      />

      {/* Checklist */}
      <div className="space-y-4">
        {CHECKLIST_ITEMS.map((item) => (
          <div key={item.id} className="flex items-center space-x-3">
            <Checkbox
              id={item.id}
              checked={checklist[item.field]}
              onCheckedChange={() => handleToggle(item.field)}
            />
            <Label
              htmlFor={item.id}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              {item.label}
            </Label>
          </div>
        ))}
      </div>

      {/* Seção Vincular Aluno */}
      <div className="space-y-3 pt-4 border-t">
        <Label className="text-sm font-semibold">Vincular Aluno</Label>
        
        <Popover open={openAlunoPopover} onOpenChange={setOpenAlunoPopover}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openAlunoPopover}
              className="w-full justify-between"
              disabled={isLoadingAlunos}
            >
              {isLoadingAlunos ? (
                <span className="text-muted-foreground">Carregando alunos...</span>
              ) : alunoSelecionado ? (
                <span className="truncate">
                  {alunoSelecionado.nome}
                  {alunoSelecionado.turma_nome && (
                    <span className="text-muted-foreground ml-1">
                      ({alunoSelecionado.turma_nome})
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-muted-foreground">Selecione um aluno...</span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput 
                placeholder="Filtrar por nome..." 
                value={searchFilter}
                onValueChange={setSearchFilter}
              />
              <CommandList>
                <CommandEmpty>Nenhum aluno encontrado.</CommandEmpty>
                <CommandGroup>
                  {alunosFiltrados.map((aluno) => (
                    <CommandItem
                      key={aluno.id}
                      value={aluno.id}
                      onSelect={(value) => {
                        setSelectedAlunoId(value === selectedAlunoId ? null : value);
                        setOpenAlunoPopover(false);
                        setSearchFilter("");
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedAlunoId === aluno.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span>{aluno.nome}</span>
                      {aluno.turma_nome && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          {aluno.turma_nome}
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {alunoSelecionado && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-md">
            <div>
              <p className="text-sm font-medium">{alunoSelecionado.nome}</p>
              {alunoSelecionado.turma_nome && (
                <p className="text-xs text-muted-foreground">{alunoSelecionado.turma_nome}</p>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemoveAluno}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Checkbox Grupo WhatsApp (último item) */}
      <div className="flex items-center space-x-3 pt-4 border-t">
        <Checkbox
          id="grupo_whatsapp"
          checked={checklist.check_grupo_whatsapp}
          onCheckedChange={() => handleToggle("check_grupo_whatsapp")}
        />
        <Label
          htmlFor="grupo_whatsapp"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
        >
          Adicionar Grupo Whatsapp
        </Label>
      </div>

      {mutation.isSuccess && (
        <p className="text-sm text-green-600">Dados salvos com sucesso!</p>
      )}

      {mutation.isError && (
        <p className="text-sm text-destructive">Erro ao salvar dados.</p>
      )}

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" disabled={mutation.isPending} className="flex-1">
          {mutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar"
          )}
        </Button>
      </div>
    </form>
  );
}
