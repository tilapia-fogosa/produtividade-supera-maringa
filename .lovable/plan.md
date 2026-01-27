

# Plano: Formulário de Dados Comerciais

## Resumo

Criar o formulário de **Dados Comerciais** dentro do drawer `PosMatriculaDrawer`, com 4 seções organizadas: Tipo de Kit, Matrícula, Mensalidade e Material. Os dados serão salvos na tabela `atividade_pos_venda` que já possui os campos necessários.

---

## Estrutura do Formulário

### Seção 1: Tipo de Kit
| Campo | Tipo | Opções |
|-------|------|--------|
| Tipo de Kit | Select | Kit 1, Kit 2, Kit 3, Kit 4, Kit 5, Kit 6, Kit 7, Kit 8 |

### Seção 2: Matrícula
| Campo | Tipo | Observação |
|-------|------|------------|
| Valor | Input numérico | Máscara de moeda (R$) |
| Data de Pagamento | Input texto | Máscara: DD/MM/AAAA |
| Forma de Pagamento | Select | Pix, Dinheiro, Cartão de Crédito, Cartão de Débito, Transferência, Boleto, Recorrência |
| Parcelas | Select | 1x a 12x |
| Pagamento Confirmado | Switch | Sim/Não |

### Seção 3: Mensalidade
| Campo | Tipo | Observação |
|-------|------|------------|
| Valor | Input numérico | Máscara de moeda (R$) |
| 1ª Mensalidade | Input texto | Data da primeira mensalidade (DD/MM/AAAA) |
| Forma de Pagamento | Select | Pix, Dinheiro, Cartão de Crédito, Cartão de Débito, Transferência, Boleto, Recorrência |

### Seção 4: Material
| Campo | Tipo | Observação |
|-------|------|------------|
| Valor | Input numérico | Máscara de moeda (R$) |
| Data de Pagamento | Input texto | Máscara: DD/MM/AAAA |
| Forma de Pagamento | Select | Pix, Dinheiro, Cartão de Crédito, Cartão de Débito, Transferência, Boleto, Recorrência |
| Parcelas | Select | 1x a 12x |
| Pagamento Confirmado | Switch | Sim/Não |

---

## Alterações Necessárias

### 1. Migration: Adicionar 'transferencia' ao enum payment_method

Adicionar o valor "transferencia" ao enum `payment_method` existente no banco de dados.

### 2. Criar: `src/components/painel-administrativo/DadosComercaisForm.tsx`

Componente de formulário seguindo o padrão do `DadosCadastraisForm`:
- Usar `react-hook-form` com validação `zod`
- Layout desktop de alta densidade com grid de 2-3 colunas
- Organização visual por seções com títulos em uppercase
- Máscara de moeda para campos de valor
- Máscara de data (DD/MM/AAAA) para datas
- Switch para confirmação de pagamento

### 3. Criar: `src/hooks/use-salvar-dados-comerciais.ts`

Hook de mutation para salvar os dados comerciais na tabela `atividade_pos_venda`, atualizando o registro pelo `client_id`.

### 4. Modificar: `src/components/painel-administrativo/PosMatriculaDrawer.tsx`

Importar e renderizar o `DadosComercaisForm` quando `tipo === "comerciais"`.

---

## Layout Visual Proposto

```text
┌─────────────────────────────────────────────────────────────┐
│ Dados Comerciais                                            │
│ [Nome do Cliente]                                           │
├─────────────────────────────────────────────────────────────┤
│ TIPO DE KIT                                                 │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Tipo de Kit                          [Kit 1 ▼]          │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ MATRÍCULA                                                   │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│ │ Valor           │ │ Data Pagamento  │ │ Forma Pagamento │ │
│ │ R$ 0,00         │ │ DD/MM/AAAA      │ │ [Selecione ▼]   │ │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘ │
│ ┌─────────────────┐ ┌─────────────────────────────────────┐ │
│ │ Parcelas        │ │ Pagamento Confirmado    [ toggle ]  │ │
│ │ [1x ▼]          │ │                                     │ │
│ └─────────────────┘ └─────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ MENSALIDADE                                                 │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│ │ Valor           │ │ 1ª Mensalidade  │ │ Forma Pagamento │ │
│ │ R$ 0,00         │ │ DD/MM/AAAA      │ │ [Selecione ▼]   │ │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ MATERIAL                                                    │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│ │ Valor           │ │ Data Pagamento  │ │ Forma Pagamento │ │
│ │ R$ 0,00         │ │ DD/MM/AAAA      │ │ [Selecione ▼]   │ │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘ │
│ ┌─────────────────┐ ┌─────────────────────────────────────┐ │
│ │ Parcelas        │ │ Pagamento Confirmado    [ toggle ]  │ │
│ │ [1x ▼]          │ │                                     │ │
│ └─────────────────┘ └─────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                               [Cancelar] [Salvar]           │
└─────────────────────────────────────────────────────────────┘
```

---

## Detalhes Técnicos

### Mapeamento de Campos para o Banco

| Campo do Formulário | Coluna no Banco |
|---------------------|-----------------|
| Tipo de Kit | `kit_type` |
| Matrícula - Valor | `enrollment_amount` |
| Matrícula - Data | `enrollment_payment_date` |
| Matrícula - Forma | `enrollment_payment_method` |
| Matrícula - Parcelas | `enrollment_installments` |
| Matrícula - Confirmado | `enrollment_payment_confirmed` |
| Mensalidade - Valor | `monthly_fee_amount` |
| Mensalidade - 1ª Data | `first_monthly_fee_date` |
| Mensalidade - Forma | `monthly_fee_payment_method` |
| Material - Valor | `material_amount` |
| Material - Data | `material_payment_date` |
| Material - Forma | `material_payment_method` |
| Material - Parcelas | `material_installments` |
| Material - Confirmado | `material_payment_confirmed` |

### Formas de Pagamento (após migration)
- dinheiro
- pix
- cartao_credito
- cartao_debito
- boleto
- recorrencia
- transferencia (novo)

### Funcionalidades
- Botão **Salvar** com estado de loading durante o processamento
- Mensagem de sucesso após salvar e fechamento automático do drawer (1.5s)
- Botão **Cancelar** fecha o drawer sem salvar
- Todos os campos são opcionais para permitir preenchimento parcial

