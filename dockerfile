# Etapa de build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

RUN npm run build

# Etapa de produção
FROM nginx:alpine

# Remove o default do nginx
RUN rm -rf /usr/share/nginx/html/*

# Copia o build do Vite para o nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copia configuração customizada do nginx (opcional, caso queira usar nginx.conf)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
