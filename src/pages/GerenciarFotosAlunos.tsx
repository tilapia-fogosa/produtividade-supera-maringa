import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Camera, Users } from "lucide-react";
import { FotoUpload } from "@/components/alunos/FotoUpload";
import { useAlunosAtivos } from "@/hooks/use-alunos-ativos";

export default function GerenciarFotosAlunos() {
  const { alunos, loading, error, atualizarFoto } = useAlunosAtivos();
  const [filtrarComFoto, setFiltrarComFoto] = useState(false);

  // Calcular estatísticas
  const stats = useMemo(() => {
    const comFoto = alunos.filter(aluno => aluno.foto_url).length;
    const semFoto = alunos.length - comFoto;
    return { comFoto, semFoto, total: alunos.length };
  }, [alunos]);

  // Filtrar alunos baseado no estado do filtro
  const alunosFiltrados = useMemo(() => {
    if (!filtrarComFoto) return alunos;
    return alunos.filter(aluno => aluno.foto_url);
  }, [alunos, filtrarComFoto]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Carregando alunos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-6">
          <div className="text-center">
            <p className="text-destructive font-medium">Erro ao carregar dados</p>
            <p className="text-muted-foreground mt-2">{error}</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Cabeçalho com estatísticas e filtros */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Gerenciar Fotos dos Alunos</h1>
            <p className="text-muted-foreground">
              Controle e gerencie as fotos de todos os alunos ativos
            </p>
          </div>
          
          {/* Filtro */}
          <div className="flex items-center space-x-2">
            <Switch
              id="filtrar-com-foto"
              checked={filtrarComFoto}
              onCheckedChange={setFiltrarComFoto}
            />
            <Label htmlFor="filtrar-com-foto">
              Mostrar apenas com foto
            </Label>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="p-2 bg-primary/10 rounded-full">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Alunos</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                <Camera className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Com Foto</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.comFoto}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                <Camera className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sem Foto</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {stats.semFoto}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Lista de alunos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {filtrarComFoto ? 'Alunos com Foto' : 'Todos os Alunos'} 
            <span className="ml-2 text-muted-foreground">
              ({alunosFiltrados.length})
            </span>
          </h2>
        </div>

        {alunosFiltrados.length === 0 ? (
          <Card className="p-8">
            <div className="text-center">
              <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">
                {filtrarComFoto ? 'Nenhum aluno com foto encontrado' : 'Nenhum aluno encontrado'}
              </p>
              <p className="text-muted-foreground">
                {filtrarComFoto 
                  ? 'Tente desativar o filtro para ver todos os alunos'
                  : 'Verifique se há alunos cadastrados no sistema'
                }
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {alunosFiltrados.map((aluno) => (
              <Card key={aluno.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-sm font-medium truncate">
                        {aluno.nome}
                      </CardTitle>
                      {aluno.turma_nome && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {aluno.turma_nome}
                        </p>
                      )}
                    </div>
                    <Badge variant={aluno.foto_url ? "default" : "secondary"} className="text-xs">
                      {aluno.foto_url ? "Com foto" : "Sem foto"}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="flex flex-col items-center space-y-3">
                    <FotoUpload
                      alunoId={aluno.id}
                      alunoNome={aluno.nome}
                      fotoUrl={aluno.foto_url}
                      onFotoUpdate={(novaFotoUrl) => atualizarFoto(aluno.id, novaFotoUrl)}
                    />
                    
                    {aluno.professor_nome && (
                      <p className="text-xs text-muted-foreground text-center">
                        Prof.: {aluno.professor_nome}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}