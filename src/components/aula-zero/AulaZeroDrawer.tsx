import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentFuncionario } from '@/hooks/use-current-funcionario';
import { AudioTranscribeButton } from '@/components/ui/audio-transcribe-button';
import { useActiveUnit } from '@/contexts/ActiveUnitContext';

interface AulaZeroDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  alunoNome: string;
  onSalvo?: () => void;
}

interface AulaZeroFormData {
  percepcao_coordenador: string;
  motivo_procura: string;
  avaliacao_abaco: string;
  avaliacao_ah: string;
  pontos_atencao: string;
}

export function AulaZeroDrawer({ open, onOpenChange, clientId, alunoNome, onSalvo }: AulaZeroDrawerProps) {
  const { funcionarioNome } = useCurrentFuncionario();
  const { activeUnit } = useActiveUnit();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<AulaZeroFormData>({
    defaultValues: {
      percepcao_coordenador: '',
      motivo_procura: '',
      avaliacao_abaco: '',
      avaliacao_ah: '',
      pontos_atencao: '',
    },
  });

  // Carregar dados existentes da atividade_pos_venda ao abrir
  useEffect(() => {
    if (open && clientId) {
      (async () => {
        const { data } = await supabase
          .from('atividade_pos_venda')
          .select('percepcao_coordenador, motivo_procura, avaliacao_abaco, avaliacao_ah, pontos_atencao')
          .eq('client_id', clientId)
          .maybeSingle();

        if (data) {
          form.reset({
            percepcao_coordenador: data.percepcao_coordenador || '',
            motivo_procura: data.motivo_procura || '',
            avaliacao_abaco: data.avaliacao_abaco || '',
            avaliacao_ah: data.avaliacao_ah || '',
            pontos_atencao: data.pontos_atencao || '',
          });
        } else {
          form.reset({
            percepcao_coordenador: '',
            motivo_procura: '',
            avaliacao_abaco: '',
            avaliacao_ah: '',
            pontos_atencao: '',
          });
        }
      })();
    }
  }, [open, clientId]);

  const onSubmit = async (data: AulaZeroFormData) => {
    if (!clientId) return;
    setIsSaving(true);
    try {
      // Salvar na tabela atividade_pos_venda
      const { error } = await supabase
        .from('atividade_pos_venda')
        .update({
          percepcao_coordenador: data.percepcao_coordenador,
          motivo_procura: data.motivo_procura,
          avaliacao_abaco: data.avaliacao_abaco,
          avaliacao_ah: data.avaliacao_ah,
          pontos_atencao: data.pontos_atencao,
        })
        .eq('client_id', clientId);

      if (error) throw error;

      // Também salvar na tabela alunos se existir vínculo
      const { data: aluno } = await supabase
        .from('alunos')
        .select('id')
        .eq('client_id', clientId)
        .maybeSingle();

      if (aluno) {
        await supabase
          .from('alunos')
          .update({
            percepcao_coordenador: data.percepcao_coordenador,
            motivo_procura: data.motivo_procura,
            avaliacao_abaco: data.avaliacao_abaco,
            avaliacao_ah: data.avaliacao_ah,
            pontos_atencao: data.pontos_atencao,
            coordenador_responsavel: funcionarioNome || undefined,
          })
          .eq('id', aluno.id);
      }

      // Enviar para webhook via edge function
      try {
        await supabase.functions.invoke('webhook-aula-inaugural', {
          body: {
            client_id: clientId,
            client_name: alunoNome,
            unit_id: activeUnit?.id || null,
            registrado_por: funcionarioNome || 'Desconhecido',
            percepcao_coordenador: data.percepcao_coordenador,
            motivo_procura: data.motivo_procura,
            avaliacao_abaco: data.avaliacao_abaco,
            avaliacao_ah: data.avaliacao_ah,
            pontos_atencao: data.pontos_atencao,
            data_registro: new Date().toISOString(),
            tipo: 'lancamento_aula_zero',
          },
        });
      } catch (webhookErr) {
        console.error('Erro ao enviar webhook:', webhookErr);
      }

      form.reset();
      onOpenChange(false);
      onSalvo?.();
    } catch (error) {
      console.error('Erro ao salvar dados da Aula Zero:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-[480px] w-full p-6 flex flex-col">
        <SheetHeader className="mb-3">
          <SheetTitle className="text-sm font-semibold">Lançamento de Aula Zero</SheetTitle>
          <SheetDescription className="text-sm">
            Aluno: <span className="font-semibold text-foreground text-base">{alunoNome}</span>
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto pr-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <FormField
                control={form.control}
                name="percepcao_coordenador"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-xs font-medium">Percepção sobre o Aluno</FormLabel>
                      <AudioTranscribeButton currentValue={field.value} onTranscribed={(v) => field.onChange(v)} />
                    </div>
                    <FormControl>
                      <Textarea placeholder="Descreva a percepção sobre o aluno..." {...field} className="min-h-[60px] text-xs" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="motivo_procura"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-xs font-medium">Motivo da Procura</FormLabel>
                      <AudioTranscribeButton currentValue={field.value} onTranscribed={(v) => field.onChange(v)} />
                    </div>
                    <FormControl>
                      <Textarea placeholder="Descreva o motivo da procura..." {...field} className="min-h-[60px] text-xs" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="avaliacao_abaco"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-xs font-medium">Avaliação no Ábaco</FormLabel>
                      <AudioTranscribeButton currentValue={field.value} onTranscribed={(v) => field.onChange(v)} />
                    </div>
                    <FormControl>
                      <Textarea placeholder="Como o aluno se saiu no Ábaco..." {...field} className="min-h-[60px] text-xs" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="avaliacao_ah"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-xs font-medium">Avaliação na Abrindo Horizontes</FormLabel>
                      <AudioTranscribeButton currentValue={field.value} onTranscribed={(v) => field.onChange(v)} />
                    </div>
                    <FormControl>
                      <Textarea placeholder="Como o aluno se saiu no Abrindo Horizontes..." {...field} className="min-h-[60px] text-xs" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pontos_atencao"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-xs font-medium">Pontos de Atenção</FormLabel>
                      <AudioTranscribeButton currentValue={field.value} onTranscribed={(v) => field.onChange(v)} />
                    </div>
                    <FormControl>
                      <Textarea placeholder="Destaque pontos importantes a serem observados..." {...field} className="min-h-[60px] text-xs" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isSaving} size="sm" className="h-8 text-xs">
                  {isSaving ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
