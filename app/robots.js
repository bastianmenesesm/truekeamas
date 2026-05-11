export default function robots() {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://truekeamas.cl';
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/reset-password',
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
