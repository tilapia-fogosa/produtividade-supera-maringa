
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

  // Obter o nome do professor da turma (pode ser um objeto ou uma string)
  const professorNome = typeof turma.professor === 'string' 
    ? turma.professor 
    : turma.professor?.nome || 'Professor não especificado';

  // Cada semana terá campos para: Apostila, Página, Exercícios, Erros, Desafio, Observações
  const renderCamposSemana = () => (
    <div className="semana-campos">
      <div className="semana-campo">Ap.</div>
      <div className="semana-campo">Página</div>
      <div className="semana-campo">Ex.</div>
      <div className="semana-campo">Er.</div>
      <div className="semana-campo">Des.</div>
      <div className="semana-campo">Obs.</div>
    </div>
  );

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
            <TableHead className="ficha-coluna-nome">Nome do Aluno</TableHead>
            <TableHead className="ficha-coluna-faltas">Faltas</TableHead>
            <TableHead className="ficha-coluna-semana semana-1">Semana 1</TableHead>
            <TableHead className="ficha-coluna-semana semana-2">Semana 2</TableHead>
            <TableHead className="ficha-coluna-semana semana-3">Semana 3</TableHead>
            <TableHead className="ficha-coluna-semana semana-4">Semana 4</TableHead>
            <TableHead className="ficha-coluna-semana semana-5">Semana 5</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alunosPagina.map((aluno, index) => (
            <TableRow key={aluno.id}>
              <TableCell className="ficha-celula-nome">
                <span className="ficha-aluno-numero">{(paginaAtual - 1) * alunosPorPagina + index + 1}</span>
                <span className="ficha-aluno-nome">{aluno.nome}</span>
              </TableCell>
              <TableCell className="ficha-celula-faltas">
                <div className="faltas-container">
                  <div className="faltas-legenda">
                    <div>P = Presente</div>
                    <div>F = Falta</div>
                    <div>D = Desafio</div>
                  </div>
                  <div className="faltas-datas">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="faltas-data"></div>
                    ))}
                  </div>
                </div>
              </TableCell>
              {/* Colunas de semanas */}
              {[1, 2, 3, 4, 5].map((semana) => (
                <TableCell key={semana} className={`ficha-celula-semana semana-${semana}`}>
                  <div className="semana-conteudo">
                    <div className="semana-campo-grupo">
                      <div className="semana-campo-label">Ap.</div>
                      <div className="semana-campo-valor"></div>
                    </div>
                    <div className="semana-campo-grupo">
                      <div className="semana-campo-label">Página</div>
                      <div className="semana-campo-valor"></div>
                    </div>
                    <div className="semana-campo-grupo">
                      <div className="semana-campo-label">Ex.</div>
                      <div className="semana-campo-valor"></div>
                    </div>
                    <div className="semana-campo-grupo">
                      <div className="semana-campo-label">Er.</div>
                      <div className="semana-campo-valor"></div>
                    </div>
                    <div className="semana-campo-grupo">
                      <div className="semana-campo-label">Des.</div>
                      <div className="semana-campo-valor"></div>
                    </div>
                    <div className="semana-campo-grupo campo-obs">
                      <div className="semana-campo-label">Obs.</div>
                      <div className="semana-campo-valor"></div>
                    </div>
                  </div>
                </TableCell>
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
