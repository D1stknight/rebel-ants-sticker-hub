import type { Metadata, Viewport } from 'next'
import { Toaster } from 'react-hot-toast'
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Rebel Ants Sticker & GIF Hub',
    template: '%s | Rebel Ants',
  },
  description: 'Download premium Rebel Ants sticker packs and GIFs for iMessage, Telegram, Discord, and more.',
  keywords: ['rebel ants', 'stickers', 'gifs', 'nft stickers', 'animated stickers'],
  authors: [{ name: 'Rebel Ants' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Rebel Ants',
  },
  openGraph: {
    type: 'website',
    title: 'Rebel Ants Sticker & GIF Hub',
    description: 'Download premium Rebel Ants sticker packs and GIFs.',
    siteName: 'Rebel Ants Hub',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rebel Ants Sticker & GIF Hub',
    description: 'Download premium Rebel Ants sticker packs and GIFs.',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
  },
}

export const viewport: Viewport = {
  themeColor: '#080b14',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-startup-image" href="/icons/splash.png" />
      </head>
      <body>
        <ServiceWorkerRegistrar />
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: '#0f1420',
              color: '#f1f5f9',
              border: '1px solid #1e2a42',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#8b5cf6', secondary: '#080b14' } },
          }}
        />
      </body>
    </html>
  )
}
