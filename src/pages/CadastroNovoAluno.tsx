import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Save, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FotoUpload } from '@/components/alunos/FotoUpload';
import { useTodasTurmas } from '@/hooks/use-todas-turmas';
import { useCadastroAluno, type CadastroAlunoForm } from '@/hooks/use-cadastro-aluno';
import { toast } from '@/hooks/use-toast';

const formSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  telefone: z.string().min(1, 'Telefone é obrigatório'),
  descricao: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  turma_id: z.string().min(1, 'Turma é obrigatória'),
  material_entregue: z.boolean(),
  kit_sugerido: z.string().min(1, 'Kit é obrigatório'),
  responsavel_financeiro: z.string(),
  telefone_responsavel: z.string(),
});

const kitsDisponiveis = [
  'Kit 1',
  'Kit 2',
  'Kit 3',
  'Kit 4',
  'Kit 5',
  'Kit 6',
  'Kit 7',
  'Kit 8',
  'Kit BPA'
];

export default function CadastroNovoAluno() {
  const { turmas, loading: turmasLoading } = useTodasTurmas();
  const { cadastrarAluno, loading: cadastroLoading } = useCadastroAluno();
  const [alunoId, setAlunoId] = useState<string | null>(null);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      telefone: '',
      descricao: '',
      turma_id: '',
      material_entregue: false,
      kit_sugerido: '',
      responsavel_financeiro: '',
      telefone_responsavel: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const dadosCompletos: CadastroAlunoForm = {
      nome: values.nome,
      telefone: values.telefone,
      descricao: values.descricao,
      turma_id: values.turma_id,
      material_entregue: values.material_entregue,
      kit_sugerido: values.kit_sugerido,
      responsavel_financeiro: values.responsavel_financeiro,
      telefone_responsavel: values.telefone_responsavel,
      foto_url: fotoUrl,
    };

    const novoAluno = await cadastrarAluno(dadosCompletos);
    
    if (novoAluno) {
      setAlunoId(novoAluno.id);
      toast({
        title: "Aluno cadastrado!",
        description: "Você pode cadastrar outro aluno ou voltar.",
      });
    }
  };

  const limparFormulario = () => {
    form.reset();
    setAlunoId(null);
    setFotoUrl(null);
  };

  const voltarPagina = () => {
    window.history.back();
  };

  return (
    <div className="container max-w-2xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={voltarPagina}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Cadastro de Novo Aluno</h1>
          <p className="text-muted-foreground">
            Preencha todos os campos obrigatórios para cadastrar o aluno
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Aluno</CardTitle>
          <CardDescription>
            Lançar EXATAMENTE o nome que está cadastrado no SGS, sem espaços extras ou acentuações diferentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Foto do Aluno */}
              {alunoId && (
                <div className="space-y-2">
                  <Label>Foto do Aluno (opcional)</Label>
                  <FotoUpload
                    alunoId={alunoId}
                    alunoNome={form.getValues('nome')}
                    fotoUrl={fotoUrl}
                    onFotoUpdate={async (novaUrl) => {
                      setFotoUrl(novaUrl);
                      return true;
                    }}
                  />
                </div>
              )}

              {/* Nome Completo */}
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo do Aluno *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Digite o nome completo exatamente como no SGS"
                        disabled={cadastroLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Telefone do Aluno */}
              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone do Aluno *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="(11) 99999-9999"
                        disabled={cadastroLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Descrição */}
              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição, Relatório e Dados Captados no Atendimento Comercial *</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Descreva de forma completa as informações captadas no atendimento comercial"
                        className="min-h-[120px]"
                        disabled={cadastroLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Turma */}
              <FormField
                control={form.control}
                name="turma_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Turma *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={turmasLoading || cadastroLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma turma" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {turmas.map((turma) => (
                          <SelectItem key={turma.id} value={turma.id}>
                            {turma.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Material Entregue */}
              <FormField
                control={form.control}
                name="material_entregue"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Material entregue? *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => field.onChange(value === 'true')}
                        value={field.value ? 'true' : 'false'}
                        disabled={cadastroLoading}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="true" id="material-sim" />
                          <Label htmlFor="material-sim">Sim</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="false" id="material-nao" />
                          <Label htmlFor="material-nao">Não</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Kit Sugerido */}
              <FormField
                control={form.control}
                name="kit_sugerido"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kit Entregue ou Sugerido *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={cadastroLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um kit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {kitsDisponiveis.map((kit) => (
                          <SelectItem key={kit} value={kit}>
                            {kit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Responsável Financeiro/Pedagógico */}
              <FormField
                control={form.control}
                name="responsavel_financeiro"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável Financeiro/Pedagógico</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Nome do responsável (opcional)"
                        disabled={cadastroLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Telefone do Responsável */}
              <FormField
                control={form.control}
                name="telefone_responsavel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone do Responsável</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="(11) 99999-9999 (opcional)"
                        disabled={cadastroLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Botões */}
              <div className="flex flex-col gap-3 pt-6">
                <Button
                  type="submit"
                  disabled={cadastroLoading || turmasLoading}
                  className="w-full flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {cadastroLoading ? 'Cadastrando...' : 'Cadastrar Aluno'}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={limparFormulario}
                  disabled={cadastroLoading}
                  className="w-full flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Limpar Formulário
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}