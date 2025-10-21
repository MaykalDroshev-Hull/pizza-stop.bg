import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { LoadingProvider } from '../components/LoadingContext'
import LoadingOverlay from '../components/LoadingOverlay'
import NavBar from '../components/NavBar'
import { CartProvider } from '../components/CartContext'
import { LoginIDProvider } from '../components/LoginIDContext'
import ConditionalFooter from '../components/ConditionalFooter'
import CookieConsent from '../components/CookieConsent'
import ConditionalNavBar from '../components/ConditionalNavBar'
import { Suspense } from 'react'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Pizza Stop - Най-вкусните пици в Ловеч',
  description: 'Поръчай най-вкусните пици, дюнери и бургери в Ловеч. Бърза доставка и качествена храна.',
  keywords: 'пица, дюнер, бургер, доставка, Ловеч, храна, ресторант',
  authors: [{ name: 'Pizza Stop' }],
  creator: 'Pizza Stop',
  publisher: 'Pizza Stop',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://pizza-stop.bg'),
  openGraph: {
    title: 'Pizza Stop - Най-вкусните пици в Ловеч',
    description: 'Поръчай най-вкусните пици, дюнери и бургери в Ловеч',
    url: 'https://pizza-stop.bg',
    siteName: 'Pizza Stop',
    locale: 'bg_BG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pizza Stop - Най-вкусните пици в Ловеч',
    description: 'Поръчай най-вкусните пици, дюнери и бургери в Ловеч',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
  manifest: '/site.webmanifest',
}


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="bg" className="dark" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#0b1020" />
        <meta name="color-scheme" content="dark" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Pizza Stop" />
        <meta name="application-name" content="Pizza Stop" />
        <meta name="msapplication-TileColor" content="#0b1020" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#0b1020" />
        <link rel="canonical" href="https://pizza-stop.bg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={inter.className}>
          <LoadingProvider>
            <LoginIDProvider>
              <CartProvider>
                <div className="min-h-screen bg-bg text-text">
                  <ConditionalNavBar />
                  <main className="flex-1">
                    {children}
                  </main>
                  <ConditionalFooter />
                  <LoadingOverlay />
                  <Suspense fallback={null}>
                    <CookieConsent />
                  </Suspense>
                </div>
              </CartProvider>
            </LoginIDProvider>
          </LoadingProvider>
      </body>
    </html>
  )
} 