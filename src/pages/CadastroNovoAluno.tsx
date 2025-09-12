import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Camera, Upload, Trash2, Loader2, Save } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useTodasTurmas } from "@/hooks/use-todas-turmas";
// ID da unidade de Maringá (única unidade que usa esta funcionalidade)
const MARINGA_UNIT_ID = '0df79a04-444e-46ee-b218-59e4b1835f4a';

const kitOptions = [
  { value: 'kit1', label: 'Kit 1' },
  { value: 'kit2', label: 'Kit 2' },
  { value: 'kit3', label: 'Kit 3' },
  { value: 'kit4', label: 'Kit 4' },
  { value: 'kit5', label: 'Kit 5' },
  { value: 'kit6', label: 'Kit 6' },
  { value: 'kit7', label: 'Kit 7' },
  { value: 'kit8', label: 'Kit 8' },
  { value: 'kitbpa', label: 'Kit BPA' },
];

const cadastroAlunoSchema = z.object({
  nome: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .transform(val => val.trim()),
  telefone: z.string()
    .min(10, 'Telefone deve ter pelo menos 10 dígitos')
    .max(15, 'Telefone deve ter no máximo 15 dígitos'),
  motivo_procura: z.string()
    .min(10, 'Descrição deve ter pelo menos 10 caracteres')
    .max(1000, 'Descrição deve ter no máximo 1000 caracteres'),
  turma_id: z.string()
    .min(1, 'Selecione uma turma'),
  material_entregue: z.boolean(),
  kit_sugerido: z.string()
    .min(1, 'Selecione um kit'),
  responsavel: z.string()
    .min(2, 'Nome do responsável deve ter pelo menos 2 caracteres')
    .max(100, 'Nome do responsável deve ter no máximo 100 caracteres'),
  whatapp_contato: z.string()
    .min(10, 'Telefone do responsável deve ter pelo menos 10 dígitos')
    .max(15, 'Telefone do responsável deve ter no máximo 15 dígitos'),
});

type CadastroAlunoFormData = z.infer<typeof cadastroAlunoSchema>;

interface FotoUploadProps {
  foto: File | null;
  onFotoChange: (file: File | null) => void;
  nomeAluno: string;
}

