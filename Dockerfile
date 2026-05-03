# STAGE 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependências necessárias para o Prisma e build
RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

# Gerar o Prisma Client e Build do NestJS
RUN npx prisma generate
RUN npm run build

# STAGE 2: Run
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl

# Copiar apenas o necessário do stage builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/.env.example ./.env

EXPOSE 8080

# Script de entrada para rodar migrations e depois a app
CMD ["sh", "-c", "npx prisma db push && npm run start:prod"]
