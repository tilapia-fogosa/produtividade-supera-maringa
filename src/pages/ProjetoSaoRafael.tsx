import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useProjetoSaoRafaelDados } from '@/hooks/use-projeto-sao-rafael-dados';
import ObservacoesModal from '@/components/projeto-sao-rafael/ObservacoesModal';

const ProjetoSaoRafael = () => {
  const navigate = useNavigate();
  
  // Definir mês atual como padrão
  const mesAtual = new Date().toISOString().substring(0, 7);
  const [mesAnoSelecionado, setMesAnoSelecionado] = useState(mesAtual);
  
  const { dadosAbaco, dadosAH, textoGeral, loading, salvarTextoGeral } = useProjetoSaoRafaelDados(mesAnoSelecionado);

  // Gerar opções de meses (últimos 12 meses)
  function gerarOpcoesMeses() {
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
  }

  function formatarMesAno(mesAno: string) {
    const [ano, mes] = mesAno.split('-');
    const data = new Date(parseInt(ano), parseInt(mes) - 1);
    return data.toLocaleDateString('pt-BR', { 
      year: 'numeric', 
      month: 'long' 
    });
  }

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
        
        <div className="flex flex-col sm:flex-row gap-2">
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
          
          <ObservacoesModal
            textoGeral={textoGeral}
            mesAno={mesAnoSelecionado}
            onSalvar={salvarTextoGeral}
          />
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

          {/* Observações Gerais - Apenas visualização */}
          {textoGeral && (
            <Card className="border-orange-200 bg-white">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-azul-500">
                  Observações Gerais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-md border">
                  <p className="text-gray-700 whitespace-pre-wrap">{textoGeral}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rodapé com Logo do Supera */}
          <div className="flex justify-center items-center py-6 mt-8 border-t border-orange-200">
            <img 
              src="/lovable-uploads/8d83acfe-5f42-4bcc-869e-62dd972ebf81.png" 
              alt="Supera Maringá" 
              className="h-12 sm:h-16 w-auto opacity-80 hover:opacity-100 transition-opacity"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjetoSaoRafael;
