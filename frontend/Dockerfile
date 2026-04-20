# multi-stage build

FROM node:20-slim AS builder

WORKDIR /app

RUN npm install -g bun

COPY bun.lock package.json ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

FROM oven/bun:1.1.0

WORKDIR /app

# copy only required runtime files
COPY --from=builder /app/.output .output
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

ENV NODE_ENV=production

EXPOSE 3000