
import React from 'react';
import { useAlunos } from '@/hooks/use-alunos';
import { Button } from "@/components/ui/button";
import { AlunosLista } from '@/components/alunos/AlunosLista';
import { DetalhesAlunoModal } from '@/components/alunos/DetalhesAlunoModal';

export default function Alunos() {
  const { alunos, alunoDetalhes, mostrarDetalhesAluno, fecharDetalhesAluno } = useAlunos();

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Alunos</h1>
      </div>
      
      <AlunosLista 
        alunos={alunos} 
        onAlunoClick={mostrarDetalhesAluno} 
      />

      {alunoDetalhes && (
        <DetalhesAlunoModal
          aluno={alunoDetalhes}
          onClose={fecharDetalhesAluno}
        />
      )}
    </div>
  );
}
