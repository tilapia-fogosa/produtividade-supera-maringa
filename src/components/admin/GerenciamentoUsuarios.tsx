import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Mail, Shield, Users, Edit, MoreVertical } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const GerenciamentoUsuarios = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [filterRole, setFilterRole] = useState<string>('all');
  const queryClient = useQueryClient();

  const { data: usuarios, isLoading } = useQuery({
    queryKey: ['usuarios-admin'],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');
      
      if (profilesError) throw profilesError;

      // Buscar unit_users para cada usuário
      const usuariosComUnidades = await Promise.all(
        profiles.map(async (profile) => {
          const { data: unitUsers, error: unitError } = await supabase
            .from('unit_users')
            .select(`
              role,
              active,
              unit_id,
              units!inner(name)
            `)
            .eq('user_id', profile.id);
          
          if (unitError) console.error('Erro ao buscar unidades:', unitError);
          
          return {
            ...profile,
            unit_users: unitUsers || []
          };
        })
      );

      return usuariosComUnidades;
    }
  });

  const { data: unidades } = useQuery({
    queryKey: ['unidades-select'],
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

  const usuariosFiltrados = usuarios?.filter(usuario => {
    const matchesSearch = 
      usuario.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = 
      filterRole === 'all' || 
      usuario.unit_users?.some((uu: any) => uu.role === filterRole) ||
      (filterRole === 'admin' && usuario.is_admin);
    
    return matchesSearch && matchesRole;
  }) || [];

  const handleToggleAdmin = async (userId: string, isAdmin: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: !isAdmin })
        .eq('id', userId);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['usuarios-admin'] });
      toast({
        title: "Sucesso",
        description: `Permissão de admin ${!isAdmin ? 'concedida' : 'removida'} com sucesso`
      });
    } catch (error) {
      console.error('Erro ao alterar permissão:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar a permissão",
        variant: "destructive"
      });
    }
  };

  const handleChangeUserRole = async (userId: string, unitId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('unit_users')
        .update({ role: newRole })
        .eq('user_id', userId)
        .eq('unit_id', unitId);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['usuarios-admin'] });
      toast({
        title: "Sucesso",
        description: "Role do usuário atualizada com sucesso"
      });
    } catch (error) {
      console.error('Erro ao alterar role:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar a role",
        variant: "destructive"
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'default';
      case 'franqueado': return 'secondary';
      case 'gestor_pedagogico': return 'outline';
      case 'educador': return 'destructive';
      case 'consultor': return 'outline';
      default: return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'franqueado': return 'Franqueado';
      case 'gestor_pedagogico': return 'Gestor Pedagógico';
      case 'educador': return 'Educador';
      case 'consultor': return 'Consultor';
      default: return role;
    }
  };

  if (isLoading) {
    return <div className="p-6">Carregando usuários...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <CardTitle>Gerenciamento de Usuários</CardTitle>
          <CardDescription>Gerencie usuários, roles e permissões</CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os usuários</SelectItem>
              <SelectItem value="admin">Administradores</SelectItem>
              <SelectItem value="franqueado">Franqueados</SelectItem>
              <SelectItem value="gestor_pedagogico">Gestores Pedagógicos</SelectItem>
              <SelectItem value="educador">Educadores</SelectItem>
              <SelectItem value="consultor">Consultores</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center space-x-2 max-w-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {usuariosFiltrados.map((usuario) => (
          <Card key={usuario.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{usuario.full_name || 'Nome não definido'}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {usuario.email}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {usuario.is_admin && (
                        <Badge variant="default">
                          <Shield className="h-3 w-3 mr-1" />
                          Admin do Sistema
                        </Badge>
                      )}
                      {usuario.unit_users?.map((uu: any) => (
                        <Badge key={`${usuario.id}-${uu.unit_id}`} variant={getRoleBadgeColor(uu.role)}>
                          {getRoleLabel(uu.role)} - {uu.units?.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor={`admin-${usuario.id}`} className="text-sm">Admin</Label>
                    <Switch
                      id={`admin-${usuario.id}`}
                      checked={usuario.is_admin}
                      onCheckedChange={() => handleToggleAdmin(usuario.id, usuario.is_admin)}
                    />
                  </div>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setSelectedUser(usuario)}>
                        <Edit className="h-3 w-3 mr-1" />
                        Gerenciar
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Gerenciar Usuário: {usuario.full_name}</DialogTitle>
                        <DialogDescription>Configure as permissões e unidades do usuário</DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium">Nome Completo</Label>
                            <p className="text-sm text-muted-foreground">{usuario.full_name || 'Não informado'}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Email</Label>
                            <p className="text-sm text-muted-foreground">{usuario.email}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Admin do Sistema</Label>
                            <div className="flex items-center space-x-2 mt-2">
                              <Switch
                                checked={usuario.is_admin}
                                onCheckedChange={() => handleToggleAdmin(usuario.id, usuario.is_admin)}
                              />
                              <span className="text-sm">{usuario.is_admin ? 'Sim' : 'Não'}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-3 block">Unidades e Roles</Label>
                          <div className="space-y-3">
                            {usuario.unit_users?.map((uu: any) => (
                              <div key={`${usuario.id}-${uu.unit_id}`} className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                  <p className="font-medium text-sm">{uu.units?.name}</p>
                                  <p className="text-xs text-muted-foreground">Role atual: {getRoleLabel(uu.role)}</p>
                                </div>
                                <Select
                                  value={uu.role}
                                  onValueChange={(newRole) => handleChangeUserRole(usuario.id, uu.unit_id, newRole)}
                                >
                                  <SelectTrigger className="w-48">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="consultor">Consultor</SelectItem>
                                    <SelectItem value="educador">Educador</SelectItem>
                                    <SelectItem value="gestor_pedagogico">Gestor Pedagógico</SelectItem>
                                    <SelectItem value="franqueado">Franqueado</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default GerenciamentoUsuarios;