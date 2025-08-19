import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Calendar, RefreshCw, School, UserMinus, User } from "lucide-react";
import { useTurmaModal } from "@/hooks/use-turma-modal";
import { Skeleton } from "@/components/ui/skeleton";
import ReposicaoModal from "./ReposicaoModal";
import AulaExperimentalModal from "./AulaExperimentalModal";
import FaltaFuturaModal from "./FaltaFuturaModal";

interface TurmaModalProps {
  turmaId: string | null;
  isOpen: boolean;
  onClose: () => void;
  dataConsulta?: Date;
}

export const TurmaModal: React.FC<TurmaModalProps> = ({
  turmaId,
  isOpen,
  onClose,
  dataConsulta,
}) => {
  const { data, isLoading, error } = useTurmaModal(turmaId, dataConsulta);
  const [reposicaoModalOpen, setReposicaoModalOpen] = useState(false);
  const [aulaExperimentalModalOpen, setAulaExperimentalModalOpen] = useState(false);
  const [faltaFuturaModalOpen, setFaltaFuturaModalOpen] = useState(false);

  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-destructive">
              Erro ao carregar dados da turma
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Não foi possível carregar os dados da turma. Tente novamente.
          </p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              {isLoading ? (
                <Skeleton className="h-6 w-64" />
              ) : (
                `${data?.turma?.nome || 'Turma'} | ${data?.professor?.nome || 'Professor'}`
              )}
            </DialogTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setReposicaoModalOpen(true)}
                disabled={isLoading || !data?.turma}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Lançar Reposição
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setAulaExperimentalModalOpen(true)}
                disabled={isLoading || !data?.turma}
                className="flex items-center gap-2"
              >
                <School className="h-4 w-4" />
                Lançar Aula Experimental
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setFaltaFuturaModalOpen(true)}
                disabled={isLoading || !data?.turma}
                className="flex items-center gap-2"
              >
                <UserMinus className="h-4 w-4" />
                Lançar Falta Futura
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info da Turma */}
          {isLoading ? (
            <div className="flex gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-36" />
            </div>
          ) : (
            <div className="flex gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{data?.turma?.dia_semana}</span>
              </div>
               <div className="flex items-center gap-2">
                 <School className="h-4 w-4" />
                 <span>Sala {data?.turma?.sala}</span>
               </div>
            </div>
          )}

          {/* Estatísticas */}
          {!isLoading && data?.estatisticas && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Estatísticas da Turma
              </h3>
              <div className="grid grid-cols-5 gap-4">
                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                  <p className="text-2xl font-bold text-blue-600">{data.estatisticas.total_alunos_ativos}</p>
                  <p className="text-sm text-muted-foreground">Alunos Ativos</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                  <p className="text-2xl font-bold text-orange-600">{data.estatisticas.total_funcionarios_ativos}</p>
                  <p className="text-sm text-muted-foreground">Funcionários Ativos</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                  <p className="text-2xl font-bold text-green-600">
                    {data.estatisticas.media_idade ? `${data.estatisticas.media_idade}` : '-'}
                  </p>
                  <p className="text-sm text-muted-foreground">Idade Média</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                  <p className="text-2xl font-bold text-purple-600">
                    {data.estatisticas.media_dias_supera ? `${data.estatisticas.media_dias_supera}` : '-'}
                  </p>
                  <p className="text-sm text-muted-foreground">Dias Médio na Supera</p>
                </div>
                {dataConsulta && (
                  <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                    {(() => {
                      const vagas = Math.max(0, 12 - 
                        data.estatisticas.total_alunos_ativos - 
                        data.estatisticas.total_funcionarios_ativos - 
                        data.estatisticas.total_reposicoes_dia - 
                        data.estatisticas.total_aulas_experimentais_dia +
                        data.estatisticas.total_faltas_futuras_dia
                      );
                      const colorClass = vagas > 5 ? 'text-emerald-600' : 
                                        vagas > 2 ? 'text-amber-600' : 
                                        'text-red-600';
                      return (
                        <>
                          <p className={`text-2xl font-bold ${colorClass}`}>{vagas}</p>
                          <p className="text-sm text-muted-foreground">Vagas do Dia</p>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Lista de Alunos */}
          <div>
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Alunos Ativos ({isLoading ? '...' : data?.alunos?.length || 0})
            </h3>
            
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="flex items-center space-x-3 p-4 border rounded-lg">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data?.alunos?.map((aluno) => (
                  <div
                    key={aluno.id}
                    className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors hover:shadow-md"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={aluno.foto_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {aluno.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{aluno.nome}</p>
                      <div className="space-y-1">
                        {(aluno.idade || aluno.dias_supera) && (
                          <div className="flex gap-3 text-xs text-muted-foreground">
                            {aluno.idade && <span>{aluno.idade} anos</span>}
                            {aluno.dias_supera && <span>{aluno.dias_supera} dias na Supera</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isLoading && (!data?.alunos || data.alunos.length === 0) && (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium mb-2">Nenhum aluno ativo encontrado</p>
                <p className="text-sm">Esta turma não possui alunos ativos no momento.</p>
              </div>
           )}
         </div>

          {/* Lista de Funcionários - Só mostra se houver funcionários */}
          {!isLoading && data?.funcionarios && data.funcionarios.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Funcionários Ativos ({data.funcionarios.length})
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.funcionarios.map((funcionario) => (
                  <div
                    key={funcionario.id}
                    className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors hover:shadow-md border-orange-200 bg-orange-50"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={funcionario.foto_url || undefined} />
                      <AvatarFallback className="bg-orange-100 text-orange-600">
                        {funcionario.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{funcionario.nome}</p>
                      <div className="space-y-1">
                        {funcionario.cargo && (
                          <div className="text-xs text-orange-600 font-medium">
                            <span>{funcionario.cargo}</span>
                          </div>
                        )}
                        {(funcionario.idade || funcionario.dias_supera) && (
                          <div className="flex gap-3 text-xs text-muted-foreground">
                            {funcionario.idade && <span>{funcionario.idade} anos</span>}
                            {funcionario.dias_supera && <span>{funcionario.dias_supera} dias na Supera</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Seção Movimentações do Dia */}
          {dataConsulta && !isLoading && (
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Movimentações do Dia
              </h3>
              
              <Tabs defaultValue="reposicoes" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="reposicoes" className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Reposições ({data?.reposicoes?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="experimentais" className="flex items-center gap-2">
                    <School className="h-4 w-4" />
                    Experimentais ({data?.aulas_experimentais?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="faltas" className="flex items-center gap-2">
                    <UserMinus className="h-4 w-4" />
                    Faltas Futuras ({data?.faltas_futuras?.length || 0})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="reposicoes" className="mt-4">
                  {data?.reposicoes && data.reposicoes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {data.reposicoes.map((aluno) => (
                        <div
                          key={aluno.id}
                          className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors hover:shadow-md border-orange-200 bg-orange-50"
                        >
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={aluno.foto_url || undefined} />
                            <AvatarFallback className="bg-orange-100 text-orange-600">
                              {aluno.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{aluno.nome}</p>
                            <div className="space-y-1">
                              {(aluno.idade || aluno.dias_supera) && (
                                <div className="flex gap-3 text-xs text-muted-foreground">
                                  {aluno.idade && <span>{aluno.idade} anos</span>}
                                  {aluno.dias_supera && <span>{aluno.dias_supera} dias na Supera</span>}
                                </div>
                              )}
                              <div className="flex items-center gap-1 text-xs text-orange-600">
                                <RefreshCw className="h-3 w-3" />
                                <span>Reposição</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                      <RefreshCw className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm font-medium mb-1">Nenhuma reposição para este dia</p>
                      <p className="text-xs">Não há reposições marcadas para {dataConsulta.toLocaleDateString('pt-BR')}.</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="experimentais" className="mt-4">
                  {data?.aulas_experimentais && data.aulas_experimentais.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {data.aulas_experimentais.map((aulaExp) => (
                        <div
                          key={aulaExp.id}
                          className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors hover:shadow-md border-blue-200 bg-blue-50"
                        >
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {aulaExp.cliente_nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{aulaExp.cliente_nome}</p>
                            <div className="space-y-1">
                              {aulaExp.responsavel_nome && (
                                <div className="text-xs text-muted-foreground">
                                  <span>Responsável: {aulaExp.responsavel_nome}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1 text-xs text-blue-600">
                                <School className="h-3 w-3" />
                                <span>Aula Experimental</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                      <School className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm font-medium mb-1">Nenhuma aula experimental para este dia</p>
                      <p className="text-xs">Não há aulas experimentais marcadas para {dataConsulta.toLocaleDateString('pt-BR')}.</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="faltas" className="mt-4">
                  {data?.faltas_futuras && data.faltas_futuras.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {data.faltas_futuras.map((falta) => (
                        <div
                          key={falta.id}
                          className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors hover:shadow-md border-red-200 bg-red-50"
                        >
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={falta.foto_url || undefined} />
                            <AvatarFallback className="bg-red-100 text-red-600">
                              {falta.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{falta.nome}</p>
                            <div className="space-y-1">
                              {falta.responsavel_aviso_nome && (
                                <div className="text-xs text-muted-foreground">
                                  <span>Avisado por: {falta.responsavel_aviso_nome}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1 text-xs text-red-600">
                                <UserMinus className="h-3 w-3" />
                                <span>Falta Futura</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                      <UserMinus className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm font-medium mb-1">Nenhuma falta futura para este dia</p>
                      <p className="text-xs">Não há faltas futuras marcadas para {dataConsulta.toLocaleDateString('pt-BR')}.</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </DialogContent>

      {/* Modal de Reposição */}
      {data?.turma && (
        <ReposicaoModal
          isOpen={reposicaoModalOpen}
          onClose={() => setReposicaoModalOpen(false)}
          turma={{
            id: data.turma.id,
            nome: data.turma.nome,
            dia_semana: data.turma.dia_semana,
            unit_id: data.turma.unit_id || '00000000-0000-0000-0000-000000000000'
          }}
        />
      )}

      {/* Modal de Aula Experimental */}
      {data?.turma && (
        <AulaExperimentalModal
          isOpen={aulaExperimentalModalOpen}
          onClose={() => setAulaExperimentalModalOpen(false)}
          turmaId={data.turma.id}
          turmaNome={data.turma.nome}
          diaSemana={data.turma.dia_semana}
          unitId={data.turma.unit_id || '00000000-0000-0000-0000-000000000000'}
        />
      )}

      {/* Modal de Falta Futura */}
      {data?.turma && (
        <FaltaFuturaModal
          isOpen={faltaFuturaModalOpen}
          onClose={() => setFaltaFuturaModalOpen(false)}
          turmaId={data.turma.id}
          unitId={data.turma.unit_id || '00000000-0000-0000-0000-000000000000'}
          dataConsulta={dataConsulta}
        />
      )}
    </Dialog>
  );
};
