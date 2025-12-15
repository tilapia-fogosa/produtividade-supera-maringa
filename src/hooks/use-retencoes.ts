import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface RetencaoFormData {
  aluno_id: string;
  aluno_nome: string;
  responsavel_id: string;
  responsavel_tipo: 'professor' | 'funcionario';
  responsavel_nome: string;
  data_retencao: string;
  descritivo_responsavel: string;
  acoes_tomadas: string;
  unit_id: string;
}

export function useRetencoes() {
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<RetencaoFormData>({
    aluno_id: '',
    aluno_nome: '',
    responsavel_id: '',
    responsavel_tipo: 'funcionario',
    responsavel_nome: '',
    data_retencao: '',
    descritivo_responsavel: '',
    acoes_tomadas: '',
    unit_id: ''
  });

  const updateFormData = useCallback((field: keyof RetencaoFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const resetForm = () => {
    setFormData({
      aluno_id: '',
      aluno_nome: '',
      responsavel_id: '',
      responsavel_tipo: 'funcionario',
      responsavel_nome: '',
      data_retencao: '',
      descritivo_responsavel: '',
      acoes_tomadas: '',
      unit_id: ''
    });
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!formData.aluno_id) errors.push('Aluno é obrigatório');
    if (!formData.data_retencao) errors.push('Data da retenção é obrigatória');
    if (new Date(formData.data_retencao) > new Date()) errors.push('Data não pode ser futura');
    if (!formData.responsavel_id) errors.push('Responsável é obrigatório');
    if (!formData.descritivo_responsavel.trim()) errors.push('Descritivo do responsável é obrigatório');
    if (formData.descritivo_responsavel.trim().length < 10) errors.push('Descritivo deve ter pelo menos 10 caracteres');
    if (!formData.acoes_tomadas.trim()) errors.push('Ações tomadas é obrigatório');
    if (formData.acoes_tomadas.trim().length < 10) errors.push('Ações tomadas deve ter pelo menos 10 caracteres');

    return errors;
  };

  const salvarRetencao = async (): Promise<boolean> => {
    const errors = validateForm();
    if (errors.length > 0) {
      toast({
        title: 'Erro na validação',
        description: errors.join(', '),
        variant: 'destructive'
      });
      return false;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('retencoes')
        .insert([{
          aluno_id: formData.aluno_id,
          responsavel_id: formData.responsavel_id,
          responsavel_tipo: formData.responsavel_tipo,
          responsavel_nome: formData.responsavel_nome,
          data_retencao: formData.data_retencao,
          descritivo_responsavel: formData.descritivo_responsavel.trim(),
          acoes_tomadas: formData.acoes_tomadas.trim(),
          unit_id: formData.unit_id
        }]);

      if (error) {
        console.error('Erro ao salvar retenção:', error);
        toast({
          title: 'Erro ao salvar retenção',
          description: 'Ocorreu um erro inesperado. Tente novamente.',
          variant: 'destructive'
        });
        return false;
      }

      toast({
        title: 'Retenção salva com sucesso!',
        description: `Retenção do aluno ${formData.aluno_nome} foi registrada.`
      });

      resetForm();
      return true;

    } catch (error) {
      console.error('Erro inesperado:', error);
      toast({
        title: 'Erro inesperado',
        description: 'Ocorreu um erro inesperado. Tente novamente.',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    formData,
    updateFormData,
    resetForm,
    isLoading,
    salvarRetencao,
    validateForm
  };
}
