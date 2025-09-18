# POKT.ai Portal Admin System

A comprehensive admin portal for managing RPC endpoints, API keys, networks, and monitoring for the POKT.ai infrastructure.

## 🚀 Features

### Core Admin Features
- **Endpoint Management**: Create, update, and manage RPC endpoints
- **Network Configuration**: Add/remove blockchain networks with RPC/WebSocket URLs
- **API Key Management**: Generate, rotate, and revoke API keys with rate limiting
- **Usage Analytics**: Real-time usage monitoring and analytics
- **Health Monitoring**: Automated health checks and status monitoring
- **RPC Tester**: Built-in JSON-RPC request tester
- **Admin Settings**: Configurable portal settings and preferences

### Technical Features
- **Type-Safe**: Full TypeScript with Zod validation
- **Real-time**: Live health checks and usage tracking
- **Scalable**: Redis-based rate limiting and caching
- **Secure**: Argon2 password hashing and RBAC
- **Monitoring**: OpenTelemetry integration and Prometheus metrics

## 📋 Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL 14+
- Redis 6+
- Docker (optional, for containerized deployment)

## 🛠️ Installation

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd pokt.ai
pnpm install
```

### 2. Environment Setup

Create environment files:

```bash
# API service
cp apps/api/env.example apps/api/.env

# Web service  
cp apps/web/env.example apps/web/.env
```

Configure your environment variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/poktai"

# Redis
REDIS_URL="redis://localhost:6379"

# Admin Portal
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Monitoring
OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
```

### 3. Database Setup

```bash
# Generate Prisma client
cd apps/api
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev

# Seed admin data
pnpm prisma db seed
```

### 4. Start Services

```bash
# Start all services with Docker Compose
docker-compose -f infra/docker-compose.simple-stable.yml up -d

# Or start individually
pnpm dev:api    # API service on port 3001
pnpm dev:web    # Web service on port 3005
```

## 🎯 Usage

### Access Admin Portal

1. **Direct Access**: Navigate to `http://localhost:3005/admin`
2. **Admin Bypass**: Add `?admin=true` to any URL to bypass construction mode
3. **Admin Key**: Use `?admin=poktai_admin_2024` for additional security

### Default Configuration

The system comes pre-configured with:

- **Endpoint**: Shannon Customer Gateway (`http://135.125.163.236:4000`)
- **Networks**: Ethereum, Avalanche, BSC, Optimism, Arbitrum, Base, Polygon
- **API Key**: Default key with 100 RPS, 1M RPD, 30M RPM limits
- **Admin User**: `admin@pokt.ai` (owner role)

### Admin Portal Navigation

- **Dashboard**: Overview of system health and usage
- **Endpoints**: Manage RPC endpoints and configurations
- **Networks**: Add/remove blockchain networks
- **API Keys**: Generate and manage API keys
- **Usage**: View usage analytics and metrics
- **Health**: Monitor endpoint health status
- **RPC Tester**: Test JSON-RPC requests
- **Settings**: Configure portal settings

## 🔧 API Reference

### Admin API Endpoints

All admin endpoints require authentication and are prefixed with `/api/admin/`:

#### Endpoints
- `GET /api/admin/endpoints` - List all endpoints
- `POST /api/admin/endpoints` - Create new endpoint
- `GET /api/admin/endpoints/:id` - Get endpoint details
- `PUT /api/admin/endpoints/:id` - Update endpoint
- `DELETE /api/admin/endpoints/:id` - Delete endpoint
- `POST /api/admin/endpoints/:id/health-check` - Run health check

#### Networks
- `POST /api/admin/endpoints/:id/networks` - Add network to endpoint
- `PUT /api/admin/networks/:id` - Update network
- `PATCH /api/admin/networks/:id/toggle` - Enable/disable network
- `DELETE /api/admin/networks/:id` - Remove network

#### API Keys
- `GET /api/admin/endpoints/:id/keys` - List API keys
- `POST /api/admin/endpoints/:id/keys` - Generate new API key
- `PUT /api/admin/keys/:id` - Update API key
- `POST /api/admin/keys/:id/rotate` - Rotate API key
- `POST /api/admin/keys/:id/revoke` - Revoke API key

#### Monitoring
- `GET /api/admin/usage` - Get usage statistics
- `GET /api/admin/health` - Get health check data
- `POST /api/admin/test-rpc` - Test JSON-RPC request

### Response Format

All API responses follow this format:

```json
{
  "data": { ... },
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  }
}
```

## 🔒 Security

### Authentication
- Admin users stored in `admin_users` table
- Role-based access control (owner, admin, viewer)
- Session-based authentication with NextAuth

### API Key Security
- Keys hashed with Argon2 before storage
- Raw keys only shown on creation/rotation
- Rate limiting with Redis token bucket

### Rate Limiting
- Per-second, per-day, per-month limits
- Configurable per API key
- Redis-based implementation

## 📊 Monitoring

### Health Checks
- Automated health checks every 60 seconds
- HTTP status and latency monitoring
- Historical health data storage

### Usage Tracking
- Request counting and latency metrics
- Error rate monitoring
- Aggregated usage statistics

### Metrics
- Prometheus-compatible metrics endpoint
- OpenTelemetry tracing integration
- Real-time dashboard updates

## 🚀 Deployment

### Production Setup

1. **Environment Configuration**:
   ```bash
   # Set production environment variables
   NODE_ENV=production
   DATABASE_URL="postgresql://..."
   REDIS_URL="redis://..."
   ```

2. **Database Migration**:
   ```bash
   pnpm prisma migrate deploy
   pnpm prisma db seed
   ```

3. **Build and Deploy**:
   ```bash
   pnpm build
   docker-compose -f infra/docker-compose.prod.yml up -d
   ```

### Docker Deployment

```bash
# Build and start all services
docker-compose -f infra/docker-compose.simple-stable.yml up -d

# View logs
docker-compose -f infra/docker-compose.simple-stable.yml logs -f

# Stop services
docker-compose -f infra/docker-compose.simple-stable.yml down
```

## 🧪 Testing

### Run Tests

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# API tests
cd apps/api && pnpm test
```

### Test API Endpoints

```bash
# Health check
curl http://135.125.163.236:4000/health

# Network list
curl http://135.125.163.236:4000/v1/networks

# JSON-RPC call
curl -X POST \
  -H 'Content-Type: application/json' \
  -H 'X-API-Key: your-api-key' \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  http://135.125.163.236:4000/v1/rpc/eth
```

## 📝 Development

### Project Structure

```
pokt.ai/
├── apps/
│   ├── api/                 # NestJS API service
│   │   ├── src/
│   │   │   ├── workers/     # Background workers
│   │   │   └── ...
│   │   └── prisma/          # Database schema & migrations
│   └── web/                 # Next.js admin portal
│       ├── app/
│       │   ├── admin/       # Admin pages
│       │   └── api/         # API routes
│       └── components/      # UI components
├── packages/
│   └── runtime-auth/        # Runtime authentication library
└── infra/                   # Docker & deployment configs
```

### Adding New Features

1. **Database Changes**: Update Prisma schema and create migration
2. **API Routes**: Add new endpoints in `apps/web/app/api/admin/`
3. **UI Components**: Create components in `apps/web/components/`
4. **Validation**: Add Zod schemas in `apps/web/lib/validations.ts`

### Background Workers

- **Health Check Worker**: Runs every 60 seconds
- **Usage Aggregation Worker**: Runs every 5 minutes
- **Start Workers**: `pnpm worker:dev`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**Built with ❤️ for the POKT.ai ecosystem**


