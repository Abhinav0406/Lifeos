import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ThemeProvider } from './components/ThemeProvider'
import { AuthProvider } from './components/AuthProvider'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: 'AI Wrapper - Prompt Enhancement Tool',
  description: 'Enhance your AI prompts with intelligent questioning and organized folder management. Support for OpenAI, Groq, Gemini, and Hugging Face.',
  keywords: ['AI', 'prompt', 'enhancement', 'OpenAI', 'Groq', 'Gemini', 'Hugging Face'],
  authors: [{ name: 'AI Wrapper Team' }],
  creator: 'AI Wrapper',
  publisher: 'AI Wrapper',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://ai-wrapper.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'AI Wrapper - Prompt Enhancement Tool',
    description: 'Enhance your AI prompts with intelligent questioning and organized folder management',
    url: 'https://ai-wrapper.vercel.app',
    siteName: 'AI Wrapper',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AI Wrapper - Prompt Enhancement Tool',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Wrapper - Prompt Enhancement Tool',
    description: 'Enhance your AI prompts with intelligent questioning and organized folder management',
    images: ['/og-image.png'],
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
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AI Wrapper',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="application-name" content="AI Wrapper" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="AI Wrapper" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#3b82f6" />
        
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color="#3b82f6" />
        <link rel="shortcut icon" href="/favicon.ico" />
        
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:url" content="https://ai-wrapper.vercel.app" />
        <meta name="twitter:title" content="AI Wrapper - Prompt Enhancement Tool" />
        <meta name="twitter:description" content="Enhance your AI prompts with intelligent questioning and organized folder management" />
        <meta name="twitter:image" content="/icons/icon-192x192.png" />
        <meta name="twitter:creator" content="@aiwrapper" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="AI Wrapper - Prompt Enhancement Tool" />
        <meta property="og:description" content="Enhance your AI prompts with intelligent questioning and organized folder management" />
        <meta property="og:site_name" content="AI Wrapper" />
        <meta property="og:url" content="https://ai-wrapper.vercel.app" />
        <meta property="og:image" content="/icons/icon-512x512.png" />
      </head>
      <body>
        <AuthProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
