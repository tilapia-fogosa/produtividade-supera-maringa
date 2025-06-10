
import React, { useState } from 'react';
import { useFuncionarios } from '@/hooks/use-funcionarios';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2, UserPlus, Loader2 } from "lucide-react";
import { FuncionarioForm } from './FuncionarioForm';

const FuncionariosList = () => {
  const { funcionarios, loading, adicionarFuncionario, atualizarFuncionario, removerFuncionario } = useFuncionarios();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentFuncionario, setCurrentFuncionario] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filtro, setFiltro] = useState('todos');

  const handleOpenDialog = (funcionario?: any) => {
    setCurrentFuncionario(funcionario);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setCurrentFuncionario(null);
  };

  const handleSubmit = async (data: any) => {
    console.log("FuncionariosList recebeu dados para submit:", data);
    
    // Validar turma_id para garantir que esteja correto antes de enviar
    const dadosValidados = {
      ...data,
      // Garantir que turma_id seja null (não string vazia) quando sem turma
      turma_id: data.turma_id === "" ? null : data.turma_id
    };
    
    console.log("Dados validados para envio:", dadosValidados);
    
    setIsSubmitting(true);
    try {
      if (currentFuncionario?.id) {
        await atualizarFuncionario(currentFuncionario.id, dadosValidados);
      } else {
        const result = await adicionarFuncionario(dadosValidados);
        console.log("Resultado da adição:", result);
      }
      handleCloseDialog();
    } catch (error) {
      console.error("Erro ao processar funcionário:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este funcionário?')) {
      await removerFuncionario(id);
    }
  };

  const funcionariosFiltrados = funcionarios.filter(funcionario => {
    if (filtro === 'todos') return true;
    if (filtro === 'estagiarios') return funcionario.cargo?.toLowerCase() === 'estagiario';
    return funcionario.cargo?.toLowerCase() !== 'estagiario';
  });

  if (loading) {
    return (
      <div className="w-full flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-azul-500" />
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Funcionários e Estagiários</CardTitle>
          <div className="mt-2 flex space-x-2">
            <Button 
              variant={filtro === 'todos' ? "default" : "outline"} 
              size="sm" 
              onClick={() => setFiltro('todos')}
            >
              Todos
            </Button>
            <Button 
              variant={filtro === 'funcionarios' ? "default" : "outline"} 
              size="sm" 
              onClick={() => setFiltro('funcionarios')}
            >
              Funcionários
            </Button>
            <Button 
              variant={filtro === 'estagiarios' ? "default" : "outline"} 
              size="sm" 
              onClick={() => setFiltro('estagiarios')}
            >
              Estagiários
            </Button>
          </div>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <UserPlus className="h-4 w-4 mr-2" />
          Adicionar {filtro === 'estagiarios' ? 'Estagiário' : 'Funcionário'}
        </Button>
      </CardHeader>
      <CardContent>
        {funcionariosFiltrados.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            {filtro === 'estagiarios' 
              ? 'Nenhum estagiário cadastrado.'
              : filtro === 'funcionarios'
                ? 'Nenhum funcionário cadastrado.'
                : 'Nenhum funcionário ou estagiário cadastrado.'}
            {' '}Clique em "Adicionar {filtro === 'estagiarios' ? 'Estagiário' : 'Funcionário'}" para começar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {funcionariosFiltrados.map((funcionario) => (
                  <TableRow key={funcionario.id}>
                    <TableCell className="font-medium">{funcionario.nome}</TableCell>
                    <TableCell>{funcionario.cargo || '-'}</TableCell>
                    <TableCell>{funcionario.turma?.nome || '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(funcionario)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDelete(funcionario.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentFuncionario 
                ? `Editar ${currentFuncionario.cargo?.toLowerCase() === 'estagiário' ? 'Estagiário' : 'Funcionário'}`
                : `Adicionar ${filtro === 'estagiarios' ? 'Estagiário' : 'Funcionário'}`}
            </DialogTitle>
          </DialogHeader>
          <FuncionarioForm
            funcionario={currentFuncionario}
            onSubmit={handleSubmit}
            onCancel={handleCloseDialog}
            isSubmitting={isSubmitting}
            tipoSelecionado={filtro === 'estagiarios' ? 'Estagiário' : ''}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default FuncionariosList;
