FROM node:18-alpine

# Install OpenSSL and other required dependencies for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY apps/api/package.json ./

# Install dependencies
RUN npm install

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

# Use development mode
CMD ["npm", "run", "start:dev"]
