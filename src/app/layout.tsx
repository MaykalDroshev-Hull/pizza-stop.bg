import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../styles/globals.css'
import NavBar from '../components/NavBar'
import Footer from '../components/Footer'
import { CartProvider } from '../components/CartContext'

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
        <meta name="color-scheme" content="dark" />
        <meta name="supported-color-schemes" content="dark" />
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Critical CSS to prevent white flash on Safari */
            html { background-color: #0b1020 !important; }
            body { background-color: #0b1020 !important; color: #f8fafc !important; }
            
          `
        }} />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" />

        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Immediately set dark theme to prevent white flash
                  document.documentElement.className = 'dark';
                  document.documentElement.setAttribute('data-theme', 'dark');
                  
                  // Then check for user preference
                  var theme = localStorage.getItem('theme');
                  if (!theme) {
                    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    theme = 'dark';
                  }
                  
                  // Apply the detected theme
                  document.documentElement.className = theme;
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {
                  // Fallback to dark theme if anything fails
                  document.documentElement.className = 'dark';
                  document.documentElement.setAttribute('data-theme', 'dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
          <CartProvider>
            <NavBar />
            {children}
            <Footer />
          </CartProvider>
      </body>
    </html>
  )
} 