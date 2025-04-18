
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { Check, X } from "lucide-react";

// Definindo interfaces
interface Turma {
  id: string;
  nome: string;
  dia_semana: string;
  horario: string;
  professor_id: string;
}

interface Aluno {
  id: string;
  nome: string;
  turma_id: string;
  codigo?: string | null;
  niveldesafio?: number | null;
}

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
  nivel_desafio?: number;
}

const DiarioTurma = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // Estados
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [turmaSelecionada, setTurmaSelecionada] = useState<string>("");
  const [data, setData] = useState<Date>(new Date());
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [registros, setRegistros] = useState<Record<string, RegistroProdutividade>>({});
  const [carregando, setCarregando] = useState<boolean>(false);
  
  // Buscar lista de turmas
  useEffect(() => {
    const fetchTurmas = async () => {
      try {
        setCarregando(true);
        const { data, error } = await supabase
          .from('turmas')
          .select('*')
          .order('nome');
          
        if (error) throw error;
        
        setTurmas(data || []);
        
        // Se tiver turmas, seleciona a primeira por padrão
        if (data && data.length > 0) {
          setTurmaSelecionada(data[0].id);
        }
      } catch (error) {
        console.error('Erro ao buscar turmas:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar a lista de turmas.",
          variant: "destructive"
        });
      } finally {
        setCarregando(false);
      }
    };
    
    fetchTurmas();
  }, []);
  
  // Buscar alunos quando a turma for selecionada
  useEffect(() => {
    const fetchAlunos = async () => {
      if (!turmaSelecionada) return;
      
      try {
        setCarregando(true);
        const { data, error } = await supabase
          .from('alunos')
          .select('*')
          .eq('turma_id', turmaSelecionada);
          
        if (error) throw error;
        
        setAlunos(data || []);
      } catch (error) {
        console.error('Erro ao buscar alunos:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar a lista de alunos.",
          variant: "destructive"
        });
      } finally {
        setCarregando(false);
      }
    };
    
    fetchAlunos();
  }, [turmaSelecionada]);
  
  // Buscar registros de produtividade quando a data ou a turma mudar
  useEffect(() => {
    const fetchRegistros = async () => {
      if (!turmaSelecionada || !alunos.length) return;
      
      try {
        setCarregando(true);
        const dataFormatada = format(data, 'yyyy-MM-dd');
        
        const { data: registrosData, error } = await supabase
          .from('produtividade_abaco')
          .select('*')
          .eq('data_aula', dataFormatada)
          .in('aluno_id', alunos.map(a => a.id));
          
        if (error) throw error;
        
        // Mapear os registros pelo ID do aluno para fácil acesso
        const registrosMapeados: Record<string, RegistroProdutividade> = {};
        registrosData?.forEach(registro => {
          registrosMapeados[registro.aluno_id] = registro;
        });
        
        setRegistros(registrosMapeados);
      } catch (error) {
        console.error('Erro ao buscar registros:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os registros de produtividade.",
          variant: "destructive"
        });
      } finally {
        setCarregando(false);
      }
    };
    
    fetchRegistros();
  }, [turmaSelecionada, alunos, data]);
  
  const nomeTurmaSelecionada = turmas.find(t => t.id === turmaSelecionada)?.nome || "";
  
  return (
    <div className="container mx-auto py-4 px-2 text-azul-500">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/')}
          className="mr-2 text-azul-400 hover:text-azul-500 hover:bg-orange-50"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar
        </Button>
        <h1 className="text-xl font-bold">Diário de Turma</h1>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Turma</label>
          <Select value={turmaSelecionada} onValueChange={setTurmaSelecionada}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione uma turma" />
            </SelectTrigger>
            <SelectContent>
              {turmas.map((turma) => (
                <SelectItem key={turma.id} value={turma.id}>{turma.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Data</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !data && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {data ? format(data, "dd/MM/yyyy") : <span>Escolha uma data</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={data}
                onSelect={(date) => date && setData(date)}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      {turmaSelecionada && (
        <div className="bg-white border border-orange-100 rounded-md p-4 mb-4">
          <h2 className="text-lg font-medium mb-2">{nomeTurmaSelecionada}</h2>
          <p className="text-sm text-azul-400">
            Data: {format(data, "dd/MM/yyyy")}
          </p>
        </div>
      )}
      
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
            {carregando ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : alunos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  {turmaSelecionada 
                    ? "Não há alunos cadastrados nesta turma." 
                    : "Selecione uma turma para ver os alunos."}
                </TableCell>
              </TableRow>
            ) : (
              alunos.map((aluno) => {
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
    </div>
  );
};

export default DiarioTurma;
