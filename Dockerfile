# Dockerfile para o projeto HOPE
# Usa uma estratégia multi-stage para otimizar o tamanho da imagem final

# Estágio de build do frontend
FROM node:18-alpine AS frontend-builder

# Define o diretório de trabalho para o frontend
WORKDIR /app/frontend

# Copia os arquivos de dependências do frontend
COPY frontend/package*.json ./

# Instala as dependências do frontend
RUN npm ci || npm install

# Copia o restante dos arquivos do frontend
COPY frontend/ ./

# Executa o build do frontend
RUN npm run build

# Estágio de build do backend
FROM node:18-alpine AS backend-builder

# Define o diretório de trabalho para o backend
WORKDIR /app

# Copia os arquivos de dependências do backend e raiz
COPY package*.json ./
COPY backend/package*.json ./backend/

# Instala as dependências do backend e raiz
RUN npm ci || npm install
RUN if [ -f backend/package.json ]; then cd backend && (npm ci || npm install); fi

# Copia o restante dos arquivos do projeto
COPY . .

# Copia os arquivos de build do frontend
COPY --from=frontend-builder /app/frontend/build /app/frontend/build

# Estágio de produção
FROM node:18-alpine AS production

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos necessários do backend
COPY --from=backend-builder /app/package*.json ./
COPY --from=backend-builder /app/node_modules ./node_modules
COPY --from=backend-builder /app/backend ./backend

# Copia os arquivos de build do frontend
COPY --from=frontend-builder /app/frontend/build ./frontend/build

# Expõe a porta que a aplicação vai usar
EXPOSE 3000

# Define o comando para iniciar a aplicação
CMD ["npm", "start"]
