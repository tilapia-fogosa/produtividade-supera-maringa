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
import { useAuth } from '@/contexts/AuthContext';
import { AudioTranscribeButton } from '@/components/ui/audio-transcribe-button';
import { useActiveUnit } from '@/contexts/ActiveUnitContext';

interface AulaZeroDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aulaInauguralId: string;
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

export function AulaZeroDrawer({ open, onOpenChange, aulaInauguralId, alunoNome, onSalvo }: AulaZeroDrawerProps) {
  const { profile } = useAuth();
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

  // Carregar dados existentes da aulas_inaugurais ao abrir
  useEffect(() => {
    if (open && aulaInauguralId) {
      (async () => {
        const { data } = await supabase
          .from('aulas_inaugurais')
          .select('percepcao_coordenador, motivo_procura, avaliacao_abaco, avaliacao_ah, pontos_atencao')
          .eq('id', aulaInauguralId)
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
  }, [open, aulaInauguralId]);

  const onSubmit = async (data: AulaZeroFormData) => {
    if (!aulaInauguralId) return;
    setIsSaving(true);
    try {
      const fields = {
        percepcao_coordenador: data.percepcao_coordenador,
        motivo_procura: data.motivo_procura,
        avaliacao_abaco: data.avaliacao_abaco,
        avaliacao_ah: data.avaliacao_ah,
        pontos_atencao: data.pontos_atencao,
      };

      // Atualizar aulas_inaugurais com dados pedagógicos e status realizada
      const { error: updateError } = await supabase
        .from('aulas_inaugurais')
        .update({
          ...fields,
          coordenador_responsavel: profile?.full_name || null,
          status: 'realizada',
        })
        .eq('id', aulaInauguralId);

      if (updateError) throw updateError;

      // Buscar dados da aula inaugural para sincronização
      const { data: aulaInaugural } = await supabase
        .from('aulas_inaugurais')
        .select('client_id, atividade_pos_venda_id')
        .eq('id', aulaInauguralId)
        .maybeSingle();

      // Sincronizar com atividade_pos_venda (retrocompatibilidade)
      if (aulaInaugural?.atividade_pos_venda_id) {
        await supabase
          .from('atividade_pos_venda')
          .update(fields)
          .eq('id', aulaInaugural.atividade_pos_venda_id);
      }

      // Sincronizar com alunos
      if (aulaInaugural?.client_id) {
        const { data: aluno } = await supabase
          .from('alunos')
          .select('id')
          .eq('client_id', aulaInaugural.client_id)
          .maybeSingle();
        if (aluno) {
          await supabase.from('alunos').update({
            ...fields,
            coordenador_responsavel: profile?.full_name || undefined,
          }).eq('id', aluno.id);
        }
      }

      // Fechar drawer imediatamente
      form.reset();
      onOpenChange(false);
      onSalvo?.();

      // Webhook fire-and-forget
      supabase.functions.invoke('webhook-aula-inaugural', {
        body: {
          aula_inaugural_id: aulaInauguralId,
          atividade_pos_venda_id: aulaInaugural?.atividade_pos_venda_id || null,
          client_name: alunoNome,
          unit_id: activeUnit?.id || null,
          registrado_por: profile?.full_name || profile?.email || 'Desconhecido',
          professor_id: profile?.professor_id || null,
          ...fields,
          data_registro: new Date().toISOString(),
          tipo: 'lancamento_aula_zero',
        },
      }).catch(err => console.error('Erro ao enviar webhook:', err));
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
