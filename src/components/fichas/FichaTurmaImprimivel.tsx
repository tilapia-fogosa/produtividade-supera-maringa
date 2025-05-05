
import React, { useState } from 'react';
import { Turma } from '@/hooks/use-professor-turmas';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from "@/components/ui/table";
import './print-styles.css';

interface FichaTurmaImprimivelProps {
  turma: Turma;
  alunos: {
    id: string;
    nome: string;
  }[];
}

const FichaTurmaImprimivel: React.FC<FichaTurmaImprimivelProps> = ({ turma, alunos }) => {
  const [paginaAtual, setPaginaAtual] = useState(1);
  const alunosPorPagina = 8;
  
  // Ordenar alunos por nome
  const alunosOrdenados = [...alunos].sort((a, b) => a.nome.localeCompare(b.nome));
  
  // Calcular total de páginas
  const totalPaginas = Math.ceil(alunosOrdenados.length / alunosPorPagina);
  
  // Obter alunos para a página atual
  const alunosPagina = alunosOrdenados.slice(
    (paginaAtual - 1) * alunosPorPagina, 
    paginaAtual * alunosPorPagina
  );

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
  const professorNome = typeof turma.professor_id === 'string' 
    ? turma.professor_id 
    : turma.professor?.nome || 'Professor não especificado';

  return (
    <div className="ficha-container">
      {/* Cabeçalho da ficha */}
      <div className="ficha-cabecalho">
        <div className="ficha-info">
          <div className="ficha-campo">
            <span className="ficha-label">Turma:</span>
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

      {/* Tabela principal da ficha */}
      <Table className="ficha-tabela">
        <TableHeader>
          <TableRow>
            <TableHead className="ficha-coluna-nome" rowSpan={2}>Nome do Aluno</TableHead>
            <TableHead className="ficha-coluna-faltas" colSpan={5}>
              <div className="faltas-header">Faltas</div>
            </TableHead>
            {[1, 2, 3, 4, 5].map((semana) => (
              <TableHead 
                key={`semana-${semana}`} 
                className={`ficha-coluna-semana semana-${semana}`}
                colSpan={5}
              >
                <div className="semana-header">Semana {semana}</div>
              </TableHead>
            ))}
          </TableRow>
          <TableRow>
            {/* Subcolunas de Faltas */}
            {[1, 2, 3, 4, 5].map((dia) => (
              <TableHead key={`falta-${dia}`} className="ficha-subcoluna-falta">
                {dia}
              </TableHead>
            ))}
            
            {/* Subcolunas para cada semana */}
            {[1, 2, 3, 4, 5].map((semana) => (
              <React.Fragment key={`subheader-semana-${semana}`}>
                <TableHead className="ficha-subcoluna">Ap.</TableHead>
                <TableHead className="ficha-subcoluna">Pág.</TableHead>
                <TableHead className="ficha-subcoluna">Ex.</TableHead>
                <TableHead className="ficha-subcoluna">Er.</TableHead>
                <TableHead className="ficha-subcoluna">Des.</TableHead>
              </React.Fragment>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {alunosPagina.map((aluno, index) => (
            <TableRow key={aluno.id}>
              <TableCell className="ficha-celula-nome">
                <span className="ficha-aluno-numero">{(paginaAtual - 1) * alunosPorPagina + index + 1}</span>
                <span className="ficha-aluno-nome">{aluno.nome}</span>
              </TableCell>
              
              {/* Células para faltas (5 dias) */}
              {[1, 2, 3, 4, 5].map((dia) => (
                <TableCell key={`falta-${aluno.id}-${dia}`} className="ficha-celula-falta">
                  <div className="falta-campo"></div>
                </TableCell>
              ))}
              
              {/* Células para cada semana (5 subcolunas por semana) */}
              {[1, 2, 3, 4, 5].map((semana) => (
                <React.Fragment key={`semana-${aluno.id}-${semana}`}>
                  <TableCell className="ficha-celula-semana">
                    <div className="semana-campo-valor"></div>
                  </TableCell>
                  <TableCell className="ficha-celula-semana">
                    <div className="semana-campo-valor"></div>
                  </TableCell>
                  <TableCell className="ficha-celula-semana">
                    <div className="semana-campo-valor"></div>
                  </TableCell>
                  <TableCell className="ficha-celula-semana">
                    <div className="semana-campo-valor"></div>
                  </TableCell>
                  <TableCell className="ficha-celula-semana">
                    <div className="semana-campo-valor"></div>
                  </TableCell>
                </React.Fragment>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Rodapé da ficha */}
      <div className="ficha-rodape">
        <div className="ficha-logo">Supera – Ginástica para o Cérebro</div>
      </div>
    </div>
  );
};

export default FichaTurmaImprimivel;
