
import React, { useState, useEffect } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { format } from 'date-fns';
import { supabase } from "@/integrations/supabase/client";
import { SalaPessoaTurma } from '@/hooks/sala/use-sala-pessoas-turma';
import { Turma } from '@/hooks/use-professor-turmas';
import { useApostilas } from '@/hooks/use-apostilas';

interface SalaProdutividadeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  pessoa: SalaPessoaTurma | null;
  turma: Turma | null;
  onSuccess: () => void;
  onError: (error: string) => void;
  presencaInicial?: boolean;
}

const niveisDesafio = [
  'Nível 1',
  'Nível 2', 
  'Nível 3',
  'Nível 4',
  'CCL',
  'Arrepio',
  'BPA',
  'Linguagem'
];

const SalaProdutividadeDrawer: React.FC<SalaProdutividadeDrawerProps> = ({
  isOpen,
  onClose,
  pessoa,
  turma,
  onSuccess,
  onError,
  presencaInicial = true
}) => {
  const { apostilas } = useApostilas();
  const [loading, setLoading] = useState(false);
  const [dataAula, setDataAula] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [presente, setPresente] = useState(true);
  
  // Campos de Ábaco
  const [apostilaAbaco, setApostilaAbaco] = useState('');
  const [paginaAbaco, setPaginaAbaco] = useState('');
  const [exerciciosRealizados, setExerciciosRealizados] = useState('');
  const [errosAbaco, setErrosAbaco] = useState('');
  
  // Campos de Desafio
  const [fezDesafio, setFezDesafio] = useState(false);
  const [nivelDesafio, setNivelDesafio] = useState('');
  
  // Comentário
  const [comentario, setComentario] = useState('');

  useEffect(() => {
    if (isOpen && pessoa) {
      setDataAula(format(new Date(), 'yyyy-MM-dd'));
      setPresente(presencaInicial);
      setApostilaAbaco(pessoa.ultimo_nivel || '');
      setPaginaAbaco(pessoa.ultima_pagina?.toString() || '');
      setExerciciosRealizados('');
      setErrosAbaco('');
      setFezDesafio(false);
      setNivelDesafio('');
      setComentario('');
    }
  }, [isOpen, pessoa, presencaInicial]);

  const handleSubmit = async () => {
    if (!pessoa || !turma) return;

    setLoading(true);
    try {
      const payload = {
        aluno_id: pessoa.id,
        aluno_nome: pessoa.nome,
        turma_id: turma.id,
        turma_nome: turma.nome,
        data_aula: dataAula,
        data_registro: new Date().toISOString(),
        presente,
        apostila_abaco: apostilaAbaco || null,
        pagina_abaco: paginaAbaco || null,
        exercicios_abaco: exerciciosRealizados || null,
        erros_abaco: errosAbaco || null,
        fez_desafio: fezDesafio,
        nivel_desafio: nivelDesafio || null,
        comentario: comentario || null,
        apostila_atual: apostilaAbaco || null,
        ultima_pagina: paginaAbaco || null,
      };

      console.log('[Sala] Enviando produtividade:', payload);

      const { error } = await supabase.functions.invoke('register-productivity', {
        body: { data: payload }
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
      <DrawerContent direction="right" className="h-full w-[85%]">
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
              {/* Apostila do Ábaco */}
              <div className="space-y-2">
                <Label>Apostila do Ábaco</Label>
                <Select value={apostilaAbaco} onValueChange={setApostilaAbaco}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a apostila" />
                  </SelectTrigger>
                  <SelectContent>
                    {apostilas.map((apostila) => (
                      <SelectItem key={apostila.nome} value={apostila.nome}>
                        {apostila.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Página e Exercícios */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Página Ábaco</Label>
                  <Input
                    type="number"
                    value={paginaAbaco}
                    onChange={(e) => setPaginaAbaco(e.target.value)}
                    placeholder="Ex: 10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Exercícios Realizados</Label>
                  <Input
                    type="number"
                    value={exerciciosRealizados}
                    onChange={(e) => setExerciciosRealizados(e.target.value)}
                    placeholder="Qtd"
                  />
                </div>
              </div>

              {/* Número de Erros */}
              <div className="space-y-2">
                <Label>Número de Erros</Label>
                <Input
                  type="number"
                  value={errosAbaco}
                  onChange={(e) => setErrosAbaco(e.target.value)}
                  placeholder="Quantidade de erros"
                />
              </div>

              {/* Fez Desafio */}
              <div className="space-y-2">
                <Label>Fez Desafio?</Label>
                <RadioGroup
                  value={fezDesafio ? 'sim' : 'nao'}
                  onValueChange={(value) => setFezDesafio(value === 'sim')}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sim" id="desafio-sim" />
                    <Label htmlFor="desafio-sim" className="cursor-pointer">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nao" id="desafio-nao" />
                    <Label htmlFor="desafio-nao" className="cursor-pointer">Não</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Nível do Desafio - só mostra se fez desafio */}
              {fezDesafio && (
                <div className="space-y-2">
                  <Label>Nível do Desafio</Label>
                  <Select value={nivelDesafio} onValueChange={setNivelDesafio}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o nível" />
                    </SelectTrigger>
                    <SelectContent>
                      {niveisDesafio.map((nivel) => (
                        <SelectItem key={nivel} value={nivel}>
                          {nivel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}

          {/* Comentário */}
          <div className="space-y-2">
            <Label>Comentário (opcional)</Label>
            <Textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
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
