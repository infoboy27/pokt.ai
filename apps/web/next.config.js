/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['localhost', 'pokt.ai'],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
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
    return [
      {
        source: '/app',
        destination: '/dashboard',
        permanent: true,
      },
      {
        source: '/app/dashboard',
        destination: '/dashboard',
        permanent: true,
      },
      {
        source: '/app/usage',
        destination: '/usage',
        permanent: true,
      },
      {
        source: '/app/billing',
        destination: '/billing',
        permanent: true,
      },
      {
        source: '/app/settings',
        destination: '/settings',
        permanent: true,
      },
      {
        source: '/app/members',
        destination: '/members',
        permanent: true,
      },
    ];
  },
  // Ensure proper handling of API routes
  async rewrites() {
    // Temporarily disabled rewrite rule to test gateway
    // if (process.env.NEXT_PUBLIC_API_URL) {
    //   return [
    //     {
    //       source: '/api/((?!gateway).*)',
    //       destination: process.env.NEXT_PUBLIC_API_URL + '/:path*',
    //     },
    //   ];
    // }
    return [];
  },
};

module.exports = nextConfig;
