
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();
  
  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onVoltar}
          className={isMobile ? "px-2 py-1 h-8" : ""}
        >
          <ArrowLeft className={`mr-1 ${isMobile ? "h-3.5 w-3.5" : "h-4 w-4"}`} /> 
          <span className={isMobile ? "text-xs" : ""}>Voltar</span>
        </Button>
        <div className={`font-medium truncate max-w-[200px] ${isMobile ? "text-sm" : "text-lg"}`}>
          {aluno.nome}
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-3">
        <Card className={isMobile ? "shadow-sm" : ""}>
          <CardHeader className={isMobile ? "px-3 py-2 pb-1" : "pb-2"}>
            <CardTitle className={isMobile ? "text-sm" : "text-base"}>Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent className={isMobile ? "px-3 py-2" : ""}>
            <dl className="space-y-1.5">
              <div className="flex justify-between">
                <dt className={`font-medium text-muted-foreground ${isMobile ? "text-xs" : ""}`}>Código:</dt>
                <dd className={isMobile ? "text-xs" : ""}>{aluno.codigo || 'Não informado'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className={`font-medium text-muted-foreground ${isMobile ? "text-xs" : ""}`}>Idade:</dt>
                <dd className={isMobile ? "text-xs" : ""}>{aluno.idade !== null ? aluno.idade : 'Não informada'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className={`font-medium text-muted-foreground ${isMobile ? "text-xs" : ""}`}>Email:</dt>
                <dd className={`break-all ${isMobile ? "text-xs" : ""}`}>{aluno.email || 'Não informado'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className={`font-medium text-muted-foreground ${isMobile ? "text-xs" : ""}`}>Telefone:</dt>
                <dd className={isMobile ? "text-xs" : ""}>{aluno.telefone || 'Não informado'}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        
        <Card className={isMobile ? "shadow-sm" : ""}>
          <CardHeader className={isMobile ? "px-3 py-2 pb-1" : "pb-2"}>
            <CardTitle className={isMobile ? "text-sm" : "text-base"}>Informações Acadêmicas</CardTitle>
          </CardHeader>
          <CardContent className={isMobile ? "px-3 py-2" : ""}>
            <dl className="space-y-1.5">
              <div className="flex justify-between">
                <dt className={`font-medium text-muted-foreground ${isMobile ? "text-xs" : ""}`}>Curso:</dt>
                <dd className={isMobile ? "text-xs" : ""}>{aluno.curso || 'Não informado'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className={`font-medium text-muted-foreground ${isMobile ? "text-xs" : ""}`}>Matrícula:</dt>
                <dd className={isMobile ? "text-xs" : ""}>{aluno.matricula || 'Não informada'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className={`font-medium text-muted-foreground ${isMobile ? "text-xs" : ""}`}>Último nível:</dt>
                <dd className={isMobile ? "text-xs" : ""}>{aluno.ultimo_nivel || 'Não informado'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className={`font-medium text-muted-foreground ${isMobile ? "text-xs" : ""}`}>Dias na apostila:</dt>
                <dd className={isMobile ? "text-xs" : ""}>{aluno.dias_apostila !== null ? aluno.dias_apostila : 'Não informado'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className={`font-medium text-muted-foreground ${isMobile ? "text-xs" : ""}`}>Dias no Supera:</dt>
                <dd className={isMobile ? "text-xs" : ""}>{aluno.dias_supera !== null ? aluno.dias_supera : 'Não informado'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className={`font-medium text-muted-foreground ${isMobile ? "text-xs" : ""}`}>Vencimento do contrato:</dt>
                <dd className={isMobile ? "text-xs" : ""}>{aluno.vencimento_contrato || 'Não informado'}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AlunoDetail;
