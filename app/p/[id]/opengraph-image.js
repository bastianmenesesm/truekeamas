import { ImageResponse } from 'next/og';

export const runtime     = 'edge';
export const alt         = 'Publicación en Truekeamas';
export const size        = { width: 1200, height: 630 };
export const contentType = 'image/png';

const ACTION_COLOR = { vender: '#F59E0B', cambiar: '#1677FF', mixto: '#8B5CF6', donar: '#22C55E' };
const ACTION_LABEL = { vender: 'Venta', cambiar: 'Trueque', mixto: 'Mixto', donar: 'Donación' };

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://truekeamas.cl';

export default async function Image({ params }) {
  const { id } = await params;

  let title     = 'Publicación en Truekeamas';
  let action    = 'cambiar';
  let price     = 0;
  let location  = '';
  let ownerName = '';
  let photoUrl  = null;

  try {
    // Usa la API pública de Firestore REST (no requiere Admin SDK, funciona en Edge)
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'truekeamas';
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/products/${id}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });

    if (res.ok) {
      const data = await res.json();
      const f = data.fields || {};
      title     = f.title?.stringValue     || title;
      action    = f.action?.stringValue    || 'cambiar';
      price     = Number(f.price?.integerValue || f.price?.doubleValue || 0);
      ownerName = f.ownerName?.stringValue || f.owner?.stringValue || '';
      const commune = f.commune?.stringValue || '';
      const region  = f.region?.stringValue  || '';
      location = [commune, region].filter(Boolean).join(', ');
      const photos = f.photos?.arrayValue?.values || [];
      photoUrl = photos[0]?.stringValue || null;
    }
  } catch {
    // Usa valores por defecto
  }

  const badgeColor = ACTION_COLOR[action] || '#1677FF';
  const badgeLabel = ACTION_LABEL[action] || 'Trueque';

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', fontFamily: 'Inter, sans-serif', background: '#F0F5FF' }}>
        {/* Panel de foto */}
        {photoUrl ? (
          <div style={{ width: 630, height: 630, flexShrink: 0, overflow: 'hidden', display: 'flex' }}>
            <img src={photoUrl} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ) : (
          <div style={{ width: 630, height: 630, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1677FF', fontSize: 160 }}>
            📦
          </div>
        )}

        {/* Panel de info */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '48px 40px', justifyContent: 'space-between' }}>
          {/* Marca */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#1677FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 18 }}>T</div>
            <span style={{ fontWeight: 800, fontSize: 20, color: '#0A1929' }}>Truekeamas</span>
          </div>

          {/* Contenido */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'inline-flex', alignSelf: 'flex-start', background: badgeColor, color: '#fff', borderRadius: 8, padding: '6px 14px', fontWeight: 700, fontSize: 15 }}>
              {badgeLabel}
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: '#0A1929', lineHeight: 1.2 }}>
              {title.slice(0, 80)}
            </div>
            {price > 0 && (
              <div style={{ fontSize: 30, fontWeight: 900, color: '#1677FF' }}>
                ${price.toLocaleString('es-CL')}
              </div>
            )}
            {location && <div style={{ fontSize: 16, color: '#5B7D9E' }}>📍 {location}</div>}
            {ownerName && <div style={{ fontSize: 15, color: '#5B7D9E' }}>Por <span style={{ fontWeight: 700, color: '#0A1929' }}>{ownerName}</span></div>}
          </div>

          {/* CTA */}
          <div style={{ padding: '14px 24px', background: '#1677FF', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 17, textAlign: 'center' }}>
            Ver en truekeamas.cl
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
