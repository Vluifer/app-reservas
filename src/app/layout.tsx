import type { Metadata, Viewport } from 'next'
import { Cinzel, Josefin_Sans } from 'next/font/google'
import { Navbar } from '@/modules/identidad/ui/componentes/navbar'
import { ContadorSolicitudes } from '@/modules/reservas/ui/componentes/contador-solicitudes'
import { PiePagina } from '@/shared/ui/pie-pagina'
import './globals.css'

// Par "Real Estate Luxury": Cinzel en titulares y logo, Josefin Sans en el texto
const cinzel = Cinzel({ subsets: ['latin'], variable: '--font-cinzel', display: 'swap' })
const josefin = Josefin_Sans({ subsets: ['latin'], variable: '--font-josefin', display: 'swap' })

export const metadata: Metadata = {
  title: { default: 'Morada · Apartamentos por noches', template: '%s · Morada' },
  description: 'Apartamentos por noches en Colombia, reservados directamente con quien los alquila.',
}

export const viewport: Viewport = { viewportFit: 'cover', themeColor: '#1C1917' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${cinzel.variable} ${josefin.variable}`}>
      <body className="flex min-h-dvh flex-col overflow-x-clip bg-fondo font-sans text-tinta antialiased">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-full focus:bg-tinta focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-fondo"
        >
          Saltar al contenido
        </a>
        <Navbar avisoPanel={<ContadorSolicitudes />} />
        <main id="contenido" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-8 sm:px-6 sm:pb-24 sm:pt-12">
          {children}
        </main>
        <PiePagina />
      </body>
    </html>
  )
}
