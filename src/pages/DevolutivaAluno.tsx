
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronDown, Brain } from "lucide-react";
import { useAlunoDevolutiva, PeriodoFiltro } from '@/hooks/use-aluno-devolutiva';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const PERIODO_OPTIONS: { value: PeriodoFiltro; label: string }[] = [
  { value: 'mes_atual', label: 'Mês atual' },
  { value: 'mes_passado', label: 'Mês passado' },
  { value: 'trimestre', label: 'Último trimestre' },
  { value: 'quadrimestre', label: 'Último quadrimestre' },
  { value: 'semestre', label: 'Último semestre' },
  { value: 'ano', label: 'Último ano' },
];

const DevolutivaAluno = () => {
  const { alunoId } = useParams<{ alunoId: string }>();
  const navigate = useNavigate();
  const [selectedPeriodo, setSelectedPeriodo] = useState<PeriodoFiltro>('mes_atual');
  const { data: aluno, loading, error } = useAlunoDevolutiva(alunoId || '', selectedPeriodo);
  const [textoDevolutiva, setTextoDevolutiva] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  

  // Atualizar texto da devolutiva quando os dados carregarem
  React.useEffect(() => {
    if (aluno?.texto_devolutiva) {
      setTextoDevolutiva(aluno.texto_devolutiva);
    }
  }, [aluno?.texto_devolutiva]);

  const handleSalvarDevolutiva = async () => {
    if (!alunoId) return;

    try {
      const { error } = await supabase
        .from('alunos')
        .update({ texto_devolutiva: textoDevolutiva })
        .eq('id', alunoId);

      if (error) throw error;

      toast({
        title: "Devolutiva salva",
        description: "O texto da devolutiva foi atualizado com sucesso.",
      });
    } catch (err) {
      console.error('Erro ao salvar devolutiva:', err);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a devolutiva.",
        variant: "destructive",
      });
    }
  };

  const getPrimeiroNome = (nomeCompleto: string) => {
    const nomeSplit = nomeCompleto.trim().split(' ');
    return nomeSplit[0];
  };

  const handleVoltar = () => {
    navigate(-1);
  };


  const formatarTextoInformativo = (texto: string | null, nomeAluno: string) => {
    const primeiroNome = getPrimeiroNome(nomeAluno);
    return texto 
      ? `Querido(a) ${primeiroNome},\n\n${texto}` 
      : `Querido(a) ${primeiroNome},\n\n`;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-4 px-2 bg-background dark:bg-background">
        <p className="text-center">Carregando dados do aluno...</p>
      </div>
    );
  }

  if (error || !aluno) {
    return (
      <div className="container mx-auto py-4 px-2 bg-background dark:bg-background">
        <p className="text-center text-red-500">
          {error || 'Erro ao carregar dados do aluno'}
        </p>
        <div className="mt-4 text-center">
          <Button onClick={handleVoltar} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-2 px-2 space-y-3 bg-background dark:bg-background min-h-screen print:py-0 print:pt-2">
      <div className="flex items-center justify-between print:hidden">
        <Button 
          onClick={handleVoltar} 
          variant="outline" 
          className="text-azul-500 dark:text-orange-100 border-orange-200"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>

        <Select value={selectedPeriodo} onValueChange={(value: PeriodoFiltro) => setSelectedPeriodo(value)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Selecionar período" />
          </SelectTrigger>
          <SelectContent>
            {PERIODO_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="text-center mb-2 print:mb-1 print:mt-0">
        <h1 className="text-xl font-bold text-azul-500 print:text-lg print:mb-1">
          Desempenho do Aluno: {aluno.nome}
        </h1>
      </div>

      {/* Informativo Personalizado - escondido na impressão */}
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="w-full space-y-2 print:hidden"
      >
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            className="flex items-center justify-between w-full"
          >
            <span>Informativo Personalizado</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${
                isOpen ? "transform rotate-180" : ""
              }`}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4">
          <Textarea
            placeholder="Digite aqui sua mensagem para o aluno ou responsável..."
            value={textoDevolutiva}
            onChange={(e) => setTextoDevolutiva(e.target.value)}
            className="min-h-[200px]"
          />
          <Button onClick={handleSalvarDevolutiva} className="w-full">
            Salvar Informativo
          </Button>

          {textoDevolutiva && (
            <div className="bg-white p-4 rounded-lg border border-orange-200">
              <h3 className="font-semibold mb-2">Informativo Atual:</h3>
              <p className="whitespace-pre-wrap">{textoDevolutiva}</p>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>


      <div className="bg-white p-2 rounded-lg border border-orange-200 text-center">
        <div className="flex items-center justify-center gap-2">
          <Brain className="h-4 w-4 text-orange-500" />
          <span className="text-lg font-semibold text-azul-500">
            {aluno.desafios_feitos} Desafios Realizados
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {/* Tabela Ábaco */}
        <div className="bg-white rounded-lg border border-orange-200 overflow-hidden">
          <div className="bg-gray-50 px-4 py-2">
            <h3 className="font-semibold text-azul-500">Desempenho no Ábaco</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-left">Mês</TableHead>
                <TableHead>Livro</TableHead>
                <TableHead>Exercícios</TableHead>
                <TableHead>Erros</TableHead>
                <TableHead>% Acerto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aluno.desempenho_abaco.length > 0 ? (
                <>
                  {aluno.desempenho_abaco.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.mes}</TableCell>
                      <TableCell>{item.livro}</TableCell>
                      <TableCell>{item.exercicios}</TableCell>
                      <TableCell>{item.erros}</TableCell>
                      <TableCell>{item.percentual_acerto.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold bg-gray-50">
                    <TableCell colSpan={2}>Total</TableCell>
                    <TableCell>{aluno.abaco_total_exercicios}</TableCell>
                    <TableCell>{aluno.abaco_total_erros}</TableCell>
                    <TableCell>{aluno.abaco_percentual_total.toFixed(1)}%</TableCell>
                  </TableRow>
                </>
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500">
                    Nenhum registro encontrado no período selecionado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Tabela AH */}
        <div className="bg-white rounded-lg border border-orange-200 overflow-hidden">
          <div className="bg-gray-50 px-4 py-2">
            <h3 className="font-semibold text-azul-500">Desempenho no Abrindo Horizontes</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-left">Mês</TableHead>
                <TableHead>Livro</TableHead>
                <TableHead>Exercícios</TableHead>
                <TableHead>Erros</TableHead>
                <TableHead>% Acerto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aluno.desempenho_ah.length > 0 ? (
                <>
                  {aluno.desempenho_ah.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.mes}</TableCell>
                      <TableCell>{item.livro}</TableCell>
                      <TableCell>{item.exercicios}</TableCell>
                      <TableCell>{item.erros}</TableCell>
                      <TableCell>{item.percentual_acerto.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold bg-gray-50">
                    <TableCell colSpan={2}>Total</TableCell>
                    <TableCell>{aluno.ah_total_exercicios}</TableCell>
                    <TableCell>{aluno.ah_total_erros}</TableCell>
                    <TableCell>{aluno.ah_percentual_total.toFixed(1)}%</TableCell>
                  </TableRow>
                </>
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500">
                    Nenhum registro encontrado no período selecionado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-azul-500">
          Informativo Oficial - {new Date().toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
        </h2>
        <div className="bg-gray-50 p-4 rounded-lg border border-orange-200">
          {textoDevolutiva ? (
            <p className="whitespace-pre-wrap">
              {formatarTextoInformativo(textoDevolutiva, aluno.nome)}
            </p>
          ) : (
            <p className="whitespace-pre-wrap">
              {formatarTextoInformativo(aluno?.texto_geral, aluno.nome)}
            </p>
          )}
        </div>
      </div>

      {/* Rodapé com logo da São Rafael */}
      <footer className="mt-8 pt-6 border-t border-orange-200">
        <div className="flex justify-center items-center">
          <img 
            src="/lovable-uploads/5407bd2f-e771-477d-ad1c-dd4ec2e14a8d.png" 
            alt="Projeto São Rafael"
            className="h-16 w-auto opacity-80"
          />
        </div>
      </footer>
    </div>
  );
};

export default DevolutivaAluno;
