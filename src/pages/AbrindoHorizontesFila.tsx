import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

const AbrindoHorizontesFila = () => {
  return (
    <div className="w-full min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Abrindo Horizontes
          </h1>
          <p className="text-muted-foreground">
            Fila de tarefas e correções pendentes
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Fila de Tarefas
            </CardTitle>
            <CardDescription>
              Aguardando especificações para implementação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Badge variant="outline" className="mb-4">
                  Em desenvolvimento
                </Badge>
                <p className="text-muted-foreground">
                  Estrutura criada. Aguardando especificações.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AbrindoHorizontesFila;
