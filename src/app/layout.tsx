import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { PWAProvider } from '@/components/PWAProvider'
import { PWAInstaller } from '@/components/PWAInstaller'
import { OfflineIndicator } from '@/components/OfflineIndicator'
import { OfflineProvider } from '@/components/OfflineProvider'
import { OfflineStatus } from '@/components/OfflineStatus'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'DipTrack Manufacturing System',
  description: 'Advanced manufacturing management system with real-time monitoring',
  manifest: '/manifest.json',
  themeColor: '#8B5CF6',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'DipTrack'
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#8B5CF6'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'%3E%3Crect width='192' height='192' fill='%238B5CF6' rx='20'/%3E%3Ctext x='96' y='120' font-family='Arial,sans-serif' font-size='60' font-weight='bold' fill='white' text-anchor='middle'%3EDT%3C/text%3E%3C/svg%3E" />
      </head>
      <body className={inter.className}>
        <PWAProvider>
          <OfflineProvider>
            <Providers>
              {children}
              <PWAInstaller />
              <OfflineIndicator />
              <OfflineStatus />
            </Providers>
          </OfflineProvider>
        </PWAProvider>
      </body>
    </html>
  )
}