function FotoUploadComponent({ foto, onFotoChange, nomeAluno }: FotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const obterIniciais = (nome: string) => {
    if (!nome) return 'AL';
    return nome
      .split(' ')
      .map(palavra => palavra.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const validarArquivo = (file: File): boolean => {
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
    const tamanhoMaximo = 5 * 1024 * 1024; // 5MB

    if (!tiposPermitidos.includes(file.type)) {
      toast({
        title: "Tipo de arquivo inválido",
        description: "Por favor, selecione um arquivo JPG, PNG ou WEBP.",
        variant: "destructive"
      });
      return false;
    }

    if (file.size > tamanhoMaximo) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 5MB.",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && validarArquivo(file)) {
      onFotoChange(file);
    }
    event.target.value = '';
  };

  const removerFoto = () => {
    onFotoChange(null);
  };

  const fotoUrl = foto ? URL.createObjectURL(foto) : null;
  const iniciais = obterIniciais(nomeAluno);

  return (
    <div className="flex flex-col items-center space-y-3">
      <Avatar className="h-32 w-32">
        <AvatarImage 
          src={fotoUrl || undefined} 
          alt={`Foto de ${nomeAluno || 'Aluno'}`}
          className="object-cover"
        />
        <AvatarFallback className="text-xl font-semibold bg-primary/10">
          {iniciais}
        </AvatarFallback>
      </Avatar>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          size="sm"
          variant={foto ? "outline" : "default"}
          className="flex items-center gap-2"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : foto ? (
            <Camera className="h-4 w-4" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {foto ? "Alterar" : "Adicionar"}
        </Button>

        {foto && (
          <Button
            type="button"
            onClick={removerFoto}
            disabled={uploading}
            size="sm"
            variant="outline"
            className="flex items-center gap-2 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Remover
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}

export default function CadastroNovoAluno() {
  const navigate = useNavigate();
  const { turmas, loading: turmasLoading } = useTodasTurmas();
  const [foto, setFoto] = useState<File | null>(null);
  const [salvando, setSalvando] = useState(false);

  const form = useForm<CadastroAlunoFormData>({
    resolver: zodResolver(cadastroAlunoSchema),
    defaultValues: {
      nome: '',
      telefone: '',
      motivo_procura: '',
      turma_id: '',
      material_entregue: false,
      kit_sugerido: '',
      responsavel: '',
      whatapp_contato: '',
    },
  });

  const nomeAluno = form.watch('nome');

  const uploadFoto = async (alunoId: string): Promise<string | null> => {
    if (!foto) return null;

    try {
      const extensao = foto.name.split('.').pop()?.toLowerCase();
      const nomeArquivo = `aluno_${alunoId}_${Date.now()}.${extensao}`;
      const caminhoArquivo = `alunos/${alunoId}/${nomeArquivo}`;

      const { error: uploadError } = await supabase.storage
        .from('fotos-pessoas')
        .upload(caminhoArquivo, foto);

      if (uploadError) {
        console.error('Erro no upload da foto:', uploadError);
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from('fotos-pessoas')
        .getPublicUrl(caminhoArquivo);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error);
      toast({
        title: "Aviso",
        description: "Aluno cadastrado, mas houve erro no upload da foto.",
        variant: "destructive"
      });
      return null;
    }
  };

  const onSubmit = async (data: CadastroAlunoFormData) => {
    try {
      setSalvando(true);

      // Inserir aluno na base de dados
      const dadosAluno = {
        nome: data.nome,
        telefone: data.telefone,
        motivo_procura: data.motivo_procura,
        turma_id: data.turma_id,
        material_entregue: data.material_entregue,
        kit_sugerido: data.kit_sugerido,
        responsavel: data.responsavel,
        whatapp_contato: data.whatapp_contato,
        unit_id: MARINGA_UNIT_ID,
        active: true,
        foto_url: null, // Será atualizado após upload da foto
      };

      const { data: novoAluno, error: insertError } = await supabase
        .from('alunos')
        .insert(dadosAluno)
        .select('id')
        .single();

      if (insertError) {
        console.error('Erro ao inserir aluno:', insertError);
        throw insertError;
      }

      // Upload da foto se existir
      let fotoUrl = null;
      if (foto && novoAluno?.id) {
        fotoUrl = await uploadFoto(novoAluno.id);
        
        if (fotoUrl) {
          // Atualizar registro do aluno com a URL da foto
          const { error: updateError } = await supabase
            .from('alunos')
            .update({ foto_url: fotoUrl })
            .eq('id', novoAluno.id);

          if (updateError) {
            console.error('Erro ao atualizar foto do aluno:', updateError);
          }
        }
      }

      toast({
        title: "Sucesso",
        description: "Aluno cadastrado com sucesso!",
      });

      // Redirecionar para página de alunos ou limpar formulário
      form.reset();
      setFoto(null);
      navigate('/alunos-ativos');

    } catch (error) {
      console.error('Erro ao cadastrar aluno:', error);
      toast({
        title: "Erro",
        description: "Não foi possível cadastrar o aluno. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Cadastro de Novo Aluno
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Upload de Foto */}
              <div className="flex justify-center">
                <FotoUploadComponent
                  foto={foto}
                  onFotoChange={setFoto}
                  nomeAluno={nomeAluno}
                />
              </div>

              {/* Nome Completo */}
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo do Aluno</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Digite o nome completo exatamente como cadastrado no SGS"
                        {...field}
                      />
                    </FormControl>
                    <p className="text-sm text-muted-foreground">
                      Lançar EXATAMENTE o nome que for cadastrado no SGS, sem espaços extras ou acentuações diferentes que não estejam no SGS. Não dar espaço ao final do lançamento também.
                    </p>
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
                    <FormLabel>Telefone do Aluno</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="(11) 99999-9999"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Descrição/Relatório */}
              <FormField
                control={form.control}
                name="motivo_procura"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição, Relatório e Dados Captados no Atendimento Comercial</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva de forma completa os dados captados durante o atendimento comercial..."
                        className="min-h-32"
                        {...field}
                      />
                    </FormControl>
                    <p className="text-sm text-muted-foreground">
                      Seja o mais completo possível
                    </p>
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
                    <FormLabel>Turma</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma turma" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {turmasLoading ? (
                          <SelectItem value="loading" disabled>
                            Carregando turmas...
                          </SelectItem>
                        ) : turmas.length === 0 ? (
                          <SelectItem value="empty" disabled>
                            Nenhuma turma disponível
                          </SelectItem>
                        ) : (
                          turmas.map((turma) => (
                            <SelectItem key={turma.id} value={turma.id}>
                              {turma.nome} {turma.sala ? `- Sala ${turma.sala}` : ''}
                            </SelectItem>
                          ))
                        )}
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
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Material Entregue?</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Indique se o material já foi entregue ao aluno
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Kit Entregue/Sugerido */}
              <FormField
                control={form.control}
                name="kit_sugerido"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Kit Entregue ou Sugerido?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-3 gap-2"
                      >
                        {kitOptions.map((kit) => (
                          <div key={kit.value} className="flex items-center space-x-2">
                            <RadioGroupItem value={kit.value} id={kit.value} />
                            <Label htmlFor={kit.value} className="text-sm">
                              {kit.label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Responsável Financeiro/Pedagógico */}
              <FormField
                control={form.control}
                name="responsavel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável Financeiro/Pedagógico</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nome do responsável financeiro ou pedagógico"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Telefone do Responsável */}
              <FormField
                control={form.control}
                name="whatapp_contato"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone do Responsável</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="(11) 99999-9999"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Botões de Ação */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  type="submit"
                  disabled={salvando}
                  className="flex items-center gap-2"
                >
                  {salvando ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {salvando ? 'Cadastrando...' : 'Cadastrar Aluno'}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  disabled={salvando}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}