'use client';
import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';

/**
 * Lee el parámetro ?open=PRODUCT_ID de la URL,
 * abre el modal de detalle del producto y limpia la URL.
 * Se monta dentro de <Suspense> en page.js.
 */
export default function AutoOpenProduct() {
  const params  = useSearchParams();
  const router  = useRouter();
  const { openModal, currentUser } = useApp();

  useEffect(() => {
    const id = params.get('open');
    if (!id) return;
    // Limpiar la URL sin recargar la página
    router.replace('/', { scroll: false });
    // Abrir el modal (funciona sin login para ver el detalle)
    openModal({ type: 'product_detail', productId: id });
  }, []); // solo al montar

  return null;
}
