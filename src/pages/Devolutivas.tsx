
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const diasSemana = [
  { id: 'segunda', nome: 'Segunda-feira' },
  { id: 'terca', nome: 'Terça-feira' },
  { id: 'quarta', nome: 'Quarta-feira' },
  { id: 'quinta', nome: 'Quinta-feira' },
  { id: 'sexta', nome: 'Sexta-feira' },
  { id: 'sabado', nome: 'Sábado' },
];

const Devolutivas = () => {
  const navigate = useNavigate();
  const [textoGeral, setTextoGeral] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [configId, setConfigId] = useState<string | null>(null);

  useEffect(() => {
    const carregarTextoGeral = async () => {
      try {
        const { data: configData, error } = await supabase
          .from('devolutivas_config')
          .select('*');

        if (error) {
          console.error('Erro ao buscar configuração:', error);
          return;
        }

        if (configData && configData.length > 0) {
          setTextoGeral(configData[0].texto_geral || '');
          setConfigId(configData[0].id);
        }
      } catch (error) {
        console.error('Erro ao carregar texto geral:', error);
      }
    };

    carregarTextoGeral();
  }, []);

  const handleDiaClick = (dia: string) => {
    navigate(`/devolutivas/turmas`, { 
      state: { 
        dia,
        serviceType: 'devolutiva'
      }
    });
  };

  const handleSalvarTextoGeral = async () => {
    setSalvando(true);
    try {
      if (configId) {
        await supabase
          .from('devolutivas_config')
          .update({ texto_geral: textoGeral })
          .eq('id', configId);
      } else {
        const { data } = await supabase
          .from('devolutivas_config')
          .insert({ texto_geral: textoGeral })
          .select();
        
        if (data && data.length > 0) {
          setConfigId(data[0].id);
        }
      }
      toast.success('Texto geral salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar texto geral:', error);
      toast.error('Erro ao salvar texto geral');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="container mx-auto p-4 bg-background dark:bg-background">
      <h1 className="text-2xl font-bold mb-6 text-azul-500 dark:text-orange-100">Devolutivas</h1>
      
      <Card className="border-orange-200 bg-white dark:bg-card mb-6">
        <CardHeader className="border-b border-orange-100 dark:border-orange-900/30">
          <CardTitle className="text-azul-500 dark:text-orange-100">Selecione o dia da semana</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 p-6">
          {diasSemana.map((dia) => (
            <Button 
              key={dia.id}
              size="lg"
              className="py-8 text-lg border-orange-300 text-azul-500 dark:text-orange-100 hover:bg-orange-100 dark:hover:bg-orange-900/20"
              variant="outline"
              onClick={() => handleDiaClick(dia.id)}
            >
              <CalendarDays className="mr-2 h-6 w-6" />
              {dia.nome}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card className="border-orange-200 bg-white dark:bg-card">
        <CardHeader className="border-b border-orange-100 dark:border-orange-900/30">
          <CardTitle className="text-azul-500 dark:text-orange-100">Texto Geral da Devolutiva</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <Textarea
            value={textoGeral}
            onChange={(e) => setTextoGeral(e.target.value)}
            placeholder="Digite o texto geral da devolutiva aqui..."
            className="min-h-[150px] mb-4"
          />
          <Button 
            onClick={handleSalvarTextoGeral}
            disabled={salvando}
            className="bg-azul-500 hover:bg-azul-600"
          >
            {salvando ? 'Salvando...' : 'Salvar Texto Geral'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Devolutivas;
