import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Target, Calendar, BookOpen, Grid3X3 } from 'lucide-react';
import CacaPalavrasForm from '@/components/caca-palavras/CacaPalavrasForm';
import CacaPalavrasGrid from '@/components/caca-palavras/CacaPalavrasGrid';
import { gerarCacaPalavras } from '@/utils/cacaPalavrasGenerator';

const PlanejadorDesafios = () => {
  const [mostrarCacaPalavras, setMostrarCacaPalavras] = useState(false);
  const [gridCacaPalavras, setGridCacaPalavras] = useState<string[][]>([]);
  const [palavrasAtivas, setPalavrasAtivas] = useState<string[]>([]);
  const [configGrid, setConfigGrid] = useState({ largura: 15, altura: 15 });

  const handleGerarCacaPalavras = (palavras: string[], largura: number, altura: number) => {
    const novoGrid = gerarCacaPalavras(palavras, largura, altura);
    setGridCacaPalavras(novoGrid);
    setPalavrasAtivas(palavras);
    setConfigGrid({ largura, altura });
    setMostrarCacaPalavras(true);
  };

  const handleRegenerarCacaPalavras = () => {
    if (palavrasAtivas.length > 0) {
      handleGerarCacaPalavras(palavrasAtivas, configGrid.largura, configGrid.altura);
    }
  };

  const voltarParaInicio = () => {
    setMostrarCacaPalavras(false);
    setGridCacaPalavras([]);
    setPalavrasAtivas([]);
  };

  if (mostrarCacaPalavras && gridCacaPalavras.length > 0) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Grid3X3 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Caça-Palavras</h1>
              <p className="text-muted-foreground">Seu caça-palavras foi gerado com sucesso</p>
            </div>
          </div>
          <Button onClick={voltarParaInicio} variant="outline">
            Voltar
          </Button>
        </div>

        <CacaPalavrasGrid
          grid={gridCacaPalavras}
          palavras={palavrasAtivas}
          onRegenerate={handleRegenerarCacaPalavras}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Target className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Planejador de Desafios</h1>
          <p className="text-muted-foreground">Organize e gerencie desafios educacionais</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Tipos de Desafios
            </CardTitle>
            <CardDescription>
              Escolha o tipo de desafio que deseja criar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <Button 
                onClick={() => setMostrarCacaPalavras(true)}
                className="w-full justify-start"
                variant="outline"
              >
                <Grid3X3 className="h-4 w-4 mr-2" />
                Caça-Palavras
              </Button>
            </div>
          </CardContent>
        </Card>

        {mostrarCacaPalavras && !gridCacaPalavras.length && (
          <CacaPalavrasForm onGenerate={handleGerarCacaPalavras} />
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-blue-500" />
                Desafios Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-sm text-muted-foreground">Em andamento</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-green-500" />
                Concluídos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-sm text-muted-foreground">Finalizados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="h-5 w-5 text-orange-500" />
                Rascunhos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-sm text-muted-foreground">Em planejamento</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Desafios</CardTitle>
            <CardDescription>
              Visualize e gerencie todos os desafios criados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum desafio criado ainda</p>
              <p className="text-sm">Comece criando seu primeiro desafio</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PlanejadorDesafios;