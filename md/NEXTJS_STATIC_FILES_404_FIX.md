# Next.js Static Files 404 Error Fix

## Problem

The Next.js application was returning 404 errors for static assets:
- `/_next/static/css/app/layout.css?v=1762977551148` - 404
- `/_next/static/chunks/main-app.js?v=1762977551148` - 404
- `/_next/static/chunks/app-pages-internals.js` - 404
- `/_next/static/chunks/app/layout.js` - 404

## Root Cause

The issue was with the Dockerfile production build configuration for Next.js standalone builds in a monorepo workspace:

1. **Standalone Build Structure**: When using `output: 'standalone'` in a monorepo, Next.js creates:
   - `.next/standalone/apps/web/` - Contains `server.js` and dependencies
   - `.next/static/` - Contains static assets (CSS, JS chunks)

2. **File Location Mismatch**: The Dockerfile was copying files incorrectly:
   - Standalone build was copied to `/app/`
   - Static files were copied to `/app/.next/static`
   - But `server.js` is actually in `/app/apps/web/server.js`
   - Static files need to be accessible from where `server.js` runs

3. **Working Directory Issue**: The CMD was running `node server.js` from `/app/`, but `server.js` is in `/app/apps/web/` for monorepo standalone builds.

## Solution

### Updated Dockerfile.production

1. **Copy Standalone Build**: Copy the entire standalone directory structure
2. **Copy Static Files to Multiple Locations**: 
   - Copy to `apps/web/.next/static` (relative to server.js)
   - Copy to root `.next/static` as fallback
3. **Set Working Directory**: Set WORKDIR to where `server.js` is located
4. **Update CMD**: Run server.js from the correct path

### Changes Made

```dockerfile
# Copy standalone build (contains server.js in apps/web/)
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./

# Copy static files to both locations
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static

# Set working directory to where server.js is
WORKDIR /app/apps/web

# Start server from correct location
CMD ["node", "server.js"]
```

## Alternative Solution (If Above Doesn't Work)

If the standalone build structure is different, you can check the actual structure:

```bash
# After building, check the structure
ls -la apps/web/.next/standalone/
ls -la apps/web/.next/standalone/apps/web/
```

Then adjust the Dockerfile based on the actual structure.

### Option 1: Flat Standalone Structure

If standalone is flat (server.js in root):

```dockerfile
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static
WORKDIR /app
CMD ["node", "server.js"]
```

### Option 2: Monorepo Standalone Structure

If standalone has monorepo structure (server.js in apps/web/):

```dockerfile
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
WORKDIR /app/apps/web
CMD ["node", "server.js"]
```

## Verification

After rebuilding the Docker image:

1. **Check Static Files**: Verify static files are accessible:
   ```bash
   docker exec <container> ls -la /app/.next/static/
   docker exec <container> ls -la /app/apps/web/.next/static/
   ```

2. **Check Server Location**: Verify server.js location:
   ```bash
   docker exec <container> find /app -name "server.js"
   ```

3. **Test in Browser**: Visit the site and check browser console for 404 errors

4. **Check Logs**: Look for any file path errors in server logs:
   ```bash
   docker logs <container> | grep -i "static\|404"
   ```

## Next.js Standalone Build Notes

- **Standalone builds** create a minimal server bundle with only necessary files
- **Static files** (`.next/static/`) must be accessible from where the server runs
- **Monorepo workspaces** add an extra layer (`apps/web/`) to the structure
- **Public files** (`public/`) are also served by Next.js and need to be accessible

## Production Deployment

After fixing the Dockerfile:

1. **Rebuild the image**:
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

## Troubleshooting

If static files still return 404:

1. **Check Reverse Proxy**: Ensure Traefik/Nginx is routing `/_next/static/*` to the Next.js server
2. **Check File Permissions**: Ensure the `nextjs` user can read static files
3. **Check Build Output**: Verify the build actually created static files:
   ```bash
   ls -la apps/web/.next/static/
   ```
4. **Check Server Logs**: Look for path resolution errors
5. **Check Next.js Config**: Ensure `output: 'standalone'` is set correctly
6. **Clear Cache**: Clear browser cache and rebuild the image

## Related Files

- `apps/web/Dockerfile.production` - Production Dockerfile
- `apps/web/next.config.js` - Next.js configuration
- `docker-compose.production.yml` - Docker Compose configuration
- `apps/web/middleware.ts` - Next.js middleware (excludes `_next/static`)

## References

- [Next.js Standalone Output](https://nextjs.org/docs/advanced-features/output-file-tracing)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment#docker-image)
- [Next.js Static File Serving](https://nextjs.org/docs/basic-features/static-file-serving)

