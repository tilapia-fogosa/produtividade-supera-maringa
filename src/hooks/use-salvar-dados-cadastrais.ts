import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const MARINGA_UNIT_ID = "0df79a04-444e-46ee-b218-59e4b1835f4a";

interface DadosCadastraisInput {
  clientId: string;
  nome: string;
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
  fotoBase64?: string | null;
}

async function uploadFoto(fotoBase64: string, clientId: string): Promise<string | null> {
  try {
    // Converter base64 para Blob
    const base64Data = fotoBase64.replace(/^data:image\/\w+;base64,/, "");
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "image/jpeg" });

    // Nome único para o arquivo
    const fileName = `${clientId}_${Date.now()}.jpg`;

    // Upload para o bucket
    const { data, error } = await supabase.storage
      .from("alunos-fotos")
      .upload(fileName, blob, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (error) {
      console.error("Erro ao fazer upload da foto:", error);
      return null;
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from("alunos-fotos")
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (error) {
    console.error("Erro ao processar foto:", error);
    return null;
  }
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
      let fotoUrl: string | null = null;

      // Upload da foto se existir
      if (input.fotoBase64) {
        fotoUrl = await uploadFoto(input.fotoBase64, input.clientId);
      }

      // Converter data de nascimento para formato ISO
      const dataNascimentoISO = input.dataNascimento
        ? parseDataNascimento(input.dataNascimento)
        : null;

      // Calcular aniversario_mes_dia (MM-DD)
      let aniversarioMesDia: string | null = null;
      if (dataNascimentoISO) {
        const [, mes, dia] = dataNascimentoISO.split("-");
        aniversarioMesDia = `${mes}-${dia}`;
      }

      // 1. Criar registro na tabela alunos
      const { data: alunoData, error: alunoError } = await supabase
        .from("alunos")
        .insert({
          nome: input.nome,
          data_nascimento: dataNascimentoISO,
          aniversario_mes_dia: aniversarioMesDia,
          telefone: input.telefone || null,
          email: input.email || null,
          whatapp_contato: input.telefone || null,
          foto_url: fotoUrl,
          unit_id: MARINGA_UNIT_ID,
          active: true,
        })
        .select("id")
        .single();

      if (alunoError) {
        console.error("Erro ao criar aluno:", alunoError);
        throw new Error("Erro ao criar registro do aluno");
      }

      // 2. Atualizar atividade_pos_venda com os dados cadastrais
      const { error: atividadeError } = await supabase
        .from("atividade_pos_venda")
        .update({
          full_name: input.nome,
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
        // Não vamos lançar erro aqui pois o aluno já foi criado
      }

      return { alunoId: alunoData.id, fotoUrl };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos-matricula"] });
    },
  });
}
