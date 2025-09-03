FROM node:18-alpine

WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml ./
COPY package.json ./

# Copy package files for all workspace packages
COPY packages/ui/package.json ./packages/ui/
COPY packages/sdk/package.json ./packages/sdk/
COPY apps/web/package.json ./apps/web/

# Install dependencies with workspace support
RUN npm install -g pnpm && pnpm install

# Copy TypeScript configuration
COPY tsconfig*.json ./

# Copy source code for all workspace packages
COPY packages/ui ./packages/ui
COPY packages/sdk ./packages/sdk
COPY apps/web ./apps/web

# Build workspace packages
RUN cd packages/ui && pnpm build
RUN cd packages/sdk && pnpm build

EXPOSE 4000

ENV NODE_ENV development
ENV PORT=4000

# Use development mode
WORKDIR /app/apps/web
CMD ["pnpm", "--filter", "@pokt-ai/web", "run", "dev"]
