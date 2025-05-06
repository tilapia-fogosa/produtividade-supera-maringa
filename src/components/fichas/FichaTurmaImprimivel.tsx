
import React, { useState, useEffect } from 'react';
import { Turma } from '@/hooks/use-professor-turmas';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import './print-styles.css';

interface FichaTurmaImprimivelProps {
  turma: Turma & { professorNome?: string };
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
  const alunosPorPagina = 14; // 14 alunos na tabela principal
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
  const professorNome = turma.professorNome || 'Professor não especificado';

  // Função para gerar as datas das aulas para o mês atual
  const gerarDatasAulas = () => {
    // Obter o mês atual
    const dataAtual = new Date();
    const mesAtual = dataAtual.getMonth();
    const anoAtual = dataAtual.getFullYear();
    
    const diaSemana = obterDiaSemana(turma.dia_semana);
    
    // Encontrar todas as datas do mês atual para o dia da semana da turma
    const datasDoMes: Date[] = [];
    const primeiroDiaDoMes = new Date(anoAtual, mesAtual, 1);
    const ultimoDiaDoMes = new Date(anoAtual, mesAtual + 1, 0);
    
    for (let dia = 1; dia <= ultimoDiaDoMes.getDate(); dia++) {
      const data = new Date(anoAtual, mesAtual, dia);
      if (data.getDay() === diaSemana) {
        datasDoMes.push(data);
      }
    }
    
    return datasDoMes;
  };
  
  // Converter string do dia da semana para número (0: domingo, 1: segunda, etc.)
  const obterDiaSemana = (diaSemana: string): number => {
    const mapeamento: Record<string, number> = {
      'domingo': 0,
      'segunda': 1,
      'terca': 2,
      'quarta': 3,
      'quinta': 4,
      'sexta': 5,
      'sabado': 6
    };
    return mapeamento[diaSemana] || 1; // Padrão para segunda-feira
  };
  
  // Obter datas das aulas
  const datasAulas = gerarDatasAulas();

