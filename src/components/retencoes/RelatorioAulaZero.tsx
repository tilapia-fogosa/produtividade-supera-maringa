import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, User, FileText, Target, Award, AlertCircle } from 'lucide-react';

interface RelatorioAulaZeroProps {
  dadosAulaZero: any;
  loading: boolean;
}

export function RelatorioAulaZero({ dadosAulaZero, loading }: RelatorioAulaZeroProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-muted-foreground">Carregando dados da aula zero...</div>
      </div>
    );
  }

  if (!dadosAulaZero) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nenhum dado de aula zero encontrado para este aluno.</p>
        <p className="text-sm mt-2">Os dados da aula zero são preenchidos durante o primeiro contato com o aluno.</p>
      </div>
    );
  }

  const temDados = dadosAulaZero.motivo_procura || 
                   dadosAulaZero.percepcao_coordenador || 
                   dadosAulaZero.avaliacao_abaco || 
                   dadosAulaZero.avaliacao_ah || 
                   dadosAulaZero.pontos_atencao ||
                   dadosAulaZero.coordenador_responsavel;

  if (!temDados) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Dados da aula zero não foram preenchidos para este aluno.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Relatório da Aula Zero</h3>
        <Badge className="bg-green-500 text-white">
          <BookOpen className="h-3 w-3 mr-1" />
          Disponível
        </Badge>
      </div>

      <div className="grid gap-6">
        {/* Motivo da Procura */}
        {dadosAulaZero.motivo_procura && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-base">
                <Target className="h-4 w-4 text-blue-500" />
                <span>Motivo da Procura</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {dadosAulaZero.motivo_procura}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Percepção do Coordenador */}
        {dadosAulaZero.percepcao_coordenador && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-base">
                <User className="h-4 w-4 text-purple-500" />
                <span>Percepção do Coordenador</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {dadosAulaZero.percepcao_coordenador}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Avaliações */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Avaliação Ábaco */}
          {dadosAulaZero.avaliacao_abaco && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-base">
                  <Award className="h-4 w-4 text-green-500" />
                  <span>Avaliação no Ábaco</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {dadosAulaZero.avaliacao_abaco}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Avaliação AH */}
          {dadosAulaZero.avaliacao_ah && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-base">
                  <Award className="h-4 w-4 text-orange-500" />
                  <span>Avaliação no AH</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {dadosAulaZero.avaliacao_ah}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Pontos de Atenção */}
        {dadosAulaZero.pontos_atencao && (
          <Card className="border-yellow-200 bg-yellow-50/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-base">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span>Pontos de Atenção</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {dadosAulaZero.pontos_atencao}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Coordenador Responsável */}
        {dadosAulaZero.coordenador_responsavel && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-base">
                <User className="h-4 w-4 text-blue-500" />
                <span>Coordenador Responsável</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">
                {dadosAulaZero.coordenador_responsavel}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Informações Adicionais */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-base">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span>Informações</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Os dados da aula zero são coletados durante a primeira avaliação do aluno e servem como base 
            para acompanhar o desenvolvimento e identificar possíveis pontos de atenção ao longo do curso.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}