
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Brain } from "lucide-react";
import { useAlunoDevolutiva } from '@/hooks/use-aluno-devolutiva';
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

const DevolutivaAluno = () => {
  const { alunoId } = useParams<{ alunoId: string }>();
  const navigate = useNavigate();
  const [selectedMes, setSelectedMes] = useState<string>('');
  const { data: aluno, loading, error, mesesDisponiveis } = useAlunoDevolutiva(alunoId || '', selectedMes);
  const [textoDevolutiva, setTextoDevolutiva] = useState(aluno?.texto_devolutiva || '');

  const handleVoltar = () => {
    navigate(-1);
  };

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

  if (loading) {
    return (
      <div className="container mx-auto py-4 px-2">
        <p className="text-center">Carregando dados do aluno...</p>
      </div>
    );
  }

  if (error || !aluno) {
    return (
      <div className="container mx-auto py-4 px-2">
        <p className="text-center text-red-500">
          {error || 'Erro ao carregar dados do aluno'}
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 px-2 space-y-6">
      <div className="flex items-center justify-between">
        <Button 
          onClick={handleVoltar} 
          variant="outline" 
          className="text-azul-500 border-orange-200"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>

        <Select value={selectedMes} onValueChange={setSelectedMes}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Selecionar mês" />
          </SelectTrigger>
          <SelectContent>
            {mesesDisponiveis.map((mes) => (
              <SelectItem key={mes} value={mes}>
                {new Date(mes).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="text-center">
        <h1 className="text-2xl font-bold text-azul-500">
          Desempenho do Aluno: {aluno.nome}
        </h1>
      </div>

      <div className="bg-white p-4 rounded-lg border border-orange-200 text-center">
        <div className="flex items-center justify-center gap-2">
          <Brain className="h-6 w-6 text-orange-500" />
          <span className="text-xl font-semibold text-azul-500">
            {aluno.desafios_feitos} Desafios Realizados
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Tabela Ábaco */}
        <div className="bg-white rounded-lg border border-orange-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-left">Data</TableHead>
                <TableHead>Livro</TableHead>
                <TableHead>Exercícios</TableHead>
                <TableHead>Erros</TableHead>
                <TableHead>% Acerto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aluno.desempenho_abaco.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{new Date(item.data).toLocaleDateString('pt-BR')}</TableCell>
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
            </TableBody>
          </Table>
        </div>

        {/* Tabela Abrindo Horizontes */}
        <div className="bg-white rounded-lg border border-orange-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-left">Data</TableHead>
                <TableHead>Livro</TableHead>
                <TableHead>Exercícios</TableHead>
                <TableHead>Erros</TableHead>
                <TableHead>% Acerto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aluno.desempenho_ah.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{new Date(item.data).toLocaleDateString('pt-BR')}</TableCell>
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
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-azul-500">
          Informativo Oficial - {new Date().toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
        </h2>
        <div className="bg-gray-50 p-4 rounded-lg border border-orange-200">
          <p>
            Prezados pais e/ou responsáveis, 
            Este é o relatório mensal do desempenho do(a) aluno(a) em nossas atividades.
            Os dados acima refletem o progresso nas atividades de Ábaco e Abrindo Horizontes.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-azul-500">Informativo Personalizado</h2>
        <Textarea
          placeholder="Digite aqui sua mensagem para o aluno ou responsável..."
          value={textoDevolutiva}
          onChange={(e) => setTextoDevolutiva(e.target.value)}
          className="min-h-[200px]"
        />
        <Button onClick={handleSalvarDevolutiva} className="w-full">
          Salvar Informativo
        </Button>
      </div>

      {textoDevolutiva && (
        <div className="bg-white p-4 rounded-lg border border-orange-200">
          <h3 className="font-semibold mb-2">Informativo Atual:</h3>
          <p className="whitespace-pre-wrap">{textoDevolutiva}</p>
        </div>
      )}
    </div>
  );
};

export default DevolutivaAluno;
