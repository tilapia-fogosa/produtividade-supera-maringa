import { useState, useEffect, useMemo, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Lock, CheckCircle2 } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import SyncSgsInline from "./SyncSgsInline";

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
  { id: "cadastrar_pagamento", label: "Cadastrar forma de pagamento", field: "check_cadastrar_pagamento" },
  { id: "sincronizar_sgs", label: "Sincronizar dados SGS", field: "check_sincronizar_sgs" },
];

const KIT_OPTIONS = [
  { value: "kit_1", label: "Kit 1" },
  { value: "kit_2", label: "Kit 2" },
  { value: "kit_3", label: "Kit 3" },
  { value: "kit_4", label: "Kit 4" },
  { value: "kit_5", label: "Kit 5" },
  { value: "kit_6", label: "Kit 6" },
  { value: "kit_7", label: "Kit 7" },
  { value: "kit_8", label: "Kit 8" },
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
  const [kitType, setKitType] = useState<string>("");
  const [openAccordion, setOpenAccordion] = useState<string>("accordion-1");

  // Estados da aula inaugural
  const [dataAulaInaugural, setDataAulaInaugural] = useState<Date | undefined>();
  const [horarioSelecionado, setHorarioSelecionado] = useState<string>("");
  const [eventoExistente, setEventoExistente] = useState<{ horario_inicio: string; horario_fim: string; professor_nome: string } | null>(null);
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
            id,
            check_lancar_sgs,
            check_assinar_contrato,
            check_entregar_kit,
            check_cadastrar_pagamento,
            check_sincronizar_sgs,
            check_grupo_whatsapp,
            photo_url,
            data_aula_inaugural,
            informacoes_onboarding,
            kit_type
          `)
          .eq("id", cliente.atividade_pos_venda_id)
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
          if ((data as any).kit_type) {
            setKitType((data as any).kit_type);
          }
          if (data.photo_url) {
            setFotoUrlExistente(data.photo_url);
          }
          if ((data as any).informacoes_onboarding) {
            setDescritivoComercial((data as any).informacoes_onboarding);
          }
          if (data.data_aula_inaugural) {
            const dateStr = String(data.data_aula_inaugural);
            // Parse como data local para evitar shift de timezone
            const tIndex = dateStr.indexOf('T');
            if (tIndex !== -1) {
              const datePart = dateStr.substring(0, tIndex);
              const timePart = dateStr.substring(tIndex + 1);
              const [year, month, day] = datePart.split('-').map(Number);
              setDataAulaInaugural(new Date(year, month - 1, day));
              // Extrair horário com segundos para match com o select
              const timeClean = timePart.replace(/[+-]\d{2}:\d{2}$/, '').replace('Z', '');
              const horario = timeClean.length >= 8 ? timeClean.substring(0, 8) : `${timeClean.substring(0, 5)}:00`;
              if (horario !== '00:00:00') {
                setHorarioSelecionado(horario);
              }
            } else {
              const [year, month, day] = dateStr.split('-').map(Number);
              setDataAulaInaugural(new Date(year, month - 1, day));
            }
          }
        }

        // Buscar evento aula_zero existente para mostrar horário e professor
        const { data: evento } = await supabase
          .from('eventos_professor')
          .select('horario_inicio, horario_fim, professores:professor_id(nome)')
          .eq('atividade_pos_venda_id', cliente.atividade_pos_venda_id)
          .eq('tipo_evento', 'aula_zero')
          .order('data', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (evento) {
          setEventoExistente({
            horario_inicio: evento.horario_inicio,
            horario_fim: evento.horario_fim,
            professor_nome: (evento as any).professores?.nome || 'Não definido',
          });
        }
      } catch (error) {
        console.error("Erro ao carregar dados finais:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [cliente.atividade_pos_venda_id]);

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
      updateData.kit_type = kitType || null;

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
        .eq("id", cliente.atividade_pos_venda_id);

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

          // Limpar aluno_id na aulas_inaugurais vinculada
          await (supabase as any)
            .from('aulas_inaugurais')
            .update({ aluno_id: null })
            .eq('atividade_pos_venda_id', cliente.atividade_pos_venda_id);
        }

        // Adicionar vínculo ao novo aluno (se selecionado)
        if (data.alunoId) {
          const updateAluno: Record<string, any> = { client_id: cliente.id, foto_url: photoUrl, kit_sugerido: kitType || null };
          if (dataAulaInaugural) {
            updateAluno.data_onboarding = `${dataAulaInaugural.getFullYear()}-${String(dataAulaInaugural.getMonth() + 1).padStart(2, '0')}-${String(dataAulaInaugural.getDate()).padStart(2, '0')}`;
          }
          const { error: addError } = await supabase
            .from("alunos")
            .update(updateAluno)
            .eq("id", data.alunoId);

          if (addError) throw addError;

          // Atualizar aluno_id na aulas_inaugurais vinculada
          await (supabase as any)
            .from('aulas_inaugurais')
            .update({ aluno_id: data.alunoId })
            .eq('atividade_pos_venda_id', cliente.atividade_pos_venda_id);
        }
      } else if (data.alunoId) {
        // Atualizar foto e data_onboarding do aluno vinculado existente
        const updateAluno: Record<string, any> = {};
        if (photoUrl) updateAluno.foto_url = photoUrl;
        if (kitType) updateAluno.kit_sugerido = kitType;
        if (dataAulaInaugural) updateAluno.data_onboarding = `${dataAulaInaugural.getFullYear()}-${String(dataAulaInaugural.getMonth() + 1).padStart(2, '0')}-${String(dataAulaInaugural.getDate()).padStart(2, '0')}`;
        
        if (Object.keys(updateAluno).length > 0) {
          await supabase
            .from("alunos")
            .update(updateAluno)
            .eq("id", data.alunoId);
        }
      }

      // Criar evento na agenda do professor (se aula inaugural preenchida)
      // Separado do fluxo principal para não bloquear o salvamento dos demais dados
      if (dataAulaInaugural && horarioSelecionado && professorSelecionado) {
        try {
          const { data: userData } = await supabase.auth.getUser();
          const userId = userData.user?.id ?? null;

          const [hora, minuto] = horarioSelecionado.split(':').map(Number);
          const totalMinutos = hora * 60 + minuto + 60;
          const horarioFim = `${String(Math.floor(totalMinutos / 60)).padStart(2, '0')}:${String(totalMinutos % 60).padStart(2, '0')}`;

          // Remover evento anterior de aula inaugural deste cliente
          await supabase
            .from('eventos_professor')
            .delete()
            .eq('atividade_pos_venda_id', cliente.atividade_pos_venda_id)
            .eq('tipo_evento', 'aula_zero');

          // Remover aula inaugural anterior deste cliente
          await (supabase as any)
            .from('aulas_inaugurais')
            .delete()
            .eq('atividade_pos_venda_id', cliente.atividade_pos_venda_id);

          const year = dataAulaInaugural.getFullYear();
          const month = String(dataAulaInaugural.getMonth() + 1).padStart(2, '0');
          const day = String(dataAulaInaugural.getDate()).padStart(2, '0');
          const dataStr = `${year}-${month}-${day}`;

          const eventoData = {
            professor_id: professorSelecionado.id,
            tipo_evento: 'aula_zero' as const,
            titulo: 'Aula Inaugural',
            descricao: 'Aula inaugural agendada via painel administrativo',
            data: dataStr,
            horario_inicio: horarioSelecionado,
            horario_fim: horarioFim,
            recorrente: false,
            created_by: userId,
            client_id: cliente.id,
            atividade_pos_venda_id: cliente.atividade_pos_venda_id,
          };

          const { data: eventoInserido, error: eventoError } = await supabase
            .from('eventos_professor')
            .insert(eventoData)
            .select('id')
            .single();

          if (eventoError) {
            console.error("Erro ao criar evento de aula inaugural (RLS):", eventoError);
          }

          // Buscar unit_id da atividade
          const { data: atividadeData } = await supabase
            .from('atividade_pos_venda')
            .select('unit_id')
            .eq('id', cliente.atividade_pos_venda_id)
            .maybeSingle();

          // Criar registro na tabela aulas_inaugurais
          if (atividadeData?.unit_id) {
            const { error: aulaError } = await (supabase as any)
              .from('aulas_inaugurais')
              .insert({
                evento_professor_id: eventoInserido?.id || null,
                atividade_pos_venda_id: cliente.atividade_pos_venda_id,
                client_id: cliente.id,
                unit_id: atividadeData.unit_id,
                professor_id: professorSelecionado.id,
                sala_id: salaSelecionada?.id || null,
                aluno_id: data.alunoId || null,
                data: dataStr,
                horario_inicio: horarioSelecionado,
                horario_fim: horarioFim,
                status: 'agendada',
                created_by: userId,
              });

            if (aulaError) {
              console.error("Erro ao criar registro em aulas_inaugurais:", aulaError);
            }
          }

          // Webhook removido daqui - agora é disparado via useEffect quando accordion 2 é completado
        } catch (eventoErr) {
          console.error("Erro ao criar evento de aula inaugural:", eventoErr);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos-matricula"] });
      queryClient.invalidateQueries({ queryKey: ["pos-matriculas-incompletas"] });
      queryClient.invalidateQueries({ queryKey: ["alunos-sem-vinculo"] });
      queryClient.invalidateQueries({ queryKey: ["aluno-vinculado"] });
      queryClient.invalidateQueries({ queryKey: ["agenda-professores"] });
      queryClient.invalidateQueries({ queryKey: ["atividades-pos-venda"] });
      queryClient.invalidateQueries({ queryKey: ["aulas-inaugurais-professor"] });
      setTimeout(() => onCancel(), 1500);
    },
    onError: (error) => {
      console.error("Erro detalhado ao salvar dados iniciais:", error);
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

  // Completion checks for accordion gating
  const isAccordion1Complete = !!(
    dataAulaInaugural &&
    horarioSelecionado &&
    checklist.check_entregar_kit
  );

  const isAccordion2Complete = !!(
    (fotoCapturada || fotoUrlExistente) &&
    checklist.check_lancar_sgs &&
    checklist.check_sincronizar_sgs &&
    selectedAlunoId
  );

  // Determine which accordions can open

  // Ref para evitar envio duplicado do webhook na mesma sessão
  const webhookEnviado = useRef(false);

  // Auto-advance when completing an accordion
  useEffect(() => {
    if (isAccordion1Complete && openAccordion === "accordion-1") {
      setOpenAccordion("accordion-2");
    }
  }, [isAccordion1Complete]);

  useEffect(() => {
    if (isAccordion2Complete && openAccordion === "accordion-2") {
      setOpenAccordion("accordion-3");
    }
  }, [isAccordion2Complete]);

  // Disparar webhook quando accordion 2 for completado
  useEffect(() => {
    if (!isAccordion2Complete || webhookEnviado.current) return;

    const enviarWebhook = async () => {
      try {
        // Buscar nome do aluno vinculado
        let nomeAluno = cliente.name;
        if (selectedAlunoId) {
          const { data: alunoData } = await supabase
            .from('alunos')
            .select('nome')
            .eq('id', selectedAlunoId)
            .maybeSingle();
          if (alunoData?.nome) nomeAluno = alunoData.nome;
        }

        const { data: atividadeData } = await supabase
          .from('atividade_pos_venda')
          .select('unit_id')
          .eq('id', cliente.atividade_pos_venda_id)
          .limit(1)
          .maybeSingle();

        const horarioFormatado = horarioSelecionado ? horarioSelecionado.substring(0, 5) : null;

        const dataStr = dataAulaInaugural
          ? `${dataAulaInaugural.getFullYear()}-${String(dataAulaInaugural.getMonth() + 1).padStart(2, '0')}-${String(dataAulaInaugural.getDate()).padStart(2, '0')}`
          : null;

        const webhookPayload = {
          atividade_pos_venda_id: cliente.atividade_pos_venda_id,
          nome_aluno: nomeAluno,
          professor_id: professorSelecionado?.id || null,
          data_aula: dataStr,
          horario_aula: horarioFormatado,
          unit_id: atividadeData?.unit_id || null,
          kit_entregue: checklist.check_entregar_kit || false,
          tipo_kit: kitType || null,
          descritivo_comercial: descritivoComercial || null,
        };

        console.log('[Webhook Aula Inaugural] Enviando via edge function (accordion 2 completo):', webhookPayload);

        await supabase.functions.invoke('webhook-aula-inaugural', {
          body: webhookPayload,
        });

        webhookEnviado.current = true;
        console.log('[Webhook Aula Inaugural] Enviado com sucesso');
      } catch (webhookErr) {
        console.error('[Webhook Aula Inaugural] Erro ao enviar:', webhookErr);
      }
    };

    enviarWebhook();
  }, [isAccordion2Complete]);

  if (isLoading || isLoadingVinculado) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Accordion
        type="single"
        collapsible
        value={openAccordion}
        onValueChange={(val) => {
          // Only allow opening if prerequisites are met
          if (val === "accordion-2" && !isAccordion1Complete) return;
          if (val === "accordion-3" && !isAccordion2Complete) return;
          setOpenAccordion(val);
        }}
      >
        {/* ===== ACORDEÃO 1: Aula Inaugural → Entregar Kit ===== */}
        <AccordionItem value="accordion-1" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              {isAccordion1Complete ? (
                <CheckCircle2 className="h-4 w-4 text-primary" />
              ) : (
                <span className="h-4 w-4 rounded-full border-2 border-muted-foreground/40 inline-block" />
              )}
              <span className="text-sm font-semibold">Aula Inaugural e Kit</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-6 pt-2 pb-4">
            {/* Aula Inaugural */}
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
              {eventoExistente && (
                <div className="mt-2 p-3 rounded-md bg-muted text-sm space-y-1">
                  <p><span className="font-medium text-foreground">Horário:</span> {eventoExistente.horario_inicio.substring(0, 5)} - {eventoExistente.horario_fim.substring(0, 5)}</p>
                  <p><span className="font-medium text-foreground">Professor:</span> {eventoExistente.professor_nome}</p>
                </div>
              )}
            </div>

            {/* Descritivo Comercial */}
            <DescritivoComercialField
              value={descritivoComercial}
              onChange={setDescritivoComercial}
            />

            {/* Entregar Kit */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="entregar_kit"
                  checked={checklist.check_entregar_kit}
                  onCheckedChange={() => handleToggle("check_entregar_kit")}
                />
                <Label htmlFor="entregar_kit" className="text-sm font-medium leading-none cursor-pointer">
                  Entregar Kit
                </Label>
              </div>
              {checklist.check_entregar_kit && (
                <div className="pl-7">
                  <Label className="text-sm mb-1.5 block">Tipo de Kit</Label>
                  <Select value={kitType} onValueChange={setKitType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o kit" />
                    </SelectTrigger>
                    <SelectContent>
                      {KIT_OPTIONS.map((kit) => (
                        <SelectItem key={kit.value} value={kit.value}>
                          {kit.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ===== ACORDEÃO 2: Foto → Vincular Aluno ===== */}
        <AccordionItem
          value="accordion-2"
          className={cn(
            "border rounded-lg px-4 mt-2",
            !isAccordion1Complete && "opacity-50"
          )}
          disabled={!isAccordion1Complete}
        >
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              {!isAccordion1Complete ? (
                <Lock className="h-4 w-4 text-muted-foreground" />
              ) : isAccordion2Complete ? (
                <CheckCircle2 className="h-4 w-4 text-primary" />
              ) : (
                <span className="h-4 w-4 rounded-full border-2 border-muted-foreground/40 inline-block" />
              )}
              <span className="text-sm font-semibold">Cadastro e Vínculo</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-6 pt-2 pb-4">
            {/* Foto do Aluno */}
            <WebcamCapture
              capturedImage={fotoCapturada}
              existingImageUrl={fotoUrlExistente}
              onCapture={setFotoCapturada}
              onClear={() => {
                setFotoCapturada(null);
                setFotoUrlExistente(null);
              }}
            />

            {/* Lançar SGS */}
            <div className="flex items-center space-x-3">
              <Checkbox
                id="lancar_sgs"
                checked={checklist.check_lancar_sgs}
                onCheckedChange={() => handleToggle("check_lancar_sgs")}
              />
              <Label htmlFor="lancar_sgs" className="text-sm font-medium leading-none cursor-pointer">
                Lançar SGS
              </Label>
            </div>

            {/* Sincronizar dados SGS */}
            <SyncSgsInline
              onSyncComplete={() => {
                handleToggle("check_sincronizar_sgs");
              }}
            />

            {/* Vincular Aluno */}
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
          </AccordionContent>
        </AccordionItem>

        {/* ===== ACORDEÃO 3: Contrato → WhatsApp ===== */}
        <AccordionItem
          value="accordion-3"
          className={cn(
            "border rounded-lg px-4 mt-2",
            !isAccordion2Complete && "opacity-50"
          )}
          disabled={!isAccordion2Complete}
        >
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              {!isAccordion2Complete ? (
                <Lock className="h-4 w-4 text-muted-foreground" />
              ) : (checklist.check_assinar_contrato && checklist.check_cadastrar_pagamento && checklist.check_grupo_whatsapp) ? (
                <CheckCircle2 className="h-4 w-4 text-primary" />
              ) : (
                <span className="h-4 w-4 rounded-full border-2 border-muted-foreground/40 inline-block" />
              )}
              <span className="text-sm font-semibold">Contrato e Pagamento</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-6 pt-2 pb-4">
            {/* Contrato assinado */}
            <div className="flex items-center space-x-3">
              <Checkbox
                id="assinar_contrato"
                checked={checklist.check_assinar_contrato}
                onCheckedChange={() => handleToggle("check_assinar_contrato")}
              />
              <Label htmlFor="assinar_contrato" className="text-sm font-medium leading-none cursor-pointer">
                Contrato Assinado
              </Label>
            </div>

            {/* Cadastrar forma de pagamento */}
            <div className="flex items-center space-x-3">
              <Checkbox
                id="cadastrar_pagamento"
                checked={checklist.check_cadastrar_pagamento}
                onCheckedChange={() => handleToggle("check_cadastrar_pagamento")}
              />
              <Label htmlFor="cadastrar_pagamento" className="text-sm font-medium leading-none cursor-pointer">
                Cadastrar forma de pagamento
              </Label>
            </div>

            {/* Adicionar Grupo WhatsApp */}
            <div className="flex items-center space-x-3">
              <Checkbox
                id="grupo_whatsapp"
                checked={checklist.check_grupo_whatsapp}
                onCheckedChange={() => handleToggle("check_grupo_whatsapp")}
              />
              <Label htmlFor="grupo_whatsapp" className="text-sm font-medium leading-none cursor-pointer">
                Adicionar Grupo Whatsapp
              </Label>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {mutation.isSuccess && (
        <p className="text-sm text-primary">Dados salvos com sucesso!</p>
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