  // Formatar data para exibição (DD/MM) - Modificado para mostrar apenas o dia (DD)
  const formatarData = (data: Date) => format(data, 'dd', { locale: ptBR });

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
              <div className="semana-header">{datasAulas[0] ? `Semana 1 (${formatarData(datasAulas[0])})` : 'Semana 1'}</div>
            </TableHead>
            <TableHead className="ficha-coluna-semana borda-semana-2" colSpan={5}>
              <div className="semana-header">{datasAulas[1] ? `Semana 2 (${formatarData(datasAulas[1])})` : 'Semana 2'}</div>
            </TableHead>
            <TableHead className="ficha-coluna-semana borda-semana-3" colSpan={5}>
              <div className="semana-header">{datasAulas[2] ? `Semana 3 (${formatarData(datasAulas[2])})` : 'Semana 3'}</div>
            </TableHead>
            <TableHead className="ficha-coluna-semana borda-semana-4" colSpan={5}>
              <div className="semana-header">{datasAulas[3] ? `Semana 4 (${formatarData(datasAulas[3])})` : 'Semana 4'}</div>
            </TableHead>
            <TableHead className="ficha-coluna-semana borda-semana-5" colSpan={5}>
              <div className="semana-header">{datasAulas[4] ? `Semana 5 (${formatarData(datasAulas[4])})` : 'Semana 5'}</div>
            </TableHead>
          </TableRow>
          <TableRow>
            {/* Subcolunas de Faltas - Datas específicas */}
            {[0, 1, 2, 3, 4].map(index => (
              <TableHead 
                key={`falta-${index}`} 
                className="ficha-subcoluna-falta borda-faltas"
              >
                {datasAulas[index] ? formatarData(datasAulas[index]) : '-'}
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
              {[0, 1, 2, 3, 4].map(index => (
                <TableCell 
                  key={`falta-${aluno.id}-${index}`} 
                  className="ficha-celula-falta borda-faltas"
                  style={{ opacity: datasAulas[index] ? 1 : 0.3 }}
                >
                  <div className="falta-campo"></div>
                </TableCell>
              ))}
              
              {/* Células para cada semana (5 subcolunas por semana) */}
              {[0, 1, 2, 3, 4].map(semanaIndex => (
                <React.Fragment key={`semana-${aluno.id}-${semanaIndex}`}>
                  <TableCell 
                    className={`ficha-celula-semana borda-semana-${semanaIndex+1}`}
                    style={{ opacity: datasAulas[semanaIndex] ? 1 : 0.3 }}
                  >
                    <div className="semana-campo-valor"></div>
                  </TableCell>
                  <TableCell 
                    className={`ficha-celula-semana borda-semana-${semanaIndex+1}`}
                    style={{ opacity: datasAulas[semanaIndex] ? 1 : 0.3 }}
                  >
                    <div className="semana-campo-valor"></div>
                  </TableCell>
                  <TableCell 
                    className={`ficha-celula-semana borda-semana-${semanaIndex+1}`}
                    style={{ opacity: datasAulas[semanaIndex] ? 1 : 0.3 }}
                  >
                    <div className="semana-campo-valor"></div>
                  </TableCell>
                  <TableCell 
                    className={`ficha-celula-semana borda-semana-${semanaIndex+1}`}
                    style={{ opacity: datasAulas[semanaIndex] ? 1 : 0.3 }}
                  >
                    <div className="semana-campo-valor"></div>
                  </TableCell>
                  <TableCell 
                    className={`ficha-celula-semana borda-semana-${semanaIndex+1}`}
                    style={{ opacity: datasAulas[semanaIndex] ? 1 : 0.3 }}
                  >
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
              {[0, 1, 2, 3, 4].map(dayIndex => (
                <TableCell 
                  key={`empty-falta-${index}-${dayIndex}`} 
                  className="ficha-celula-falta borda-faltas"
                  style={{ opacity: datasAulas[dayIndex] ? 1 : 0.3 }}
                >
                  <div className="falta-campo"></div>
                </TableCell>
              ))}
              
              {/* Células para cada semana (5 subcolunas por semana) */}
              {[0, 1, 2, 3, 4].map(semanaIndex => (
                <React.Fragment key={`empty-semana-${index}-${semanaIndex}`}>
                  <TableCell 
                    className={`ficha-celula-semana borda-semana-${semanaIndex+1}`}
                    style={{ opacity: datasAulas[semanaIndex] ? 1 : 0.3 }}
                  >
                    <div className="semana-campo-valor"></div>
                  </TableCell>
                  <TableCell 
                    className={`ficha-celula-semana borda-semana-${semanaIndex+1}`}
                    style={{ opacity: datasAulas[semanaIndex] ? 1 : 0.3 }}
                  >
                    <div className="semana-campo-valor"></div>
                  </TableCell>
                  <TableCell 
                    className={`ficha-celula-semana borda-semana-${semanaIndex+1}`}
                    style={{ opacity: datasAulas[semanaIndex] ? 1 : 0.3 }}
                  >
                    <div className="semana-campo-valor"></div>
                  </TableCell>
                  <TableCell 
                    className={`ficha-celula-semana borda-semana-${semanaIndex+1}`}
                    style={{ opacity: datasAulas[semanaIndex] ? 1 : 0.3 }}
                  >
                    <div className="semana-campo-valor"></div>
                  </TableCell>
                  <TableCell 
                    className={`ficha-celula-semana borda-semana-${semanaIndex+1}`}
                    style={{ opacity: datasAulas[semanaIndex] ? 1 : 0.3 }}
                  >
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

      {/* Mês e ano atual */}
      <div className="ficha-mes-ano">
        <h2>{format(new Date(), 'MMMM yyyy', { locale: ptBR })}</h2>
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
