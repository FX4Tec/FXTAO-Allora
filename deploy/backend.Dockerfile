FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./
RUN apk add --no-cache openssl postgresql-client \
    && npm ci

COPY backend/ ./
ENV DATABASE_URL="postgresql://user:password@localhost:5432/fxtao_db?schema=public"
RUN npx prisma generate \
    && npm prune --omit=dev \
    && mkdir -p /app/uploads \
    && chown -R node:node /app

ENV NODE_ENV=production
USER node

EXPOSE 3000

CMD ["npm", "start"]
