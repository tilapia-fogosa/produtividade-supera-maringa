
import React, { useState } from 'react';
import { Turma } from '@/hooks/use-professor-turmas';
import './print-styles.css';
import { ArrowLeft, ArrowRight } from 'lucide-react';

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
  
  // Preencher até 8 alunos com espaços vazios se necessário
  const alunosExibidos = [...alunosPagina];
  while (alunosExibidos.length < alunosPorPagina) {
    alunosExibidos.push({ id: `vazio-${alunosExibidos.length}`, nome: '' });
  }

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

  return (
    <div className="registro-semanal-container">
      {/* Cabeçalho */}
      <div className="registro-cabecalho">
        <div className="registro-info">
          <div className="registro-campo">
            <span className="registro-label">Turma:</span>
            <span className="registro-valor">{turma.nome}</span>
          </div>
          <div className="registro-campo">
            <span className="registro-label">Professor:</span>
            <span className="registro-valor">{turma.professor_id}</span>
          </div>
        </div>
        <div className="registro-navegacao">
          <span className="registro-pagina">Página: {paginaAtual}</span>
          <div className="registro-setas no-print">
            <button onClick={paginaAnterior} disabled={paginaAtual <= 1} className="seta-pagina">
              <ArrowLeft size={16} />
            </button>
            <button onClick={proximaPagina} disabled={paginaAtual >= totalPaginas} className="seta-pagina">
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Lista de alunos */}
      <div className="registro-alunos-lista">
        {alunosExibidos.map((aluno, index) => (
          <div key={aluno.id} className="registro-aluno-item">
            <div className="registro-aluno-numero">{index + 1}</div>
            <div className="registro-aluno-nome">{aluno.nome}</div>
          </div>
        ))}
      </div>

      {/* Tabela de presenças e semanas */}
      <div className="registro-tabela-container">
        {/* Coluna de presenças */}
        <div className="registro-coluna-presencas">
          <div className="registro-presencas-header">Presenças/Faltas</div>
          <div className="registro-presencas-legenda">
            <div>P = Presente</div>
            <div>F = Falta</div>
            <div>D = Desafio</div>
          </div>
          <div className="registro-presencas-datas">
            <div className="registro-datas-header">Datas:</div>
            <div className="registro-datas-campos">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="registro-data-campo"></div>
              ))}
            </div>
          </div>
        </div>

        {/* Blocos de semanas */}
        <div className="registro-semanas">
          {['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4', 'Semana 5'].map((semana, index) => (
            <div key={semana} className={`registro-semana semana-${index + 1}`}>
              <div className="registro-semana-header">{semana}</div>
              <div className="registro-semana-campos">
                <div className="registro-campo-grupo">
                  <div className="registro-campo-label">Ap.</div>
                  <div className="registro-campo-valor"></div>
                </div>
                <div className="registro-campo-grupo">
                  <div className="registro-campo-label">Página</div>
                  <div className="registro-campo-valor"></div>
                </div>
                <div className="registro-campo-grupo">
                  <div className="registro-campo-label">Ex.</div>
                  <div className="registro-campo-valor"></div>
                </div>
                <div className="registro-campo-grupo">
                  <div className="registro-campo-label">Er.</div>
                  <div className="registro-campo-valor"></div>
                </div>
                <div className="registro-campo-grupo">
                  <div className="registro-campo-label">Des.</div>
                  <div className="registro-campo-valor"></div>
                </div>
                <div className="registro-campo-grupo campo-obs">
                  <div className="registro-campo-label">Obs.</div>
                  <div className="registro-campo-valor"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rodapé */}
      <div className="registro-rodape">
        <div className="registro-logo">Supera – Ginástica para o Cérebro</div>
      </div>
    </div>
  );
};

export default FichaTurmaImprimivel;
