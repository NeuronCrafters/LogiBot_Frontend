# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copia arquivos de dependência
COPY package*.json ./

# Instala dependências
RUN npm ci

# Copia código fonte
COPY . .

# Build de produção
RUN npm run build

# Production stage - serve estático simples
FROM node:20-alpine

WORKDIR /app

# Instala serve para servir arquivos estáticos
RUN npm install -g serve

# Copia apenas os arquivos buildados
COPY --from=builder /app/dist ./dist

EXPOSE 3001

# Serve os arquivos estáticos
CMD ["serve", "-s", "dist", "-l", "3001"]