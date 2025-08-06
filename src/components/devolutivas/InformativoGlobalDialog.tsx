import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Settings, Save } from "lucide-react";

interface InformativoGlobalDialogProps {
  children?: React.ReactNode;
}

export const InformativoGlobalDialog: React.FC<InformativoGlobalDialogProps> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [textoGlobal, setTextoGlobal] = useState('');
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Buscar texto global atual
  useEffect(() => {
    if (open) {
      buscarTextoGlobal();
    }
  }, [open]);

  const buscarTextoGlobal = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('devolutivas_config')
        .select('texto_geral')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar texto global:', error);
        toast({
          title: "Erro ao carregar",
          description: "Não foi possível carregar o texto global.",
          variant: "destructive",
        });
        return;
      }

      setTextoGlobal(data?.texto_geral || '');
    } catch (err) {
      console.error('Erro ao buscar texto global:', err);
    } finally {
      setLoading(false);
    }
  };

  const salvarTextoGlobal = async () => {
    setSalvando(true);
    try {
      // Primeiro tentar fazer update
      const { data: existingData, error: selectError } = await supabase
        .from('devolutivas_config')
        .select('id')
        .limit(1)
        .single();

      if (existingData) {
        // Registro existe, fazer update
        const { error: updateError } = await supabase
          .from('devolutivas_config')
          .update({ texto_geral: textoGlobal })
          .eq('id', existingData.id);

        if (updateError) throw updateError;
      } else {
        // Registro não existe, fazer insert
        const { error: insertError } = await supabase
          .from('devolutivas_config')
          .insert({ texto_geral: textoGlobal });

        if (insertError) throw insertError;
      }

      toast({
        title: "Informativo salvo",
        description: "O texto do informativo oficial foi atualizado com sucesso.",
      });

      setOpen(false);
    } catch (err) {
      console.error('Erro ao salvar texto global:', err);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o informativo oficial.",
        variant: "destructive",
      });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className="gap-2">
            <Settings className="h-4 w-4" />
            Informativo Oficial Global
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Informativo Oficial Global</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Texto do Informativo Global
            </label>
            <p className="text-sm text-muted-foreground mb-3">
              Este texto será exibido em todas as devolutivas como "Informativo Oficial". 
              Você pode usar quebras de linha para organizar o conteúdo.
            </p>
            <Textarea
              placeholder="Digite aqui o texto que aparecerá em todas as devolutivas..."
              value={textoGlobal}
              onChange={(e) => setTextoGlobal(e.target.value)}
              className="min-h-[300px]"
              disabled={loading}
            />
          </div>

          {textoGlobal && (
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h4 className="font-semibold mb-2">Visualização:</h4>
              <p className="whitespace-pre-wrap text-sm">{textoGlobal}</p>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={salvando}
            >
              Cancelar
            </Button>
            <Button 
              onClick={salvarTextoGlobal}
              disabled={salvando || loading}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {salvando ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};