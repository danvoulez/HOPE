#!/bin/bash

# Script para automatizar commits e pushes no projeto HOPE
# Uso: ./auto-commit.sh "Mensagem do commit"

# Cores para melhor visualização
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Diretório raiz do projeto
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Verificar se estamos em um repositório git
if [ ! -d "$ROOT_DIR/.git" ]; then
  echo -e "${RED}Erro: Este diretório não é um repositório git.${NC}"
  echo -e "Execute 'git init' para inicializar um repositório git."
  exit 1
fi

# Verificar se uma mensagem de commit foi fornecida
if [ -z "$1" ]; then
  echo -e "${YELLOW}Nenhuma mensagem de commit fornecida. Usando mensagem padrão.${NC}"
  COMMIT_MSG="Atualização automática - $(date '+%Y-%m-%d %H:%M:%S')"
else
  COMMIT_MSG="$1"
fi

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

# Mudar para o diretório raiz
cd "$ROOT_DIR" || exit 1

header "VERIFICANDO ESTADO DO REPOSITÓRIO"

# Verificar se há mudanças para commit
step "Verificando mudanças..."
if git diff --quiet && git diff --staged --quiet; then
  error "Nenhuma mudança para commit. Nada a fazer." "exit"
else
  success "Mudanças detectadas"
fi

# Verificar branch atual
CURRENT_BRANCH=$(git branch --show-current)
step "Branch atual: $CURRENT_BRANCH"

header "PREPARANDO COMMIT"

# Adicionar todas as mudanças
step "Adicionando mudanças ao stage..."
git add .
if [ $? -eq 0 ]; then
  success "Mudanças adicionadas ao stage"
else
  error "Falha ao adicionar mudanças" "exit"
fi

# Realizar o commit
step "Realizando commit com mensagem: \"$COMMIT_MSG\"..."
git commit -m "$COMMIT_MSG"
if [ $? -eq 0 ]; then
  success "Commit realizado com sucesso"
else
  error "Falha ao realizar commit" "exit"
fi

header "VERIFICANDO CONFIGURAÇÃO REMOTA"

# Verificar se há um remote configurado
step "Verificando repositório remoto..."
if ! git remote -v | grep -q origin; then
  echo -e "${YELLOW}⚠ Nenhum repositório remoto 'origin' configurado.${NC}"
  echo -e "Para configurar um repositório remoto, execute:"
  echo -e "git remote add origin <URL_DO_REPOSITORIO>"
  echo -e "\nCommit realizado apenas localmente."
  exit 0
fi

# Perguntar se deseja fazer push
read -p "Deseja fazer push para o repositório remoto? (s/n): " PUSH_CHOICE
if [[ "$PUSH_CHOICE" =~ ^[Ss]$ ]]; then
  header "ENVIANDO MUDANÇAS PARA O REPOSITÓRIO REMOTO"
  
  # Verificar se o branch existe no remote
  step "Verificando se o branch existe no remote..."
  if ! git ls-remote --heads origin "$CURRENT_BRANCH" | grep -q "$CURRENT_BRANCH"; then
    echo -e "${YELLOW}⚠ O branch '$CURRENT_BRANCH' não existe no repositório remoto.${NC}"
    read -p "Deseja criar o branch no remote? (s/n): " CREATE_BRANCH
    if [[ "$CREATE_BRANCH" =~ ^[Ss]$ ]]; then
      step "Criando branch no remote..."
      git push --set-upstream origin "$CURRENT_BRANCH"
      if [ $? -eq 0 ]; then
        success "Branch criado e push realizado com sucesso"
      else
        error "Falha ao criar branch no remote"
      fi
    else
      echo -e "${YELLOW}Push cancelado pelo usuário.${NC}"
      exit 0
    fi
  else
    # Fazer push para o branch existente
    step "Fazendo push para o branch '$CURRENT_BRANCH'..."
    git push origin "$CURRENT_BRANCH"
    if [ $? -eq 0 ]; then
      success "Push realizado com sucesso"
    else
      error "Falha ao fazer push"
    fi
  fi
else
  echo -e "${YELLOW}Push cancelado pelo usuário.${NC}"
  echo -e "O commit foi realizado apenas localmente."
fi

header "VERIFICANDO WORKFLOWS DE CI/CD"

# Verificar se existem workflows de CI/CD
if [ -d "$ROOT_DIR/.github/workflows" ]; then
  step "Workflows de CI/CD detectados"
  echo -e "${YELLOW}⚠ Lembre-se de verificar o status dos workflows no GitHub:${NC}"
  echo -e "- Railway deploy: https://github.com/SEU_USUARIO/HOPE/actions/workflows/railway-deploy.yml"
  echo -e "- Vercel deploy: https://github.com/SEU_USUARIO/HOPE/actions/workflows/vercel-deploy.yml"
fi

echo -e "\n${GREEN}Commit automático concluído com sucesso!${NC}"
echo -e "Mensagem: \"$COMMIT_MSG\""
if [[ "$PUSH_CHOICE" =~ ^[Ss]$ ]] && [ $? -eq 0 ]; then
  echo -e "As mudanças foram enviadas para o repositório remoto."
  echo -e "Branch: $CURRENT_BRANCH"
else
  echo -e "As mudanças foram commitadas apenas localmente."
fi
