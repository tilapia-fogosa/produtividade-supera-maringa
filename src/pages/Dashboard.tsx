
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Dashboard = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Visão Geral</CardTitle>
            <CardDescription>Resumo das atividades da plataforma</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Conteúdo do dashboard será implementado aqui.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estatísticas</CardTitle>
            <CardDescription>Indicadores principais</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Estatísticas serão exibidas aqui.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
