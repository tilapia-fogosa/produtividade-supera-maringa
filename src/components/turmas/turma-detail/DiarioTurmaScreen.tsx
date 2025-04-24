
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronLeft, ChevronRight, Search, Check, X, CalendarIcon, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Aluno, Turma } from '@/hooks/use-professor-turmas';
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useProdutividade } from '@/hooks/use-produtividade';
import { ProdutividadeAbaco } from '@/types/produtividade';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";

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
  
  // Estados para modais de edição e exclusão
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [registroAtual, setRegistroAtual] = useState<RegistroProdutividade | null>(null);
  const [alunoAtual, setAlunoAtual] = useState<Aluno | null>(null);
  
  // Estados para o formulário de edição
  const [formData, setFormData] = useState({
    presente: true,
    apostila: '',
    pagina: '',
    exercicios: '',
    erros: '',
    fez_desafio: false,
    comentario: ''
  });
  
  // Hook de produtividade para a operação atual
  const { isLoading, excluirProdutividade, atualizarProdutividade } = 
    useProdutividade(alunoAtual?.id || '');
  
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
  
  const handleEditClick = (registro: RegistroProdutividade, aluno: Aluno) => {
    setAlunoAtual(aluno);
    setRegistroAtual(registro);
    setFormData({
      presente: registro.presente,
      apostila: registro.apostila || '',
      pagina: registro.pagina ? String(registro.pagina) : '',
      exercicios: registro.exercicios ? String(registro.exercicios) : '',
      erros: registro.erros ? String(registro.erros) : '',
      fez_desafio: registro.fez_desafio || false,
      comentario: registro.comentario || ''
    });
    setEditModalOpen(true);
  };
  
  const handleDeleteClick = (registro: RegistroProdutividade, aluno: Aluno) => {
    setAlunoAtual(aluno);
    setRegistroAtual(registro);
    setDeleteDialogOpen(true);
  };
  
  const handleDelete = async () => {
    if (!registroAtual) return;
    
    const resultado = await excluirProdutividade(registroAtual.id);
    
    if (resultado) {
      // Atualizar a lista de registros após exclusão bem-sucedida
      const novosRegistros = { ...registros };
      delete novosRegistros[registroAtual.aluno_id];
      setRegistros(novosRegistros);
    }
    
    setDeleteDialogOpen(false);
  };
  
  const handleUpdate = async () => {
    if (!registroAtual || !alunoAtual) return;
    
    // Preparar dados para atualização
    const dadosAtualizacao = {
      presente: formData.presente,
      apostila: formData.apostila,
      pagina: formData.pagina,
      exercicios: formData.exercicios,
      erros: formData.erros,
      fez_desafio: formData.fez_desafio,
      comentario: formData.comentario,
      data_aula: registroAtual.data_aula
    };
    
    const resultado = await atualizarProdutividade(registroAtual.id, dadosAtualizacao);
    
    if (resultado) {
      // Atualizar a lista de registros após atualização bem-sucedida
      const dataFormatada = dataAtual.toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('produtividade_abaco')
        .select('*')
        .eq('data_aula', dataFormatada)
        .in('aluno_id', alunos.map(a => a.id));
        
      if (!error && data) {
        const registrosMapeados: Record<string, RegistroProdutividade> = {};
        data?.forEach(registro => {
          registrosMapeados[registro.aluno_id] = registro;
        });
        
        setRegistros(registrosMapeados);
      }
    }
    
    setEditModalOpen(false);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      comentario: e.target.value
    });
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
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "min-w-[240px] justify-start text-left font-normal",
                  !dataAtual && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(dataAtual, "dd 'de' MMMM", { locale: ptBR })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dataAtual}
                onSelect={(date) => date && setDataAtual(date)}
                initialFocus
                locale={ptBR}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
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
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alunosFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
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
                    <TableCell>
                      {registro ? (
                        <div className="flex space-x-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleEditClick(registro, aluno)}
                                >
                                  <Edit className="h-4 w-4 text-blue-500" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Editar registro</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleDeleteClick(registro, aluno)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Excluir registro</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Modal de edição */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Registro</DialogTitle>
            <DialogDescription>
              {alunoAtual ? `Editando o registro de ${alunoAtual.nome}` : 'Editando registro'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-4">
              <Label htmlFor="presente">Presente</Label>
              <input
                type="checkbox"
                id="presente"
                name="presente"
                checked={formData.presente}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="apostila">Apostila</Label>
              <Input
                id="apostila"
                name="apostila"
                value={formData.apostila}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="pagina">Página</Label>
              <Input
                id="pagina"
                name="pagina"
                value={formData.pagina}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="exercicios">Exercícios</Label>
              <Input
                id="exercicios"
                name="exercicios"
                type="number"
                value={formData.exercicios}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="erros">Erros</Label>
              <Input
                id="erros"
                name="erros"
                type="number"
                value={formData.erros}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="flex items-center gap-4">
              <Label htmlFor="fez_desafio">Fez Desafio</Label>
              <input
                type="checkbox"
                id="fez_desafio"
                name="fez_desafio"
                checked={formData.fez_desafio}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="comentario">Comentário</Label>
              <textarea
                id="comentario"
                name="comentario"
                className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={formData.comentario}
                onChange={handleTextareaChange}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>Cancelar</Button>
            <Button type="submit" onClick={handleUpdate} disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este registro de produtividade?
              {alunoAtual && <p className="font-medium mt-2">Aluno: {alunoAtual.nome}</p>}
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              {isLoading ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DiarioTurmaScreen;
