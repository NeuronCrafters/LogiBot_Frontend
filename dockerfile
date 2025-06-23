# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copia apenas arquivos de dependência primeiro (melhor cache)
COPY package*.json ./
RUN npm ci

# Copia o restante do projeto
COPY . .

# Gera build de produção
RUN npm run build

# Production stage - apenas arquivos finais
FROM node:22-alpine

WORKDIR /app

# Instala o servidor estático
RUN npm install -g serve

# Copia build final
COPY --from=builder /app/dist ./dist

EXPOSE 3001

# Comando para servir os arquivos
CMD ["serve", "-s", "dist", "-l", "3001"]
