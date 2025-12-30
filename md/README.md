# pokt.ai - AI-powered RPC Gateway

A production-ready web portal for an AI-powered RPC Gateway built on top of Pocket Network Shannon + PATH. This project provides intelligent routing, multi-organization support, real-time analytics, and enterprise-grade security for blockchain RPC requests.

## 🚀 Features

- **AI-Powered RPC Gateway**: Intelligent routing and optimization across multiple blockchain networks
- **Multi-Organization Support**: Create and manage multiple organizations with role-based access
- **Real-time Analytics**: Comprehensive usage metrics, performance insights, and billing tracking
- **Enterprise Security**: Rate limiting, authentication, audit logs, and DDoS protection
- **Pay-as-you-go Billing**: Transparent, metered billing with Stripe integration
- **Developer-First**: Simple API, comprehensive SDKs, detailed documentation
- **Admin Portal**: Complete administrative interface for managing networks, endpoints, and users
- **Load Balancing**: Traefik-based load balancing with automatic failover

## 🏗️ Architecture

```
pokt.ai/
├── apps/
│   ├── web/              # Next.js 14 frontend (App Router, TypeScript)
│   │   ├── app/          # App router pages
│   │   │   ├── admin/    # Admin portal
│   │   │   ├── api/      # API routes
│   │   │   └── login/    # Authentication pages
│   │   ├── components/   # Reusable UI components
│   │   └── lib/          # Utility functions and storage
│   └── api/              # NestJS backend API
│       ├── src/          # Source code
│       ├── prisma/       # Database schema and migrations
│       └── dist/         # Compiled output
├── packages/
│   ├── ui/               # Shared UI components
│   ├── sdk/              # TypeScript API client
│   └── runtime-auth/     # Authentication runtime
├── infra/                # Infrastructure configuration
│   ├── docker-compose.yml      # Main Docker configuration
│   ├── traefik-poktai-fixed.yml # Traefik routing configuration
│   └── Makefile         # Development commands
└── loadbalancer/         # Traefik load balancer configuration
```

### Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Recharts
- **Backend**: NestJS, TypeScript, Prisma, PostgreSQL, Redis
- **Auth**: Auth0 with JWT
- **Billing**: Stripe integration
- **Infrastructure**: Docker Compose, Traefik, PostgreSQL, Redis
- **Load Balancer**: Traefik with SSL termination
- **Monitoring**: Built-in health checks and metrics

## 🛠️ Quick Start

### Prerequisites

- **Node.js 18+**
- **pnpm 8+**
- **Docker & Docker Compose**
- **Git**

### 1. Clone and Install

```bash
git clone https://github.com/infoboy27/pokt.ai.git
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

### 3. Start Infrastructure Services

```bash
# Start PostgreSQL and Redis
cd infra
docker-compose up -d postgres redis
```

### 4. Setup Database

```bash
# Reset and setup database schema
cd apps/api
npx prisma db push --force-reset
pnpm db:seed
```

### 5. Start Development Servers

```bash
# From the root directory
pnpm dev
```

This will start:
- **Web Application**: http://localhost:4000
- **API Server**: http://localhost:3001
- **API Documentation**: http://localhost:3001/docs

### 6. Access the Applications

- **Main Website**: http://localhost:4000
- **Admin Portal**: http://localhost:4000/admin
- **API Health**: http://localhost:3001/api/health
- **Swagger Docs**: http://localhost:3001/docs

## 🔧 Environment Variables

### API Configuration (apps/api/.env)

```bash
# Database
DATABASE_URL="postgresql://pokt_ai:pokt_ai_password@localhost:5432/pokt_ai"

# Redis
REDIS_URL="redis://:pokt_ai_redis_password@localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# Auth0 (Optional for basic setup)
AUTH0_DOMAIN="your-tenant.auth0.com"
AUTH0_AUDIENCE="https://your-api.com"
AUTH0_ISSUER_BASE_URL="https://your-tenant.auth0.com"

# Stripe (Optional for billing)
STRIPE_SECRET_KEY="sk_test_your_stripe_test_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"
STRIPE_PRICE_METERED="price_your_metered_price_id"

# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:4000"
```

### Web Configuration (apps/web/.env)

```bash
# Auth0 (Optional for basic setup)
AUTH0_SECRET="your-auth0-secret"
AUTH0_BASE_URL="http://localhost:4000"
AUTH0_ISSUER_BASE_URL="https://your-tenant.auth0.com"
AUTH0_CLIENT_ID="your-auth0-client-id"
AUTH0_CLIENT_SECRET="your-auth0-client-secret"

