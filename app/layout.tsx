import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono, Montserrat, Playfair_Display, Poppins, Roboto, Open_Sans, Lato, Oswald, Raleway, Nunito, Merriweather, Bebas_Neue, Dancing_Script } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'


import { SuportePopup } from "@/components/central63/support/support-popup"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

// Configuração das fontes adicionais para o Flow Design
const montserrat = Montserrat({ subsets: ["latin"], variable: '--font-montserrat' });
const playfair = Playfair_Display({ subsets: ["latin"], variable: '--font-playfair' });
const poppins = Poppins({ subsets: ["latin"], weight: ['400', '600', '700'], variable: '--font-poppins' });
const roboto = Roboto({ subsets: ["latin"], weight: ['400', '700'], variable: '--font-roboto' });
const openSans = Open_Sans({ subsets: ["latin"], variable: '--font-open-sans' });
const lato = Lato({ subsets: ["latin"], weight: ['400', '700'], variable: '--font-lato' });
const oswald = Oswald({ subsets: ["latin"], variable: '--font-oswald' });
const raleway = Raleway({ subsets: ["latin"], variable: '--font-raleway' });
const nunito = Nunito({ subsets: ["latin"], variable: '--font-nunito' });
const merriweather = Merriweather({ subsets: ["latin"], weight: ['400', '700'], variable: '--font-merriweather' });
const bebasNeue = Bebas_Neue({ subsets: ["latin"], weight: ['400'], variable: '--font-bebas-neue' });
const dancingScript = Dancing_Script({ subsets: ["latin"], variable: '--font-dancing-script' });

export const metadata: Metadata = {
  title: 'Central63 - Gestão Imobiliária',
  description: 'Sistema de gestão imobiliária para acompanhar leads, negociações e performance da equipe',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body 
        className={`font-sans antialiased ${montserrat.variable} ${playfair.variable} ${poppins.variable} ${roboto.variable} ${openSans.variable} ${lato.variable} ${oswald.variable} ${raleway.variable} ${nunito.variable} ${merriweather.variable} ${bebasNeue.variable} ${dancingScript.variable}`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <SuportePopup />
          <Toaster />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}