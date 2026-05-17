import { ImageResponse } from 'next/og';
import { getAdminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const alt     = 'Publicación en Truekeamas';
export const size    = { width: 1200, height: 630 };
export const contentType = 'image/png';

const ACTION_COLOR = {
  vender:  '#F59E0B',
  cambiar: '#1677FF',
  mixto:   '#8B5CF6',
  donar:   '#22C55E',
};
const ACTION_LABEL = {
  vender:  'Venta',
  cambiar: 'Trueque',
  mixto:   'Mixto',
  donar:   'Donación',
};

export default async function Image({ params }) {
  const { id } = await params;

  let title       = 'Publicación en Truekeamas';
  let description = 'Descubre productos únicos en Truekeamas';
  let action      = 'cambiar';
  let price       = 0;
  let location    = '';
  let ownerName   = '';
  let photoUrl    = null;

  try {
    const db   = getAdminDb();
    const snap = await db.collection('products').doc(id).get();
    if (snap.exists) {
      const d = snap.data();
      title       = d.title       || title;
      description = d.description ? d.description.slice(0, 100) : description;
      action      = d.action      || 'cambiar';
      price       = typeof d.price === 'number' ? d.price : 0;
      location    = [d.commune, d.region].filter(Boolean).join(', ');
      ownerName   = d.ownerName   || d.owner || '';
      photoUrl    = Array.isArray(d.photos) && d.photos[0] ? d.photos[0] : null;
    }
  } catch {
    // Serve fallback image on error
  }

  const badgeColor = ACTION_COLOR[action] || '#1677FF';
  const badgeLabel = ACTION_LABEL[action] || 'Trueque';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          fontFamily: 'Inter, sans-serif',
          background: '#F0F5FF',
        }}
      >
        {/* Photo panel */}
        {photoUrl ? (
          <div style={{ width: 630, height: 630, flexShrink: 0, overflow: 'hidden', display: 'flex' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrl}
              alt={title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        ) : (
          <div style={{
            width: 630, height: 630, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#1677FF',
            fontSize: 160,
          }}>
            📦
          </div>
        )}

        {/* Info panel */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '48px 40px',
          justifyContent: 'space-between',
        }}>
          {/* Top: brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: '#1677FF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 900, fontSize: 18,
            }}>T</div>
            <span style={{ fontWeight: 800, fontSize: 20, color: '#0A1929', letterSpacing: '-0.5px' }}>
              Truekeamas
            </span>
          </div>

          {/* Middle: content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Badge */}
            <div style={{
              display: 'inline-flex', alignSelf: 'flex-start',
              background: badgeColor, color: '#fff',
              borderRadius: 8, padding: '6px 14px',
              fontWeight: 700, fontSize: 15, letterSpacing: 0.3,
            }}>
              {badgeLabel}
            </div>

            {/* Title */}
            <div style={{
              fontSize: 36, fontWeight: 800, color: '#0A1929',
              lineHeight: 1.2, letterSpacing: '-0.5px',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {title}
            </div>

            {/* Price */}
            {price > 0 && (
              <div style={{ fontSize: 30, fontWeight: 900, color: '#1677FF' }}>
                ${price.toLocaleString('es-CL')}
              </div>
            )}

            {/* Location */}
            {location && (
              <div style={{ fontSize: 16, color: '#5B7D9E', fontWeight: 500 }}>
                📍 {location}
              </div>
            )}

            {/* Owner */}
            {ownerName && (
              <div style={{ fontSize: 15, color: '#5B7D9E' }}>
                Por <span style={{ fontWeight: 700, color: '#0A1929' }}>{ownerName}</span>
              </div>
            )}
          </div>

          {/* Bottom: CTA */}
          <div style={{
            padding: '14px 24px',
            background: '#1677FF',
            borderRadius: 12,
            color: '#fff',
            fontWeight: 700,
            fontSize: 17,
            textAlign: 'center',
          }}>
            Ver en truekeamas.cl
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
