
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronLeft, ChevronRight, Search, Check, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Aluno, Turma } from '@/hooks/use-professor-turmas';
import { Input } from "@/components/ui/input";
import { formatDateBr } from "@/lib/utils";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";

// Definindo o tipo para os registros de produtividade
interface RegistroProdutividade {
  id: string;
  aluno_id: string;
  data_aula: string;
  presente: boolean;
  is_reposicao: boolean;
  apostila: string;
  pagina: string;
  exercicios: number;
  erros: number;
  fez_desafio: boolean;
  comentario: string;
  created_at: string;
  updated_at: string;
  nivel_desafio?: number; // Adicionando como opcional
}

interface DiarioTurmaScreenProps {
  turma: Turma;
  onBack: () => void;
  alunos?: Aluno[];
}

const DiarioTurmaScreen: React.FC<DiarioTurmaScreenProps> = ({ 
  turma,
  onBack,
  alunos = [] 
}) => {
  const isMobile = useIsMobile();
  
  const [dataAtual, setDataAtual] = useState<Date>(new Date());
  const [filtroAluno, setFiltroAluno] = useState<string>("");
  const [registros, setRegistros] = useState<Record<string, RegistroProdutividade>>({});
  const [carregando, setCarregando] = useState<boolean>(false);
  
  // Buscar produtividade dos alunos para a data atual
  useEffect(() => {
    const buscarProdutividade = async () => {
      setCarregando(true);
      try {
        const dataFormatada = dataAtual.toISOString().split('T')[0];
        
        const { data, error } = await supabase
          .from('produtividade_abaco')
          .select('*')
          .eq('data_aula', dataFormatada)
          .in('aluno_id', alunos.map(a => a.id));
          
        if (error) {
          throw error;
        }
        
        // Mapear os registros pelo ID do aluno para fácil acesso
        const registrosMapeados: Record<string, RegistroProdutividade> = {};
        data?.forEach(registro => {
          registrosMapeados[registro.aluno_id] = registro;
        });
        
        setRegistros(registrosMapeados);
      } catch (error) {
        console.error('Erro ao buscar registros de produtividade:', error);
      } finally {
        setCarregando(false);
      }
    };
    
    if (alunos.length > 0) {
      buscarProdutividade();
    }
  }, [dataAtual, alunos]);
  
  const alunosFiltrados = alunos.filter(aluno => 
    aluno.nome.toLowerCase().includes(filtroAluno.toLowerCase())
  );
  
  const mudarData = (dias: number) => {
    const novaData = new Date(dataAtual);
    novaData.setDate(novaData.getDate() + dias);
    setDataAtual(novaData);
  };
  
  return (
    <>
      <div className="border-b border-orange-100 pb-2 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="mr-2 text-azul-400 hover:text-azul-500 hover:bg-orange-50"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar
            </Button>
            
            <div>
              <h2 className={`font-bold text-azul-500 ${isMobile ? "text-lg" : "text-xl"}`}>
                {turma.nome}
              </h2>
              <p className="text-sm text-azul-400">Diário de Turma</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-2">
        <div className="flex items-center">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => mudarData(-1)}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="mx-2 min-w-[120px] text-center">
            <p className="font-medium">{formatDateBr(dataAtual)}</p>
          </div>
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => mudarData(1)}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar aluno..."
            className="pl-8"
            value={filtroAluno}
            onChange={(e) => setFiltroAluno(e.target.value)}
          />
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aluno</TableHead>
              <TableHead>Presença</TableHead>
              <TableHead>Apostila</TableHead>
              <TableHead>Página</TableHead>
              <TableHead>Exercícios</TableHead>
              <TableHead>Erros</TableHead>
              <TableHead>Desafio</TableHead>
              <TableHead>Nível</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alunosFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  {carregando ? "Carregando..." : "Nenhum aluno encontrado"}
                </TableCell>
              </TableRow>
            ) : (
              alunosFiltrados.map((aluno) => {
                const registro = registros[aluno.id];
                return (
                  <TableRow key={aluno.id}>
                    <TableCell className="font-medium">{aluno.nome}</TableCell>
                    <TableCell>
                      {registro ? (
                        registro.presente ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Check className="h-4 w-4 text-green-500" />
                              </TooltipTrigger>
                              <TooltipContent>Presente</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <X className="h-4 w-4 text-red-500" />
                              </TooltipTrigger>
                              <TooltipContent>Ausente</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )
                      ) : ("-")}
                    </TableCell>
                    <TableCell>{registro?.apostila || "-"}</TableCell>
                    <TableCell>{registro?.pagina || "-"}</TableCell>
                    <TableCell>{registro?.exercicios || "-"}</TableCell>
                    <TableCell>{registro?.erros || "-"}</TableCell>
                    <TableCell>
                      {registro ? (
                        registro.fez_desafio ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Check className="h-4 w-4 text-green-500" />
                              </TooltipTrigger>
                              <TooltipContent>Fez o desafio</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <X className="h-4 w-4 text-red-500" />
                              </TooltipTrigger>
                              <TooltipContent>Não fez desafio</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )
                      ) : ("-")}
                    </TableCell>
                    <TableCell>{aluno.niveldesafio || "-"}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
};

export default DiarioTurmaScreen;
