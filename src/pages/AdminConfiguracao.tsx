import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Database, FileSpreadsheet, Users } from "lucide-react";
import AdminDadosImportantesForm from '@/components/AdminDadosImportantesForm';
import XlsUploadComponent from '@/components/sync/XlsUploadComponent';
import XlsSyncStatus from '@/components/sync/XlsSyncStatus';
import { VincularProfessorModal } from '@/components/admin/VincularProfessorModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface UsuarioSemVinculo {
  id: string;
  full_name: string | null;
  email: string | null;
  professor_id: string | null;
  professor_nome?: string | null;
}

const AdminConfiguracao = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UsuarioSemVinculo | null>(null);
  const queryClient = useQueryClient();

  // ID da unidade de Maringá
  const MARINGA_UNIT_ID = '0df79a04-444e-46ee-b218-59e4b1835f4a';

  // Buscar usuários de Maringá (via unit_users) ou sem nenhuma unidade
  const { data: usuarios, isLoading } = useQuery({
    queryKey: ['usuarios-vinculos-professor', MARINGA_UNIT_ID],
    queryFn: async () => {
      // 1. Buscar todos os usuários com seus vínculos
      const { data: allProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          professor_id,
          professores (
            nome
          )
        `)
        .order('full_name');

      if (profilesError) throw profilesError;

      // 2. Buscar usuários que pertencem a Maringá via unit_users
      const { data: unitUsersMaringa, error: unitUsersError } = await supabase
        .from('unit_users')
        .select('user_id')
        .eq('unit_id', MARINGA_UNIT_ID)
        .eq('active', true);

      if (unitUsersError) throw unitUsersError;

      const userIdsMaringa = new Set(unitUsersMaringa?.map(u => u.user_id) || []);

      // 3. Buscar todos os user_ids que têm alguma unidade
      const { data: allUnitUsers, error: allUnitUsersError } = await supabase
        .from('unit_users')
        .select('user_id')
        .eq('active', true);

      if (allUnitUsersError) throw allUnitUsersError;

      const userIdsComUnidade = new Set(allUnitUsers?.map(u => u.user_id) || []);

      // 4. Filtrar: usuários de Maringá OU sem nenhuma unidade
      const usuariosFiltrados = allProfiles?.filter(u => {
        const pertenceMaringa = userIdsMaringa.has(u.id);
        const semUnidade = !userIdsComUnidade.has(u.id);
        return pertenceMaringa || semUnidade;
      });

      return usuariosFiltrados?.map(u => ({
        id: u.id,
        full_name: u.full_name,
        email: u.email,
        professor_id: u.professor_id,
        professor_nome: u.professores?.nome || null
      })) as UsuarioSemVinculo[];
    },
  });

  // Mutation para desvincular professor
  const desvincularMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ professor_id: null })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios-vinculos-professor'] });
    },
  });

  const handleVincular = (usuario: UsuarioSemVinculo) => {
    setSelectedUser(usuario);
    setModalOpen(true);
  };

  const handleDesvincular = (userId: string) => {
    desvincularMutation.mutate(userId);
  };

  const usuariosSemVinculo = usuarios?.filter(u => !u.professor_id) || [];
  const usuariosComVinculo = usuarios?.filter(u => u.professor_id) || [];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-azul-500">Configurações do Sistema</h1>
      
      <Tabs defaultValue="dados">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="dados" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span>Dados Importantes</span>
          </TabsTrigger>
          <TabsTrigger value="vinculos" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Vínculos Professor</span>
          </TabsTrigger>
          <TabsTrigger value="sync-xls" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            <span>Sincronização XLS</span>
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Configurações Gerais</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="dados">
          <AdminDadosImportantesForm />
        </TabsContent>

        <TabsContent value="vinculos">
          <div className="space-y-6">
            {/* Usuários sem vínculo */}
            <Card className="p-4">
              <h3 className="text-lg font-medium mb-4">
                Usuários sem Professor Vinculado
                {usuariosSemVinculo.length > 0 && (
                  <Badge variant="secondary" className="ml-2">{usuariosSemVinculo.length}</Badge>
                )}
              </h3>
              
              {isLoading ? (
                <p className="text-muted-foreground">Carregando...</p>
              ) : usuariosSemVinculo.length === 0 ? (
                <p className="text-muted-foreground text-sm">Todos os usuários estão vinculados.</p>
              ) : (
                <div className="space-y-2">
                  {usuariosSemVinculo.map((usuario) => (
                    <div
                      key={usuario.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{usuario.full_name || 'Sem nome'}</p>
                        <p className="text-sm text-muted-foreground">{usuario.email}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleVincular(usuario)}
                      >
                        Vincular
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Usuários com vínculo */}
            <Card className="p-4">
              <h3 className="text-lg font-medium mb-4">
                Usuários Vinculados
                {usuariosComVinculo.length > 0 && (
                  <Badge variant="default" className="ml-2">{usuariosComVinculo.length}</Badge>
                )}
              </h3>
              
              {isLoading ? (
                <p className="text-muted-foreground">Carregando...</p>
              ) : usuariosComVinculo.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhum usuário vinculado.</p>
              ) : (
                <div className="space-y-2">
                  {usuariosComVinculo.map((usuario) => (
                    <div
                      key={usuario.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{usuario.full_name || 'Sem nome'}</p>
                        <p className="text-sm text-muted-foreground">{usuario.email}</p>
                        <p className="text-sm text-primary">Professor: {usuario.professor_nome}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDesvincular(usuario.id)}
                        disabled={desvincularMutation.isPending}
                      >
                        Desvincular
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="sync-xls">
          <div className="space-y-6">
            <XlsUploadComponent />
            <XlsSyncStatus />
          </div>
        </TabsContent>
        
        <TabsContent value="config">
          <Card className="p-6">
            <h3 className="text-lg font-medium">Configurações Gerais</h3>
            <p className="text-muted-foreground">Funcionalidade em desenvolvimento.</p>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedUser && (
        <VincularProfessorModal
          open={modalOpen}
          onOpenChange={(open) => {
            setModalOpen(open);
            if (!open) setSelectedUser(null);
          }}
          userId={selectedUser.id}
          userName={selectedUser.full_name || selectedUser.email || 'Usuário'}
        />
      )}
    </div>
  );
};

export default AdminConfiguracao;
