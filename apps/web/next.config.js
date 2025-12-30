/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['localhost', 'pokt.ai', 'assets.coingecko.com', 'cryptologos.cc', 'raw.githubusercontent.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.coingecko.com',
        pathname: '/coins/images/**',
      },
      {
        protocol: 'https',
        hostname: 'cryptologos.cc',
        pathname: '/logos/**',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        pathname: '/trustwallet/assets/**',
      },
    ],
  },
  env: {
    PORT: process.env.PORT || '4000',
  },
  // Allow requests from pokt.ai domain
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
      {
        source: '/app/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [];
  },
  // Ensure proper handling of API routes
  async rewrites() {
    // Enable rewrite for dashboard to use Next.js API (not NestJS)
    // This ensures we use the Next.js API routes which have real data
    // Exception: Keep gateway, auth, and certain routes in Next.js
    if (process.env.NEXT_PUBLIC_API_URL) {
      return [
        {
          // Route most API calls to NestJS, except:
          // - dashboard: Next.js API routes
          // - gateway: Next.js RPC gateway
          // - billing: Next.js billing routes
          // - usage: Next.js usage routes
          // - endpoints: Next.js endpoints routes
          // - auth: Next.js authentication routes (login, me, register, etc.)
          source: '/api/((?!dashboard|gateway|billing|usage|endpoints|auth).*)',
          destination: process.env.NEXT_PUBLIC_API_URL + '/:path*',
        },
      ];
    }
    return [];
  },
};

module.exports = nextConfig;
