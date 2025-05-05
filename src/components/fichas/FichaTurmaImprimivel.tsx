
import React from 'react';
import { Turma } from '@/hooks/use-professor-turmas';
import './print-styles.css';

interface FichaTurmaImprimivelProps {
  turma: Turma;
  alunos: {
    id: string;
    nome: string;
  }[];
}

const FichaTurmaImprimivel: React.FC<FichaTurmaImprimivelProps> = ({ turma, alunos }) => {
  // Formatar o dia da semana
  const formatarDiaSemana = (dia: string) => {
    switch (dia) {
      case 'segunda': return 'Segunda-feira';
      case 'terca': return 'Terça-feira';
      case 'quarta': return 'Quarta-feira';
      case 'quinta': return 'Quinta-feira';
      case 'sexta': return 'Sexta-feira';
      case 'sabado': return 'Sábado';
      case 'domingo': return 'Domingo';
      default: return dia;
    }
  };

  // Formatar o horário
  const formatarHorario = (horario: string) => {
    if (!horario) return '';
    // Se o horário for um objeto Date ou string no formato ISO, converter para string HH:MM
    if (typeof horario === 'object' || horario.includes('T')) {
      try {
        const date = new Date(horario);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      } catch (e) {
        return horario;
      }
    }
    return horario;
  };

  // Criar 5 semanas para o mês
  const semanas = [1, 2, 3, 4, 5];
  
  // Ordenar alunos por nome para fácil localização
  const alunosOrdenados = [...alunos].sort((a, b) => a.nome.localeCompare(b.nome));

  return (
    <div className="ficha-turma-container p-4">
      <div className="ficha-header mb-6 text-center">
        <h1 className="text-2xl font-bold text-azul-500">FICHA DE ACOMPANHAMENTO DE TURMA</h1>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="text-left">
            <p className="font-semibold">Turma: <span className="font-normal">{turma.nome}</span></p>
            <p className="font-semibold">Dia: <span className="font-normal">{formatarDiaSemana(turma.dia_semana)}</span></p>
          </div>
          <div className="text-left">
            <p className="font-semibold">Sala: <span className="font-normal">{turma.sala || '---'}</span></p>
            <p className="font-semibold">Horário: <span className="font-normal">{formatarHorario(turma.horario)}</span></p>
          </div>
        </div>
      </div>

      <table className="w-full border-collapse mt-4 print:border print:border-black">
        <thead>
          <tr>
            <th className="border border-gray-400 p-2 w-1/3">Nome do Aluno</th>
            {semanas.map((semana) => (
              <th key={`semana-${semana}`} className="border border-gray-400 p-2">
                Semana {semana}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {alunosOrdenados.map((aluno) => (
            <tr key={aluno.id}>
              <td className="border border-gray-400 p-2">{aluno.nome}</td>
              {semanas.map((semana) => (
                <td key={`${aluno.id}-semana-${semana}`} className="border border-gray-400 p-2">
                  <div className="min-h-[40px]"></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-8 page-break-inside-avoid">
        <h2 className="text-xl font-bold text-azul-500 mb-4">Observações</h2>
        <div className="border border-gray-400 min-h-[200px] p-2"></div>
      </div>
    </div>
  );
};

export default FichaTurmaImprimivel;