# API
NEXT_PUBLIC_API_URL="http://localhost:3001/api"

# Stripe (Optional for billing)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

## 📚 Available Scripts

### Root Level Commands

```bash
pnpm dev          # Start all applications in development
pnpm build        # Build all applications
pnpm test         # Run all tests
pnpm lint         # Run linting
pnpm format       # Format code
```

### Make Commands (from infra/ directory)

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

### Service Management Scripts

```bash
./start-services.sh   # Start all services in background
./stop-services.sh    # Stop all services
./health-check.sh     # Check service health
```

## 🗄️ Database Management

### Schema Management

```bash
cd apps/api

# Generate Prisma client
pnpm db:generate

# Push schema changes
npx prisma db push

# Reset database (DESTRUCTIVE)
npx prisma db push --force-reset

# Open Prisma Studio
pnpm db:studio
```

### Seeding Data

```bash
# Seed with sample data
pnpm db:seed

# Seed with admin data
npx ts-node prisma/seed-admin.ts

# Seed with simple data
npx ts-node prisma/seed-simple.ts
```

### Database Schema Overview

- **AdminUser**: Portal administrators with role-based access
- **User**: Customer users with Auth0 integration
- **Organization**: Multi-tenant organizations
- **OrgMember**: Organization membership and roles
- **Endpoint**: RPC endpoints with tokens and rate limiting
- **UsageDaily**: Daily usage metrics and analytics
- **Invoice**: Billing and payment records

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/login` - Login with Auth0 token
- `GET /api/auth/me` - Get current user profile

### Endpoints Management

- `GET /api/endpoints` - List all endpoints
- `POST /api/endpoints` - Create new endpoint
- `GET /api/endpoints/:id` - Get specific endpoint
- `PUT /api/endpoints/:id/rotate-token` - Rotate endpoint token
- `PUT /api/endpoints/:id/revoke` - Revoke endpoint
- `DELETE /api/endpoints/:id` - Delete endpoint

### Admin API

- `GET /api/admin/test-rpc` - Test RPC connectivity
- `GET /api/admin/health` - Admin health check
- `GET /api/admin/networks` - Manage networks
- `GET /api/admin/keys` - Manage API keys

### Gateway & RPC

- `POST /api/gateway` - Main RPC gateway endpoint
- `POST /api/rpc/:network` - Direct network RPC calls
- `GET /api/networks` - List available networks

### Usage & Analytics

- `GET /api/usage` - Get usage statistics
- `GET /api/billing/portal` - Create billing portal session
- `GET /api/billing/invoices` - List invoices

## 🚀 Production Deployment

### Docker Production Setup

```bash
# Build production images
docker-compose -f infra/docker-compose.yml build

# Start production services
docker-compose -f infra/docker-compose.yml up -d
```

### Traefik Load Balancer

The project includes Traefik configuration for production load balancing:

```bash
# Start Traefik load balancer
cd loadbalancer
docker-compose up -d

# Traefik will handle:
# - SSL termination
# - Load balancing
# - Health checks
# - Automatic failover
```

### Environment Variables for Production

Update environment variables for production:

```bash
# Use strong JWT secrets
JWT_SECRET="your-production-jwt-secret"

# Configure production Auth0 tenant
AUTH0_DOMAIN="your-production-tenant.auth0.com"

# Set up production Stripe keys
STRIPE_SECRET_KEY="sk_live_..."

# Use production database URLs
DATABASE_URL="postgresql://user:password@production-db:5432/pokt_ai"

# Set production Redis URL
REDIS_URL="redis://production-redis:6379"
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test suites
cd apps/web && pnpm test:e2e    # E2E tests with Playwright
cd apps/api && pnpm test        # Unit tests with Jest
```

### Health Checks

```bash
# Check all service health
./health-check.sh

# Individual service health
curl http://localhost:3001/api/health      # API health
curl http://localhost:4000/api/health      # Web health
```

## 🔧 Troubleshooting

### Common Issues

1. **Bad Gateway Error**
   - Ensure all services are running: `docker-compose ps`
   - Check Traefik configuration: `infra/traefik-poktai-fixed.yml`
   - Verify service connectivity: `curl http://localhost:4000`

