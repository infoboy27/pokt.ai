# pokt.ai Traefik Deployment Guide

This guide explains how to deploy pokt.ai with your existing Traefik reverse proxy setup.

## 🏗️ Architecture

```
Internet → Traefik → pokt.ai (web + api) → PostgreSQL + Redis
```

## 📋 Prerequisites

1. **Traefik already running** on your server with the following configuration:
   - Network: `lb` (external)
   - Network: `poktia` (external)
   - Ports: 80, 443, 15432
   - Services directory mounted

2. **Domain**: `pokt.ai` (or your preferred domain)

3. **SSL Certificate**: Automatic via Let's Encrypt through Traefik

## 🚀 Quick Deployment

### 1. Setup

```bash
cd infra
./setup-traefik.sh
```

This script will:
- Create necessary Docker networks
- Generate environment file template
- Create Traefik service configuration

### 2. Configure Environment

Edit the `.env` file with your production values:

```bash
# Required: Domain
DOMAIN=pokt.ai

# Required: Database
POSTGRES_PASSWORD=your_secure_password

# Required: JWT Secret
JWT_SECRET=your-super-secret-jwt-key

# Required: Auth0 Configuration
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://pokt.ai/api
AUTH0_SECRET=your-auth0-secret
AUTH0_BASE_URL=https://pokt.ai
AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_CLIENT_SECRET=your-auth0-client-secret

# Required: Stripe Configuration
STRIPE_SECRET_KEY=sk_test_or_production_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_or_production_key
```

### 3. Deploy

```bash
./deploy.sh
```

## 📁 File Structure

```
infra/
├── docker-compose.prod.yml    # Production Docker Compose
├── traefik-services/
│   └── poktai.yml            # Traefik service configuration
├── deploy.sh                 # Deployment script
├── setup-traefik.sh         # Setup script
├── env.prod.example         # Environment template
└── README-TRAEFIK.md        # This file
```

## 🔧 Traefik Configuration

### Service Configuration

The `traefik-services/poktai.yml` file contains the Traefik routing rules:

- **Web**: Routes `https://pokt.ai` to the web service (port 4000)
- **API**: Routes `https://pokt.ai/api/*` to the API service (port 3001)

### Docker Labels

The production compose file includes Traefik labels for automatic service discovery:

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.poktai-web.rule=Host(`pokt.ai`)"
  - "traefik.http.routers.poktai-web.entrypoints=websecure"
  - "traefik.http.routers.poktai-web.tls=true"
  - "traefik.http.services.poktai-web.loadbalancer.server.port=4000"
```

## 🌐 Access Points

After deployment:

- **Web Application**: https://pokt.ai
- **API**: https://pokt.ai/api
- **API Documentation**: https://pokt.ai/api/docs
- **Database**: Internal only (not exposed)
- **Redis**: Internal only (not exposed)

## 🔍 Monitoring

### Check Service Status

```bash
docker-compose -f docker-compose.prod.yml ps
```

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f web
docker-compose -f docker-compose.prod.yml logs -f api
```

### Traefik Dashboard

Access your Traefik dashboard to see the pokt.ai services and their routing rules.

## 🔄 Updates

To update the application:

```bash
# Build new images
docker build -t poktai-api:latest ../apps/api
docker build -t poktai-web:latest ../apps/web

# Restart services
docker-compose -f docker-compose.prod.yml up -d --force-recreate
```

## 🛠️ Troubleshooting

### Common Issues

1. **Network not found**
   ```bash
   docker network create lb
   docker network create poktia
   ```

2. **Service not accessible**
   - Check Traefik logs: `docker logs traefik`
   - Verify service labels in Traefik dashboard
   - Ensure networks are properly connected

3. **Database connection issues**
   - Check PostgreSQL logs: `docker-compose -f docker-compose.prod.yml logs postgres`
   - Verify DATABASE_URL in .env file

4. **SSL/TLS issues**
   - Verify domain DNS is pointed to your server
   - Check Let's Encrypt certificate status in Traefik dashboard

### Debug Commands

```bash
# Check network connectivity
docker network inspect lb
docker network inspect poktia

# Test service connectivity
docker run --rm --network poktia curlimages/curl http://api:3001/health
docker run --rm --network poktia curlimages/curl http://web:4000

# Check Traefik configuration
docker exec traefik traefik version
docker exec traefik cat /etc/traefik/traefik.yml
```

## 📚 Additional Resources

- [Traefik Documentation](https://doc.traefik.io/traefik/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [pokt.ai API Documentation](https://pokt.ai/api/docs)

## 🆘 Support

If you encounter issues:

1. Check the logs: `docker-compose -f docker-compose.prod.yml logs`
2. Verify Traefik configuration
3. Test network connectivity
4. Review this documentation

For additional help, please refer to the main [pokt.ai README](../README.md).
