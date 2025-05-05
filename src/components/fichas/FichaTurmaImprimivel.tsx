
import React from 'react';
import { Turma } from '@/hooks/use-professor-turmas';
import { Aluno } from '@/hooks/use-alunos';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface FichaTurmaImprimivelProps {
  turma: Turma;
  alunos: Aluno[];
}

const FichaTurmaImprimivel: React.FC<FichaTurmaImprimivelProps> = ({ turma, alunos }) => {
  // Lista de tipos de atividades que serão exibidas no cabeçalho
  const atividades = [
    { id: 1, nome: "Adição" },
    { id: 2, nome: "Cella Maria Pujol dos Santos" },
    { id: 3, nome: "Direit Tavaes de Souza Santos" },
    { id: 4, nome: "Direito Tavaes Week" },
    { id: 5, nome: "Eunice Cabral dos Santos" },
    { id: 6, nome: "Maria de Lourdes da Silva Machado" },
    { id: 7, nome: "Tereza Casimira Barros" },
    { id: 8, nome: "Zilda Fuse Yamada" },
  ];

  // Função para formatar título da turma
  const formatarTituloTurma = () => {
    const nomeTurma = turma.nome || "";
    const professorNome = (turma as any).professor?.nome || "";
    
    return (
      <div className="flex flex-col items-center">
        <div className="font-bold border border-gray-800 px-3 py-1 rotate-90 origin-bottom-left absolute right-10 top-0">
          Turma: {nomeTurma} ({professorNome})
        </div>
      </div>
    );
  };

  return (
    <div className="p-2 print:p-0 relative">
      {formatarTituloTurma()}
      
      <div className="overflow-auto print:overflow-visible">
        <Table className="w-full border-collapse border">
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead className="border p-1 text-center w-4 h-20 align-bottom text-xs" rowSpan={2}>
                Nome do Aluno
              </TableHead>
              {/* 4 tipos de células: Faltas, Semana 1, Semana 2, etc. */}
              <TableHead className="border p-1 text-center w-4 h-10 align-bottom text-xs bg-red-50" colSpan={4}>
                <div className="rotate-270 transform origin-center w-4 h-10 flex items-center justify-center">
                  Faltas
                </div>
              </TableHead>
              <TableHead className="border p-1 text-center w-4 h-10 align-bottom text-xs bg-orange-50" colSpan={5}>
                <div className="rotate-270 transform origin-center w-4 h-10 flex items-center justify-center">
                  Semana 1
                </div>
              </TableHead>
              <TableHead className="border p-1 text-center w-4 h-10 align-bottom text-xs bg-yellow-50" colSpan={5}>
                <div className="rotate-270 transform origin-center w-4 h-10 flex items-center justify-center">
                  Semana 2
                </div>
              </TableHead>
              <TableHead className="border p-1 text-center w-4 h-10 align-bottom text-xs bg-amber-50" colSpan={5}>
                <div className="rotate-270 transform origin-center w-4 h-10 flex items-center justify-center">
                  Semana 3
                </div>
              </TableHead>
              <TableHead className="border p-1 text-center w-4 h-10 align-bottom text-xs bg-yellow-50" colSpan={5}>
                <div className="rotate-270 transform origin-center w-4 h-10 flex items-center justify-center">
                  Semana 4
                </div>
              </TableHead>
              <TableHead className="border p-1 text-center w-4 h-10 align-bottom text-xs bg-orange-50" colSpan={5}>
                <div className="rotate-270 transform origin-center w-4 h-10 flex items-center justify-center">
                  Semana 5
                </div>
              </TableHead>
            </TableRow>
            <TableRow className="bg-gray-100">
              {/* Faltas - 4 colunas */}
              <TableHead className="border p-0 text-center w-4 h-10 text-[8px] align-middle bg-red-50">1</TableHead>
              <TableHead className="border p-0 text-center w-4 h-10 text-[8px] align-middle bg-red-50">2</TableHead>
              <TableHead className="border p-0 text-center w-4 h-10 text-[8px] align-middle bg-red-50">3</TableHead>
              <TableHead className="border p-0 text-center w-4 h-10 text-[8px] align-middle bg-red-50">4</TableHead>
              
              {/* Semana 1 - 5 colunas */}
              <TableHead className="border p-0 text-center w-4 h-10 text-[8px] align-middle bg-orange-50">Ap</TableHead>
              <TableHead className="border p-0 text-center w-4 h-10 text-[8px] align-middle bg-orange-50">Pág</TableHead>
              <TableHead className="border p-0 text-center w-4 h-10 text-[8px] align-middle bg-orange-50">Er</TableHead>
              <TableHead className="border p-0 text-center w-4 h-10 text-[8px] align-middle bg-orange-50">Des</TableHead>
              <TableHead className="border p-0 text-center w-4 h-10 text-[8px] align-middle bg-orange-50">Dig</TableHead>

              {/* Semana 2 - 5 colunas */}
              <TableHead className="border p-0 text-center w-4 h-10 text-[8px] align-middle bg-yellow-50">Ap</TableHead>
              <TableHead className="border p-0 text-center w-4 h-10 text-[8px] align-middle bg-yellow-50">Pág</TableHead>
              <TableHead className="border p-0 text-center w-4 h-10 text-[8px] align-middle bg-yellow-50">Er</TableHead>
              <TableHead className="border p-0 text-center w-4 h-10 text-[8px] align-middle bg-yellow-50">Des</TableHead>
              <TableHead className="border p-0 text-center w-4 h-10 text-[8px] align-middle bg-yellow-50">Dig</TableHead>

              {/* Semana 3 - 5 colunas */}
              <TableHead className="border p-0 text-center w-4 h-10 text-[8px] align-middle bg-amber-50">Ap</TableHead>
              <TableHead className="border p-0 text-center w-4 h-10 text-[8px] align-middle bg-amber-50">Pág</TableHead>
              <TableHead className="border p-0 text-center w-4 h-10 text-[8px] align-middle bg-amber-50">Er</TableHead>
              <TableHead className="border p-0 text-center w-4 h-10 text-[8px] align-middle bg-amber-50">Des</TableHead>
              <TableHead className="border p-0 text-center w-4 h-10 text-[8px] align-middle bg-amber-50">Dig</TableHead>

              {/* Semana 4 - 5 colunas */}
              <TableHead className="border p-0 text-center w-4 h-10 text-[8px] align-middle bg-yellow-50">Ap</TableHead>
              <TableHead className="border p-0 text-center w-4 h-10 text-[8px] align-middle bg-yellow-50">Pág</TableHead>
              <TableHead className="border p-0 text-center w-4 h-10 text-[8px] align-middle bg-yellow-50">Er</TableHead>
              <TableHead className="border p-0 text-center w-4 h-10 text-[8px] align-middle bg-yellow-50">Des</TableHead>
              <TableHead className="border p-0 text-center w-4 h-10 text-[8px] align-middle bg-yellow-50">Dig</TableHead>

              {/* Semana 5 - 5 colunas */}
              <TableHead className="border p-0 text-center w-4 h-10 text-[8px] align-middle bg-orange-50">Ap</TableHead>
              <TableHead className="border p-0 text-center w-4 h-10 text-[8px] align-middle bg-orange-50">Pág</TableHead>
              <TableHead className="border p-0 text-center w-4 h-10 text-[8px] align-middle bg-orange-50">Er</TableHead>
              <TableHead className="border p-0 text-center w-4 h-10 text-[8px] align-middle bg-orange-50">Des</TableHead>
              <TableHead className="border p-0 text-center w-4 h-10 text-[8px] align-middle bg-orange-50">Dig</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alunos.map((aluno, index) => (
              <TableRow key={aluno.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <TableCell className="border p-1 text-left text-xs font-medium">{aluno.nome}</TableCell>
                
                {/* Faltas - 4 colunas vazias */}
                <TableCell className="border p-0 text-center w-4 h-8 text-[8px] bg-red-50"></TableCell>
                <TableCell className="border p-0 text-center w-4 h-8 text-[8px] bg-red-50"></TableCell>
                <TableCell className="border p-0 text-center w-4 h-8 text-[8px] bg-red-50"></TableCell>
                <TableCell className="border p-0 text-center w-4 h-8 text-[8px] bg-red-50"></TableCell>
                
                {/* Semanas 1-5, cada uma com 5 colunas vazias */}
                {/* Semana 1 */}
                <TableCell className="border p-0 text-center w-4 h-8 text-[8px] bg-orange-50"></TableCell>
                <TableCell className="border p-0 text-center w-4 h-8 text-[8px] bg-orange-50"></TableCell>
                <TableCell className="border p-0 text-center w-4 h-8 text-[8px] bg-orange-50"></TableCell>
                <TableCell className="border p-0 text-center w-4 h-8 text-[8px] bg-orange-50"></TableCell>
                <TableCell className="border p-0 text-center w-4 h-8 text-[8px] bg-orange-50"></TableCell>
                
                {/* Semana 2 */}
                <TableCell className="border p-0 text-center w-4 h-8 text-[8px] bg-yellow-50"></TableCell>
                <TableCell className="border p-0 text-center w-4 h-8 text-[8px] bg-yellow-50"></TableCell>
                <TableCell className="border p-0 text-center w-4 h-8 text-[8px] bg-yellow-50"></TableCell>
                <TableCell className="border p-0 text-center w-4 h-8 text-[8px] bg-yellow-50"></TableCell>
                <TableCell className="border p-0 text-center w-4 h-8 text-[8px] bg-yellow-50"></TableCell>
                
                {/* Semana 3 */}
                <TableCell className="border p-0 text-center w-4 h-8 text-[8px] bg-amber-50"></TableCell>
                <TableCell className="border p-0 text-center w-4 h-8 text-[8px] bg-amber-50"></TableCell>
                <TableCell className="border p-0 text-center w-4 h-8 text-[8px] bg-amber-50"></TableCell>
                <TableCell className="border p-0 text-center w-4 h-8 text-[8px] bg-amber-50"></TableCell>
                <TableCell className="border p-0 text-center w-4 h-8 text-[8px] bg-amber-50"></TableCell>
                
                {/* Semana 4 */}
                <TableCell className="border p-0 text-center w-4 h-8 text-[8px] bg-yellow-50"></TableCell>
                <TableCell className="border p-0 text-center w-4 h-8 text-[8px] bg-yellow-50"></TableCell>
                <TableCell className="border p-0 text-center w-4 h-8 text-[8px] bg-yellow-50"></TableCell>
                <TableCell className="border p-0 text-center w-4 h-8 text-[8px] bg-yellow-50"></TableCell>
                <TableCell className="border p-0 text-center w-4 h-8 text-[8px] bg-yellow-50"></TableCell>
                
                {/* Semana 5 */}
                <TableCell className="border p-0 text-center w-4 h-8 text-[8px] bg-orange-50"></TableCell>
                <TableCell className="border p-0 text-center w-4 h-8 text-[8px] bg-orange-50"></TableCell>
                <TableCell className="border p-0 text-center w-4 h-8 text-[8px] bg-orange-50"></TableCell>
                <TableCell className="border p-0 text-center w-4 h-8 text-[8px] bg-orange-50"></TableCell>
                <TableCell className="border p-0 text-center w-4 h-8 text-[8px] bg-orange-50"></TableCell>
              </TableRow>
            ))}
            
            {/* Adicionar linhas vazias extras para preenchimento manual caso necessário */}
            {[...Array(Math.max(0, 20 - alunos.length))].map((_, i) => (
              <TableRow key={`empty-${i}`} className={(i + alunos.length) % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <TableCell className="border p-1 text-left text-xs font-medium h-8"></TableCell>
                
                {/* Faltas - 4 colunas vazias */}
                <TableCell className="border p-0 w-4 h-8 bg-red-50"></TableCell>
                <TableCell className="border p-0 w-4 h-8 bg-red-50"></TableCell>
                <TableCell className="border p-0 w-4 h-8 bg-red-50"></TableCell>
                <TableCell className="border p-0 w-4 h-8 bg-red-50"></TableCell>
                
                {/* 5 semanas x 5 colunas = 25 células vazias */}
                {[...Array(5)].map((_, week) => (
                  React.Children.toArray([...Array(5)].map((_, col) => (
                    <TableCell 
                      className={`border p-0 w-4 h-8 
                        ${week === 0 ? 'bg-orange-50' : 
                          week === 1 || week === 3 ? 'bg-yellow-50' : 
                          week === 2 ? 'bg-amber-50' : 'bg-orange-50'}`}
                    ></TableCell>
                  )))
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Legends - Title */}
      <div className="mt-4 text-xs">
        <div className="font-bold">Legenda:</div>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div>
            <p>Ap = Apostila</p>
            <p>Pág = Página</p>
            <p>Er = Erros</p>
          </div>
          <div>
            <p>Des = Desafio</p>
            <p>Dig = Digitação</p>
          </div>
        </div>
      </div>

      {/* CSS para impressão */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            margin: 0;
            padding: 0;
          }
          table {
            page-break-inside: avoid;
            width: 100%;
          }
          @page {
            size: landscape;
            margin: 1cm;
          }
        }
        .rotate-270 {
          transform: rotate(270deg);
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
};

export default FichaTurmaImprimivel;
