export default function sitemap() {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://truekeamas.cl';
  const now = new Date().toISOString();

  return [
    {
      url: base,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
  ];
}
