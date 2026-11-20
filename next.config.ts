import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      // Imagen temporal del hero de la portada (ver InicioPagina)
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  experimental: {
    // Hasta 10 imágenes de 5 MB en un solo envío de formulario
    serverActions: { bodySizeLimit: '55mb' },
  },
}

export default nextConfig
