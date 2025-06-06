
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useProjetoSaoRafaelDados } from '@/hooks/use-projeto-sao-rafael-dados';
import { useToast } from "@/hooks/use-toast";

const ProjetoSaoRafael = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Definir mês atual como padrão
  const mesAtual = new Date().toISOString().substring(0, 7);
  const [mesAnoSelecionado, setMesAnoSelecionado] = useState(mesAtual);
  const [textoTemp, setTextoTemp] = useState('');
  const [salvando, setSalvando] = useState(false);
  
  const { dadosAbaco, dadosAH, textoGeral, loading, salvarTextoGeral } = useProjetoSaoRafaelDados(mesAnoSelecionado);

  // Sincronizar texto temporário com o texto carregado
  React.useEffect(() => {
    setTextoTemp(textoGeral);
  }, [textoGeral]);

  // Gerar opções de meses (últimos 12 meses)
  const gerarOpcoesMeses = () => {
    const opcoes = [];
    const hoje = new Date();
    
    for (let i = 0; i < 12; i++) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const valor = data.toISOString().substring(0, 7);
      const texto = data.toLocaleDateString('pt-BR', { 
        year: 'numeric', 
        month: 'long' 
      });
      opcoes.push({ valor, texto });
    }
    
    return opcoes;
  };

  const handleSalvarTexto = async () => {
    setSalvando(true);
    try {
      const sucesso = await salvarTextoGeral(textoTemp);
      if (sucesso) {
        toast({
          title: "Sucesso",
          description: "Texto geral salvo com sucesso!",
        });
      } else {
        toast({
          title: "Erro",
          description: "Erro ao salvar o texto. Tente novamente.",
          variant: "destructive",
        });
      }
    } finally {
      setSalvando(false);
    }
  };

  const formatarMesAno = (mesAno: string) => {
    const [ano, mes] = mesAno.split('-');
    const data = new Date(parseInt(ano), parseInt(mes) - 1);
    return data.toLocaleDateString('pt-BR', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  return (
    <div className="container mx-auto py-4 px-2">
      <Button 
        onClick={() => navigate('/devolutivas')} 
        variant="outline" 
        className="mb-4 text-azul-500 border-orange-200"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-azul-500">Projeto São Rafael</h1>
        
        <div className="w-full sm:w-auto">
          <Select value={mesAnoSelecionado} onValueChange={setMesAnoSelecionado}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Selecione o mês" />
            </SelectTrigger>
            <SelectContent>
              {gerarOpcoesMeses().map(opcao => (
                <SelectItem key={opcao.valor} value={opcao.valor}>
                  {opcao.texto}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="text-center p-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Seção Ábaco */}
          <Card className="border-orange-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-azul-500">
                Dados do Ábaco - {formatarMesAno(mesAnoSelecionado)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dadosAbaco.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Nenhum dado encontrado para o período selecionado.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome do Aluno</TableHead>
                        <TableHead className="text-center">Nº Exercícios</TableHead>
                        <TableHead className="text-center">Nº Erros</TableHead>
                        <TableHead className="text-center">% Acerto</TableHead>
                        <TableHead className="text-center">Nº Presenças</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dadosAbaco.map((aluno, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{aluno.nome_aluno}</TableCell>
                          <TableCell className="text-center">{aluno.total_exercicios}</TableCell>
                          <TableCell className="text-center">{aluno.total_erros}</TableCell>
                          <TableCell className="text-center">{aluno.percentual_acerto}%</TableCell>
                          <TableCell className="text-center">{aluno.total_presencas}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seção Abrindo Horizontes */}
          <Card className="border-orange-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-azul-500">
                Dados do Abrindo Horizontes - {formatarMesAno(mesAnoSelecionado)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dadosAH.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Nenhum dado encontrado para o período selecionado.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome do Aluno</TableHead>
                        <TableHead className="text-center">Nº Exercícios</TableHead>
                        <TableHead className="text-center">Nº Erros</TableHead>
                        <TableHead className="text-center">% Acerto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dadosAH.map((aluno, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{aluno.nome_aluno}</TableCell>
                          <TableCell className="text-center">{aluno.total_exercicios}</TableCell>
                          <TableCell className="text-center">{aluno.total_erros}</TableCell>
                          <TableCell className="text-center">{aluno.percentual_acerto}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Campo de Texto Geral */}
          <Card className="border-orange-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-azul-500">
                Observações Gerais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={textoTemp}
                onChange={(e) => setTextoTemp(e.target.value)}
                placeholder="Digite aqui suas observações gerais sobre o Projeto São Rafael para este mês..."
                className="min-h-[120px]"
              />
              <Button 
                onClick={handleSalvarTexto}
                disabled={salvando}
                className="w-full sm:w-auto bg-azul-500 hover:bg-azul-600 text-white"
              >
                {salvando ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Texto Geral
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ProjetoSaoRafael;
