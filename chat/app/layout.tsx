import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'chat.pokt.ai - AI-Powered Blockchain Assistant',
  description: 'Interact with all major blockchains through AI. Powered by Pocket Network and pokt.ai',
  keywords: ['blockchain', 'AI', 'crypto', 'ethereum', 'polygon', 'pokt', 'rpc'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}







