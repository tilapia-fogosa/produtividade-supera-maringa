import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw } from 'lucide-react';

interface CacaPalavrasGridProps {
  grid: string[][];
  palavras: string[];
  onRegenerate: () => void;
}

const CacaPalavrasGrid = ({ grid, palavras, onRegenerate }: CacaPalavrasGridProps) => {
  const exportarParaPDF = () => {
    // Implementação futura para exportar para PDF
    console.log('Exportar para PDF');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Caça-Palavras Gerado</span>
            <div className="flex gap-2">
              <Button onClick={onRegenerate} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerar
              </Button>
              <Button onClick={exportarParaPDF} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Grid {grid[0]?.length}x{grid.length} com {palavras.length} palavras escondidas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Grid do Caça-Palavras */}
            <div className="flex justify-center">
              <div 
                className="grid gap-1 bg-background p-4 rounded-lg border"
                style={{
                  gridTemplateColumns: `repeat(${grid[0]?.length || 0}, minmax(0, 1fr))`,
                  maxWidth: '90vw',
                  fontSize: 'clamp(8px, 2vw, 16px)'
                }}
              >
                {grid.map((linha, i) =>
                  linha.map((letra, j) => (
                    <div
                      key={`${i}-${j}`}
                      className="aspect-square flex items-center justify-center border border-border bg-card text-card-foreground font-mono font-bold text-center"
                      style={{ 
                        minWidth: '20px',
                        minHeight: '20px',
                        maxWidth: '40px',
                        maxHeight: '40px'
                      }}
                    >
                      {letra}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Lista de Palavras */}
            <div>
              <h3 className="font-semibold mb-2">Palavras para encontrar:</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {palavras.map((palavra, index) => (
                  <div
                    key={index}
                    className="bg-secondary px-3 py-2 rounded text-center font-medium"
                  >
                    {palavra}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CacaPalavrasGrid;