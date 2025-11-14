# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/dba09226-4402-46ce-b03c-4880f0e15215

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/dba09226-4402-46ce-b03c-4880f0e15215) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with .

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/dba09226-4402-46ce-b03c-4880f0e15215) and click on Share -> Publish.

## I want to use a custom domain - is that possible?

We don't support custom domains (yet). If you want to deploy your project under your own domain then we recommend using Netlify. Visit our docs for more details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)

## Documentação de Desenvolvimento

### Funções Edge do Supabase

O projeto utiliza várias funções Edge do Supabase para automação e integração:

1. **Funções Principais**:
   - `register-productivity`: Registra produtividade dos alunos
   - `register-ah`: Registra dados do programa Abrindo Horizontes
   - `check-missing-attendance`: Verifica faltas consecutivas e frequência baixa
   - `check-missing-launches`: Verifica lançamentos pendentes
   - `sync-students`: Sincroniza dados dos alunos com uma planilha do Google Sheets
   - `process-video`: Processa vídeos (provavelmente relacionados ao conteúdo)
   - `send-evasion-alert-slack`: Envia alertas de evasão para o Slack

2. **Integrações**:
   - Google Sheets: Para sincronização de dados
   - Slack: Para envio de alertas e notificações
   - Make.com: Para automações via webhooks

3. **Estrutura do Banco de Dados**:
   - Tabelas principais:
     - `alunos`: Dados dos estudantes
     - `turmas`: Informações das turmas
     - `produtividade_abaco`: Registros de produtividade
     - `produtividade_ah`: Registros do programa Abrindo Horizontes
     - `funcionarios`: Dados dos funcionários
     - `units`: Unidades da escola
     - `dados_importantes`: Configurações e tokens

### Configuração de Credenciais

Para trabalhar com as funções Edge do Supabase, é necessário configurar as credenciais de forma segura:

1. **Variáveis de Ambiente**:
   Criar um arquivo `.env` na raiz do projeto com:
   ```
   SUPABASE_URL=sua_url_do_supabase
   SUPABASE_ANON_KEY=sua_chave_anonima
   SUPABASE_SERVICE_ROLE_KEY=sua_chave_de_servico
   ```

2. **Credenciais do Slack** (para alertas):
   - SLACK_BOT_TOKEN
   - Canal ID para os alertas

3. **Configuração no Supabase**:
   - Acessar o painel em https://app.supabase.com
   - Project Settings > API para obter as credenciais
   - Edge Functions > Settings para configurar variáveis de ambiente

### Monitoramento e Alertas

O sistema possui funcionalidades de monitoramento:
- Verificação de faltas consecutivas
- Monitoramento de frequência
- Alertas de evasão
- Controle de produtividade
