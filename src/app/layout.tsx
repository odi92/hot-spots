import type { Metadata, Viewport } from 'next'
import './globals.css'
import AppHeader from '@/components/layout/AppHeader'
import BottomNav from '@/components/layout/BottomNav'

export const metadata: Metadata = {
  title: 'Hot Spots',
  description: 'See where your friends are traveling and discover hot spots around the world.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Hot Spots',
  },
}

export const viewport: Viewport = {
  themeColor: '#ff5a1f',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-[#f9f9f7] text-[#1a1a1a] antialiased">
        <div className="mx-auto flex w-full max-w-lg flex-col flex-1 pb-20 md:max-w-4xl">
          <AppHeader />
          {children}
          <BottomNav />
        </div>
      </body>
    </html>
  )
}
