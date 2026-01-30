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
import { Edit, Trash2, RefreshCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import EditRegistroModal from '@/components/turmas/turma-detail/diario/EditRegistroModal';
import DeleteRegistroDialog from '@/components/turmas/turma-detail/diario/DeleteRegistroDialog';

export interface ReposicaoRegistro {
  id: string;
  pessoa_id: string;
  pessoa_nome: string;
  pessoa_foto?: string | null;
  turma_original_id?: string | null;
  turma_original_nome?: string | null;
  origem: 'aluno' | 'funcionario';
  presente: boolean;
  apostila?: string | number | null;
  pagina?: string | number | null;
  exercicios?: string | number | null;
  erros?: string | number | null;
  comentario?: string | null;
  data_aula: string;
}

interface DiarioReposicoesTabelaProps {
  registros: ReposicaoRegistro[];
  carregando: boolean;
  onRefresh: () => void;
  dataSelecionada: Date;
}

const DiarioReposicoesTabela: React.FC<DiarioReposicoesTabelaProps> = ({
  registros,
  carregando,
  onRefresh,
  dataSelecionada
}) => {
  const [editRegistroModalAberto, setEditRegistroModalAberto] = useState(false);
  const [deleteRegistroDialogAberto, setDeleteRegistroDialogAberto] = useState(false);
  const [registroSelecionado, setRegistroSelecionado] = useState<any | null>(null);

  const handleEditarRegistro = (registro: ReposicaoRegistro) => {
    // Adaptar registro para o formato esperado pelo modal
    setRegistroSelecionado({
      ...registro,
      pessoa: {
        id: registro.pessoa_id,
        nome: registro.pessoa_nome,
        foto_url: registro.pessoa_foto,
        origem: registro.origem
      }
    });
    setEditRegistroModalAberto(true);
  };

  const handleExcluirRegistro = (registro: ReposicaoRegistro) => {
    setRegistroSelecionado({
      ...registro,
      pessoa: {
        id: registro.pessoa_id,
        nome: registro.pessoa_nome,
        foto_url: registro.pessoa_foto,
        origem: registro.origem
      }
    });
    setDeleteRegistroDialogAberto(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          className="border-laranja-DEFAULT text-laranja-DEFAULT hover:bg-laranja-DEFAULT/10"
          disabled={carregando}
        >
          <RefreshCcw className="h-4 w-4 mr-1" />
          Atualizar
        </Button>
      </div>

      {carregando ? (
        <div className="text-center py-8">
          <p>Carregando reposições...</p>
        </div>
      ) : registros.length === 0 ? (
        <div className="text-center py-8 border rounded-md bg-slate-50 border-laranja-DEFAULT/20">
          <p className="text-laranja-DEFAULT/80">Nenhuma reposição encontrada para esta data.</p>
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden border-laranja-DEFAULT/20">
          <Table>
            <TableHeader className="bg-laranja-DEFAULT/10">
              <TableRow>
                <TableHead className="text-laranja-DEFAULT">Nome</TableHead>
                <TableHead className="text-laranja-DEFAULT">Turma Original</TableHead>
                <TableHead className="text-laranja-DEFAULT">Status</TableHead>
                <TableHead className="text-laranja-DEFAULT">Apostila</TableHead>
                <TableHead className="text-laranja-DEFAULT">Página</TableHead>
                <TableHead className="text-laranja-DEFAULT">Exercícios</TableHead>
                <TableHead className="text-laranja-DEFAULT">Erros</TableHead>
                <TableHead className="text-laranja-DEFAULT">Comentário</TableHead>
                <TableHead className="text-right text-laranja-DEFAULT">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registros.map((registro) => (
                <TableRow key={registro.id} className="hover:bg-laranja-DEFAULT/5">
                  <TableCell className="font-medium">
                    {registro.pessoa_nome || "Não encontrado"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {registro.turma_original_nome || "Sem turma"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {registro.presente ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100">Presente</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100">Ausente</Badge>
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
                      className="text-laranja-DEFAULT hover:bg-laranja-DEFAULT/10"
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

      {editRegistroModalAberto && registroSelecionado && (
        <EditRegistroModal
          isOpen={editRegistroModalAberto}
          onClose={() => {
            setEditRegistroModalAberto(false);
            setRegistroSelecionado(null);
          }}
          registroSelecionado={registroSelecionado}
          dataSelecionada={dataSelecionada}
          turma={{ id: registroSelecionado.turma_original_id || '', nome: registroSelecionado.turma_original_nome || 'Reposição' } as any}
          onSuccess={onRefresh}
          modo="editar"
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

export default DiarioReposicoesTabela;
