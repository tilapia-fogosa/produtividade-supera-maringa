
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { useIsMobile } from "@/hooks/use-mobile";
import ProdutividadeModal from './ProdutividadeModal';

interface Turma {
  id: string;
  nome: string;
  dia_semana: 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado' | 'domingo';
  horario: string;
}

interface Aluno {
  id: string;
  nome: string;
  turma_id: string;
  codigo?: string | null;
  telefone?: string | null;
  email?: string | null;
  curso?: string | null;
  matricula?: string | null;
  idade?: number | null;
  ultimo_nivel?: string | null;
  dias_apostila?: number | null;
  dias_supera?: number | null;
  vencimento_contrato?: string | null;
}

interface TurmaDetailProps {
  turma: Turma;
  alunos: Aluno[];
  onVoltar: () => void;
  onShowAlunoDetails: (aluno: Aluno) => void;
  onRegistrarPresenca: (alunoId: string) => void;
}

const TurmaDetail: React.FC<TurmaDetailProps> = ({ 
  turma, 
  alunos, 
  onVoltar, 
  onShowAlunoDetails, 
  onRegistrarPresenca 
}) => {
  const isMobile = useIsMobile();
  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  
  // Add the "Reposição de aula" entry with a special ID
  const todosAlunos = [
    ...alunos,
    {
      id: "reposicao",
      nome: "Reposição de aula",
      turma_id: turma.id
    }
  ];

  const handleClickRegistrarPresenca = (aluno: Aluno) => {
    setAlunoSelecionado(aluno);
    setModalAberto(true);
  };

  const handleFecharModal = () => {
    setModalAberto(false);
    setAlunoSelecionado(null);
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onVoltar}
          className="px-2 py-1 h-8"
        >
          <ArrowLeft className="mr-1 h-3.5 w-3.5" /> 
          <span className={isMobile ? "text-xs" : ""}>Voltar</span>
        </Button>
        <div className={`font-medium ${isMobile ? "text-sm ml-1" : "text-lg"}`}>
          {turma.nome}
        </div>
      </div>

      {alunos.length === 0 ? (
        <div className="text-center py-3">
          <p className={isMobile ? "text-sm" : ""}>Não há alunos cadastrados nesta turma.</p>
        </div>
      ) : (
        <div className={isMobile ? "-mx-2" : ""}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={isMobile ? "px-2 py-2 text-xs" : ""}>Nome</TableHead>
                <TableHead className={`hidden md:table-cell ${isMobile ? "px-2 py-2 text-xs" : ""}`}>Código</TableHead>
                <TableHead className={`hidden md:table-cell ${isMobile ? "px-2 py-2 text-xs" : ""}`}>Último Nível</TableHead>
                <TableHead className={`w-[100px] ${isMobile ? "px-2 py-2 text-xs" : ""}`}>Produtividade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {todosAlunos.map((aluno, index) => (
                <TableRow key={aluno.id} className={index % 2 === 1 ? "bg-muted/50" : ""}>
                  <TableCell className={`font-medium ${isMobile ? "px-2 py-1.5 text-xs truncate max-w-[120px]" : ""}`}>
                    {aluno.nome}
                  </TableCell>
                  <TableCell className={`hidden md:table-cell ${isMobile ? "px-2 py-1.5 text-xs" : ""}`}>
                    {aluno.codigo || '-'}
                  </TableCell>
                  <TableCell className={`hidden md:table-cell ${isMobile ? "px-2 py-1.5 text-xs" : ""}`}>
                    {aluno.ultimo_nivel || '-'}
                  </TableCell>
                  <TableCell className={isMobile ? "px-2 py-1.5" : ""}>
                    <div className="flex items-center justify-center">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleClickRegistrarPresenca(aluno)}
                        className={isMobile ? "h-7 w-7 p-0" : "h-8 px-2"}
                      >
                        <TrendingUp className={isMobile ? "h-3.5 w-3.5" : "h-4 w-4"} />
                        {!isMobile && <span className="ml-1 text-xs">Lançar</span>}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modal de Produtividade */}
      {alunoSelecionado && (
        <ProdutividadeModal 
          isOpen={modalAberto}
          aluno={alunoSelecionado}
          turma={turma}
          onClose={handleFecharModal}
        />
      )}
    </div>
  );
};

export default TurmaDetail;
