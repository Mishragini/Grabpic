# multi-stage build

FROM node:20-slim AS builder

WORKDIR /app

RUN npm install -g bun

COPY bun.lock package.json ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

FROM node:20-slim

WORKDIR /app

# only copy the files required to run the app
COPY --from=builder /app/public ./public
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["node","dist/server/server.js"]