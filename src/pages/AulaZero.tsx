
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { 
  Form, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage 
} from '@/components/ui/form';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Aluno {
  id: string;
  nome: string;
}

interface AulaZeroData {
  alunoId: string;
  percepcao_coordenador: string;
  motivo_procura: string;
  avaliacao_abaco: string;
  avaliacao_ah: string;
  pontos_atencao: string;
}

const WEBHOOK_URL = "https://hook.us1.make.com/rhla45qk19cwlcq3jnekoirj1zatazfn";

const AulaZero = () => {
  const navigate = useNavigate();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [webhookSending, setWebhookSending] = useState<boolean>(false);
  
  const form = useForm<AulaZeroData>({
    defaultValues: {
      alunoId: '',
      percepcao_coordenador: '',
      motivo_procura: '',
      avaliacao_abaco: '',
      avaliacao_ah: '',
      pontos_atencao: ''
    }
  });

  useEffect(() => {
    fetchAlunos();
  }, []);

  const fetchAlunos = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('alunos')
        .select('id, nome')
        .eq('active', true)
        .order('nome');

      if (error) throw error;
      setAlunos(data || []);
    } catch (error) {
      console.error('Erro ao buscar alunos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a lista de alunos',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAlunos = alunos.filter(aluno => 
    aluno.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sendToWebhook = async (data: AulaZeroData, alunoNome: string) => {
    setWebhookSending(true);
    try {
      // Enviar dados para o webhook no mesmo formato dos outros serviços
      const dataAtual = new Date().toISOString();
      console.log('Dados enviados para o webhook:', {
        tipo: "Aula Zero",
        aluno_nome: alunoNome,
        percepcao_coordenador: data.percepcao_coordenador,
        motivo_procura: data.motivo_procura,
        avaliacao_abaco: data.avaliacao_abaco,
        avaliacao_ah: data.avaliacao_ah,
        pontos_atencao: data.pontos_atencao,
        data_registro: dataAtual
      });
      
      // Enviar dados para o webhook
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tipo: "Aula Zero",
          aluno_nome: alunoNome,
          percepcao_coordenador: data.percepcao_coordenador,
          motivo_procura: data.motivo_procura,
          avaliacao_abaco: data.avaliacao_abaco,
          avaliacao_ah: data.avaliacao_ah,
          pontos_atencao: data.pontos_atencao,
          data_registro: dataAtual
        }),
        mode: 'no-cors' // Necessário para evitar problemas de CORS
      });

      toast({
        title: 'Webhook Enviado',
        description: 'Os dados foram enviados para o sistema externo',
      });
    } catch (error) {
      console.error('Erro ao enviar dados para o webhook:', error);
      toast({
        title: 'Atenção',
        description: 'Os dados foram salvos, mas houve um erro ao enviá-los para o sistema externo',
        variant: 'destructive',
      });
    } finally {
      setWebhookSending(false);
    }
  };

  const onSubmit = async (data: AulaZeroData) => {
    setIsLoading(true);
    try {
      // Obter o nome do aluno selecionado
      const alunoSelecionado = alunos.find(aluno => aluno.id === data.alunoId);
      if (!alunoSelecionado) {
        throw new Error('Aluno não encontrado');
      }

      // Salvar os dados no Supabase
      const { error } = await supabase
        .from('alunos')
        .update({
          percepcao_coordenador: data.percepcao_coordenador,
          motivo_procura: data.motivo_procura,
          avaliacao_abaco: data.avaliacao_abaco,
          avaliacao_ah: data.avaliacao_ah,
          pontos_atencao: data.pontos_atencao,
        })
        .eq('id', data.alunoId);

      if (error) throw error;
      
      // Enviar para o webhook
      await sendToWebhook(data, alunoSelecionado.nome);
      
      toast({
        title: 'Sucesso!',
        description: 'Informações da Aula Zero registradas com sucesso!',
      });
      
      // Resetar o formulário
      form.reset();
    } catch (error) {
      console.error('Erro ao salvar dados da Aula Zero:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as informações',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoltar = () => {
    navigate('/lancamentos');
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={handleVoltar} 
          className="mr-2"
          size="sm"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold text-azul-500">Lançamento de Aula Zero</h1>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm max-w-2xl mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Seleção de aluno */}
            <FormField
              control={form.control}
              name="alunoId"
              rules={{ required: 'Por favor, selecione um aluno' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Aluno</FormLabel>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Pesquisar aluno..."
                      className="w-full p-2 border rounded mb-2"
                      onChange={(e) => setSearchTerm(e.target.value)}
                      value={searchTerm}
                    />
                    <FormControl>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          // Encontrar o nome do aluno selecionado para exibir na pesquisa
                          const selectedAluno = alunos.find(aluno => aluno.id === value);
                          if (selectedAluno) setSearchTerm(selectedAluno.nome);
                        }}
                        value={field.value}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione um aluno" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredAlunos.map((aluno) => (
                            <SelectItem key={aluno.id} value={aluno.id}>
                              {aluno.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Percepção do coordenador */}
            <FormField
              control={form.control}
              name="percepcao_coordenador"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Percepção do Coordenador</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva a percepção do coordenador..."
                      {...field}
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Motivo da procura */}
            <FormField
              control={form.control}
              name="motivo_procura"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo da Procura</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o motivo da procura..."
                      {...field}
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Como foi no Ábaco */}
            <FormField
              control={form.control}
              name="avaliacao_abaco"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avaliação no Ábaco</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Como o aluno se saiu no Ábaco..."
                      {...field}
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Como foi na AH */}
            <FormField
              control={form.control}
              name="avaliacao_ah"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avaliação no Abrindo Horizontes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Como o aluno se saiu no Abrindo Horizontes..."
                      {...field}
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Pontos de Atenção */}
            <FormField
              control={form.control}
              name="pontos_atencao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pontos de Atenção</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Destaque pontos importantes a serem observados..."
                      {...field}
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={isLoading || webhookSending} 
                className="bg-supera hover:bg-supera-600"
              >
                <Save className="mr-2 h-4 w-4" />
                {isLoading || webhookSending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default AulaZero;
