import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
const CRM = () => {
  const [isLoading, setIsLoading] = useState(false);
  const handleWebhookCall = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('https://webhookn8n.agenciakadin.com.br/webhook/b2feecc1-8387-4665-99d0-74f6b9fcb1db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          source: 'crm-page'
        })
      });
      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Webhook chamado com sucesso!"
        });
      } else {
        throw new Error('Erro na resposta do webhook');
      }
    } catch (error) {
      console.error('Erro ao chamar webhook:', error);
      toast({
        title: "Erro",
        description: "Erro ao chamar webhook. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  return <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Mágica de adicionar leads no CRM</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">Busca leads na lista de convidados</p>
          
          <Button onClick={handleWebhookCall} disabled={isLoading} size="mobile" className="w-full">
            {isLoading ? <>
                <Loader2 className="animate-spin" />
                Processando...
              </> : 'Clique aqui para adicionar 10 leads ao CRM'}
          </Button>
        </CardContent>
      </Card>
    </div>;
};
export default CRM;