import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, MapPin, Phone, Mail, Edit, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const GerenciamentoUnidades = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: unidades, isLoading } = useQuery({
    queryKey: ['unidades'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .eq('active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: funcionalidadesUnidade } = useQuery({
    queryKey: ['funcionalidades-unidade', selectedUnit?.id],
    queryFn: async () => {
      if (!selectedUnit?.id) return [];
      
      const { data, error } = await supabase
        .from('funcionalidades_unidade')
        .select('*')
        .eq('unit_id', selectedUnit.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedUnit?.id
  });

  const unidadesFiltradas = unidades?.filter(unidade =>
    unidade.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unidade.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unidade.cnpj?.includes(searchTerm)
  ) || [];

  const handleToggleFuncionalidade = async (unitId: string, tipoFuncionalidade: string, ativa: boolean) => {
    try {
      if (ativa) {
        // Ativar funcionalidade
        const { error } = await supabase
          .from('funcionalidades_unidade')
          .upsert({
            unit_id: unitId,
            tipo_funcionalidade: tipoFuncionalidade,
            ativa: true,
            configuracao: {},
            data_habilitacao: new Date().toISOString()
          });
        
        if (error) throw error;
      } else {
        // Desativar funcionalidade
        const { error } = await supabase
          .from('funcionalidades_unidade')
          .update({ ativa: false })
          .eq('unit_id', unitId)
          .eq('tipo_funcionalidade', tipoFuncionalidade);
        
        if (error) throw error;
      }
      
      queryClient.invalidateQueries({ queryKey: ['funcionalidades-unidade'] });
      toast({
        title: "Sucesso",
        description: `Funcionalidade ${ativa ? 'ativada' : 'desativada'} com sucesso`
      });
    } catch (error) {
      console.error('Erro ao alterar funcionalidade:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar a funcionalidade",
        variant: "destructive"
      });
    }
  };

  const funcionalidadesDisponiveis = [
    { key: 'disparo_slack', label: 'Disparo para Slack', description: 'Envio automático de alertas para Slack' },
    { key: 'gestao_estoque', label: 'Gestão de Estoque', description: 'Controle completo de estoque de materiais' },
    { key: 'gestao_eventos', label: 'Gestão de Eventos', description: 'Organização e controle de eventos da unidade' },
    { key: 'relatorios_avancados', label: 'Relatórios Avançados', description: 'Relatórios detalhados e analytics' },
    { key: 'google_agenda', label: 'Integração Google Agenda', description: 'Sincronização com Google Calendar' },
    { key: 'assistente_whatsapp', label: 'Assistente WhatsApp', description: 'Automação de mensagens WhatsApp' },
    { key: 'integracao_telefonia_net2phone', label: 'Integração Net2Phone', description: 'Sistema de telefonia integrado' }
  ];

  if (isLoading) {
    return <div className="p-6">Carregando unidades...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <CardTitle>Gerenciamento de Unidades</CardTitle>
          <CardDescription>Gerencie unidades e suas funcionalidades</CardDescription>
        </div>
        <div className="flex items-center space-x-2 max-w-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar unidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {unidadesFiltradas.map((unidade) => (
          <Card key={unidade.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{unidade.name}</CardTitle>
                <Badge variant="outline">#{unidade.unit_number}</Badge>
              </div>
              <CardDescription className="space-y-1">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  <span className="text-sm">{unidade.city}, {unidade.state}</span>
                </div>
                {unidade.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    <span className="text-sm">{unidade.phone}</span>
                  </div>
                )}
                {unidade.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3" />
                    <span className="text-sm">{unidade.email}</span>
                  </div>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => setSelectedUnit(unidade)}>
                      <Eye className="h-3 w-3 mr-1" />
                      Detalhes
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{unidade.name}</DialogTitle>
                      <DialogDescription>Configurações e funcionalidades da unidade</DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">CNPJ</Label>
                          <p className="text-sm text-muted-foreground">{unidade.cnpj || 'Não informado'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Razão Social</Label>
                          <p className="text-sm text-muted-foreground">{unidade.company_name || 'Não informado'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Endereço</Label>
                          <p className="text-sm text-muted-foreground">
                            {unidade.street}, {unidade.number} - {unidade.neighborhood}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">CEP</Label>
                          <p className="text-sm text-muted-foreground">{unidade.postal_code || 'Não informado'}</p>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-3 block">Funcionalidades</Label>
                        <div className="space-y-3">
                          {funcionalidadesDisponiveis.map((funcionalidade) => {
                            const isAtiva = funcionalidadesUnidade?.some(
                              f => f.tipo_funcionalidade === funcionalidade.key && f.ativa
                            );
                            
                            return (
                              <div key={funcionalidade.key} className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                  <p className="font-medium text-sm">{funcionalidade.label}</p>
                                  <p className="text-xs text-muted-foreground">{funcionalidade.description}</p>
                                </div>
                                <Button
                                  size="sm"
                                  variant={isAtiva ? "default" : "outline"}
                                  onClick={() => handleToggleFuncionalidade(unidade.id, funcionalidade.key, !isAtiva)}
                                >
                                  {isAtiva ? 'Ativar' : 'Desativar'}
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Button variant="outline" size="sm">
                  <Edit className="h-3 w-3 mr-1" />
                  Editar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default GerenciamentoUnidades;