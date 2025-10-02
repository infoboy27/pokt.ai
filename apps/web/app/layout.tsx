import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { UserProvider } from '@auth0/nextjs-auth0/client';
import { Providers } from '@/components/providers';
import GoogleAnalytics from '@/components/analytics/google-analytics';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'pokt.ai - AI-powered RPC Gateway',
  description: 'AI-powered RPC Gateway on top of Pocket Network Shannon + PATH',
  keywords: ['RPC', 'blockchain', 'Pocket Network', 'AI', 'gateway'],
  authors: [{ name: 'pokt.ai' }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <GoogleAnalytics />
        <UserProvider>
          <Providers>
            {children}
          </Providers>
        </UserProvider>
      </body>
    </html>
  );
}
