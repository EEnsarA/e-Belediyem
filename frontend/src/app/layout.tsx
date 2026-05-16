import type { Metadata, Viewport } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-plus-jakarta' })

export const metadata: Metadata = {
  title: 'e-Belediyem | Vatandaş Etkileşim Platformu',
  description: 'Belediyenizle dijital köprü. Şikayet bildirin, anketlere katılın, AI destekli destek alın.',
  keywords: ['belediye', 'şikayet', 'vatandaş', 'e-devlet', 'dijital belediye'],
  authors: [{ name: 'e-Belediyem' }],
  manifest: '/manifest.json',
  openGraph: {
    title: 'e-Belediyem',
    description: 'Vatandaş-Belediye Etkileşim Platformu',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0f1e' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={`${inter.variable} ${plusJakarta.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              className: 'dark:bg-surface-800 dark:text-surface-50 dark:border dark:border-surface-700',
              duration: 4000,
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
