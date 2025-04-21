
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AlunoDevolutiva } from '@/hooks/use-devolutivas';
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const DevolutivaTurma = () => {
  const { turmaId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [turma, setTurma] = useState<{ id: string; nome: string } | null>(null);
  const [alunos, setAlunos] = useState<AlunoDevolutiva[]>([]);
  const [textoAlunos, setTextoAlunos] = useState<Record<string, string>>({});

  useEffect(() => {
    const carregarDados = async () => {
      setLoading(true);
      try {
        // Buscar informações da turma
        const { data: turmaData, error: turmaError } = await supabase
          .from('turmas')
          .select('id, nome')
          .eq('id', turmaId)
          .single();

        if (turmaError) {
          console.error('Erro ao buscar turma:', turmaError);
          return;
        }

        setTurma(turmaData);

        // Buscar alunos da turma
        const { data: alunosData, error: alunosError } = await supabase
          .from('alunos')
          .select('id, nome, texto_devolutiva')
          .eq('turma_id', turmaId)
          .eq('active', true);

        if (alunosError) {
          console.error('Erro ao buscar alunos:', alunosError);
          return;
        }

        setAlunos(alunosData || []);

        // Inicializar o estado de textos dos alunos
        const textos: Record<string, string> = {};
        alunosData?.forEach(aluno => {
          textos[aluno.id] = aluno.texto_devolutiva || '';
        });
        setTextoAlunos(textos);

      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    if (turmaId) {
      carregarDados();
    }
  }, [turmaId]);

  const handleVoltar = () => {
    navigate('/devolutivas/turmas');
  };

  const handleSalvarTextoAluno = async (alunoId: string) => {
    setSalvando(true);
    try {
      await supabase
        .from('alunos')
        .update({ texto_devolutiva: textoAlunos[alunoId] })
        .eq('id', alunoId);
      
      toast.success('Texto do aluno salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar texto do aluno:', error);
      toast.error('Erro ao salvar texto do aluno');
    } finally {
      setSalvando(false);
    }
  };

  const handleTextoAlunoChange = (alunoId: string, texto: string) => {
    setTextoAlunos(prev => ({
      ...prev,
      [alunoId]: texto
    }));
  };

  if (loading) {
    return (
      <div className="text-center p-6">
        <p>Carregando dados da turma...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 px-2">
      <Button 
        onClick={handleVoltar} 
        variant="outline" 
        className="mb-4 text-azul-500 border-orange-200"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>
      
      <h1 className="text-xl font-bold mb-4 text-azul-500">
        Devolutivas - {turma?.nome}
      </h1>
      
      <div className="space-y-4">
        {alunos.map((aluno) => (
          <Card key={aluno.id} className="border-orange-200 bg-white">
            <CardHeader className="border-b border-orange-100 py-3">
              <CardTitle className="text-md text-azul-500">{aluno.nome}</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <Textarea
                value={textoAlunos[aluno.id] || ''}
                onChange={(e) => handleTextoAlunoChange(aluno.id, e.target.value)}
                placeholder="Digite a devolutiva individual aqui..."
                className="min-h-[100px] mb-4"
              />
              <Button 
                onClick={() => handleSalvarTextoAluno(aluno.id)}
                disabled={salvando}
                className="bg-azul-500 hover:bg-azul-600"
              >
                {salvando ? 'Salvando...' : 'Salvar'}
              </Button>
            </CardContent>
          </Card>
        ))}
        
        {alunos.length === 0 && (
          <p className="text-center text-gray-500 p-4">
            Nenhum aluno encontrado nesta turma.
          </p>
        )}
      </div>
    </div>
  );
};

export default DevolutivaTurma;
