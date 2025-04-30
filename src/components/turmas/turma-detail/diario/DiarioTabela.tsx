
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, RefreshCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Turma } from '@/hooks/use-professor-turmas';
import EditRegistroModal from './EditRegistroModal';
import DeleteRegistroDialog from './DeleteRegistroDialog';

interface DiarioTabelaProps {
  registros: any[];
  carregando: boolean;
  onRefresh: () => void;
  dataSelecionada: Date;
  turma: Turma;
}

const DiarioTabela: React.FC<DiarioTabelaProps> = ({
  registros,
  carregando,
  onRefresh,
  dataSelecionada,
  turma
}) => {
  const [editRegistroModalAberto, setEditRegistroModalAberto] = useState(false);
  const [deleteRegistroDialogAberto, setDeleteRegistroDialogAberto] = useState(false);
  const [registroSelecionado, setRegistroSelecionado] = useState<any | null>(null);
  const [modalModo, setModalModo] = useState<'editar' | 'criar'>('criar');

  const handleNovoRegistro = () => {
    setRegistroSelecionado(null);
    setModalModo('criar');
    setEditRegistroModalAberto(true);
  };

  const handleEditarRegistro = (registro: any) => {
    setRegistroSelecionado(registro);
    setModalModo('editar');
    setEditRegistroModalAberto(true);
  };

  const handleExcluirRegistro = (registro: any) => {
    setRegistroSelecionado(registro);
    setDeleteRegistroDialogAberto(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="mr-2"
            disabled={carregando}
          >
            <RefreshCcw className="h-4 w-4 mr-1" />
            Atualizar
          </Button>
        </div>
        
        <Button onClick={handleNovoRegistro} size="sm">
          <PlusCircle className="h-4 w-4 mr-1" />
          Novo Registro
        </Button>
      </div>

      {carregando ? (
        <div className="text-center py-8">
          <p>Carregando registros...</p>
        </div>
      ) : registros.length === 0 ? (
        <div className="text-center py-8 border rounded-md bg-slate-50">
          <p>Nenhum registro encontrado para esta data.</p>
          <Button 
            variant="link" 
            onClick={handleNovoRegistro}
            className="mt-2"
          >
            Adicionar registro
          </Button>
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Apostila</TableHead>
                <TableHead>Página</TableHead>
                <TableHead>Exercícios</TableHead>
                <TableHead>Erros</TableHead>
                <TableHead>Comentário</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registros.map((registro) => (
                <TableRow key={registro.id}>
                  <TableCell className="font-medium">
                    {registro.pessoa?.nome || "Aluno não encontrado"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={registro.origem === 'funcionario' ? "secondary" : "default"}>
                      {registro.origem === 'funcionario' ? 'Funcionário' : 'Aluno'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {registro.presente ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100">Presente</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-100">Ausente</Badge>
                    )}
                  </TableCell>
                  <TableCell>{registro.apostila || "-"}</TableCell>
                  <TableCell>{registro.pagina || "-"}</TableCell>
                  <TableCell>{registro.exercicios || "-"}</TableCell>
                  <TableCell>{registro.erros || "-"}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {registro.comentario || "-"}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleEditarRegistro(registro)}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleExcluirRegistro(registro)}
                      className="text-red-600 hover:text-red-800 hover:bg-red-100"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Excluir</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Corrigi aqui passando as props corretas para os modais */}
      {editRegistroModalAberto && (
        <EditRegistroModal
          isOpen={editRegistroModalAberto}
          onClose={() => {
            setEditRegistroModalAberto(false);
            setRegistroSelecionado(null);
          }}
          registroSelecionado={registroSelecionado}
          dataSelecionada={dataSelecionada}
          turma={turma}
          onSuccess={onRefresh}
          modo={modalModo}
        />
      )}

      {deleteRegistroDialogAberto && registroSelecionado && (
        <DeleteRegistroDialog
          isOpen={deleteRegistroDialogAberto}
          onClose={() => {
            setDeleteRegistroDialogAberto(false);
            setRegistroSelecionado(null);
          }}
          registroSelecionado={registroSelecionado}
          onSuccess={onRefresh}
        />
      )}
    </div>
  );
};

export default DiarioTabela;
