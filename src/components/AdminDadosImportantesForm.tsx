
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DadosImportante {
  id: string;
  key: string;
  data: string;
}

const AdminDadosImportantesForm = () => {
  const [dados, setDados] = useState<DadosImportante[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('dados_importantes')
        .select('*')
        .order('key');
      
      if (error) throw error;
      
      setDados(data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os dados importantes."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const adicionarCampo = () => {
    setDados([...dados, { id: `temp-${Date.now()}`, key: '', data: '' }]);
  };

  const removerCampo = (index: number) => {
    const novosDados = [...dados];
    novosDados.splice(index, 1);
    setDados(novosDados);
  };

  const atualizarCampo = (index: number, campo: keyof DadosImportante, valor: string) => {
    const novosDados = [...dados];
    novosDados[index] = { ...novosDados[index], [campo]: valor };
    setDados(novosDados);
  };

  const salvarDados = async () => {
    setIsSaving(true);
    
    try {
      // Validar campos
      const camposVazios = dados.some(item => !item.key.trim() || !item.data.trim());
      if (camposVazios) {
        throw new Error("Por favor, preencha todos os campos.");
      }

      // Processar cada registro
      for (const item of dados) {
        if (item.id.startsWith('temp-')) {
          // Novo registro
          const { error } = await supabase
            .from('dados_importantes')
            .insert({ key: item.key, data: item.data });
          
          if (error) throw error;
        } else {
          // Atualizar registro existente
          const { error } = await supabase
            .from('dados_importantes')
            .update({ key: item.key, data: item.data })
            .eq('id', item.id);
          
          if (error) throw error;
        }
      }

      // Verificar e adicionar chaves essenciais se não existirem
      const chavesEssenciais = [
        { key: 'SLACK_BOT_TOKEN', descricao: 'Token de Bot do Slack para enviar mensagens' },
        { key: 'canal_alertas_evasao', descricao: 'ID do canal do Slack para alertas de evasão' },
        { key: 'SUPABASE_ANON_KEY', descricao: 'Chave anônima do Supabase para funções Edge' }
      ];

      for (const chave of chavesEssenciais) {
        const chaveExiste = dados.some(item => item.key === chave.key);
        
        if (!chaveExiste) {
          await supabase.from('dados_importantes').insert({ 
            key: chave.key, 
            data: '', 
            descricao: chave.descricao 
          });
        }
      }

      toast({
        title: "Sucesso",
        description: "Dados importantes salvos com sucesso."
      });
      
      // Recarregar dados para mostrar IDs atualizados
      await carregarDados();
      
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Não foi possível salvar os dados importantes."
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Dados Importantes do Sistema</CardTitle>
        <CardDescription>
          Configure dados sensíveis como tokens e IDs utilizados pelo sistema.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {dados.map((item, index) => (
              <div key={item.id} className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor={`key-${index}`}>Chave</Label>
                  <Input
                    id={`key-${index}`}
                    value={item.key}
                    onChange={e => atualizarCampo(index, 'key', e.target.value)}
                    placeholder="Nome da chave"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor={`data-${index}`}>Valor</Label>
                  <Input
                    id={`data-${index}`}
                    value={item.data}
                    onChange={e => atualizarCampo(index, 'data', e.target.value)}
                    placeholder="Valor da chave"
                    type={item.key.includes('TOKEN') || item.key.includes('KEY') ? "password" : "text"}
                  />
                </div>
                <Button variant="outline" size="icon" onClick={() => removerCampo(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={adicionarCampo} disabled={isLoading || isSaving}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Campo
        </Button>
        <Button onClick={salvarDados} disabled={isLoading || isSaving}>
          {isSaving ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando</>
          ) : (
            <><Save className="h-4 w-4 mr-2" /> Salvar</>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AdminDadosImportantesForm;
