

# Plano: Formulário de Dados Cadastrais no Drawer

## Resumo

Criar o formulário de **Dados Cadastrais** dentro do drawer existente (`PosMatriculaDrawer`), seguindo o layout da imagem de referência com duas seções: **Dados Pessoais** e **Endereço**.

---

## Campos do Formulário

### Seção: Dados Pessoais
| Campo | Tipo | Observação |
|-------|------|------------|
| Nome | Input texto | Pré-preenchido com o nome do cliente |
| Data de Nascimento | DatePicker | Seletor de data |
| CPF | Input texto | Máscara: 000.000.000-00 |
| RG | Input texto | Campo livre |

### Seção: Endereço
| Campo | Tipo | Observação |
|-------|------|------------|
| CEP | Input texto | Máscara: 00000-000 |
| Rua | Input texto | Campo livre |
| Número | Input texto | Campo livre |
| Complemento | Input texto | Opcional |
| Bairro | Input texto | Campo livre |
| Cidade | Input texto | Campo livre |
| Estado | Select | Lista de UFs brasileiras |

---

## Arquivos a Criar/Modificar

### 1. Criar: `src/components/painel-administrativo/DadosCadastraisForm.tsx`

Componente de formulário usando:
- `react-hook-form` com `zod` para validação
- Componentes de UI existentes (`Form`, `FormField`, `Input`, `Select`, `Button`)
- Organização em duas seções com visual limpo

### 2. Modificar: `src/components/painel-administrativo/PosMatriculaDrawer.tsx`

- Importar e renderizar o novo componente `DadosCadastraisForm` quando `tipo === "cadastrais"`
- Passar o cliente selecionado como prop para pré-preencher o nome

---

## Detalhes Técnicos

### Estrutura do Formulário
```text
┌─────────────────────────────────────┐
│ Dados Cadastrais                    │
│ [Nome do Cliente]                   │
├─────────────────────────────────────┤
│ DADOS PESSOAIS                      │
│ ┌─────────────────────────────────┐ │
│ │ Nome                            │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Data de Nascimento              │ │
│ └─────────────────────────────────┘ │
│ ┌───────────────┐ ┌───────────────┐ │
│ │ CPF           │ │ RG            │ │
│ └───────────────┘ └───────────────┘ │
├─────────────────────────────────────┤
│ ENDEREÇO                            │
│ ┌─────────────────────────────────┐ │
│ │ CEP                             │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Rua                             │ │
│ └─────────────────────────────────┘ │
│ ┌───────────────┐ ┌───────────────┐ │
│ │ Número        │ │ Complemento   │ │
│ └───────────────┘ └───────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Bairro                          │ │
│ └─────────────────────────────────┘ │
│ ┌───────────────┐ ┌───────────────┐ │
│ │ Cidade        │ │ Estado (UF)   │ │
│ └───────────────┘ └───────────────┘ │
├─────────────────────────────────────┤
│              [Cancelar] [Salvar]    │
└─────────────────────────────────────┘
```

### Schema Zod
```typescript
const dadosCadastraisSchema = z.object({
  nome: z.string().min(2, "Nome obrigatório"),
  data_nascimento: z.date().optional(),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  cep: z.string().optional(),
  rua: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
});
```

### Estados Brasileiros
Lista completa de UFs para o campo Estado (AC, AL, AM, AP, BA, CE, DF, ES, GO, MA, MG, MS, MT, PA, PB, PE, PI, PR, RJ, RN, RO, RR, RS, SC, SE, SP, TO)

### Funcionalidades
- O botão **Salvar** exibirá um estado de loading enquanto processa
- O botão **Cancelar** fechará o drawer
- Por enquanto, o **onSubmit** apenas fará um `console.log` dos dados (integração com banco será feita depois)
- O campo **Nome** será pré-preenchido com o nome do cliente selecionado

