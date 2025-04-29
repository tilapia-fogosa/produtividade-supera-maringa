
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarIcon, Search } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Aluno, Turma } from '@/hooks/use-professor-turmas';
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useProdutividade } from '@/hooks/use-produtividade';
import DiarioTabela, { RegistroProdutividade } from './diario/DiarioTabela';
import EditRegistroModal from './diario/EditRegistroModal';
import DeleteRegistroDialog from './diario/DeleteRegistroDialog';

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
      id: registroAtual.id,
      aluno_id: alunoAtual.id,
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
      
      <DiarioTabela 
        alunosFiltrados={alunosFiltrados}
        registros={registros}
        carregando={carregando}
        onEditClick={handleEditClick}
        onDeleteClick={handleDeleteClick}
      />
      
      {/* Modal de edição */}
      <EditRegistroModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleUpdate}
        formData={formData}
        handleInputChange={handleInputChange}
        handleTextareaChange={handleTextareaChange}
        isLoading={isLoading}
        alunoNome={alunoAtual?.nome}
      />
      
      {/* Diálogo de confirmação de exclusão */}
      <DeleteRegistroDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        isLoading={isLoading}
        aluno={alunoAtual}
      />
    </>
  );
};

export default DiarioTurmaScreen;
