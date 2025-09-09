
import React from 'react';
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Database, FileSpreadsheet } from "lucide-react";
import AdminDadosImportantesForm from '@/components/AdminDadosImportantesForm';
import XlsUploadComponent from '@/components/sync/XlsUploadComponent';
import XlsSyncStatus from '@/components/sync/XlsSyncStatus';

const AdminConfiguracao = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-azul-500">Configurações do Sistema</h1>
      
      <Tabs defaultValue="dados">
        <TabsList className="mb-4">
          <TabsTrigger value="dados" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span>Dados Importantes</span>
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
    </div>
  );
};

export default AdminConfiguracao;
