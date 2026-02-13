

# Mover Campo "Aula Inaugural" para Dados Iniciais

## O que sera feito

O campo "Data da Aula Inaugural" (com selecao de data, horario, professor e sala) sera removido do formulario de **Dados Pedagogicos** e adicionado como **primeiro campo** do formulario de **Dados Iniciais**.

## Alteracoes

### 1. `src/components/painel-administrativo/DadosFinaisForm.tsx` (Dados Iniciais)
- Importar o componente `AulaInauguralSelector`
- Adicionar estados para data, horario, professor e sala
- Renderizar o `AulaInauguralSelector` como primeiro elemento do formulario (antes da foto/webcam)
- Salvar os dados da aula inaugural junto com o submit do formulario (gravar `data_aula_inaugural` na tabela `atividade_pos_venda` e criar evento na `eventos_professor`)
- Carregar dados salvos existentes de `data_aula_inaugural` no useEffect inicial

### 2. `src/components/painel-administrativo/DadosPedagogicosForm.tsx`
- Remover toda a secao "Aula Inaugural" do accordion (AccordionItem value="aula")
- Remover os estados relacionados: `dataAulaInaugural`, `horarioSelecionado`, `professorSelecionado`, `salaSelecionada`
- Remover o import do `AulaInauguralSelector`
- Remover os parametros de aula inaugural do `handleSave` (`dataAulaInaugural`, `horarioAulaInaugural`, `professorId`, `salaId`)
- Remover o carregamento de dados salvos de `data_aula_inaugural` no useEffect

### 3. Logica de salvamento
- A logica de criar evento na agenda do professor (que hoje esta no hook `use-salvar-dados-pedagogicos.ts`) sera replicada diretamente na mutation do `DadosFinaisForm.tsx`, pois o salvamento ja e feito inline nesse componente
- A gravacao de `data_aula_inaugural` na `atividade_pos_venda` sera feita junto com os demais campos do checklist

