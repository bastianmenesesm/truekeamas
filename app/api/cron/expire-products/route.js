import { NextResponse } from 'next/server';
import { getAdminDb }    from '@/lib/firebase-admin';

const THIRTY_DAYS_MS  = 30 * 24 * 60 * 60 * 1000;
const SEVEN_DAYS_MS   =  7 * 24 * 60 * 60 * 1000;
const EXPIRE_AFTER_MS = THIRTY_DAYS_MS + SEVEN_DAYS_MS; // 37 días

export async function GET(request) {
  // Vercel envía automáticamente Authorization: Bearer <CRON_SECRET>
  const cronSecret = process.env.CRON_SECRET;
  const authHeader  = request.headers.get('authorization');

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const adminDb = getAdminDb();
  const now     = Date.now();

  // Fecha límite: solo traemos productos con createdAt > 30 días (candidatos a caducar)
  const warnDate = new Date(now - THIRTY_DAYS_MS);

  const snap = await adminDb
    .collection('products')
    .where('status', '==', 'active')
    .where('createdAt', '<', warnDate)
    .limit(300)
    .get();

  let warned  = 0;
  let expired = 0;

  const notifBatch   = adminDb.batch();
  const productBatch = adminDb.batch();

  for (const docSnap of snap.docs) {
    const p          = docSnap.data();
    // Usar renewedAt si existe (el usuario renovó); si no, usar createdAt
    const lastActive = p.renewedAt?.toDate?.() || p.createdAt?.toDate?.();
    if (!lastActive) continue;

    const age = now - lastActive.getTime();

    if (age >= EXPIRE_AFTER_MS) {
      // 37+ días sin renovar → caducar
      productBatch.update(docSnap.ref, {
        status:    'expired',
        expiredAt: new Date(),
      });
      expired++;

    } else if (age >= THIRTY_DAYS_MS && !p.expiryNotifiedAt) {
      // Entre 30 y 37 días, aún no notificado → avisar
      productBatch.update(docSnap.ref, { expiryNotifiedAt: new Date() });

      if (p.ownerId) {
        const notifRef = adminDb
          .collection('notifications')
          .doc(p.ownerId)
          .collection('items')
          .doc(); // auto-ID
        notifBatch.set(notifRef, {
          type:      'expiry_warning',
          title:     '⏰ Tu publicación caduca pronto',
          body:      `"${p.title || 'Tu publicación'}" caduca en 7 días. ¡Renuévala para que siga visible!`,
          productId: docSnap.id,
          read:      false,
          createdAt: new Date(),
        });
      }
      warned++;
    }
  }

  await Promise.all([productBatch.commit(), notifBatch.commit()]);

  console.log(`[expire-products] warned=${warned} expired=${expired}`);
  return NextResponse.json({ ok: true, warned, expired });
}
