import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DadosCadastraisInput {
  clientId: string;
  alunoId: string; // ID do aluno vinculado
  dataNascimento?: string;
  cpf?: string;
  rg?: string;
  telefone?: string;
  email?: string;
  cep?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
}

function parseDataNascimento(dataBr: string): string | null {
  if (!dataBr || dataBr.length !== 10) return null;
  const [dia, mes, ano] = dataBr.split("/");
  if (!dia || !mes || !ano) return null;
  return `${ano}-${mes}-${dia}`;
}

export function useSalvarDadosCadastrais() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: DadosCadastraisInput) => {
      // Converter data de nascimento para formato ISO
      const dataNascimentoISO = input.dataNascimento
        ? parseDataNascimento(input.dataNascimento)
        : null;

      // 1. Atualizar registro na tabela alunos (aluno vinculado)
      // Nota: aniversario_mes_dia é uma coluna gerada automaticamente pelo banco
      const { error: alunoError } = await supabase
        .from("alunos")
        .update({
          data_nascimento: dataNascimentoISO,
          telefone: input.telefone || null,
          email: input.email || null,
          whatapp_contato: input.telefone || null,
          // Documentos
          cpf: input.cpf?.replace(/\D/g, "") || null,
          rg: input.rg || null,
          // Endereço completo
          endereco_cep: input.cep?.replace(/\D/g, "") || null,
          endereco_rua: input.rua || null,
          endereco_numero: input.numero || null,
          endereco_complemento: input.complemento || null,
          endereco_bairro: input.bairro || null,
          endereco_cidade: input.cidade || null,
          endereco_estado: input.estado || null,
        })
        .eq("id", input.alunoId);

      if (alunoError) {
        console.error("Erro ao atualizar aluno:", alunoError);
        throw new Error("Erro ao atualizar registro do aluno");
      }

      // 2. Atualizar atividade_pos_venda com os dados cadastrais
      const { error: atividadeError } = await supabase
        .from("atividade_pos_venda")
        .update({
          birth_date: dataNascimentoISO,
          cpf: input.cpf?.replace(/\D/g, "") || null,
          rg: input.rg || null,
          whatsapp_contato: input.telefone || null,
          address_postal_code: input.cep?.replace(/\D/g, "") || null,
          address_street: input.rua || null,
          address_number: input.numero || null,
          address_complement: input.complemento || null,
          address_neighborhood: input.bairro || null,
          address_city: input.cidade || null,
          address_state: input.estado || null,
        })
        .eq("client_id", input.clientId);

      if (atividadeError) {
        console.error("Erro ao atualizar atividade_pos_venda:", atividadeError);
      }

      return { alunoId: input.alunoId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos-matricula"] });
      queryClient.invalidateQueries({ queryKey: ["aluno-vinculado"] });
      queryClient.invalidateQueries({ queryKey: ["atividades-pos-venda"] });
    },
  });
}
