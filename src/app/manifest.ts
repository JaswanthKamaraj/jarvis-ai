import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'JARVIS AI',
    short_name: 'JARVIS',
    description: 'JARVIS AI Study Assistant',
    start_url: '/',
    display: 'standalone',
    background_color: '#0A0F1C',
    theme_color: '#0A0F1C',
    icons: [
      {
        src: '/favicon.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
      },
      {
        src: '/favicon.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
      },
    ],
  }
}
