# pokt.ai - AI-powered RPC Gateway

A production-ready web portal for an AI-powered RPC Gateway built on top of Pocket Network Shannon + PATH.

## 🚀 Features

- **AI-Powered RPC Gateway**: Intelligent routing and optimization
- **Multi-Organization Support**: Create and manage multiple organizations
- **Real-time Analytics**: Comprehensive usage metrics and performance insights
- **Enterprise Security**: Rate limiting, authentication, and audit logs
- **Pay-as-you-go Billing**: Transparent, metered billing with Stripe
- **Developer-First**: Simple API, comprehensive SDKs, detailed documentation

## 🏗️ Architecture

```
pokt.ai/
├── apps/
│   ├── web/          # Next.js 14 frontend (App Router, TypeScript)
│   └── api/          # NestJS backend API
├── packages/
│   ├── ui/           # Shared UI components
│   └── sdk/          # TypeScript API client
└── infra/            # Docker Compose, migrations, deployment
```

### Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Recharts
- **Backend**: NestJS, TypeScript, Prisma, PostgreSQL, Redis
- **Auth**: Auth0 with JWT
- **Billing**: Stripe
- **Infrastructure**: Docker Compose, PostgreSQL, Redis

## 🛠️ Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Docker & Docker Compose
- PostgreSQL (or use Docker)

### 1. Clone and Install

```bash
git clone <repository-url>
cd pokt.ai
pnpm install
```

### 2. Environment Setup

```bash
# Copy environment files
cp apps/api/env.example apps/api/.env
cp apps/web/env.example apps/web/.env

# Edit the environment files with your configuration
# See Environment Variables section below
```

### 3. Start Development Environment

```bash
# Start all services with Docker Compose
make dev

# Or manually:
docker-compose up -d postgres redis
cd apps/api && pnpm db:migrate && pnpm db:seed
pnpm dev
```

### 4. Access the Application

- **Frontend**: http://localhost:4000
- **API**: http://localhost:3001
- **API Docs**: http://localhost:3001/docs
- **Database**: localhost:5432 (postgres/pokt_ai)

## 🔧 Environment Variables

### API (.env)

```bash
# Database
DATABASE_URL="postgresql://pokt_ai:pokt_ai_password@localhost:5432/pokt_ai"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key"

# Auth0
AUTH0_DOMAIN="your-tenant.auth0.com"
AUTH0_AUDIENCE="https://your-api.com"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Server
PORT=3001
FRONTEND_URL="http://localhost:4000"
```

### Web (.env)

```bash
# Auth0
AUTH0_SECRET="your-auth0-secret"
AUTH0_BASE_URL="http://localhost:4000"
AUTH0_ISSUER_BASE_URL="https://your-tenant.auth0.com"
AUTH0_CLIENT_ID="your-auth0-client-id"
AUTH0_CLIENT_SECRET="your-auth0-client-secret"

# API
NEXT_PUBLIC_API_URL="http://localhost:3001/api"

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

## 📚 Available Scripts

### Root Level

```bash
pnpm dev          # Start all applications in development
pnpm build        # Build all applications
pnpm test         # Run all tests
pnpm lint         # Run linting
pnpm format       # Format code
```

### Make Commands

```bash
make help         # Show all available commands
make dev          # Start development environment
make up           # Start all Docker services
make down         # Stop all Docker services
make clean        # Clean all build artifacts
make seed         # Seed database with sample data
make migrate      # Run database migrations
make studio       # Open Prisma Studio
```

## 🗄️ Database

### Migrations

```bash
cd apps/api
pnpm db:migrate   # Run migrations
pnpm db:generate  # Generate Prisma client
pnpm db:seed      # Seed with sample data
pnpm db:studio    # Open Prisma Studio
```

### Schema Overview

- **Users**: Authentication and profile data
- **Organizations**: Multi-tenant organizations
- **Endpoints**: RPC endpoints with rate limiting
- **Usage**: Daily usage metrics and analytics
- **Invoices**: Billing and payment records

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - Login with Auth0 token
- `GET /api/auth/me` - Get current user profile

### Endpoints
- `GET /api/endpoints` - List all endpoints
- `POST /api/endpoints` - Create new endpoint
- `GET /api/endpoints/:id` - Get specific endpoint
- `PUT /api/endpoints/:id/rotate-token` - Rotate endpoint token
- `PUT /api/endpoints/:id/revoke` - Revoke endpoint
- `DELETE /api/endpoints/:id` - Delete endpoint

### Usage & Analytics
- `GET /api/usage` - Get usage statistics
- `GET /api/billing/portal` - Create billing portal session
- `GET /api/billing/invoices` - List invoices

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run specific test suites
cd apps/web && pnpm test:e2e    # E2E tests with Playwright
cd apps/api && pnpm test        # Unit tests with Jest
```

## 🚀 Deployment

### Production Build

```bash
# Build all applications
pnpm build

# Start production services
docker-compose -f docker-compose.yml --profile production up -d
```

### Environment Variables for Production

Update the environment variables with production values:
- Use strong JWT secrets
- Configure production Auth0 tenant
- Set up production Stripe keys
- Use production database URLs

## 📖 Documentation

- [API Documentation](http://localhost:3001/docs) - Swagger/OpenAPI docs
- [Getting Started Guide](./docs/getting-started.md)
- [API Reference](./docs/api-reference.md)
- [Deployment Guide](./docs/deployment.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs/](./docs/)
- **Issues**: [GitHub Issues](https://github.com/your-org/pokt-ai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/pokt-ai/discussions)

## 🔗 Links

- [Pocket Network](https://www.pocketnetwork.com/)
- [PATH Gateway](https://path.pokt.network/)
- [Shannon Testnet](https://shannon.pokt.network/)
