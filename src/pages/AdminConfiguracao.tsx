import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, DoorOpen } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VincularProfessorModal } from '@/components/admin/VincularProfessorModal';
import SalasManager from '@/components/admin/SalasManager';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useActiveUnit } from '@/contexts/ActiveUnitContext';

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
  const { activeUnit } = useActiveUnit();

  const unitId = activeUnit?.id;

  // Buscar usuários da unidade ativa
  const { data: usuarios, isLoading } = useQuery({
    queryKey: ['usuarios-vinculos-professor', unitId],
    queryFn: async () => {
      if (!unitId) return [];

      // 1. Buscar usuários que pertencem à unidade ativa via unit_users
      const { data: unitUsersData, error: unitUsersError } = await supabase
        .from('unit_users')
        .select('user_id')
        .eq('unit_id', unitId)
        .eq('active', true);

      if (unitUsersError) throw unitUsersError;

      const userIds = unitUsersData?.map(u => u.user_id) || [];
      if (userIds.length === 0) return [];

      // 2. Buscar perfis desses usuários
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          professor_id,
          access_blocked,
          professores (
            nome
          )
        `)
        .in('id', userIds)
        .or('access_blocked.is.null,access_blocked.eq.false')
        .order('full_name');

      if (profilesError) throw profilesError;

      return profiles?.map(u => ({
        id: u.id,
        full_name: u.full_name,
        email: u.email,
        professor_id: u.professor_id,
        professor_nome: u.professores?.nome || null
      })) as UsuarioSemVinculo[];
    },
    enabled: !!unitId,
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
      <h1 className="text-2xl font-bold text-foreground mb-6">Configurações</h1>

      <Tabs defaultValue="vinculos">
        <TabsList>
          <TabsTrigger value="vinculos">
            <Users className="h-4 w-4 mr-2" />
            Vínculos Professor
          </TabsTrigger>
          <TabsTrigger value="salas">
            <DoorOpen className="h-4 w-4 mr-2" />
            Salas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vinculos" className="mt-4">
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

        <TabsContent value="salas" className="mt-4">
          <SalasManager />
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
