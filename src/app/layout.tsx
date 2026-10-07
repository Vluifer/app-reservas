import type { Metadata, Viewport } from 'next'
import { Archivo } from 'next/font/google'
import { Navbar } from '@/modules/identidad/ui/componentes/navbar'
import { ContadorSolicitudes } from '@/modules/reservas/ui/componentes/contador-solicitudes'
import './globals.css'

const archivo = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--font-archivo', display: 'swap' })

export const metadata: Metadata = {
  title: 'Reservas de apartamentos',
  description: 'Encuentra y reserva apartamentos directamente con sus propietarios',
}

export const viewport: Viewport = { viewportFit: 'cover', themeColor: '#3F3F46' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={archivo.variable}>
      <body className="min-h-dvh bg-fondo font-sans text-tinta antialiased">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-full focus:bg-tinta focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-fondo"
        >
          Saltar al contenido
        </a>
        <Navbar avisoPanel={<ContadorSolicitudes tono="claro" />} />
        <main id="contenido" className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          {children}
        </main>
      </body>
    </html>
  )
}
