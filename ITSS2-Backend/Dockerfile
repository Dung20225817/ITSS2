FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci && npx prisma generate

COPY tsconfig.json ./
COPY index.ts ./
COPY config ./config
COPY controllers ./controllers
COPY helper ./helper
COPY models ./models
COPY routes ./routes

RUN npm run build

FROM node:22-alpine AS runner

ENV NODE_ENV=production
ENV PORT=8080

RUN apk add --no-cache openssl

WORKDIR /app

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

EXPOSE 8080

CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/index.js"]
