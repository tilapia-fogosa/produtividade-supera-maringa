
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Calendar, ArrowLeft, ArrowRight } from "lucide-react";
import { format, addDays, subDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Aluno, Turma } from '@/hooks/use-professor-turmas';

interface DiarioTurmaScreenProps {
  turma: Turma;
  onBack: () => void;
}

interface RegistroDiario {
  aluno_id: string;
  aluno_nome: string;
  presente: boolean;
  apostila?: string;
  pagina?: string;
  exercicios?: string;
  erros?: string;
  fez_desafio?: boolean;
  nivel_desafio?: string;
}

const DiarioTurmaScreen: React.FC<DiarioTurmaScreenProps> = ({ turma, onBack }) => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const [dataAtual, setDataAtual] = useState<Date>(new Date());
  const [registros, setRegistros] = useState<RegistroDiario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState('');

  // Formatar a data para exibição
  const dataFormatada = format(dataAtual, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const dataParaBanco = format(dataAtual, 'yyyy-MM-dd');

  useEffect(() => {
    carregarRegistrosData();
  }, [dataAtual, turma.id]);

  const carregarRegistrosData = async () => {
    try {
      setCarregando(true);
      
      // Buscar alunos da turma
      const { data: alunos, error: alunosError } = await supabase
        .from('alunos')
        .select('*')
        .eq('turma_id', turma.id)
        .order('nome');
        
      if (alunosError) throw alunosError;
      
      // Buscar registros de produtividade para a data selecionada
      const { data: produtividade, error: prodError } = await supabase
        .from('produtividade_abaco')
        .select('*')
        .eq('data_aula', dataParaBanco)
        .in('aluno_id', alunos.map(a => a.id));
        
      if (prodError) throw prodError;
      
      // Buscar registros de presença para a data selecionada
      const { data: presencas, error: presencasError } = await supabase
        .from('presencas')
        .select('*')
        .eq('data_aula', dataParaBanco)
        .in('aluno_id', alunos.map(a => a.id));
        
      if (presencasError) throw presencasError;
      
      // Mapear os dados de produtividade para os alunos
      const registrosDiario: RegistroDiario[] = alunos.map(aluno => {
        // Encontrar o registro de produtividade para este aluno
        const prodAluno = produtividade?.find(p => p.aluno_id === aluno.id);
        // Encontrar o registro de presença para este aluno
        const presencaAluno = presencas?.find(p => p.aluno_id === aluno.id);
        
        // Determinar se o aluno estava presente
        const estaPresente = prodAluno?.presente || presencaAluno?.presente || false;
        
        return {
          aluno_id: aluno.id,
          aluno_nome: aluno.nome,
          presente: estaPresente,
          apostila: prodAluno?.apostila || aluno.ultimo_nivel || '',
          pagina: prodAluno?.pagina || (aluno.ultima_pagina ? aluno.ultima_pagina.toString() : ''),
          exercicios: prodAluno?.exercicios ? prodAluno.exercicios.toString() : '',
          erros: prodAluno?.erros ? prodAluno.erros.toString() : '',
          fez_desafio: prodAluno?.fez_desafio || false,
          nivel_desafio: aluno.niveldesafio ? aluno.niveldesafio.toString() : '1'
        };
      });
      
      setRegistros(registrosDiario);
    } catch (error) {
      console.error('Erro ao carregar registros do diário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os registros do diário.",
        variant: "destructive"
      });
    } finally {
      setCarregando(false);
    }
  };

  const handleDiaAnterior = () => {
    setDataAtual(subDays(dataAtual, 1));
  };

  const handleProximoDia = () => {
    setDataAtual(addDays(dataAtual, 1));
  };

  const registrosFiltrados = registros.filter(
    reg => reg.aluno_nome.toLowerCase().includes(filtro.toLowerCase())
  );

  const getPresencaIconClass = (presente: boolean) => {
    return presente 
      ? "text-green-500 dark:text-green-400" 
      : "text-red-500 dark:text-red-400";
  };

  const getDesafioIconClass = (fezDesafio: boolean | undefined) => {
    return fezDesafio 
      ? "text-green-500 dark:text-green-400" 
      : "text-gray-300 dark:text-gray-600";
  };

  return (
    <Card className="border-orange-200 bg-white dark:bg-slate-900 dark:border-orange-800">
      <CardHeader className="border-b border-orange-100 dark:border-orange-900 flex flex-row justify-between items-center">
        <div>
          <CardTitle className="text-azul-500 dark:text-orange-100">
            Diário de Turma - {turma.nome} 
          </CardTitle>
          <div className="text-sm text-azul-400 dark:text-orange-300 mt-1">
            {format(new Date(`2023-01-0${turma.dia_semana === 'domingo' ? 7 : turma.dia_semana === 'sabado' ? 6 : Number(turma.dia_semana)}T00:00:00`), 'EEEE', { locale: ptBR })} às {turma.horario.slice(0, 5)}
          </div>
        </div>
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="text-azul-400 hover:text-azul-500 hover:bg-orange-50 dark:text-orange-300 dark:hover:bg-orange-950"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </CardHeader>
      
      <CardContent className={`${isMobile ? "px-3 py-3" : "px-6 py-6"}`}>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleDiaAnterior}
                className="h-10 w-10 mr-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center border rounded-md px-3 py-2 bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800">
                <Calendar className="h-4 w-4 mr-2 text-azul-500 dark:text-orange-300" />
                <span className="text-azul-500 dark:text-orange-100 font-medium">{dataFormatada}</span>
              </div>
              
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleProximoDia}
                className="h-10 w-10 ml-2"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-azul-400 dark:text-orange-300" />
              <Input 
                placeholder="Buscar aluno..." 
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="pl-9 border-orange-200 dark:border-orange-800 dark:bg-slate-800"
              />
            </div>
          </div>
          
          {carregando ? (
            <div className="text-center py-8 text-azul-500 dark:text-orange-100">
              <p>Carregando registros...</p>
            </div>
          ) : registrosFiltrados.length === 0 ? (
            <div className="text-center py-8 text-azul-500 dark:text-orange-100">
              <p>Nenhum registro encontrado para esta data.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-orange-200 dark:border-orange-800">
                    <TableHead className="text-azul-400 dark:text-orange-300">Nome do Aluno</TableHead>
                    <TableHead className="text-azul-400 dark:text-orange-300 text-center">Presença</TableHead>
                    <TableHead className="text-azul-400 dark:text-orange-300">Apostila</TableHead>
                    <TableHead className="text-azul-400 dark:text-orange-300">Página</TableHead>
                    <TableHead className="text-azul-400 dark:text-orange-300">Exercícios</TableHead>
                    <TableHead className="text-azul-400 dark:text-orange-300">Erros</TableHead>
                    <TableHead className="text-azul-400 dark:text-orange-300 text-center">Desafio</TableHead>
                    <TableHead className="text-azul-400 dark:text-orange-300">Nível Desafio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrosFiltrados.map(registro => (
                    <TableRow key={registro.aluno_id} className="border-orange-200 dark:border-orange-800">
                      <TableCell className="font-medium text-azul-500 dark:text-orange-100">
                        {registro.aluno_nome}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={getPresencaIconClass(registro.presente)}>
                          {registro.presente ? 'P' : 'F'}
                        </span>
                      </TableCell>
                      <TableCell className="text-azul-500 dark:text-orange-100">
                        {registro.apostila}
                      </TableCell>
                      <TableCell className="text-azul-500 dark:text-orange-100">
                        {registro.pagina}
                      </TableCell>
                      <TableCell className="text-azul-500 dark:text-orange-100">
                        {registro.exercicios}
                      </TableCell>
                      <TableCell className="text-azul-500 dark:text-orange-100">
                        {registro.erros}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={getDesafioIconClass(registro.fez_desafio)}>
                          {registro.fez_desafio ? 'Sim' : 'Não'}
                        </span>
                      </TableCell>
                      <TableCell className="text-azul-500 dark:text-orange-100">
                        {registro.fez_desafio ? registro.nivel_desafio : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DiarioTurmaScreen;
