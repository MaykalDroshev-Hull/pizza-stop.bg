import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../styles/globals.css'
import NavBar from '../components/NavBar'
import Footer from '../components/Footer'
import { ThemeProvider } from '../components/ThemeProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Pizza Stop — Пица • Дюнер • Бургер — Ловеч',
  description: 'Pizza Stop — пици, дюнери и бургери в Ловеч. Домашно изпечени хлебчета за дюнер, бърза доставка и внимателно подбрани продукти. Поръчай сега на 068 670070.',
  keywords: 'пица, дюнер, бургер, доставка, храна, ресторант, Ловеч',
  themeColor: '#e11d48',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bg">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <NavBar />
          {children}
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
} 