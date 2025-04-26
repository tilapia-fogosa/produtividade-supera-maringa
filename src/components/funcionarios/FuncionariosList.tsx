
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

  const handleOpenDialog = (funcionario?: any) => {
    setCurrentFuncionario(funcionario);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setCurrentFuncionario(null);
  };

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      if (currentFuncionario?.id) {
        await atualizarFuncionario(currentFuncionario.id, data);
      } else {
        await adicionarFuncionario(data);
      }
      handleCloseDialog();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este funcionário?')) {
      await removerFuncionario(id);
    }
  };

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
        <CardTitle>Funcionários</CardTitle>
        <Button onClick={() => handleOpenDialog()}>
          <UserPlus className="h-4 w-4 mr-2" />
          Adicionar Funcionário
        </Button>
      </CardHeader>
      <CardContent>
        {funcionarios.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            Nenhum funcionário cadastrado. Clique em "Adicionar Funcionário" para começar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {funcionarios.map((funcionario) => (
                  <TableRow key={funcionario.id}>
                    <TableCell className="font-medium">{funcionario.nome}</TableCell>
                    <TableCell>{funcionario.email || '-'}</TableCell>
                    <TableCell>{funcionario.telefone || '-'}</TableCell>
                    <TableCell>{funcionario.cargo || '-'}</TableCell>
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
              {currentFuncionario ? 'Editar Funcionário' : 'Adicionar Funcionário'}
            </DialogTitle>
          </DialogHeader>
          <FuncionarioForm
            funcionario={currentFuncionario}
            onSubmit={handleSubmit}
            onCancel={handleCloseDialog}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default FuncionariosList;
