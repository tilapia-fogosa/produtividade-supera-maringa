import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Trash2, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CacaPalavrasFormProps {
  onGenerate: (palavras: string[], largura: number, altura: number) => void;
}

const CacaPalavrasForm = ({ onGenerate }: CacaPalavrasFormProps) => {
  const [palavras, setPalavras] = useState<string[]>(['']);
  const [largura, setLargura] = useState([15]);
  const [altura, setAltura] = useState([15]);
  const [novaPalavra, setNovaPalavra] = useState('');

  const adicionarPalavra = () => {
    if (novaPalavra.trim()) {
      const palavraLimpa = novaPalavra.trim().toUpperCase().replace(/[^A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]/g, '');
      if (palavraLimpa.length > 0) {
        setPalavras([...palavras.filter(p => p), palavraLimpa]);
        setNovaPalavra('');
      }
    }
  };

  const removerPalavra = (index: number) => {
    setPalavras(palavras.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      adicionarPalavra();
    }
  };

  const gerarCacaPalavras = () => {
    const palavrasValidas = palavras.filter(p => p.trim().length > 0);
    
    if (palavrasValidas.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos uma palavra para gerar o caça-palavras.",
        variant: "destructive"
      });
      return;
    }

    const maxTamanho = Math.max(largura[0], altura[0]);
    const palavraMuitoGrande = palavrasValidas.find(p => p.length > maxTamanho);
    
    if (palavraMuitoGrande) {
      toast({
        title: "Erro",
        description: `A palavra "${palavraMuitoGrande}" é muito grande para o grid ${largura[0]}x${altura[0]}.`,
        variant: "destructive"
      });
      return;
    }

    onGenerate(palavrasValidas, largura[0], altura[0]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar Caça-Palavras</CardTitle>
        <CardDescription>
          Adicione palavras e configure o tamanho do grid para gerar seu caça-palavras
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label>Adicionar Palavras</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Digite uma palavra..."
              value={novaPalavra}
              onChange={(e) => setNovaPalavra(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={adicionarPalavra} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {palavras.filter(p => p).length > 0 && (
            <div className="space-y-2">
              <Label>Palavras Adicionadas ({palavras.filter(p => p).length})</Label>
              <div className="flex flex-wrap gap-2">
                {palavras.filter(p => p).map((palavra, index) => (
                  <div key={index} className="flex items-center gap-1 bg-secondary px-2 py-1 rounded">
                    <span className="text-sm">{palavra}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-4 w-4 p-0"
                      onClick={() => removerPalavra(index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Largura: {largura[0]} colunas</Label>
            <Slider
              value={largura}
              onValueChange={setLargura}
              max={25}
              min={10}
              step={1}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Altura: {altura[0]} linhas</Label>
            <Slider
              value={altura}
              onValueChange={setAltura}
              max={25}
              min={10}
              step={1}
              className="w-full"
            />
          </div>
        </div>

        <Button 
          onClick={gerarCacaPalavras}
          className="w-full"
          size="lg"
        >
          Gerar Caça-Palavras
        </Button>
      </CardContent>
    </Card>
  );
};

export default CacaPalavrasForm;