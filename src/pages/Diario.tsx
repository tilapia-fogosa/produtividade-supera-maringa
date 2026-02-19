import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from '@/integrations/supabase/client';
import DiarioTurmaAccordion from '@/components/diario/DiarioTurmaAccordion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Turma } from '@/hooks/use-professor-turmas';
import { ReposicaoRegistro } from '@/components/diario/DiarioReposicoesTabela';

type DiaSemanaEnum = 'domingo' | 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado';

// Mapeamento de dia da semana (Date) para o enum do banco
const getDiaSemanaFromDate = (date: Date): DiaSemanaEnum => {
  const diasSemana: DiaSemanaEnum[] = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  return diasSemana[date.getDay()];
};

// Mapeamento para exibição amigável
const getDiaSemanaDisplay = (date: Date): string => {
  const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  return diasSemana[date.getDay()];
};

const DiarioPage = () => {
  const [dataSelecionada, setDataSelecionada] = useState<Date>(new Date());
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [carregandoTurmas, setCarregandoTurmas] = useState(false);
  const [reposicoes, setReposicoes] = useState<ReposicaoRegistro[]>([]);
  const [carregandoReposicoes, setCarregandoReposicoes] = useState(false);

  // Buscar turmas quando a data muda
  useEffect(() => {
    const buscarTurmasDoDia = async () => {
      if (!dataSelecionada) return;

      setCarregandoTurmas(true);
      try {
        const diaSemana = getDiaSemanaFromDate(dataSelecionada);
        console.log('Buscando turmas para:', diaSemana);

        const { data, error } = await supabase
          .from('turmas')
          .select('*, professor:professores(id, nome)')
          .eq('dia_semana', diaSemana)
          .eq('active', true)
          .order('horario_inicio', { ascending: true });

        if (error) {
          console.error('Erro ao buscar turmas:', error);
          setTurmas([]);
          return;
        }

        // Filtrar apenas turmas que possuem alunos ativos
        const turmaIds = (data || []).map(t => t.id);
        const { data: alunosAtivos } = await supabase
          .from('alunos')
          .select('turma_id')
          .in('turma_id', turmaIds)
          .eq('active', true);

        const turmasComAlunosAtivos = new Set((alunosAtivos || []).map(a => a.turma_id));
        const turmasFiltradas = (data || []).filter(t => turmasComAlunosAtivos.has(t.id));

        console.log('Turmas com alunos ativos:', turmasFiltradas.length);
        setTurmas(turmasFiltradas);
      } catch (error) {
        console.error('Erro ao buscar turmas:', error);
        setTurmas([]);
      } finally {
        setCarregandoTurmas(false);
      }
    };

    buscarTurmasDoDia();
  }, [dataSelecionada]);

  // Buscar reposições do dia
  const buscarReposicoesDoDia = async () => {
    if (!dataSelecionada) return;

    setCarregandoReposicoes(true);
    try {
      const dataFormatada = dataSelecionada.toISOString().split('T')[0];
      console.log('Buscando reposições para:', dataFormatada);

      // Buscar registros de produtividade onde is_reposicao = true
      const { data: prodData, error: prodError } = await supabase
        .from('produtividade_abaco')
        .select('*')
        .eq('data_aula', dataFormatada)
        .eq('is_reposicao', true);

      if (prodError) {
        console.error('Erro ao buscar reposições:', prodError);
        setReposicoes([]);
        return;
      }

      if (!prodData || prodData.length === 0) {
        console.log('Nenhuma reposição encontrada');
        setReposicoes([]);
        return;
      }

      // Buscar informações das pessoas
      const pessoasIds = [...new Set(prodData.map(p => p.pessoa_id))];

      // Buscar alunos
      const { data: alunosData } = await supabase
        .from('alunos')
        .select('id, nome, foto_url, turma_id')
        .in('id', pessoasIds);

      // Buscar funcionários
      const { data: funcionariosData } = await supabase
        .from('funcionarios')
        .select('id, nome, foto_url, turma_id')
        .in('id', pessoasIds);

      // Criar mapa de pessoas
      const pessoasMap = new Map<string, { nome: string; foto_url?: string | null; turma_id?: string | null; origem: 'aluno' | 'funcionario' }>();
      
      (alunosData || []).forEach(a => {
        pessoasMap.set(a.id, { nome: a.nome, foto_url: a.foto_url, turma_id: a.turma_id, origem: 'aluno' });
      });
      
      (funcionariosData || []).forEach(f => {
        pessoasMap.set(f.id, { nome: f.nome, foto_url: f.foto_url, turma_id: f.turma_id, origem: 'funcionario' });
      });

      // Buscar nomes das turmas originais
      const turmasIds = [...new Set(
        [...(alunosData || []), ...(funcionariosData || [])]
          .map(p => p.turma_id)
          .filter(Boolean)
      )] as string[];

      const { data: turmasData } = await supabase
        .from('turmas')
        .select('id, nome')
        .in('id', turmasIds);

      const turmasMap = new Map<string, string>();
      (turmasData || []).forEach(t => {
        turmasMap.set(t.id, t.nome);
      });

      // Montar registros de reposição
      const reposicoesFormatadas: ReposicaoRegistro[] = prodData.map(registro => {
        const pessoa = pessoasMap.get(registro.pessoa_id);
        const turmaOriginalNome = pessoa?.turma_id ? turmasMap.get(pessoa.turma_id) : null;

        return {
          id: registro.id,
          pessoa_id: registro.pessoa_id,
          pessoa_nome: pessoa?.nome || 'Não encontrado',
          pessoa_foto: pessoa?.foto_url,
          turma_original_id: pessoa?.turma_id,
          turma_original_nome: turmaOriginalNome,
          origem: pessoa?.origem || 'aluno',
          presente: registro.presente ?? false,
          apostila: registro.apostila,
          pagina: registro.pagina,
          exercicios: registro.exercicios,
          erros: registro.erros,
          comentario: registro.comentario,
          data_aula: registro.data_aula
        };
      });

      console.log('Reposições encontradas:', reposicoesFormatadas.length);
      setReposicoes(reposicoesFormatadas);
    } catch (error) {
      console.error('Erro ao buscar reposições:', error);
      setReposicoes([]);
    } finally {
      setCarregandoReposicoes(false);
    }
  };

  useEffect(() => {
    buscarReposicoesDoDia();
  }, [dataSelecionada]);

  return (
    <div className="container mx-auto p-4 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-laranja-DEFAULT">Diário de Turma</h1>
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Coluna do Calendário */}
        <div className="lg:w-80 flex-shrink-0">
          <Card className="p-4 border-laranja-DEFAULT/30">
            <h3 className="text-lg font-medium mb-3 text-laranja-DEFAULT">Selecione o Dia</h3>
            <Calendar
              mode="single"
              selected={dataSelecionada}
              onSelect={(date) => date && setDataSelecionada(date)}
              className="rounded-md border pointer-events-auto"
              locale={ptBR}
            />
            
            <div className="mt-4 p-3 bg-muted/30 rounded-md">
              <p className="text-sm text-muted-foreground">Data selecionada:</p>
              <p className="font-medium text-laranja-DEFAULT">
                {format(dataSelecionada, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {getDiaSemanaDisplay(dataSelecionada)}
              </p>
            </div>
          </Card>
        </div>

        {/* Coluna das Turmas */}
        <div className="flex-1">
          <Card className="p-4 border-laranja-DEFAULT/30">
            <h3 className="text-lg font-medium mb-4 text-laranja-DEFAULT">
              Turmas de {getDiaSemanaDisplay(dataSelecionada)}
            </h3>
            
            <DiarioTurmaAccordion
              turmas={turmas}
              dataSelecionada={dataSelecionada}
              carregandoTurmas={carregandoTurmas}
              reposicoes={reposicoes}
              carregandoReposicoes={carregandoReposicoes}
              onRefreshReposicoes={buscarReposicoesDoDia}
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DiarioPage;
