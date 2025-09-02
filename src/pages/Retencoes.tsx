import React, { useState } from 'react';
import { Search, Filter, Users, AlertTriangle, Shield } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlunoRetencaoCard } from '@/components/retencoes/AlunoRetencaoCard';
import { HistoricoAlunoModal } from '@/components/retencoes/HistoricoAlunoModal';
import { useRetencoesHistorico } from '@/hooks/use-retencoes-historico';

export default function Retencoes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [selectedAluno, setSelectedAluno] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { 
    alunos, 
    loading, 
    error,
    totals 
  } = useRetencoesHistorico({ searchTerm, statusFilter });

  const handleAlunoClick = (aluno: any) => {
    setSelectedAluno(aluno);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedAluno(null);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-muted-foreground">Carregando...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-destructive">Erro ao carregar dados: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-primary">Gestão de Retenções</h1>
            <Badge variant="secondary" className="text-sm">
              {alunos.length} alunos
            </Badge>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totals.totalAlunos}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Alertas Ativos</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{totals.alertasAtivos}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Com Retenções</CardTitle>
                <Shield className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{totals.comRetencoes}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Críticos</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{totals.criticos}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por nome do aluno..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="alertas-ativos">Alertas Ativos</SelectItem>
              <SelectItem value="com-retencoes">Com Retenções</SelectItem>
              <SelectItem value="criticos">Críticos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Student Cards Grid */}
        {alunos.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground text-lg">
              Nenhum aluno encontrado com os filtros aplicados.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {alunos.map((aluno) => (
              <AlunoRetencaoCard
                key={aluno.id}
                aluno={aluno}
                onClick={() => handleAlunoClick(aluno)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Student History Modal */}
      <HistoricoAlunoModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        aluno={selectedAluno}
      />
    </>
  );
}