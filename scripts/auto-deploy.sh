#!/bin/bash

# Script para automatizar o deploy do projeto HOPE no Railway e Vercel
# Uso: ./auto-deploy.sh [railway|vercel|all]

# Cores para melhor visualização
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Diretório raiz do projeto
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

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

# Verificar argumentos
if [ $# -eq 0 ]; then
  echo -e "${YELLOW}Nenhum argumento fornecido. Uso:${NC}"
  echo -e "./auto-deploy.sh [railway|vercel|all]"
  echo -e "  railway: Deploy apenas do backend no Railway"
  echo -e "  vercel: Deploy apenas do frontend no Vercel"
  echo -e "  all: Deploy completo (backend e frontend)"
  exit 1
fi

# Verificar se as CLIs estão instaladas
check_cli() {
  if ! command -v $1 &> /dev/null; then
    error "CLI $1 não encontrada. Por favor, instale com: npm install -g $1" "exit"
  else
    success "CLI $1 encontrada"
  fi
}

# Função para deploy no Railway
deploy_railway() {
  header "DEPLOY DO BACKEND NO RAILWAY"
  
  # Verificar CLI do Railway
  step "Verificando Railway CLI..."
  check_cli railway
  
  # Verificar login
  step "Verificando login no Railway..."
  if ! railway whoami &> /dev/null; then
    error "Não logado no Railway. Execute 'railway login' primeiro."
    railway login
  else
    success "Logado no Railway"
  fi
  
  # Executar deploy
  step "Iniciando deploy no Railway..."
  cd "$BACKEND_DIR" || exit 1
  
  # Verificar se já existe um projeto Railway
  if ! railway list &> /dev/null; then
    step "Nenhum projeto Railway encontrado. Criando novo projeto..."
    railway init
  fi
  
  # Deploy
  railway up
  if [ $? -eq 0 ]; then
    success "Deploy no Railway concluído com sucesso"
    
    # Obter URL do projeto
    RAILWAY_URL=$(railway status | grep -o 'https://.*\.up\.railway\.app' | head -1)
    if [ -n "$RAILWAY_URL" ]; then
      echo -e "${GREEN}URL do backend: $RAILWAY_URL${NC}"
      
      # Atualizar .env do frontend se necessário
      if [ -f "$FRONTEND_DIR/.env" ]; then
        step "Atualizando URL da API no frontend..."
        sed -i '' "s|REACT_APP_API_URL=.*|REACT_APP_API_URL=$RAILWAY_URL|g" "$FRONTEND_DIR/.env"
        success "URL da API atualizada no frontend"
      fi
    fi
  else
    error "Falha no deploy do Railway"
  fi
}

# Função para deploy no Vercel
deploy_vercel() {
  header "DEPLOY DO FRONTEND NO VERCEL"
  
  # Verificar CLI do Vercel
  step "Verificando Vercel CLI..."
  check_cli vercel
  
  # Verificar login
  step "Verificando login no Vercel..."
  if ! vercel whoami &> /dev/null; then
    error "Não logado no Vercel. Execute 'vercel login' primeiro."
    vercel login
  else
    success "Logado no Vercel"
  fi
  
  # Executar deploy
  step "Iniciando deploy no Vercel..."
  cd "$FRONTEND_DIR" || exit 1
  
  # Deploy para produção
  vercel --prod
  if [ $? -eq 0 ]; then
    success "Deploy no Vercel concluído com sucesso"
    
    # Tentar obter URL do projeto
    VERCEL_URL=$(vercel ls | grep -o 'https://.*\.vercel\.app' | head -1)
    if [ -n "$VERCEL_URL" ]; then
      echo -e "${GREEN}URL do frontend: $VERCEL_URL${NC}"
    fi
  else
    error "Falha no deploy do Vercel"
  fi
}

# Executar deploy com base no argumento
case "$1" in
  railway)
    deploy_railway
    ;;
  vercel)
    deploy_vercel
    ;;
  all)
    deploy_railway
    deploy_vercel
    
    header "DEPLOY COMPLETO CONCLUÍDO"
    echo -e "${GREEN}O projeto HOPE foi implantado com sucesso!${NC}"
    echo -e "Não se esqueça de verificar se tudo está funcionando corretamente."
    ;;
  *)
    error "Argumento inválido: $1. Use railway, vercel ou all." "exit"
    ;;
esac

echo -e "\n${BLUE}PRÓXIMOS PASSOS:${NC}"
echo -e "1. Verifique se as aplicações estão funcionando corretamente"
echo -e "2. Teste o fluxo de autenticação (login/logout)"
echo -e "3. Verifique se as variáveis de ambiente estão configuradas corretamente"
echo -e "4. Configure monitoramento e alertas para os serviços"

echo -e "\n${GREEN}Deploy automatizado concluído!${NC}"
