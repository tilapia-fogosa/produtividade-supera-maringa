
import React, { useState } from 'react';
import { Turma } from '@/hooks/use-professor-turmas';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import './print-styles.css';

interface FichaTurmaImprimivelProps {
  turma: Turma;
  alunos: {
    id: string;
    nome: string;
  }[];
}

const FichaTurmaImprimivel: React.FC<FichaTurmaImprimivelProps> = ({
  turma,
  alunos
}) => {
  const [paginaAtual, setPaginaAtual] = useState(1);
  const alunosPorPagina = 14; // Alterado para 14 alunos na tabela principal
  const alunosReposicaoPorPagina = 5; // 5 linhas para reposições

  // Ordenar alunos por nome
  const alunosOrdenados = [...alunos].sort((a, b) => a.nome.localeCompare(b.nome));

  // Calcular total de páginas
  const totalPaginas = Math.ceil(alunosOrdenados.length / alunosPorPagina);

  // Obter alunos para a página atual
  const alunosPagina = alunosOrdenados.slice((paginaAtual - 1) * alunosPorPagina, paginaAtual * alunosPorPagina);

  const paginaAnterior = () => {
    if (paginaAtual > 1) {
      setPaginaAtual(paginaAtual - 1);
    }
  };

  const proximaPagina = () => {
    if (paginaAtual < totalPaginas) {
      setPaginaAtual(paginaAtual + 1);
    }
  };

  // Obter o nome do professor da turma
  const professorNome = typeof turma.professor_id === 'string' ? turma.professor_id : 'Professor não especificado';

  // Função para renderizar a tabela com os dados necessários
  const renderizarTabela = (tipoTabela: 'principal' | 'reposicao') => {
    const linhasMax = tipoTabela === 'principal' ? alunosPorPagina : alunosReposicaoPorPagina;
    const alunosAtivos = tipoTabela === 'principal' ? alunosPagina : [];
    const linhasVazias = linhasMax - alunosAtivos.length;
    
    return (
      <Table className="ficha-tabela">
        <TableHeader>
          <TableRow>
            <TableHead className="ficha-coluna-nome" rowSpan={2}>Nome do Aluno</TableHead>
            <TableHead className="ficha-coluna-faltas borda-faltas" colSpan={5}>
              <div className="faltas-header">Faltas</div>
            </TableHead>
            <TableHead className="ficha-coluna-semana borda-semana-1" colSpan={5}>
              <div className="semana-header">Semana 1</div>
            </TableHead>
            <TableHead className="ficha-coluna-semana borda-semana-2" colSpan={5}>
              <div className="semana-header">Semana 2</div>
            </TableHead>
            <TableHead className="ficha-coluna-semana borda-semana-3" colSpan={5}>
              <div className="semana-header">Semana 3</div>
            </TableHead>
            <TableHead className="ficha-coluna-semana borda-semana-4" colSpan={5}>
              <div className="semana-header">Semana 4</div>
            </TableHead>
            <TableHead className="ficha-coluna-semana borda-semana-5" colSpan={5}>
              <div className="semana-header">Semana 5</div>
            </TableHead>
          </TableRow>
          <TableRow>
            {/* Subcolunas de Faltas */}
            {[1, 2, 3, 4, 5].map(dia => (
              <TableHead key={`falta-${dia}`} className="ficha-subcoluna-falta borda-faltas">
                {dia}
              </TableHead>
            ))}
            
            {/* Subcolunas para cada semana */}
            {[1, 2, 3, 4, 5].map(semana => (
              <React.Fragment key={`subheader-semana-${semana}`}>
                <TableHead className={`ficha-subcoluna borda-semana-${semana}`}>Ap.</TableHead>
                <TableHead className={`ficha-subcoluna borda-semana-${semana}`}>Pág.</TableHead>
                <TableHead className={`ficha-subcoluna borda-semana-${semana}`}>Ex.</TableHead>
                <TableHead className={`ficha-subcoluna borda-semana-${semana}`}>Er.</TableHead>
                <TableHead className={`ficha-subcoluna borda-semana-${semana}`}>Des.</TableHead>
              </React.Fragment>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {alunosAtivos.map((aluno, index) => (
            <TableRow key={aluno.id}>
              <TableCell className="ficha-celula-nome">
                <span className="ficha-aluno-numero">{(paginaAtual - 1) * alunosPorPagina + index + 1}</span>
                <span className="ficha-aluno-nome">{aluno.nome}</span>
              </TableCell>
              
              {/* Células para faltas (5 dias) */}
              {[1, 2, 3, 4, 5].map(dia => (
                <TableCell key={`falta-${aluno.id}-${dia}`} className="ficha-celula-falta borda-faltas">
                  <div className="falta-campo"></div>
                </TableCell>
              ))}
              
              {/* Células para cada semana (5 subcolunas por semana) */}
              {[1, 2, 3, 4, 5].map(semana => (
                <React.Fragment key={`semana-${aluno.id}-${semana}`}>
                  <TableCell className={`ficha-celula-semana borda-semana-${semana}`}>
                    <div className="semana-campo-valor"></div>
                  </TableCell>
                  <TableCell className={`ficha-celula-semana borda-semana-${semana}`}>
                    <div className="semana-campo-valor"></div>
                  </TableCell>
                  <TableCell className={`ficha-celula-semana borda-semana-${semana}`}>
                    <div className="semana-campo-valor"></div>
                  </TableCell>
                  <TableCell className={`ficha-celula-semana borda-semana-${semana}`}>
                    <div className="semana-campo-valor"></div>
                  </TableCell>
                  <TableCell className={`ficha-celula-semana borda-semana-${semana}`}>
                    <div className="semana-campo-valor"></div>
                  </TableCell>
                </React.Fragment>
              ))}
            </TableRow>
          ))}
          
          {/* Adicionar linhas vazias para completar a tabela quando não tiver alunos suficientes */}
          {Array.from({ length: linhasVazias }).map((_, index) => (
            <TableRow key={`empty-row-${tipoTabela}-${index}`}>
              <TableCell className="ficha-celula-nome">
                <span className="ficha-aluno-numero">{alunosAtivos.length + index + 1}</span>
                <span className="ficha-aluno-nome"></span>
              </TableCell>
              
              {/* Células para faltas (5 dias) */}
              {[1, 2, 3, 4, 5].map(dia => (
                <TableCell key={`empty-falta-${index}-${dia}`} className="ficha-celula-falta borda-faltas">
                  <div className="falta-campo"></div>
                </TableCell>
              ))}
              
              {/* Células para cada semana (5 subcolunas por semana) */}
              {[1, 2, 3, 4, 5].map(semana => (
                <React.Fragment key={`empty-semana-${index}-${semana}`}>
                  <TableCell className={`ficha-celula-semana borda-semana-${semana}`}>
                    <div className="semana-campo-valor"></div>
                  </TableCell>
                  <TableCell className={`ficha-celula-semana borda-semana-${semana}`}>
                    <div className="semana-campo-valor"></div>
                  </TableCell>
                  <TableCell className={`ficha-celula-semana borda-semana-${semana}`}>
                    <div className="semana-campo-valor"></div>
                  </TableCell>
                  <TableCell className={`ficha-celula-semana borda-semana-${semana}`}>
                    <div className="semana-campo-valor"></div>
                  </TableCell>
                  <TableCell className={`ficha-celula-semana borda-semana-${semana}`}>
                    <div className="semana-campo-valor"></div>
                  </TableCell>
                </React.Fragment>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="ficha-container">
      {/* Cabeçalho da ficha */}
      <div className="ficha-cabecalho">
        <div className="ficha-info">
          <div className="ficha-campo">
            <span className="ficha-label font-bold">Turma:</span>
            <span className="ficha-valor">{turma.nome}</span>
          </div>
          <div className="ficha-campo">
            <span className="ficha-label">Professor:</span>
            <span className="ficha-valor">{professorNome}</span>
          </div>
        </div>
        <div className="ficha-navegacao">
          <span className="ficha-pagina">Página: {paginaAtual} de {totalPaginas}</span>
          <div className="ficha-setas no-print">
            <button onClick={paginaAnterior} disabled={paginaAtual <= 1} className="seta-pagina">
              <ArrowLeft size={16} />
            </button>
            <button onClick={proximaPagina} disabled={paginaAtual >= totalPaginas} className="seta-pagina">
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabela principal da ficha (14 alunos) */}
      {renderizarTabela('principal')}

      {/* Título da seção de reposições */}
      <div className="ficha-reposicoes-titulo">
        <h3>Reposições</h3>
      </div>

      {/* Tabela de reposições (5 linhas) */}
      {renderizarTabela('reposicao')}

      {/* Rodapé da ficha */}
      <div className="ficha-rodape">
        <div className="ficha-logo">Supera – Ginástica para o Cérebro</div>
      </div>
    </div>
  );
};

export default FichaTurmaImprimivel;
