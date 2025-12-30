# Next.js Static Files 404 Error - Fix Summary

## Problem

Next.js static assets were returning 404 errors:
- `/_next/static/css/app/layout.css?v=1762977551148` - 404
- `/_next/static/chunks/main-app.js?v=1762977551148` - 404
- `/_next/static/chunks/app-pages-internals.js` - 404
- `/_next/static/chunks/app/layout.js` - 404

## Root Cause

The Dockerfile production build was not copying static files to the correct location relative to where `server.js` runs in the standalone build.

## Solution

### Fixed Dockerfile.production

1. **Copy Standalone Build**: Copy the entire standalone directory structure
2. **Copy Static Files to Root**: Copy `.next/static/` to `/app/.next/static/` (root level)
   - Static files are served from `/_next/static/` by Next.js
   - They must be at `.next/static/` relative to where `server.js` runs
3. **Copy Public Assets**: Copy `public/` directory to `/app/public/`
4. **Flexible Server Start**: Use a shell command to find `server.js` in the correct location

### Key Changes

```dockerfile
# Copy standalone build
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./

# Copy static files to root .next/static/ (CRITICAL FIX)
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static

# Copy public assets
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./public

# Set working directory
WORKDIR /app

# Start server (flexible path)
CMD ["sh", "-c", "if [ -f server.js ]; then node server.js; elif [ -f apps/web/server.js ]; then node apps/web/server.js; else echo 'Error: server.js not found'; exit 1; fi"]
```

## Why This Works

1. **Static File Path**: Next.js serves static files from `/_next/static/`, which maps to `.next/static/` in the filesystem
2. **Server Location**: The standalone build creates `server.js` at the root of the standalone directory
3. **Relative Paths**: Static files must be accessible relative to where `server.js` runs
4. **Root Level**: By copying static files to `/app/.next/static/`, they're accessible when `server.js` runs from `/app/`

## Deployment Steps

1. **Rebuild the Docker image**:
   ```bash
   docker build -f apps/web/Dockerfile.production -t pokt-ai-web:latest .
   ```

2. **Restart the container**:
   ```bash
   docker-compose restart web
   # or
   docker restart <container-name>
   ```

3. **Verify the fix**:
   - Check browser console for 404 errors
   - Verify static assets load correctly
   - Check server logs for any errors

## Verification

After rebuilding, verify the structure:

```bash
# Check static files exist
docker exec <container> ls -la /app/.next/static/

# Check server.js location
docker exec <container> find /app -name "server.js"

# Test static file access
curl http://localhost:4000/_next/static/css/app/layout.css
```

## Troubleshooting

If static files still return 404:

1. **Check Reverse Proxy**: Ensure Traefik/Nginx routes `/_next/static/*` to Next.js
2. **Check File Permissions**: Ensure `nextjs` user can read static files
3. **Check Build Output**: Verify build actually created static files:
   ```bash
   ls -la apps/web/.next/static/
   ```
4. **Check Server Logs**: Look for path resolution errors
5. **Clear Cache**: Clear browser cache and rebuild image

## Related Files

- `apps/web/Dockerfile.production` - Fixed production Dockerfile
- `apps/web/next.config.js` - Next.js configuration (`output: 'standalone'`)
- `docker-compose.production.yml` - Docker Compose configuration
- `apps/web/middleware.ts` - Next.js middleware (excludes `_next/static`)

## Additional Notes

- The standalone build includes all necessary dependencies
- Static files are separate from the standalone build
- Public assets are served from the `public/` directory
- The server automatically serves static files from `.next/static/`
- The flexible CMD handles both flat and monorepo standalone structures

