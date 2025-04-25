import React, { useState, useEffect } from 'react';
import { useFuncionarios, Funcionario } from '@/hooks/use-funcionarios';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Pencil, Trash2, UserPlus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const FuncionariosForm = ({
  funcionario,
  onSubmit,
  onCancel,
  isSubmitting
}: {
  funcionario?: Partial<Funcionario>;
  onSubmit: (data: Partial<Funcionario>) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) => {
  const [formData, setFormData] = useState({
    nome: funcionario?.nome || '',
    email: funcionario?.email || '',
    telefone: funcionario?.telefone || '',
    cargo: funcionario?.cargo || '',
    turma_id: funcionario?.turma_id || '',
  });
  const [turmas, setTurmas] = useState<{ id: string; nome: string }[]>([]);

  useEffect(() => {
    const fetchTurmas = async () => {
      const { data, error } = await supabase
        .from('turmas')
        .select('id, nome')
        .order('nome');
        
      if (error) {
        console.error('Erro ao buscar turmas:', error);
        return;
      }
      
      setTurmas(data || []);
    };

    fetchTurmas();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTurmaChange = (value: string) => {
    setFormData(prev => ({ ...prev, turma_id: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="nome">Nome</Label>
        <Input 
          id="nome" 
          name="nome" 
          value={formData.nome} 
          onChange={handleChange} 
          required 
        />
      </div>
      
      <div>
        <Label htmlFor="email">Email</Label>
        <Input 
          id="email" 
          name="email" 
          type="email" 
          value={formData.email} 
          onChange={handleChange} 
        />
      </div>
      
      <div>
        <Label htmlFor="telefone">Telefone</Label>
        <Input 
          id="telefone" 
          name="telefone" 
          value={formData.telefone} 
          onChange={handleChange} 
        />
      </div>
      
      <div>
        <Label htmlFor="cargo">Cargo</Label>
        <Input 
          id="cargo" 
          name="cargo" 
          value={formData.cargo} 
          onChange={handleChange} 
        />
      </div>

      <div>
        <Label htmlFor="turma">Turma</Label>
        <Select onValueChange={handleTurmaChange} value={formData.turma_id}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma turma" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Nenhuma</SelectItem>
            {turmas.map((turma) => (
              <SelectItem key={turma.id} value={turma.id}>
                {turma.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {funcionario?.id ? 'Atualizar' : 'Adicionar'}
        </Button>
      </DialogFooter>
    </form>
  );
};

const FuncionariosList = () => {
  const { 
    funcionarios, 
    loading, 
    error, 
    adicionarFuncionario, 
    atualizarFuncionario, 
    removerFuncionario 
  } = useFuncionarios();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentFuncionario, setCurrentFuncionario] = useState<Partial<Funcionario> | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenDialog = (funcionario?: Funcionario) => {
    setCurrentFuncionario(funcionario);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setCurrentFuncionario(undefined);
  };

  const handleSubmit = async (data: Partial<Funcionario>) => {
    setIsSubmitting(true);
    
    try {
      if (currentFuncionario?.id) {
        await atualizarFuncionario(currentFuncionario.id, data);
      } else {
        await adicionarFuncionario(data as Omit<Funcionario, 'id' | 'created_at' | 'active'>);
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

  if (error) {
    return (
      <div className="w-full text-center py-8 text-red-500">
        <p>Erro ao carregar funcionários: {error}</p>
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
                  <TableHead>Turma</TableHead>
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
              {currentFuncionario?.id ? 'Editar Funcionário' : 'Adicionar Funcionário'}
            </DialogTitle>
          </DialogHeader>
          <FuncionariosForm
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
