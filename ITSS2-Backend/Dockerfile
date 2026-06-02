FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY index.ts ./
COPY config ./config
COPY controllers ./controllers
COPY helper ./helper
COPY models ./models
COPY routes ./routes

RUN npm run build && npm prune --omit=dev

FROM node:22-alpine AS runner

ENV NODE_ENV=production
ENV PORT=8080

WORKDIR /app

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

EXPOSE 8080

CMD ["npm", "start"]
