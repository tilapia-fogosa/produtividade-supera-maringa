
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

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

interface AlunoDetailProps {
  aluno: Aluno;
  onVoltar: () => void;
}

const AlunoDetail: React.FC<AlunoDetailProps> = ({ aluno, onVoltar }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onVoltar}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para lista
        </Button>
        <div className="text-lg font-medium truncate">
          {aluno.nome}
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="font-medium text-muted-foreground">Código:</dt>
                <dd>{aluno.codigo || 'Não informado'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-muted-foreground">Idade:</dt>
                <dd>{aluno.idade !== null ? aluno.idade : 'Não informada'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-muted-foreground">Email:</dt>
                <dd className="break-all">{aluno.email || 'Não informado'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-muted-foreground">Telefone:</dt>
                <dd>{aluno.telefone || 'Não informado'}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Informações Acadêmicas</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="font-medium text-muted-foreground">Curso:</dt>
                <dd>{aluno.curso || 'Não informado'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-muted-foreground">Matrícula:</dt>
                <dd>{aluno.matricula || 'Não informada'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-muted-foreground">Último nível:</dt>
                <dd>{aluno.ultimo_nivel || 'Não informado'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-muted-foreground">Dias na apostila:</dt>
                <dd>{aluno.dias_apostila !== null ? aluno.dias_apostila : 'Não informado'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-muted-foreground">Dias no Supera:</dt>
                <dd>{aluno.dias_supera !== null ? aluno.dias_supera : 'Não informado'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-muted-foreground">Vencimento do contrato:</dt>
                <dd>{aluno.vencimento_contrato || 'Não informado'}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AlunoDetail;
