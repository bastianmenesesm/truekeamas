'use client';
import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { applyActionCode, reload } from 'firebase/auth';
import { auth } from '@/lib/firebase';

/**
 * Maneja parámetros especiales de URL:
 * - ?open=PRODUCT_ID        → abre modal de producto
 * - ?mode=verifyEmail&oobCode=XXX → verifica el email del usuario
 */
export default function AutoOpenProduct() {
  const params  = useSearchParams();
  const router  = useRouter();
  const { openModal, showToast, setCurrentUser } = useApp();

  useEffect(() => {
    // ── Verificación de email ──────────────────────────────────
    const mode    = params.get('mode');
    const oobCode = params.get('oobCode');

    if (mode === 'verifyEmail' && oobCode) {
      router.replace('/', { scroll: false });
      applyActionCode(auth, oobCode)
        .then(async () => {
          // Refrescar el usuario para que emailVerified = true
          if (auth.currentUser) {
            await reload(auth.currentUser);
            setCurrentUser({ ...auth.currentUser });
          }
          showToast('¡Email verificado! Ahora eres nivel Verificado.');
        })
        .catch(() => {
          showToast('El enlace expiró o ya fue usado. Reenvía el correo de verificación.');
        });
      return;
    }

    // ── Abrir producto por URL ─────────────────────────────────
    const id = params.get('open');
    if (!id) return;
    router.replace('/', { scroll: false });
    openModal({ type: 'product_detail', productId: id });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
