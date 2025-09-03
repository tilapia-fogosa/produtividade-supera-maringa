import React from 'react';
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Video, Upload } from "lucide-react";
import VideoPlayer from '@/components/VideoPlayer';
import SGSUploadComponent from '@/components/upload/SGSUploadComponent';

const SincronizacaoSGS = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-azul-500">Sincronização com SGS</h1>
      
      <Tabs defaultValue="tutorial" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="tutorial" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            <span>Tutorial</span>
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            <span>Upload de Alunos</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="tutorial">
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">Como sincronizar dados do SGS</h3>
            <p className="text-muted-foreground mb-4">
              Assista ao tutorial abaixo para aprender como fazer a sincronização dos dados do SGS.
            </p>
            <div className="w-full max-w-4xl mx-auto">
              <VideoPlayer />
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="upload">
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">Upload de Arquivo XLS</h3>
            <p className="text-muted-foreground mb-6">
              Faça o upload do arquivo .xls exportado do SGS para sincronizar os dados dos alunos.
            </p>
            <SGSUploadComponent />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SincronizacaoSGS;