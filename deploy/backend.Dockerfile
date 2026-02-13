FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./
RUN apk add --no-cache openssl
RUN npm install

COPY backend/ .
# Variável fictícia para validação do Prisma durante o build
ENV DATABASE_URL="postgresql://user:password@localhost:5432/fxtao_db?schema=public"
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "dev"]
