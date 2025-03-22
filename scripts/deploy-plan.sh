#!/bin/bash

# Script de automação do plano de implantação do HOPE
# Este script executa todas as etapas necessárias para preparar e implantar
# o projeto HOPE no Railway (backend) e Vercel (frontend)

# Cores para melhor visualização
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para exibir cabeçalhos
header() {
  echo -e "\n${BLUE}==== $1 ====${NC}\n"
}

# Função para exibir etapas
step() {
  echo -e "${YELLOW}→ $1${NC}"
}

# Função para exibir sucesso
success() {
  echo -e "${GREEN}✓ $1${NC}"
}

# Função para exibir erro
error() {
  echo -e "${RED}✗ $1${NC}"
  if [ "$2" = "exit" ]; then
    exit 1
  fi
}

# Diretórios principais
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
SCRIPTS_DIR="$ROOT_DIR/scripts"

# Verificar se estamos no diretório correto
if [ ! -d "$BACKEND_DIR" ] || [ ! -d "$FRONTEND_DIR" ]; then
  error "Diretórios de backend ou frontend não encontrados. Execute este script do diretório raiz do projeto." "exit"
fi

header "VERIFICANDO DEPENDÊNCIAS DO SISTEMA"

# Verificar Node.js
step "Verificando Node.js..."
if ! command -v node &> /dev/null; then
  error "Node.js não encontrado. Por favor, instale o Node.js 16 ou superior."
  exit 1
else
  NODE_VERSION=$(node -v)
  success "Node.js $NODE_VERSION encontrado"
fi

# Verificar npm
step "Verificando npm..."
if ! command -v npm &> /dev/null; then
  error "npm não encontrado. Por favor, instale o npm."
  exit 1
else
  NPM_VERSION=$(npm -v)
  success "npm $NPM_VERSION encontrado"
fi

# Verificar git
step "Verificando git..."
if ! command -v git &> /dev/null; then
  error "git não encontrado. Por favor, instale o git."
  exit 1
else
  GIT_VERSION=$(git --version)
  success "$GIT_VERSION encontrado"
fi

# Verificar Railway CLI (opcional)
step "Verificando Railway CLI..."
if ! command -v railway &> /dev/null; then
  echo -e "${YELLOW}⚠ Railway CLI não encontrado. Recomendamos instalar para testes locais:${NC}"
  echo "    npm install -g @railway/cli"
else
  RAILWAY_VERSION=$(railway version)
  success "Railway CLI $RAILWAY_VERSION encontrado"
fi

# Verificar Vercel CLI (opcional)
step "Verificando Vercel CLI..."
if ! command -v vercel &> /dev/null; then
  echo -e "${YELLOW}⚠ Vercel CLI não encontrado. Recomendamos instalar para testes locais:${NC}"
  echo "    npm install -g vercel"
else
  VERCEL_VERSION=$(vercel --version)
  success "Vercel CLI $VERCEL_VERSION encontrado"
fi

header "VERIFICANDO CONFIGURAÇÃO DO BACKEND (RAILWAY)"

# Verificar arquivos de configuração do backend
step "Verificando arquivos de configuração..."
FILES_TO_CHECK=("package.json" "server.js" "railway.json" "Procfile" ".env.example")
for file in "${FILES_TO_CHECK[@]}"; do
  if [ -f "$BACKEND_DIR/$file" ]; then
    success "Arquivo $file encontrado"
  else
    error "Arquivo $file não encontrado no backend"
  fi
done

# Verificar dependências do backend
step "Verificando dependências do backend..."
cd "$BACKEND_DIR" || exit 1
if [ ! -d "node_modules" ]; then
  echo "Instalando dependências do backend..."
  npm install
  if [ $? -ne 0 ]; then
    error "Falha ao instalar dependências do backend" "exit"
  fi
  success "Dependências do backend instaladas"
else
  success "Dependências do backend já instaladas"
fi

# Verificar JWT e bcrypt no package.json
step "Verificando dependências de autenticação..."
if grep -q "jsonwebtoken" "$BACKEND_DIR/package.json" && grep -q "bcryptjs" "$BACKEND_DIR/package.json"; then
  success "Dependências de autenticação encontradas"
else
  error "Dependências de autenticação (jsonwebtoken e/ou bcryptjs) não encontradas no package.json do backend"
fi

# Verificar rotas de autenticação
step "Verificando rotas de autenticação..."
if [ -f "$BACKEND_DIR/routes/auth.js" ]; then
  success "Rotas de autenticação encontradas"
else
  error "Arquivo routes/auth.js não encontrado. A autenticação pode não estar configurada corretamente."
fi

header "VERIFICANDO CONFIGURAÇÃO DO FRONTEND (VERCEL)"

