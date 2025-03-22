# Guia de Implantação do HOPE

Este guia explica como implantar o projeto HOPE no Railway (backend) e Vercel (frontend).

## Pré-requisitos

- Conta no [Railway](https://railway.app/)
- Conta no [Vercel](https://vercel.com/)
- Node.js 16+ instalado
- Git

## Configuração do Backend (Railway)

### Método 1: Deploy via GitHub

1. Faça fork do repositório no GitHub
2. Conecte sua conta Railway ao GitHub
3. Crie um novo projeto no Railway e selecione o repositório
4. Configure as variáveis de ambiente:
   - `PORT`: 3000
   - `NODE_ENV`: production
   - `MONGODB_URI`: sua string de conexão MongoDB
   - `JWT_SECRET`: chave secreta para tokens JWT
   - `CORS_ORIGIN`: URL do frontend (ex: [https://hope-platform.vercel.app](https://hope-platform.vercel.app))

### Método 2: Deploy via CLI

1. Instale a CLI do Railway:

   ```bash
   npm install -g @railway/cli
   ```

2. Faça login:

   ```bash
   railway login
   ```

3. Navegue até a pasta do backend:

   ```bash
   cd backend
   ```

4. Inicie um novo projeto:

   ```bash
   railway init
   ```

5. Configure as variáveis de ambiente:

   ```bash
   railway vars set PORT=3000 NODE_ENV=production ...
   ```

6. Faça o deploy:

   ```bash
   railway up
   ```

## Configuração do Frontend (Vercel)

### Método 1: Deploy via GitHub

1. Conecte sua conta Vercel ao GitHub
2. Importe o repositório no Vercel
3. Configure as variáveis de ambiente:
   - `REACT_APP_API_URL`: URL do backend (ex: [https://hope-api.up.railway.app](https://hope-api.up.railway.app))
4. Configure as opções de build:
   - Build Command: `cd frontend && npm install && npm run build`
   - Output Directory: `frontend/build`

### Método 2: Deploy via CLI

1. Instale a CLI do Vercel:

   ```bash
   npm install -g vercel
   ```

2. Faça login:

   ```bash
   vercel login
   ```

3. Navegue até a pasta do frontend:

   ```bash
   cd frontend
   ```

4. Faça o deploy:

   ```bash
   vercel
   ```

5. Para produção:

   ```bash
   vercel --prod
   ```

## Configuração de CI/CD

O projeto já inclui workflows GitHub Actions para automatizar o deploy:

- `.github/workflows/railway-deploy.yml`: Deploy automático do backend no Railway
- `.github/workflows/vercel-deploy.yml`: Deploy automático do frontend no Vercel

Para configurar:

1. Adicione os seguintes secrets no seu repositório GitHub:
   - `RAILWAY_TOKEN`: Token de API do Railway
   - `VERCEL_TOKEN`: Token de API do Vercel

2. Faça push para a branch main para acionar o deploy automático

## Verificação de Saúde

Após o deploy, verifique se tudo está funcionando corretamente:

1. Backend: Acesse `https://seu-app-railway.app/api/health`
2. Frontend: Acesse `https://seu-app-vercel.app`

## Solução de Problemas

### Problemas no Railway

- Verifique os logs no dashboard do Railway
- Confirme que todas as variáveis de ambiente estão configuradas corretamente
- Verifique se o MongoDB está acessível

### Problemas no Vercel

- Verifique os logs de build no dashboard do Vercel
- Confirme que a URL da API está configurada corretamente
- Verifique se o CORS está configurado corretamente no backend

## Monitoramento

- Configure alertas no Railway para monitorar o uso de recursos
- Use o Analytics do Vercel para monitorar o desempenho do frontend
- Considere adicionar ferramentas como Sentry para monitoramento de erros
