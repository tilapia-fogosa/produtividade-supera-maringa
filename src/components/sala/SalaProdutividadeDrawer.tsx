
import React, { useState, useEffect } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from 'date-fns';
import { supabase } from "@/integrations/supabase/client";
import { SalaPessoaTurma } from '@/hooks/sala/use-sala-pessoas-turma';
import { Turma } from '@/hooks/use-professor-turmas';

interface SalaProdutividadeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  pessoa: SalaPessoaTurma | null;
  turma: Turma | null;
  onSuccess: () => void;
  onError: (error: string) => void;
  presencaInicial?: boolean;
}

const SalaProdutividadeDrawer: React.FC<SalaProdutividadeDrawerProps> = ({
  isOpen,
  onClose,
  pessoa,
  turma,
  onSuccess,
  onError,
  presencaInicial = true
}) => {
  const [loading, setLoading] = useState(false);
  const [dataAula, setDataAula] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [presente, setPresente] = useState(true);
  const [paginaInicial, setPaginaInicial] = useState('');
  const [paginaFinal, setPaginaFinal] = useState('');
  const [exerciciosAbaco, setExerciciosAbaco] = useState('');
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    if (isOpen && pessoa) {
      setDataAula(format(new Date(), 'yyyy-MM-dd'));
      setPresente(presencaInicial);
      setPaginaInicial(pessoa.ultima_pagina?.toString() || '');
      setPaginaFinal('');
      setExerciciosAbaco('');
      setObservacoes('');
    }
  }, [isOpen, pessoa, presencaInicial]);

  const handleSubmit = async () => {
    if (!pessoa || !turma) return;

    setLoading(true);
    try {
      const payload = {
        pessoa_id: pessoa.id,
        pessoa_tipo: pessoa.origem,
        turma_id: turma.id,
        data_aula: dataAula,
        presente,
        pagina_inicial: paginaInicial ? parseInt(paginaInicial) : null,
        pagina_final: paginaFinal ? parseInt(paginaFinal) : null,
        exercicios_abaco: exerciciosAbaco ? parseInt(exerciciosAbaco) : null,
        observacoes: observacoes || null,
        unit_id: turma.unit_id
      };

      console.log('[Sala] Enviando produtividade:', payload);

      const { error } = await supabase.functions.invoke('register-productivity', {
        body: payload
      });

      if (error) {
        throw error;
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('[Sala] Erro ao registrar produtividade:', error);
      onError(error.message || 'Erro ao registrar produtividade');
    } finally {
      setLoading(false);
    }
  };

  if (!pessoa || !turma) return null;

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent direction="right" className="h-full w-[70%]">
        <DrawerHeader className="border-b">
          <DrawerTitle>Registrar Produtividade</DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Nome do aluno */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="font-medium">{pessoa.nome}</p>
            <p className="text-sm text-muted-foreground">{turma.nome}</p>
          </div>

          {/* Indicador de Presença */}
          <div className={`p-3 rounded-lg text-center text-sm font-medium ${
            presente 
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {presente ? '✓ Presente' : '✗ Falta'}
          </div>

          {/* Data da aula */}
          <div className="space-y-2">
            <Label>Data da Aula</Label>
            <Input
              type="date"
              value={dataAula}
              onChange={(e) => setDataAula(e.target.value)}
            />
          </div>

          {presente && (
            <>
              {/* Páginas */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Página Inicial</Label>
                  <Input
                    type="number"
                    value={paginaInicial}
                    onChange={(e) => setPaginaInicial(e.target.value)}
                    placeholder="Ex: 10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Página Final</Label>
                  <Input
                    type="number"
                    value={paginaFinal}
                    onChange={(e) => setPaginaFinal(e.target.value)}
                    placeholder="Ex: 15"
                  />
                </div>
              </div>

              {/* Exercícios de Ábaco */}
              <div className="space-y-2">
                <Label>Exercícios de Ábaco</Label>
                <Input
                  type="number"
                  value={exerciciosAbaco}
                  onChange={(e) => setExerciciosAbaco(e.target.value)}
                  placeholder="Quantidade de exercícios"
                />
              </div>
            </>
          )}

          {/* Observações */}
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações sobre a aula..."
              rows={3}
            />
          </div>
        </div>

        <DrawerFooter className="border-t">
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default SalaProdutividadeDrawer;
