import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClienteMatriculado } from "@/hooks/use-pos-matricula";
import { WebcamCapture } from "./WebcamCapture";
const ESTADOS_BRASILEIROS = ["AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO"];
const dadosCadastraisSchema = z.object({
  nome: z.string().min(2, "Nome obrigatório"),
  data_nascimento: z.string().optional(),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  cep: z.string().optional(),
  rua: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional()
});
type DadosCadastraisFormData = z.infer<typeof dadosCadastraisSchema>;
interface DadosCadastraisFormProps {
  cliente: ClienteMatriculado;
  onCancel: () => void;
}

// Máscaras
const formatCPF = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};
const formatCEP = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.replace(/(\d{5})(\d)/, "$1-$2");
};
const formatDate = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.replace(/(\d{2})(\d)/, "$1/$2").replace(/(\d{2})(\d)/, "$1/$2");
};

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  }
  return digits.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
};
export function DadosCadastraisForm({
  cliente,
  onCancel
}: DadosCadastraisFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fotoCapturada, setFotoCapturada] = useState<string | null>(null);
  
  const form = useForm<DadosCadastraisFormData>({
    resolver: zodResolver(dadosCadastraisSchema),
    defaultValues: {
      nome: cliente.name || "",
      data_nascimento: "",
      cpf: "",
      rg: "",
      telefone: "",
      email: "",
      cep: "",
      rua: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      estado: ""
    }
  });
  const onSubmit = async (data: DadosCadastraisFormData) => {
    setIsSubmitting(true);
    try {
      // Por enquanto, apenas log dos dados
      console.log("Dados Cadastrais:", data);
      console.log("Foto capturada:", fotoCapturada ? "Sim" : "Não");
      // TODO: Integração com banco será implementada depois
    } finally {
      setIsSubmitting(false);
    }
  };
  return <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Seção: Dados Pessoais */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">DADOS DO ALUNO</h3>

          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="nome" render={({
            field
          }) => <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>} />

            <FormField control={form.control} name="data_nascimento" render={({
            field
          }) => <FormItem>
                  <FormLabel>Data de Nascimento</FormLabel>
                  <FormControl>
                    <Input placeholder="DD/MM/AAAA" {...field} onChange={e => field.onChange(formatDate(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="cpf" render={({
            field
          }) => <FormItem>
                  <FormLabel>CPF</FormLabel>
                  <FormControl>
                    <Input placeholder="000.000.000-00" {...field} onChange={e => field.onChange(formatCPF(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>} />

            <FormField control={form.control} name="rg" render={({
            field
          }) => <FormItem>
                  <FormLabel>RG</FormLabel>
                  <FormControl>
                    <Input placeholder="RG" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="telefone" render={({
            field
          }) => <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input placeholder="(00) 00000-0000" {...field} onChange={e => field.onChange(formatPhone(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>} />

            <FormField control={form.control} name="email" render={({
            field
          }) => <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="email@exemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>} />
          </div>
        </div>

        {/* Seção: Endereço */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Endereço
          </h3>

          <div className="grid grid-cols-3 gap-4">
            <FormField control={form.control} name="cep" render={({
            field
          }) => <FormItem>
                  <FormLabel>CEP</FormLabel>
                  <FormControl>
                    <Input placeholder="00000-000" {...field} onChange={e => field.onChange(formatCEP(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>} />

            <div className="col-span-2">
              <FormField control={form.control} name="rua" render={({
              field
            }) => <FormItem>
                    <FormLabel>Rua</FormLabel>
                    <FormControl>
                      <Input placeholder="Rua / Avenida" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <FormField control={form.control} name="numero" render={({
            field
          }) => <FormItem>
                  <FormLabel>Número</FormLabel>
                  <FormControl>
                    <Input placeholder="Nº" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>} />

            <FormField control={form.control} name="complemento" render={({
            field
          }) => <FormItem>
                  <FormLabel>Complemento</FormLabel>
                  <FormControl>
                    <Input placeholder="Apto, Bloco..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>} />

            <div className="col-span-2">
              <FormField control={form.control} name="bairro" render={({
              field
            }) => <FormItem>
                    <FormLabel>Bairro</FormLabel>
                    <FormControl>
                      <Input placeholder="Bairro" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <FormField control={form.control} name="cidade" render={({
              field
            }) => <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input placeholder="Cidade" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />
            </div>

            <FormField control={form.control} name="estado" render={({
            field
          }) => <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="UF" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ESTADOS_BRASILEIROS.map(uf => <SelectItem key={uf} value={uf}>
                          {uf}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>} />
          </div>
        </div>

        {/* Seção: Foto do Aluno */}
        <WebcamCapture
          capturedImage={fotoCapturada}
          onCapture={setFotoCapturada}
          onClear={() => setFotoCapturada(null)}
        />

        {/* Botões */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </div>
      </form>
    </Form>;
}