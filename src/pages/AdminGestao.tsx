import React from 'react';
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Building, Settings } from "lucide-react";
import GerenciamentoUnidades from '@/components/admin/GerenciamentoUnidades';
import GerenciamentoUsuarios from '@/components/admin/GerenciamentoUsuarios';
import GerenciamentoFuncionalidades from '@/components/admin/GerenciamentoFuncionalidades';

const AdminGestao = () => {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center space-x-2">
        <Settings className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Administração do Sistema</h1>
      </div>
      
      <Tabs defaultValue="unidades" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="unidades" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <span>Unidades</span>
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Usuários</span>
          </TabsTrigger>
          <TabsTrigger value="funcionalidades" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Funcionalidades</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="unidades" className="mt-6">
          <Card>
            <GerenciamentoUnidades />
          </Card>
        </TabsContent>
        
        <TabsContent value="usuarios" className="mt-6">
          <Card>
            <GerenciamentoUsuarios />
          </Card>
        </TabsContent>
        
        <TabsContent value="funcionalidades" className="mt-6">
          <Card>
            <GerenciamentoFuncionalidades />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminGestao;