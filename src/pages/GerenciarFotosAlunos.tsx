import React from 'react';
import { Camera, Users, Filter, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FotoUpload } from '@/components/alunos/FotoUpload';
import { useFotosAlunos } from '@/hooks/use-fotos-alunos';
import { cn } from '@/lib/utils';

export default function GerenciarFotosAlunos() {
  const { 
    alunos, 
    loading, 
    contadores, 
    filtroComFoto, 
    setFiltroComFoto, 
    atualizarFotoAluno 
  } = useFotosAlunos();

  const obterIniciais = (nome: string) => {
    return nome
      .split(' ')
      .filter(part => part.length > 0)
      .slice(0, 2)
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className="container max-w-6xl mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando alunos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto p-4 space-y-6">
      {/* Cabeçalho */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Camera className="h-6 w-6" />
            Gerenciar Fotos dos Alunos
          </h1>
          <p className="text-muted-foreground">
            Visualize e gerencie as fotos de perfil dos alunos ativos
          </p>
        </div>

        {/* Contadores e Filtros */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-wrap gap-4">
            <Card className="px-4 py-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Total: {contadores.total}</span>
              </div>
            </Card>
            
            <Card className="px-4 py-2">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Com Foto: {contadores.comFoto}</span>
              </div>
            </Card>
            
            <Card className="px-4 py-2">
              <div className="flex items-center gap-2">
                <X className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">Sem Foto: {contadores.semFoto}</span>
              </div>
            </Card>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <Select
              value={filtroComFoto === null ? 'todos' : filtroComFoto ? 'com-foto' : 'sem-foto'}
              onValueChange={(value) => {
                if (value === 'todos') setFiltroComFoto(null);
                else if (value === 'com-foto') setFiltroComFoto(true);
                else setFiltroComFoto(false);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filtrar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Alunos</SelectItem>
                <SelectItem value="com-foto">Apenas Com Foto</SelectItem>
                <SelectItem value="sem-foto">Apenas Sem Foto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Lista de Alunos */}
      {alunos.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum aluno encontrado</h3>
            <p className="text-muted-foreground">
              {filtroComFoto === null 
                ? 'Não há alunos ativos cadastrados'
                : filtroComFoto 
                ? 'Nenhum aluno possui foto cadastrada'
                : 'Todos os alunos já possuem foto'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:gap-6">
          {alunos.map((aluno) => (
            <Card key={aluno.id} className="overflow-hidden">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row gap-4 items-start">
                  {/* Foto do Aluno */}
                  <div className="flex-shrink-0">
                    <FotoUpload
                      alunoId={aluno.id}
                      alunoNome={aluno.nome}
                      fotoUrl={aluno.foto_url}
                      onFotoUpdate={async (novaUrl) => {
                        const sucesso = await atualizarFotoAluno(aluno.id, novaUrl);
                        return sucesso;
                      }}
                    />
                  </div>

                  {/* Informações do Aluno */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                      <h3 className="text-lg font-semibold truncate">{aluno.nome}</h3>
                      <Badge 
                        variant={aluno.tem_foto ? "default" : "secondary"}
                        className={cn(
                          "w-fit",
                          aluno.tem_foto 
                            ? "bg-green-100 text-green-800 border-green-200" 
                            : "bg-red-100 text-red-800 border-red-200"
                        )}
                      >
                        {aluno.tem_foto ? (
                          <Check className="h-3 w-3 mr-1" />
                        ) : (
                          <X className="h-3 w-3 mr-1" />
                        )}
                        {aluno.tem_foto ? 'Com Foto' : 'Sem Foto'}
                      </Badge>
                    </div>

                    <div className="space-y-1 text-sm text-muted-foreground">
                      {aluno.turma_nome && (
                        <p><span className="font-medium">Turma:</span> {aluno.turma_nome}</p>
                      )}
                      {aluno.telefone && (
                        <p><span className="font-medium">Telefone:</span> {aluno.telefone}</p>
                      )}
                      {aluno.email && (
                        <p><span className="font-medium">Email:</span> {aluno.email}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}