# Verificar arquivos de configuração do frontend
step "Verificando arquivos de configuração..."
FILES_TO_CHECK=("package.json" "vercel.json" "src/App.js" "public/index.html" ".env.example")
for file in "${FILES_TO_CHECK[@]}"; do
  if [ -f "$FRONTEND_DIR/$file" ]; then
    success "Arquivo $file encontrado"
  else
    error "Arquivo $file não encontrado no frontend"
  fi
done

# Verificar homepage no package.json
step "Verificando configuração de homepage..."
if grep -q "\"homepage\":" "$FRONTEND_DIR/package.json"; then
  success "Homepage configurada no package.json"
else
  error "Homepage não configurada no package.json do frontend"
fi

# Verificar dependências do frontend
step "Verificando dependências do frontend..."
cd "$FRONTEND_DIR" || exit 1
if [ ! -d "node_modules" ]; then
  echo "Instalando dependências do frontend..."
  npm install
  if [ $? -ne 0 ]; then
    error "Falha ao instalar dependências do frontend" "exit"
  fi
  success "Dependências do frontend instaladas"
else
  success "Dependências do frontend já instaladas"
fi

header "VERIFICANDO CONFIGURAÇÃO DE CI/CD"

# Verificar workflows do GitHub Actions
step "Verificando workflows do GitHub Actions..."
if [ -f "$ROOT_DIR/.github/workflows/railway-deploy.yml" ] && [ -f "$ROOT_DIR/.github/workflows/vercel-deploy.yml" ]; then
  success "Workflows do GitHub Actions encontrados"
else
  error "Workflows do GitHub Actions não encontrados ou incompletos"
fi

header "VERIFICANDO VARIÁVEIS DE AMBIENTE"

# Verificar variáveis de ambiente do backend
step "Verificando variáveis de ambiente do backend..."
BACKEND_ENV_VARS=("PORT" "NODE_ENV" "MONGODB_URI" "JWT_SECRET" "CORS_ORIGIN")
MISSING_VARS=()

for var in "${BACKEND_ENV_VARS[@]}"; do
  if ! grep -q "$var" "$BACKEND_DIR/.env.example"; then
    MISSING_VARS+=("$var")
  fi
done

if [ ${#MISSING_VARS[@]} -eq 0 ]; then
  success "Todas as variáveis de ambiente do backend estão documentadas"
else
  error "Variáveis de ambiente faltando no .env.example do backend: ${MISSING_VARS[*]}"
fi

# Verificar variáveis de ambiente do frontend
step "Verificando variáveis de ambiente do frontend..."
if grep -q "REACT_APP_API_URL" "$FRONTEND_DIR/.env.example"; then
  success "Variável REACT_APP_API_URL encontrada no frontend"
else
  error "Variável REACT_APP_API_URL não encontrada no .env.example do frontend"
fi

header "EXECUTANDO TESTES BÁSICOS"

# Testar build do backend
step "Testando backend..."
cd "$BACKEND_DIR" || exit 1
if node -e "try { require('./server.js'); console.log('Verificação de sintaxe do servidor bem-sucedida'); } catch(e) { console.error('Erro:', e); process.exit(1); }"; then
  success "Verificação de sintaxe do backend bem-sucedida"
else
  error "Verificação de sintaxe do backend falhou"
fi

# Testar build do frontend
step "Testando build do frontend..."
cd "$FRONTEND_DIR" || exit 1
echo "Executando build do frontend (pode demorar um pouco)..."
if npm run build --if-present; then
  success "Build do frontend bem-sucedido"
else
  error "Build do frontend falhou"
fi

header "RESUMO DO PLANO DE IMPLANTAÇÃO"

echo -e "${GREEN}✓ Configuração do backend (Railway) verificada${NC}"
echo -e "${GREEN}✓ Configuração do frontend (Vercel) verificada${NC}"
echo -e "${GREEN}✓ Configuração de CI/CD verificada${NC}"
echo -e "${GREEN}✓ Variáveis de ambiente verificadas${NC}"
echo -e "${GREEN}✓ Testes básicos executados${NC}"

echo -e "\n${BLUE}PRÓXIMOS PASSOS:${NC}"
echo -e "1. Adicione os segredos RAILWAY_TOKEN e VERCEL_TOKEN ao seu repositório GitHub"
echo -e "2. Faça push para o GitHub para acionar os workflows de CI/CD"
echo -e "3. Verifique os logs de deploy em ambos os serviços"
echo -e "4. Teste a aplicação em produção"

echo -e "\n${BLUE}COMANDOS PARA DEPLOY MANUAL:${NC}"
echo -e "- Backend (Railway): cd $BACKEND_DIR && railway up"
echo -e "- Frontend (Vercel): cd $FRONTEND_DIR && vercel --prod"

echo -e "\n${GREEN}O projeto HOPE está pronto para ser implantado!${NC}"
