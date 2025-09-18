FROM node:18-alpine

# Install OpenSSL, curl for health checks, and other required dependencies
RUN apk add --no-cache openssl curl

WORKDIR /app

# Copy package files
COPY apps/api/package.json ./
COPY apps/api/pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm && pnpm install

# Copy source code
COPY apps/api/src ./src
COPY apps/api/prisma ./prisma
COPY apps/api/tsconfig*.json ./
COPY apps/api/nest-cli.json ./

# Generate Prisma client
RUN npx prisma generate

EXPOSE 3001

ENV NODE_ENV development
ENV PORT=3001

# Use development mode with pnpm
CMD ["pnpm", "run", "start:dev"]
