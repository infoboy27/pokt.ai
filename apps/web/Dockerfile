FROM node:18-alpine

# Install curl for health checks
RUN apk add --no-cache curl

WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./

# Copy package files for all workspace packages
COPY packages/ui/package.json ./packages/ui/
COPY packages/sdk/package.json ./packages/sdk/
COPY apps/web/package.json ./apps/web/

# Install pnpm and dependencies with workspace support
RUN npm install -g pnpm && pnpm install --no-frozen-lockfile

# Copy TypeScript configuration
COPY tsconfig*.json ./

# Copy source code for all workspace packages
COPY packages/ui ./packages/ui
COPY packages/sdk ./packages/sdk
COPY apps/web ./apps/web

# Build workspace packages
RUN cd packages/ui && pnpm build
RUN cd packages/sdk && pnpm build

# Install dependencies directly in web app directory
WORKDIR /app/apps/web
RUN pnpm install --no-frozen-lockfile

EXPOSE 4000

ENV NODE_ENV development
ENV PORT=4000
ENV HOST=0.0.0.0

# Use development mode with explicit path to next
CMD ["./node_modules/.bin/next", "dev", "-p", "4000"]
