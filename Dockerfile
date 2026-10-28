FROM node:22-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS test
COPY . .
CMD ["npm", "test"]

FROM test AS build
ARG VITE_API_BASE_URL=https://api.saellogibot.com
ARG VITE_API_KEY=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_API_KEY=$VITE_API_KEY
RUN npm run build

FROM nginx:alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx.local.conf.template /etc/nginx/templates/default.conf.template
ENV API_UPSTREAM=http://backend:43187
EXPOSE 5190
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s CMD wget -qO- http://127.0.0.1:5190/health || exit 1
CMD ["nginx", "-g", "daemon off;"]
