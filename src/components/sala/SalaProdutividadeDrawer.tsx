
import React, { useState, useEffect, useMemo } from 'react';
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
import { usePessoasReposicao } from '@/hooks/use-alunos-reposicao';
import { ScrollArea } from "@/components/ui/scroll-area";

interface SalaProdutividadeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  pessoa: SalaPessoaTurma | null;
  turma: Turma | null;
  onSuccess: () => void;
  onError: (error: string) => void;
  presencaInicial?: boolean;
  modoReposicao?: boolean;
  dataInicial?: Date;
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
  presencaInicial = true,
  modoReposicao = false,
  dataInicial
}) => {
  const { apostilas } = useApostilas();
  const { data: pessoasReposicao = [], isLoading: loadingPessoas } = usePessoasReposicao(turma?.id || null);
  
  const [loading, setLoading] = useState(false);
  const [dataAula, setDataAula] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [presente, setPresente] = useState(true);
  
  // Seletor de pessoa para reposição
  const [pessoaSelecionadaId, setPessoaSelecionadaId] = useState('');
  const [filtroPessoa, setFiltroPessoa] = useState('');
  
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

  // Pessoa selecionada (da lista de reposição ou a passada por prop)
  const pessoaAtual = useMemo(() => {
    if (modoReposicao && pessoaSelecionadaId) {
      const encontrada = pessoasReposicao.find(p => p.id === pessoaSelecionadaId);
      if (encontrada) {
        return {
          id: encontrada.id,
          nome: encontrada.nome,
          origem: encontrada.tipo,
          ultimo_nivel: null,
          ultima_pagina: null
        } as SalaPessoaTurma;
      }
    }
    return pessoa;
  }, [modoReposicao, pessoaSelecionadaId, pessoasReposicao, pessoa]);

  // Filtrar pessoas por nome
  const pessoasFiltradas = useMemo(() => {
    if (!filtroPessoa.trim()) return pessoasReposicao;
    const termo = filtroPessoa.toLowerCase();
    return pessoasReposicao.filter(p => p.nome.toLowerCase().includes(termo));
  }, [pessoasReposicao, filtroPessoa]);

  useEffect(() => {
    if (isOpen) {
      // Usar a data inicial se fornecida, senão usa hoje
      const dataParaUsar = dataInicial ? format(dataInicial, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
      setDataAula(dataParaUsar);
      setPresente(presencaInicial);
      setPessoaSelecionadaId('');
      setFiltroPessoa('');
      setExerciciosRealizados('');
      setErrosAbaco('');
      setFezDesafio(false);
      setNivelDesafio('');
      setComentario('');
      
      if (pessoa && !modoReposicao) {
        setApostilaAbaco(pessoa.ultimo_nivel || '');
        setPaginaAbaco(pessoa.ultima_pagina?.toString() || '');
      } else {
        setApostilaAbaco('');
        setPaginaAbaco('');
      }
    }
  }, [isOpen, pessoa, presencaInicial, modoReposicao, dataInicial]);

  // Atualizar apostila quando selecionar pessoa em reposição
  useEffect(() => {
    if (modoReposicao && pessoaAtual) {
      setApostilaAbaco(pessoaAtual.ultimo_nivel || '');
      setPaginaAbaco(pessoaAtual.ultima_pagina?.toString() || '');
    }
  }, [pessoaAtual, modoReposicao]);

  const handleSubmit = async () => {
    if (!pessoaAtual || !turma) return;

    setLoading(true);
    try {
      const payload = {
        aluno_id: pessoaAtual.id,
        aluno_nome: pessoaAtual.nome,
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
        is_reposicao: modoReposicao,
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

  const podeSubmeter = modoReposicao ? !!pessoaAtual && !!pessoaSelecionadaId : !!pessoaAtual;

  if (!turma) return null;
  if (!modoReposicao && !pessoa) return null;

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent direction="right" className="h-full w-[85%]">
        <DrawerHeader className="border-b">
          <DrawerTitle>
            {modoReposicao ? 'Reposição de Aula' : 'Registrar Produtividade'}
          </DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Seletor de pessoa para reposição */}
          {modoReposicao && (
            <div className="space-y-2">
              <Label>Selecione o Aluno/Funcionário</Label>
              <Input
                placeholder="Filtrar por nome..."
                value={filtroPessoa}
                onChange={(e) => setFiltroPessoa(e.target.value)}
                className="mb-2"
              />
              <ScrollArea className="h-40 border rounded-md">
                {loadingPessoas ? (
                  <div className="p-4 text-center text-muted-foreground">Carregando...</div>
                ) : pessoasFiltradas.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">Nenhuma pessoa encontrada</div>
                ) : (
                  <div className="p-1">
                    {pessoasFiltradas.map((p) => (
                      <div
                        key={p.id}
                        className={`p-3 rounded-md cursor-pointer transition-colors ${
                          pessoaSelecionadaId === p.id 
                            ? 'bg-primary text-primary-foreground' 
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => setPessoaSelecionadaId(p.id)}
                      >
                        <p className="font-medium">{p.nome}</p>
                        <p className={`text-xs ${pessoaSelecionadaId === p.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          {p.tipo === 'funcionario' ? 'Funcionário' : 'Aluno'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          {/* Nome do aluno (quando não é reposição ou já selecionou) */}
          {pessoaAtual && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium">{pessoaAtual.nome}</p>
              <p className="text-sm text-muted-foreground">{turma.nome}</p>
              {modoReposicao && (
                <span className="inline-block mt-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                  Reposição
                </span>
              )}
            </div>
          )}

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
              disabled={loading || !podeSubmeter}
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
