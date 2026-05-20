import { NextResponse }                       from 'next/server';
import { getAdminAuth }                        from '@/lib/firebase-admin';
import { inMemoryRateLimit, rateLimitResponse } from '@/lib/rateLimit';
import crypto                                  from 'crypto';

/**
 * POST /api/cloudinary-signature
 *
 * Genera una firma HMAC-SHA1 para subidas firmadas a Cloudinary.
 * El API secret NUNCA llega al cliente — solo se usa aquí en el servidor.
 *
 * Flujo:
 *  1. El cliente pide la firma (con su token Firebase)
 *  2. El servidor verifica la sesión y genera timestamp + signature
 *  3. El cliente sube directamente a Cloudinary con esos parámetros firmados
 *  4. Cloudinary valida la firma contra el API secret — rechaza si no coincide
 *
 * Sin firma (upload_preset sin firmar) cualquiera puede subir a tu cuenta.
 * Con firma solo usuarios autenticados de Truekeamas pueden hacerlo.
 */
export async function POST(request) {
  // ── Auth ──────────────────────────────────────────────────────────────
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  let uid;
  try {
    const decoded = await getAdminAuth().verifyIdToken(authHeader.slice(7));
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: 'Sesión expirada, vuelve a iniciar sesión' }, { status: 401 });
  }

  // ── Rate limit: 30 firmas por usuario por hora ────────────────────────
  // (en memoria es suficiente; el secreto real está en el servidor de todos modos)
  const rl = inMemoryRateLimit(`upload:${uid}`, 30, 60 * 60 * 1000);
  if (!rl.allowed) {
    return rateLimitResponse(
      rl.retryAfter,
      `Demasiadas subidas de imágenes. Espera ${Math.ceil(rl.retryAfter / 60)} minuto${Math.ceil(rl.retryAfter / 60) !== 1 ? 's' : ''}.`
    );
  }

  // ── Variables de entorno ──────────────────────────────────────────────
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const apiKey    = process.env.CLOUDINARY_API_KEY;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

  if (!apiSecret || !apiKey || !cloudName) {
    console.error('[cloudinary-signature] Faltan variables de entorno: CLOUDINARY_API_SECRET, CLOUDINARY_API_KEY, CLOUDINARY_CLOUD_NAME');
    return NextResponse.json({ error: 'Servicio de imágenes no configurado' }, { status: 503 });
  }

  // ── Generar firma ──────────────────────────────────────────────────────
  const timestamp      = Math.round(Date.now() / 1000);
  const folder         = 'truekeamas';
  const allowedFormats = 'jpg,jpeg,png,webp,gif,avif';

  // Los parámetros deben ordenarse alfabéticamente antes de concatenar el secret
  // Referencia: https://cloudinary.com/documentation/upload_images#generating_authentication_signatures
  const paramsToSign = `allowed_formats=${allowedFormats}&folder=${folder}&timestamp=${timestamp}`;
  const signature    = crypto.createHash('sha1').update(paramsToSign + apiSecret).digest('hex');

  return NextResponse.json({ signature, timestamp, apiKey, cloudName, folder, allowedFormats });
}
