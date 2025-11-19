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
    created_at: string;
    dias_supera: number | null;
  }[];
  mesSelecionado: number;
  anoSelecionado: number;
  iniciarSemanaAnterior: boolean;
}

// Definir cores constantes para garantir consistência
const CORES = {
  vermelho: '#ea384c',
  preto: '#000000',
  cinza: '#999999',
  amareloClaro: '#FEF7CD'
};

const FichaTurmaImprimivel: React.FC<FichaTurmaImprimivelProps> = ({
  turma,
  alunos,
  mesSelecionado,
  anoSelecionado,
  iniciarSemanaAnterior
}) => {
  // Adicionar classe específica para impressão de fichas
  useEffect(() => {
    document.body.classList.add('printing-ficha');
    
    return () => {
      document.body.classList.remove('printing-ficha');
    };
  }, []);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const alunosPorPagina = 14;
  const alunosReposicaoPorPagina = 5;

  // Função para verificar se um aluno tem menos de 90 dias na Supera
  const isAlunoRecente = (diasSupera: number | null) => {
    if (diasSupera === null) return false;
    return diasSupera < 90;
  };

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

  // Função para gerar as datas das aulas para o mês/ano selecionados
  const gerarDatasAulas = () => {
    const diaSemana = obterDiaSemana(turma.dia_semana);
    
    let dataInicio: Date;
    let dataFim: Date;
    
    if (iniciarSemanaAnterior) {
      // Encontrar a primeira ocorrência do dia da semana começando uma semana antes do mês
      const primeiroDiaDoMes = new Date(anoSelecionado, mesSelecionado, 1);
      const ultimoDiaDoMesAnterior = new Date(anoSelecionado, mesSelecionado, 0);
      
      // Procurar a primeira ocorrência do dia da semana na semana anterior ao mês
      dataInicio = new Date(ultimoDiaDoMesAnterior);
      dataInicio.setDate(dataInicio.getDate() - 6); // Uma semana antes
      
      // Encontrar a primeira ocorrência do dia da semana a partir desta data
      while (dataInicio.getDay() !== diaSemana) {
        dataInicio.setDate(dataInicio.getDate() + 1);
      }
      
      // Data fim será o último dia do mês selecionado + alguns dias para cobrir 5 semanas
      dataFim = new Date(anoSelecionado, mesSelecionado + 1, 0);
      dataFim.setDate(dataFim.getDate() + 7); // Uma semana a mais para garantir 5 semanas
    } else {
      // Lógica original - começar do primeiro dia do mês
      dataInicio = new Date(anoSelecionado, mesSelecionado, 1);
      dataFim = new Date(anoSelecionado, mesSelecionado + 1, 0);
      
      // Encontrar a primeira ocorrência do dia da semana no mês
      while (dataInicio.getDay() !== diaSemana && dataInicio.getMonth() === mesSelecionado) {
        dataInicio.setDate(dataInicio.getDate() + 1);
      }
    }
    
    // Coletar todas as datas do dia da semana dentro do período
    const datasDoMes: Date[] = [];
    const dataAtual = new Date(dataInicio);
    
    while (datasDoMes.length < 5 && dataAtual <= dataFim) {
      if (dataAtual.getDay() === diaSemana) {
        datasDoMes.push(new Date(dataAtual));
        dataAtual.setDate(dataAtual.getDate() + 7); // Próxima semana
      } else {
        dataAtual.setDate(dataAtual.getDate() + 1);
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
    return mapeamento[diaSemana] || 1;
  };
  
  // Obter datas das aulas
  const datasAulas = gerarDatasAulas();

  // Formatar data para exibição (apenas o dia)
  const formatarData = (data: Date) => format(data, 'dd', { locale: ptBR });

  // Estilos inline para garantir que as cores sejam impressas corretamente
  const getSemanaBorderStyle = (semana: number) => {
    const cor = semana % 2 === 1 ? CORES.vermelho : CORES.preto;
    return {
      borderLeft: `2px solid ${cor}`,
      borderRight: `2px solid ${cor}`,
      borderLeftColor: cor,
      borderRightColor: cor,
      color: cor,
      WebkitPrintColorAdjust: 'exact' as 'exact',
      printColorAdjust: 'exact' as 'exact',
    };
  };

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
            <TableHead 
              className="ficha-coluna-faltas borda-faltas" 
              colSpan={5} 
              style={{
                borderLeft: `2px solid ${CORES.preto}`,
                borderRight: `2px solid ${CORES.preto}`,
                color: CORES.preto,
                WebkitPrintColorAdjust: 'exact' as 'exact',
                printColorAdjust: 'exact' as 'exact',
              }}
            >
              <div className="faltas-header">Faltas</div>
            </TableHead>
            {[1, 2, 3, 4, 5].map(semana => (
              <TableHead 
                key={`semana-header-${semana}`}
                className={`ficha-coluna-semana borda-semana-${semana}`} 
                colSpan={5} 
                style={getSemanaBorderStyle(semana)}
              >
                <div className="semana-header">
                  {datasAulas[semana-1] ? `Semana ${semana} (${formatarData(datasAulas[semana-1])})` : `Semana ${semana}`}
                </div>
              </TableHead>
            ))}
          </TableRow>
          <TableRow>
            {/* Subcolunas de Faltas - Datas específicas */}
            {[0, 1, 2, 3, 4].map((index, idx) => (
              <TableHead 
                key={`falta-${index}`} 
                className={`ficha-subcoluna-falta borda-faltas ${idx === 0 ? 'first-subcol' : ''} ${idx === 4 ? 'last-subcol' : ''}`}
                style={{
                  borderColor: CORES.preto,
                  color: CORES.preto,
                  borderLeft: idx === 0 ? `2px solid ${CORES.preto}` : `0.5px solid ${CORES.cinza}`,
                  borderRight: idx === 4 ? `2px solid ${CORES.preto}` : `0.5px solid ${CORES.cinza}`,
                  WebkitPrintColorAdjust: 'exact' as 'exact',
                  printColorAdjust: 'exact' as 'exact',
                }}
              >
                {datasAulas[index] ? formatarData(datasAulas[index]) : '-'}
              </TableHead>
            ))}
            
            {/* Subcolunas para cada semana */}
            {[1, 2, 3, 4, 5].map(semana => {
              const corSemana = semana % 2 === 1 ? CORES.vermelho : CORES.preto;
              return (
                <React.Fragment key={`subheader-semana-${semana}`}>
                  {['Ap.', 'Pág.', 'Ex.', 'Er.', 'Des.'].map((label, idx) => {
                    const isFirst = idx === 0;
                    const isLast = idx === 4;
                    return (
                      <TableHead 
                        key={`subheader-semana-${semana}-${idx}`}
                        className={`ficha-subcoluna borda-semana-${semana} ${isFirst ? 'first-subcol' : ''} ${isLast ? 'last-subcol' : ''}`}
                        style={{
                          borderColor: corSemana,
                          color: corSemana,
                          borderLeft: isFirst ? `2px solid ${corSemana}` : `0.5px solid ${CORES.cinza}`,
                          borderRight: isLast ? `2px solid ${corSemana}` : `0.5px solid ${CORES.cinza}`,
                          WebkitPrintColorAdjust: 'exact' as 'exact',
                          printColorAdjust: 'exact' as 'exact',
                        }}
                      >
                        {label}
                      </TableHead>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {alunosAtivos.map((aluno, index) => {
            const alunoRecente = isAlunoRecente(aluno.dias_supera);
            
            return (
              <TableRow key={aluno.id}>
                <TableCell 
                  className="ficha-celula-nome"
                  style={alunoRecente ? {
                    backgroundColor: CORES.amareloClaro,
                    WebkitPrintColorAdjust: 'exact' as 'exact',
                    printColorAdjust: 'exact' as 'exact',
                    colorAdjust: 'exact' as 'exact'
                  } : {}}
                >
                  <span className="ficha-aluno-numero">{(paginaAtual - 1) * alunosPorPagina + index + 1}</span>
                  <span className="ficha-aluno-nome">{aluno.nome}</span>
                </TableCell>
                
                {/* Células para faltas (5 dias) */}
                {[0, 1, 2, 3, 4].map((idx, i) => (
                  <TableCell 
                    key={`falta-${aluno.id}-${idx}`} 
                    className="ficha-celula-falta borda-faltas"
                    style={{ 
                      opacity: datasAulas[idx] ? 1 : 0.3,
                      borderLeft: i === 0 ? `2px solid ${CORES.preto}` : `0.5px solid ${CORES.cinza}`,
                      borderRight: i === 4 ? `2px solid ${CORES.preto}` : `0.5px solid ${CORES.cinza}`,
                      WebkitPrintColorAdjust: 'exact' as 'exact',
                      printColorAdjust: 'exact' as 'exact',
                    }}
                  >
                    <div className="falta-campo"></div>
                  </TableCell>
                ))}
                
                {/* Células para cada semana (5 subcolunas por semana) */}
                {[1, 2, 3, 4, 5].map(semana => {
                  const corSemana = semana % 2 === 1 ? CORES.vermelho : CORES.preto;
                  return (
                    <React.Fragment key={`semana-${aluno.id}-${semana}`}>
                      {[0, 1, 2, 3, 4].map((subIdx, i) => (
                        <TableCell 
                          key={`semana-${aluno.id}-${semana}-${subIdx}`}
                          className={`ficha-celula-semana borda-semana-${semana}`}
                          style={{ 
                            opacity: datasAulas[semana-1] ? 1 : 0.3,
                            borderLeft: i === 0 ? `2px solid ${corSemana}` : `0.5px solid ${CORES.cinza}`,
                            borderRight: i === 4 ? `2px solid ${corSemana}` : `0.5px solid ${CORES.cinza}`,
                            borderColor: corSemana,
                            WebkitPrintColorAdjust: 'exact' as 'exact',
                            printColorAdjust: 'exact' as 'exact',
                          }}
                        >
                          <div className="semana-campo-valor"></div>
                        </TableCell>
                      ))}
                    </React.Fragment>
                  );
                })}
              </TableRow>
            );
          })}
          
          {/* Adicionar linhas vazias para completar a tabela quando não tiver alunos suficientes */}
          {Array.from({ length: linhasVazias }).map((_, index) => (
            <TableRow key={`empty-row-${tipoTabela}-${index}`}>
              <TableCell className="ficha-celula-nome">
                <span className="ficha-aluno-numero">{alunosAtivos.length + index + 1}</span>
                <span className="ficha-aluno-nome"></span>
              </TableCell>
              
              {/* Células para faltas (5 dias) */}
              {[0, 1, 2, 3, 4].map((idx, i) => (
                <TableCell 
                  key={`empty-falta-${index}-${idx}`} 
                  className="ficha-celula-falta borda-faltas"
                  style={{ 
                    opacity: datasAulas[idx] ? 1 : 0.3,
                    borderLeft: i === 0 ? `2px solid ${CORES.preto}` : `0.5px solid ${CORES.cinza}`,
                    borderRight: i === 4 ? `2px solid ${CORES.preto}` : `0.5px solid ${CORES.cinza}`,
                    WebkitPrintColorAdjust: 'exact' as 'exact',
                    printColorAdjust: 'exact' as 'exact',
                  }}
                >
                  <div className="falta-campo"></div>
                </TableCell>
              ))}
              
              {/* Células para cada semana (5 subcolunas por semana) */}
              {[1, 2, 3, 4, 5].map(semana => {
                const corSemana = semana % 2 === 1 ? CORES.vermelho : CORES.preto;
                return (
                  <React.Fragment key={`empty-semana-${index}-${semana}`}>
                    {[0, 1, 2, 3, 4].map((subIdx, i) => (
                      <TableCell 
                        key={`empty-semana-${index}-${semana}-${subIdx}`}
                        className={`ficha-celula-semana borda-semana-${semana}`}
                        style={{ 
                          opacity: datasAulas[semana-1] ? 1 : 0.3,
                          borderLeft: i === 0 ? `2px solid ${corSemana}` : `0.5px solid ${CORES.cinza}`,
                          borderRight: i === 4 ? `2px solid ${corSemana}` : `0.5px solid ${CORES.cinza}`,
                          borderColor: corSemana,
                          WebkitPrintColorAdjust: 'exact' as 'exact',
                          printColorAdjust: 'exact' as 'exact',
                        }}
                      >
                        <div className="semana-campo-valor"></div>
                      </TableCell>
                    ))}
                  </React.Fragment>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="ficha-print-wrapper">
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

      {/* Mês e ano selecionados */}
      <div className="ficha-mes-ano">
        <h2>
          {format(new Date(anoSelecionado, mesSelecionado), 'MMMM yyyy', { locale: ptBR })}
          {iniciarSemanaAnterior && <span className="text-sm"> (iniciando semana anterior)</span>}
        </h2>
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
    </div>
  );
};

export default FichaTurmaImprimivel;
