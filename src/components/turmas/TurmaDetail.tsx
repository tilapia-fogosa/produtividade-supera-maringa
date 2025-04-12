import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, RefreshCw, CheckCircle } from "lucide-react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { useIsMobile } from "@/hooks/use-mobile";
import ProdutividadeModal from './ProdutividadeModal';
import ReposicaoAulaModal from './ReposicaoAulaModal';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  todosAlunos: Aluno[];
  onVoltar: () => void;
  onShowAlunoDetails: (aluno: Aluno) => void;
  onRegistrarPresenca: (alunoId: string) => void;
  produtividadeRegistrada?: Record<string, boolean>;
}

const TurmaDetail: React.FC<TurmaDetailProps> = ({ 
  turma, 
  alunos, 
  todosAlunos,
  onVoltar, 
  onShowAlunoDetails, 
  onRegistrarPresenca,
  produtividadeRegistrada = {}
}) => {
  const isMobile = useIsMobile();
  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [reposicaoModalAberto, setReposicaoModalAberto] = useState(false);
  
  const handleClickRegistrarPresenca = (aluno: Aluno) => {
    setAlunoSelecionado(aluno);
    setModalAberto(true);
  };

  const handleFecharModal = () => {
    setModalAberto(false);
    setAlunoSelecionado(null);
  };

  const handleClickReposicaoAula = () => {
    setReposicaoModalAberto(true);
  };

  const handleFecharReposicaoModal = () => {
    setReposicaoModalAberto(false);
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

      {/* Botão de Reposição de Aula */}
      <div className="mb-3">
        <Button 
          variant="outline" 
          size={isMobile ? "sm" : "default"} 
          onClick={handleClickReposicaoAula}
          className="w-full"
        >
          <RefreshCw className={`mr-1.5 ${isMobile ? "h-3.5 w-3.5" : "h-4 w-4"}`} />
          <span className={isMobile ? "text-xs" : ""}>Registrar Reposição de Aula</span>
        </Button>
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
                <TableHead className={`hidden md:table-cell ${isMobile ? "px-2 py-2 text-xs" : ""}`}>Último Nível</TableHead>
                <TableHead className={`w-[100px] ${isMobile ? "px-2 py-2 text-xs" : ""}`}>Produtividade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alunos.map((aluno, index) => (
                <TableRow key={aluno.id} className={index % 2 === 1 ? "bg-muted/50" : ""}>
                  <TableCell className={`font-medium ${isMobile ? "px-2 py-1.5 text-xs truncate max-w-[120px]" : ""}`}>
                    {aluno.nome}
                  </TableCell>
                  <TableCell className={`hidden md:table-cell ${isMobile ? "px-2 py-1.5 text-xs" : ""}`}>
                    {aluno.ultimo_nivel || '-'}
                  </TableCell>
                  <TableCell className={isMobile ? "px-2 py-1.5" : ""}>
                    <div className="flex items-center justify-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleClickRegistrarPresenca(aluno)}
                              className={isMobile ? "h-7 w-7 p-0" : "h-8 px-2"}
                            >
                              {produtividadeRegistrada[aluno.id] && (
                                <CheckCircle className={`mr-1 text-green-500 ${isMobile ? "h-3.5 w-3.5" : "h-4 w-4"}`} />
                              )}
                              <TrendingUp className={isMobile ? "h-3.5 w-3.5" : "h-4 w-4"} />
                              {!isMobile && <span className="ml-1 text-xs">Lançar</span>}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {produtividadeRegistrada[aluno.id] 
                              ? "Produtividade já registrada hoje" 
                              : "Registrar produtividade"}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
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
          onSuccess={(alunoId) => {
            if (produtividadeRegistrada && alunoId) {
              produtividadeRegistrada[alunoId] = true;
            }
          }}
        />
      )}

      {/* Modal de Reposição de Aula */}
      <ReposicaoAulaModal
        isOpen={reposicaoModalAberto}
        turma={turma}
        todosAlunos={todosAlunos}
        onClose={handleFecharReposicaoModal}
      />
    </div>
  );
};

export default TurmaDetail;