2. **Database Connection Issues**
   - Check PostgreSQL is running: `docker-compose ps postgres`
   - Verify database URL in `.env` files
   - Reset database if needed: `npx prisma db push --force-reset`

3. **API Compilation Errors**
   - Regenerate Prisma client: `pnpm db:generate`
   - Clear dist folder: `rm -rf apps/api/dist`
   - Rebuild: `cd apps/api && pnpm build`

4. **Port Conflicts**
   - Check for conflicting services: `lsof -i :3001 -i :4000 -i :5432`
   - Stop conflicting services or change ports in configuration

### Service Status Commands

```bash
# Check Docker services
docker-compose -f infra/docker-compose.yml ps

# Check running processes
ps aux | grep -E "(next|nest|postgres|redis)"

# Check port usage
netstat -tlnp | grep -E "(3001|4000|5432|6379)"
```

## 📖 Documentation

### API Documentation
- **Swagger UI**: http://localhost:3001/docs
- **OpenAPI Spec**: http://localhost:3001/docs-json

### Project Documentation
- **Admin Portal Guide**: `README-ADMIN-PORTAL.md`
- **Traefik Integration**: `infra/TRAEFIK-INTEGRATION.md`
- **Infrastructure Setup**: `infra/README-TRAEFIK.md`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Workflow

```bash
# Setup development environment
git clone https://github.com/infoboy27/pokt.ai.git
cd pokt.ai
pnpm install

# Start development
cd infra && docker-compose up -d postgres redis
cd ../apps/api && pnpm db:generate && npx prisma db push --force-reset
cd ../.. && pnpm dev

# Make changes and test
pnpm test
pnpm lint

# Commit and push
git add .
git commit -m "Your changes"
git push origin your-branch
```

## 🔗 Network Configuration

The project supports multiple blockchain networks:

- **Ethereum Mainnet**: Chain ID 1
- **Polygon**: Chain ID 137
- **Arbitrum**: Chain ID 42161
- **Optimism**: Chain ID 10
- **Base**: Chain ID 8453
- **Avalanche**: Chain ID 43114
- **BSC**: Chain ID 56
- **Fantom**: Chain ID 250
- **Solana**: No chain ID (different architecture)
- **And many more...**

Networks are configured in the database and can be managed through the admin portal.

## 📊 Monitoring & Analytics

### Built-in Monitoring

- **Health Checks**: All services include health check endpoints
- **Usage Tracking**: Automatic tracking of all RPC requests
- **Performance Metrics**: Response times, success rates, error tracking
- **Billing Analytics**: Usage-based billing calculations

### Metrics Endpoints

```bash
# Service health
GET /api/health

# Usage metrics
GET /api/usage

# Admin metrics
GET /api/admin/metrics
```

## 🔐 Security

### Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Per-endpoint rate limiting
- **CORS Configuration**: Proper cross-origin resource sharing
- **Input Validation**: Comprehensive request validation
- **SQL Injection Protection**: Prisma ORM with parameterized queries
- **XSS Protection**: Content Security Policy headers

### Security Best Practices

1. **Change Default Secrets**: Update all JWT secrets and passwords
2. **Enable HTTPS**: Use SSL certificates in production
3. **Regular Updates**: Keep dependencies updated
4. **Monitor Logs**: Set up log monitoring and alerting
5. **Backup Database**: Regular database backups

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check this README and project docs
- **Issues**: [GitHub Issues](https://github.com/infoboy27/pokt.ai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/infoboy27/pokt.ai/discussions)

## 🔗 Links

- **Pocket Network**: https://www.pokt.network/
- **PATH Gateway**: https://path.pokt.network/
- **Shannon Testnet**: https://shannon-grove-api.mainnet.poktroll.com/
- **Project Repository**: https://github.com/infoboy27/pokt.ai

---

## Quick Start Summary

```bash
# 1. Clone and install
git clone https://github.com/infoboy27/pokt.ai.git
cd pokt.ai && pnpm install

# 2. Start infrastructure
cd infra && docker-compose up -d postgres redis

# 3. Setup database
cd ../apps/api && npx prisma db push --force-reset && pnpm db:seed

# 4. Start development servers
cd ../.. && pnpm dev

# 5. Access applications
# Web: http://localhost:4000
# Admin: http://localhost:4000/admin  
# API: http://localhost:3001
```

🎉 **You're ready to build with pokt.ai!**