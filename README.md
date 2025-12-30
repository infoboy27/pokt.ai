# pokt.ai - AI-Powered RPC Gateway

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Pocket Network](https://img.shields.io/badge/Powered%20by-Pocket%20Network-blue)](https://www.pokt.network/)

A production-ready web portal for an AI-powered RPC Gateway built on top of Pocket Network Shannon + PATH. This project provides intelligent routing, multi-organization support, real-time analytics, and enterprise-grade security for blockchain RPC requests.

**Gateway URL**: `https://pokt.ai/api/gateway`

## 🚀 Features

- **AI-Powered RPC Gateway**: Intelligent routing and optimization across 27+ blockchain networks
- **Multi-Organization Support**: Create and manage multiple organizations with role-based access
- **Real-time Analytics**: Comprehensive usage metrics, performance insights, and billing tracking
- **Enterprise Security**: Rate limiting, authentication, audit logs, and DDoS protection
- **Pay-as-you-go Billing**: Transparent, metered billing with Stripe integration
- **Multi-Tier Caching**: In-memory + Redis caching for sub-millisecond response times
- **Developer-First**: Simple API, comprehensive SDKs, detailed documentation
- **Admin Portal**: Complete administrative interface for managing networks, endpoints, and users
- **Load Balancing**: Traefik-based load balancing with automatic failover
- **Production Ready**: Docker Compose setup with monitoring and health checks

## 🏗️ Architecture

```
pokt.ai/
├── apps/
│   ├── web/              # Next.js 14 frontend (App Router, TypeScript)
│   │   ├── app/          # App router pages
│   │   │   ├── admin/    # Admin portal
│   │   │   ├── api/      # API routes (gateway, billing, webhooks)
│   │   │   ├── billing/  # Billing and payment pages
│   │   │   └── dashboard/# User dashboard
│   │   ├── components/   # Reusable UI components
│   │   └── lib/          # Utility functions (cache, payment, etc.)
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
│   └── traefik-poktai-fixed.yml # Traefik routing configuration
├── loadbalancer/         # Traefik load balancer configuration
├── monitoring/           # Prometheus & Grafana dashboards
├── scripts/             # Utility scripts (100+ scripts)
└── md/                  # Comprehensive documentation
```

### Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Recharts
- **Backend**: NestJS, TypeScript, Prisma, PostgreSQL, Redis
- **Auth**: Auth0 with JWT
- **Billing**: Stripe integration with webhook support
- **Infrastructure**: Docker Compose, Traefik, PostgreSQL, Redis
- **Load Balancer**: Traefik with SSL termination
- **Monitoring**: Prometheus, Grafana, health checks
- **Caching**: Multi-tier (in-memory + Redis) for optimal performance

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

# For production
cp env.production.example .env.production
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

# Auth0
AUTH0_DOMAIN="your-tenant.auth0.com"
AUTH0_AUDIENCE="https://your-api.com"
AUTH0_CLIENT_ID="your-client-id"
AUTH0_CLIENT_SECRET="your-client-secret"

# Stripe (for billing)
STRIPE_SECRET_KEY="sk_test_your_stripe_test_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"
STRIPE_PUBLISHABLE_KEY="pk_test_your_publishable_key"

# Email (SendGrid)
SENDGRID_API_KEY="SG.your_sendgrid_api_key"
FROM_EMAIL="noreply@pokt.ai"

# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:4000"
```

### Web Configuration (apps/web/.env)

```bash
# Auth0
AUTH0_SECRET="your-auth0-secret"
AUTH0_BASE_URL="http://localhost:4000"
AUTH0_ISSUER_BASE_URL="https://your-tenant.auth0.com"
AUTH0_CLIENT_ID="your-auth0-client-id"
AUTH0_CLIENT_SECRET="your-auth0-client-secret"

# API
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
INTERNAL_API_URL="http://localhost:3001/api"

# Stripe (for billing UI)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Database (for direct queries)
DATABASE_URL="postgresql://pokt_ai:pokt_ai_password@localhost:5432/pokt_ai"
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

### Production Deployment

```bash
# Build production images
docker compose -f docker-compose.production.yml build

# Start production services
docker compose -f docker-compose.production.yml up -d

# Build and start web service only
docker compose -f docker-compose.production.yml build web
docker compose -f docker-compose.production.yml up -d web
```

### Utility Scripts

The project includes 100+ utility scripts in the `scripts/` directory:

```bash
# Health checks
./scripts/health-check.sh

# Payment testing
./scripts/test-stripe-integration.sh
./scripts/verify-stripe-payment.sh

# Load testing
./scripts/run-load-test.sh
./scripts/load-test-gateway-endpoint.js

# Endpoint management
./scripts/create-test-endpoint.sh
./scripts/test-endpoints.sh

# Database utilities
./scripts/test-database.sh
./scripts/calculate-daily-metrics.sh
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

### Database Schema Overview

- **AdminUser**: Portal administrators with role-based access
- **User**: Customer users with Auth0 integration
- **Organization**: Multi-tenant organizations
- **OrgMember**: Organization membership and roles
- **Endpoint**: RPC endpoints with tokens and rate limiting
- **Network**: Blockchain network configurations
- **UsageDaily**: Daily usage metrics and analytics
- **Invoice**: Billing and payment records
- **Payment**: Payment transaction records

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/login` - Login with Auth0 token
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/register` - Register new user
- `POST /api/auth/verify-email` - Verify email address

### Gateway & RPC

- `POST /api/gateway` - Main RPC gateway endpoint (supports all EVM chains)
- `POST /api/gateway/debug` - Gateway debugging endpoint
- `GET /api/networks` - List available networks
- `GET /api/networks/detect` - Auto-detect network from RPC call

### Endpoints Management

- `GET /api/endpoints` - List all endpoints
- `POST /api/endpoints` - Create new endpoint
- `GET /api/endpoints/:id` - Get specific endpoint
- `PUT /api/endpoints/:id/rotate-token` - Rotate endpoint token
- `DELETE /api/endpoints/:id` - Delete endpoint

### Billing & Payments

- `GET /api/billing` - Get billing information
- `GET /api/billing/monthly` - Get monthly billing summary
- `POST /api/payment/stripe/create-checkout` - Create Stripe checkout session
- `POST /api/webhooks/stripe` - Stripe webhook handler
- `GET /api/billing/invoice/:id` - Get invoice details
- `GET /api/billing/invoice/:id/pdf` - Download invoice PDF

### Usage & Analytics

- `GET /api/usage` - Get usage statistics
- `GET /api/usage/analytics` - Get detailed analytics
- `GET /api/usage/real` - Get real-time usage data
- `GET /api/dashboard/stats` - Get dashboard statistics

### Admin API

- `GET /api/admin/health` - Admin health check
- `GET /api/admin/endpoints` - Manage endpoints
- `GET /api/admin/keys` - Manage API keys
- `POST /api/admin/create-checkout` - Create admin checkout session

## 🚀 Production Deployment

### Docker Production Setup

```bash
# Build production images
docker compose -f docker-compose.production.yml build

# Start production services
docker compose -f docker-compose.production.yml up -d

# View logs
docker compose -f docker-compose.production.yml logs -f web
```

### Production Services

The production setup includes:

- **Web Service**: Next.js application (port 4000)
- **API Service**: NestJS backend (port 3001)
- **PostgreSQL**: Database (port 5432)
- **Redis**: Caching layer (port 6379)
- **Traefik**: Load balancer with SSL (ports 80, 443)
- **Prometheus**: Metrics collection (port 9090)
- **Grafana**: Monitoring dashboards (port 3000)

### Environment Variables for Production

See `env.production.example` for all required production environment variables.

**Important**: Update all secrets and API keys before deploying to production!

## 🔗 Supported Blockchain Networks

The gateway supports 27+ blockchain networks:

- **Ethereum Mainnet** (Chain ID: 1)
- **Polygon** (Chain ID: 137)
- **Arbitrum** (Chain ID: 42161)
- **Optimism** (Chain ID: 10)
- **Base** (Chain ID: 8453)
- **Avalanche** (Chain ID: 43114)
- **BSC** (Chain ID: 56)
- **Fantom** (Chain ID: 250)
- **Oasys** (Chain ID: 248)
- **And 18+ more networks...**

Networks are configured in the database and can be managed through the admin portal.

## 📊 Monitoring & Analytics

### Built-in Monitoring

- **Health Checks**: All services include health check endpoints
- **Usage Tracking**: Automatic tracking of all RPC requests
- **Performance Metrics**: Response times, success rates, error tracking
- **Billing Analytics**: Usage-based billing calculations
- **Grafana Dashboards**: Pre-configured dashboards for monitoring

### Metrics Endpoints

```bash
# Service health
GET /api/health

# Usage metrics
GET /api/usage
GET /api/metrics

# Admin metrics
GET /api/admin/metrics
```

## 💳 Payment Integration

### Stripe Integration

The project includes full Stripe integration for billing:

- **Checkout Sessions**: One-time and recurring payments
- **Webhook Handling**: Automatic payment processing
- **Invoice Generation**: PDF invoice generation
- **Payment Status**: Real-time payment status tracking

### Verifying Stripe Integration

After completing a payment, verify everything is working:

```bash
# Check webhook logs
docker compose -f docker-compose.production.yml logs web | grep STRIPE

# Run verification script
./scripts/verify-stripe-payment.sh
```

See `STRIPE_VERIFICATION_CHECKLIST.md` for detailed verification steps.

## 🔐 Security

### Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Per-endpoint rate limiting
- **CORS Configuration**: Proper cross-origin resource sharing
- **Input Validation**: Comprehensive request validation
- **SQL Injection Protection**: Prisma ORM with parameterized queries
- **XSS Protection**: Content Security Policy headers
- **Secret Scanning**: GitHub push protection for secrets

### Security Best Practices

1. **Change Default Secrets**: Update all JWT secrets and passwords
2. **Enable HTTPS**: Use SSL certificates in production
3. **Regular Updates**: Keep dependencies updated
4. **Monitor Logs**: Set up log monitoring and alerting
5. **Backup Database**: Regular database backups
6. **Rotate API Keys**: Regularly rotate Stripe and SendGrid keys

## 🧪 Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test suites
cd apps/web && pnpm test:e2e    # E2E tests with Playwright
cd apps/api && pnpm test        # Unit tests with Jest
```

### Load Testing

```bash
# Run load test on gateway
./scripts/run-load-test-gateway.sh

# Run load test on specific endpoint
./scripts/load-test-endpoint.js
```

### Health Checks

```bash
# Check all service health
./scripts/health-check.sh

# Individual service health
curl http://localhost:3001/api/health      # API health
curl http://localhost:4000/api/health      # Web health
```

## 🔧 Troubleshooting

### Common Issues

1. **Bad Gateway Error**
   - Ensure all services are running: `docker compose ps`
   - Check Traefik configuration
   - Verify service connectivity: `curl http://localhost:4000`

2. **Database Connection Issues**
   - Check PostgreSQL is running: `docker compose ps postgres`
   - Verify database URL in `.env` files
   - Reset database if needed: `npx prisma db push --force-reset`

3. **API Compilation Errors**
   - Regenerate Prisma client: `pnpm db:generate`
   - Clear dist folder: `rm -rf apps/api/dist`
   - Rebuild: `cd apps/api && pnpm build`

4. **Port Conflicts**
   - Check for conflicting services: `lsof -i :3001 -i :4000 -i :5432`
   - Stop conflicting services or change ports in configuration

5. **Stripe Webhook Issues**
   - Verify webhook URL is configured in Stripe Dashboard
   - Check `STRIPE_WEBHOOK_SECRET` matches Stripe configuration
   - Review webhook logs: `docker compose logs web | grep STRIPE`

## 📖 Documentation

### API Documentation

- **Swagger UI**: http://localhost:3001/docs
- **OpenAPI Spec**: http://localhost:3001/docs-json

### Project Documentation

- **Comprehensive Docs**: See `md/` directory for detailed guides
- **Billing Process**: `md/docs_BILLING_PROCESS.md`
- **Load Testing**: `md/LOAD_TEST_README.md`
- **PATH Gateway**: `md/PATH_GATEWAY_SETUP.md`
- **Stripe Verification**: `STRIPE_VERIFICATION_CHECKLIST.md`

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

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check this README and project docs in `md/` directory
- **Issues**: [GitHub Issues](https://github.com/infoboy27/pokt.ai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/infoboy27/pokt.ai/discussions)

## 🔗 Links

- **Pocket Network**: https://www.pokt.network/
- **PATH Gateway**: https://path.pokt.network/
- **Shannon Testnet**: https://shannon-grove-api.mainnet.poktroll.com/
- **Project Repository**: https://github.com/infoboy27/pokt.ai
- **Live Gateway**: https://pokt.ai/api/gateway

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
# Docs: http://localhost:3001/docs
```

🎉 **You're ready to build with pokt.ai!**

