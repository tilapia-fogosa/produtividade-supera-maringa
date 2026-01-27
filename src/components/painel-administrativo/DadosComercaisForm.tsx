import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ClienteMatriculado } from "@/hooks/use-pos-matricula";
import { useSalvarDadosComerciais } from "@/hooks/use-salvar-dados-comerciais";
import { Loader2, CheckCircle } from "lucide-react";

const formSchema = z.object({
  kitType: z.string().optional(),
  enrollmentAmount: z.string().optional(),
  enrollmentPaymentDate: z.string().optional(),
  enrollmentPaymentMethod: z.string().optional(),
  enrollmentInstallments: z.string().optional(),
  enrollmentPaymentConfirmed: z.boolean().optional(),
  monthlyFeeAmount: z.string().optional(),
  firstMonthlyFeeDate: z.string().optional(),
  monthlyFeePaymentMethod: z.string().optional(),
  materialAmount: z.string().optional(),
  materialPaymentDate: z.string().optional(),
  materialPaymentMethod: z.string().optional(),
  materialInstallments: z.string().optional(),
  materialPaymentConfirmed: z.boolean().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface DadosComercaisFormProps {
  cliente: ClienteMatriculado;
  onCancel: () => void;
}

const KIT_OPTIONS = [
  { value: "kit_1", label: "Kit 1" },
  { value: "kit_2", label: "Kit 2" },
  { value: "kit_3", label: "Kit 3" },
  { value: "kit_4", label: "Kit 4" },
  { value: "kit_5", label: "Kit 5" },
  { value: "kit_6", label: "Kit 6" },
  { value: "kit_7", label: "Kit 7" },
  { value: "kit_8", label: "Kit 8" },
];

const PAYMENT_METHODS = [
  { value: "pix", label: "Pix" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "cartao_credito", label: "Cartão de Crédito" },
  { value: "cartao_debito", label: "Cartão de Débito" },
  { value: "transferencia", label: "Transferência" },
  { value: "boleto", label: "Boleto" },
  { value: "recorrencia", label: "Recorrência" },
];

const INSTALLMENTS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1}x`,
}));

const formatCurrency = (value: string) => {
  const numbers = value.replace(/\D/g, "");
  const amount = parseInt(numbers || "0", 10) / 100;
  return amount.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

const parseCurrency = (value: string): number => {
  const numbers = value.replace(/\D/g, "");
  return parseInt(numbers || "0", 10) / 100;
};

const formatDate = (value: string) => {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
  return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
};

export function DadosComercaisForm({ cliente, onCancel }: DadosComercaisFormProps) {
  const [salvoComSucesso, setSalvoComSucesso] = useState(false);
  const { mutate: salvar, isPending } = useSalvarDadosComerciais();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      kitType: "",
      enrollmentAmount: "R$ 0,00",
      enrollmentPaymentDate: "",
      enrollmentPaymentMethod: "",
      enrollmentInstallments: "",
      enrollmentPaymentConfirmed: false,
      monthlyFeeAmount: "R$ 0,00",
      firstMonthlyFeeDate: "",
      monthlyFeePaymentMethod: "",
      materialAmount: "R$ 0,00",
      materialPaymentDate: "",
      materialPaymentMethod: "",
      materialInstallments: "",
      materialPaymentConfirmed: false,
    },
  });

  useEffect(() => {
    if (salvoComSucesso) {
      const timer = setTimeout(() => {
        onCancel();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [salvoComSucesso, onCancel]);

  const handleCurrencyChange = (
    field: "enrollmentAmount" | "monthlyFeeAmount" | "materialAmount",
    value: string
  ) => {
    form.setValue(field, formatCurrency(value));
  };

  const handleDateChange = (
    field: "enrollmentPaymentDate" | "firstMonthlyFeeDate" | "materialPaymentDate",
    value: string
  ) => {
    form.setValue(field, formatDate(value));
  };

  const onSubmit = (data: FormData) => {
    salvar(
      {
        clientId: cliente.id,
        kitType: data.kitType || undefined,
        enrollmentAmount: parseCurrency(data.enrollmentAmount || "") || undefined,
        enrollmentPaymentDate: data.enrollmentPaymentDate || undefined,
        enrollmentPaymentMethod: data.enrollmentPaymentMethod || undefined,
        enrollmentInstallments: data.enrollmentInstallments
          ? parseInt(data.enrollmentInstallments)
          : undefined,
        enrollmentPaymentConfirmed: data.enrollmentPaymentConfirmed,
        monthlyFeeAmount: parseCurrency(data.monthlyFeeAmount || "") || undefined,
        firstMonthlyFeeDate: data.firstMonthlyFeeDate || undefined,
        monthlyFeePaymentMethod: data.monthlyFeePaymentMethod || undefined,
        materialAmount: parseCurrency(data.materialAmount || "") || undefined,
        materialPaymentDate: data.materialPaymentDate || undefined,
        materialPaymentMethod: data.materialPaymentMethod || undefined,
        materialInstallments: data.materialInstallments
          ? parseInt(data.materialInstallments)
          : undefined,
        materialPaymentConfirmed: data.materialPaymentConfirmed,
      },
      {
        onSuccess: () => setSalvoComSucesso(true),
      }
    );
  };

  if (salvoComSucesso) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <CheckCircle className="h-16 w-16 text-green-500" />
        <p className="text-lg font-medium text-green-700">Dados salvos com sucesso!</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Accordion type="multiple" defaultValue={["kit"]} className="w-full">
          {/* TIPO DE KIT */}
          <AccordionItem value="kit" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline py-4">
              <span className="text-sm font-medium">Tipo de Kit</span>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <FormField
                control={form.control}
                name="kitType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Selecione o Kit</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o kit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {KIT_OPTIONS.map((kit) => (
                          <SelectItem key={kit.value} value={kit.value}>
                            {kit.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </AccordionContent>
          </AccordionItem>

          {/* MATRÍCULA */}
          <AccordionItem value="matricula" className="border rounded-lg px-4 mt-2">
            <AccordionTrigger className="hover:no-underline py-4">
              <span className="text-sm font-medium">Matrícula</span>
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="enrollmentAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          onChange={(e) => handleCurrencyChange("enrollmentAmount", e.target.value)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="enrollmentPaymentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Pagamento</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="DD/MM/AAAA"
                          maxLength={10}
                          onChange={(e) => handleDateChange("enrollmentPaymentDate", e.target.value)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="enrollmentPaymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Forma de Pagamento</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PAYMENT_METHODS.map((method) => (
                            <SelectItem key={method.value} value={method.value}>
                              {method.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="enrollmentInstallments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parcelas</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {INSTALLMENTS.map((inst) => (
                            <SelectItem key={inst.value} value={inst.value}>
                              {inst.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* MENSALIDADE */}
          <AccordionItem value="mensalidade" className="border rounded-lg px-4 mt-2">
            <AccordionTrigger className="hover:no-underline py-4">
              <span className="text-sm font-medium">Mensalidade</span>
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="monthlyFeeAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          onChange={(e) => handleCurrencyChange("monthlyFeeAmount", e.target.value)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="firstMonthlyFeeDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>1ª Mensalidade</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="DD/MM/AAAA"
                          maxLength={10}
                          onChange={(e) => handleDateChange("firstMonthlyFeeDate", e.target.value)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="monthlyFeePaymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma de Pagamento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PAYMENT_METHODS.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </AccordionContent>
          </AccordionItem>

          {/* MATERIAL */}
          <AccordionItem value="material" className="border rounded-lg px-4 mt-2">
            <AccordionTrigger className="hover:no-underline py-4">
              <span className="text-sm font-medium">Material</span>
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="materialAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          onChange={(e) => handleCurrencyChange("materialAmount", e.target.value)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="materialPaymentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Pagamento</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="DD/MM/AAAA"
                          maxLength={10}
                          onChange={(e) => handleDateChange("materialPaymentDate", e.target.value)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="materialPaymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Forma de Pagamento</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PAYMENT_METHODS.map((method) => (
                            <SelectItem key={method.value} value={method.value}>
                              {method.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="materialInstallments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parcelas</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {INSTALLMENTS.map((inst) => (
                            <SelectItem key={inst.value} value={inst.value}>
                              {inst.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* CONFIRMAÇÕES DE PAGAMENTOS */}
          <AccordionItem value="confirmacoes" className="border rounded-lg px-4 mt-2">
            <AccordionTrigger className="hover:no-underline py-4">
              <span className="text-sm font-medium">Confirmações de Pagamentos</span>
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-4">
              <FormField
                control={form.control}
                name="enrollmentPaymentConfirmed"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <FormLabel className="text-sm font-normal">Matrícula Confirmada</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="materialPaymentConfirmed"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <FormLabel className="text-sm font-normal">Material Confirmado</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* BOTÃO SALVAR */}
        <div className="flex justify-end pt-4">
          <Button 
            type="submit" 
            disabled={isPending}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Dados
          </Button>
        </div>
      </form>
    </Form>
  );
}
