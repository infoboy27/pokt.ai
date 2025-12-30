# Authentication 401 Error Fix

## Problem

The `/api/auth/login` and `/api/auth/me` endpoints were returning 401 Unauthorized errors because:

1. **Next.js Rewrite Configuration**: The `next.config.js` file was rewriting `/api/auth/*` routes to the NestJS backend (`NEXT_PUBLIC_API_URL`), but the Next.js application has its own authentication routes that use cookies instead of JWT tokens.

2. **Authentication Mismatch**: 
   - Next.js routes (`/apps/web/app/api/auth/*`) use cookie-based authentication (`user_id` cookie)
   - NestJS backend expects JWT token authentication in headers
   - The rewrite caused requests to hit the wrong backend

3. **Cookie Issues**: The cookie was being set with `secure: true` in production, which requires HTTPS. If the site was accessed over HTTP or through a proxy, cookies might not be set properly.

## Solution

### 1. Fixed Next.js Rewrite Configuration

Updated `next.config.js` to exclude `/api/auth/*` routes from rewrites:

```javascript
// Before:
source: '/api/((?!dashboard|gateway|billing|usage|endpoints).*)',

// After:
source: '/api/((?!dashboard|gateway|billing|usage|endpoints|auth).*)',
```

This ensures that `/api/auth/login`, `/api/auth/me`, `/api/auth/register`, etc. are handled by Next.js API routes instead of being rewritten to the NestJS backend.

### 2. Improved Cookie Configuration

Updated the login route to handle cookie domain and path correctly:

```typescript
const cookieOptions: any = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: '/', // Set cookie for entire domain
};

// In production, set domain if needed (only if using a subdomain)
if (process.env.NODE_ENV === 'production' && process.env.COOKIE_DOMAIN) {
  cookieOptions.domain = process.env.COOKIE_DOMAIN;
}
```

## How Authentication Works

1. **Login Flow**:
   - User submits email/password to `/api/auth/login`
   - Next.js route validates credentials against PostgreSQL database
   - If valid, sets `user_id` cookie (httpOnly, secure in production)
   - Returns user data and token in response

2. **Authentication Check**:
   - Client calls `/api/auth/me` to get current user
   - Next.js route reads `user_id` cookie
   - Fetches user from database and returns user data

3. **Session Management**:
   - Cookie is httpOnly (cannot be accessed via JavaScript)
   - Cookie expires after 7 days
   - Cookie is secure in production (HTTPS only)
   - Cookie uses `sameSite: 'lax'` for CSRF protection

## Testing

To test the fix:

1. **Restart the Next.js server** to apply the `next.config.js` changes:
   ```bash
   cd apps/web
   npm run dev
   # or in production
   npm run build && npm start
   ```

2. **Test Login**:
   ```bash
   curl -X POST http://localhost:4000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"your-password"}' \
     -c cookies.txt
   ```

3. **Test Auth Me**:
   ```bash
   curl http://localhost:4000/api/auth/me \
     -b cookies.txt
   ```

## Environment Variables

If you need to set a custom cookie domain (for subdomains), add to `.env`:

```bash
COOKIE_DOMAIN=.pokt.ai  # Note the leading dot for subdomain support
```

## Production Considerations

1. **HTTPS Required**: In production, `secure: true` requires HTTPS. Ensure your site is served over HTTPS.

2. **Cookie Domain**: Only set `COOKIE_DOMAIN` if you need to share cookies across subdomains (e.g., `app.pokt.ai` and `api.pokt.ai`). For the main domain (`pokt.ai`), don't set the domain.

3. **CORS**: The authentication routes include CORS headers to allow cross-origin requests if needed.

4. **Rate Limiting**: Login attempts are rate-limited to prevent brute force attacks.

## Troubleshooting

If you still see 401 errors:

1. **Check Next.js Server Logs**: Look for `[LOGIN]` and `[AUTH/ME]` log messages
2. **Verify Database Connection**: Ensure PostgreSQL is accessible and users exist
3. **Check Cookie Settings**: Verify cookies are being set in browser DevTools
4. **Verify Rewrite Configuration**: Check that `NEXT_PUBLIC_API_URL` is set correctly
5. **Check HTTPS**: In production, ensure the site is served over HTTPS for secure cookies

## Database Users

To check existing users:

```sql
SELECT id, email, name, password IS NOT NULL as has_password 
FROM users 
ORDER BY created_at DESC;
```

To create a test user:

```sql
INSERT INTO users (email, name, password, is_email_verified, created_at, updated_at)
VALUES ('test@example.com', 'Test User', 'plain-text-password', true, NOW(), NOW());
```

Note: The login route accepts both bcrypt hashed passwords and plain text passwords (for demo purposes).

