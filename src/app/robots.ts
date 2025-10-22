import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://pizza-stop.bg'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin-delivery-login',
          '/admin-kitchen-login',
          '/api/',
          '/delivery',
          '/kitchen',
          '/printer',
          '/login-admin',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}






