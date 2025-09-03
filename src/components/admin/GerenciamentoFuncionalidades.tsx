import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Settings, CheckCircle, XCircle, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const GerenciamentoFuncionalidades = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [novaFuncionalidade, setNovaFuncionalidade] = useState('');
  const [novaDescricao, setNovaDescricao] = useState('');
  const [configGlobal, setConfigGlobal] = useState('{}');
  const queryClient = useQueryClient();

  const { data: unidades } = useQuery({
    queryKey: ['unidades-funcionalidades'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('units')
        .select('id, name, unit_number')
        .eq('active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: funcionalidadesResumo } = useQuery({
    queryKey: ['funcionalidades-resumo'],
    queryFn: async () => {
      const { data: allFuncionalidades, error } = await supabase
        .from('funcionalidades_unidade')
        .select(`
          tipo_funcionalidade,
          ativa,
          unit_id,
          units!inner(name, unit_number)
        `);
      
      if (error) throw error;

      // Agrupar por tipo de funcionalidade
      const resumo = allFuncionalidades.reduce((acc: any, func: any) => {
        if (!acc[func.tipo_funcionalidade]) {
          acc[func.tipo_funcionalidade] = {
            tipo: func.tipo_funcionalidade,
            unidadesAtivas: [],
            unidadesInativas: [],
            totalUnidades: 0
          };
        }
        
        acc[func.tipo_funcionalidade].totalUnidades++;
        
        if (func.ativa) {
          acc[func.tipo_funcionalidade].unidadesAtivas.push({
            id: func.unit_id,
            name: func.units.name,
            unit_number: func.units.unit_number
          });
        } else {
          acc[func.tipo_funcionalidade].unidadesInativas.push({
            id: func.unit_id,
            name: func.units.name,
            unit_number: func.units.unit_number
          });
        }
        
        return acc;
      }, {});

      return Object.values(resumo);
    }
  });

  const funcionalidadesInfo = {
    'disparo_slack': { 
      label: 'Disparo para Slack', 
      description: 'Envio automático de alertas e notificações para canais do Slack',
      icon: '📢'
    },
    'gestao_estoque': { 
      label: 'Gestão de Estoque', 
      description: 'Controle completo de estoque de materiais, livros e apostilas',
      icon: '📦'
    },
    'gestao_eventos': { 
      label: 'Gestão de Eventos', 
      description: 'Organização e controle de eventos, workshops e palestras',
      icon: '🎪'
    },
    'relatorios_avancados': { 
      label: 'Relatórios Avançados', 
      description: 'Relatórios detalhados e analytics avançados',
      icon: '📊'
    },
    'google_agenda': { 
      label: 'Integração Google Agenda', 
      description: 'Sincronização com Google Calendar e agendamento automático',
      icon: '📅'
    },
    'assistente_whatsapp': { 
      label: 'Assistente WhatsApp', 
      description: 'Automação de mensagens e atendimento via WhatsApp',
      icon: '💬'
    },
    'integracao_telefonia_net2phone': { 
      label: 'Integração Net2Phone', 
      description: 'Sistema de telefonia integrado com Net2Phone',
      icon: '📞'
    }
  };

  const handleAtivarParaTodasUnidades = async (tipoFuncionalidade: string) => {
    try {
      if (!unidades) return;
      
      const promises = unidades.map(unidade => 
        supabase.from('funcionalidades_unidade').upsert({
          unit_id: unidade.id,
          tipo_funcionalidade: tipoFuncionalidade as any,
          ativa: true,
          configuracao: {},
          data_habilitacao: new Date().toISOString()
        })
      );
      
      await Promise.all(promises);
      
      queryClient.invalidateQueries({ queryKey: ['funcionalidades-resumo'] });
      toast({
        title: "Sucesso",
        description: `${funcionalidadesInfo[tipoFuncionalidade as keyof typeof funcionalidadesInfo]?.label} ativada para todas as unidades`
      });
    } catch (error) {
      console.error('Erro ao ativar funcionalidade:', error);
      toast({
        title: "Erro",
        description: "Não foi possível ativar a funcionalidade para todas as unidades",
        variant: "destructive"
      });
    }
  };

  const handleDesativarParaTodasUnidades = async (tipoFuncionalidade: string) => {
    try {
      const { error } = await supabase
        .from('funcionalidades_unidade')
        .update({ ativa: false })
        .eq('tipo_funcionalidade', tipoFuncionalidade as any);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['funcionalidades-resumo'] });
      toast({
        title: "Sucesso",
        description: `${funcionalidadesInfo[tipoFuncionalidade as keyof typeof funcionalidadesInfo]?.label} desativada para todas as unidades`
      });
    } catch (error) {
      console.error('Erro ao desativar funcionalidade:', error);
      toast({
        title: "Erro",
        description: "Não foi possível desativar a funcionalidade",
        variant: "destructive"
      });
    }
  };

  const funcionalidadesFiltradas = funcionalidadesResumo?.filter((func: any) =>
    funcionalidadesInfo[func.tipo as keyof typeof funcionalidadesInfo]?.label
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <CardTitle>Gerenciamento de Funcionalidades</CardTitle>
          <CardDescription>Configure funcionalidades disponíveis para cada unidade</CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 max-w-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar funcionalidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Alert>
        <Settings className="h-4 w-4" />
        <AlertDescription>
          <strong>Como funciona:</strong> Ative ou desative funcionalidades específicas para cada unidade. 
          Funcionalidades desabilitadas não aparecerão nos menus dos usuários daquela unidade.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 gap-4">
        {funcionalidadesFiltradas.map((funcionalidade: any) => {
          const info = funcionalidadesInfo[funcionalidade.tipo as keyof typeof funcionalidadesInfo];
          const unidadesAtivas = funcionalidade.unidadesAtivas?.length || 0;
          const totalUnidades = unidades?.length || 0;
          
          return (
            <Card key={funcionalidade.tipo} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">{info?.icon}</div>
                    <div>
                      <h3 className="font-semibold text-lg">{info?.label}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{info?.description}</p>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{unidadesAtivas} unidades ativas</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{totalUnidades - unidadesAtivas} unidades inativas</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge variant={unidadesAtivas === totalUnidades ? "default" : "secondary"}>
                      {unidadesAtivas}/{totalUnidades} unidades
                    </Badge>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAtivarParaTodasUnidades(funcionalidade.tipo)}
                    >
                      Ativar Todas
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDesativarParaTodasUnidades(funcionalidade.tipo)}
                    >
                      Desativar Todas
                    </Button>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-medium text-green-600 mb-1 block">UNIDADES ATIVAS</Label>
                      <div className="flex flex-wrap gap-1">
                        {funcionalidade.unidadesAtivas?.map((unidade: any) => (
                          <Badge key={unidade.id} variant="outline" className="text-xs">
                            #{unidade.unit_number} {unidade.name}
                          </Badge>
                        ))}
                        {funcionalidade.unidadesAtivas?.length === 0 && (
                          <span className="text-xs text-muted-foreground">Nenhuma unidade ativa</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-500 mb-1 block">UNIDADES INATIVAS</Label>
                      <div className="flex flex-wrap gap-1">
                        {funcionalidade.unidadesInativas?.map((unidade: any) => (
                          <Badge key={unidade.id} variant="secondary" className="text-xs">
                            #{unidade.unit_number} {unidade.name}
                          </Badge>
                        ))}
                        {funcionalidade.unidadesInativas?.length === 0 && (
                          <span className="text-xs text-muted-foreground">Todas as unidades estão ativas</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default GerenciamentoFuncionalidades;