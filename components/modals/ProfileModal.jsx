'use client';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';

export default function ProfileModal() {
  const { currentUser, userData, updateUserProfile, logoutUser, closeModal, showToast } = useApp();
  const [loading, setLoading] = useState(false);

  if (!currentUser) return <div className="nb nbd">No has iniciado sesión.</div>;

  const name = userData?.displayName || currentUser.displayName || 'Usuario';

  async function handleSave(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    setLoading(true);
    try {
      await updateUserProfile(fd.get('name'), fd.get('phone') || '', fd.get('location') || '');
      showToast('Perfil actualizado ✅');
    } catch (err) { showToast('Error: ' + err.message); }
    finally { setLoading(false); }
  }

  async function handleLogout() {
    await logoutUser();
    showToast('Sesión cerrada.');
    closeModal();
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, padding: 20, background: 'var(--sf)', borderRadius: 14, border: '1.5px solid var(--ln)' }}>
        <div style={{ width: 60, height: 60, borderRadius: 16, background: 'linear-gradient(135deg,var(--v),var(--vl))', display: 'grid', placeItems: 'center', color: '#fff', fontFamily: 'Syne,sans-serif', fontSize: 26, fontWeight: 900 }}>
          {name.charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 900 }}>{name}</div>
          <div style={{ fontSize: 13, color: 'var(--mu)' }}>{currentUser.email}</div>
          <span className="cl" style={{ marginTop: 6, display: 'inline-flex', padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{userData?.level || 'Nuevo'}</span>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="fg">
          <label className="fd fl">Nombre visible<input name="name" defaultValue={name} placeholder="Tu nombre" /></label>
          <label className="fd">Teléfono<input name="phone" defaultValue={userData?.phone || ''} placeholder="+56 9..." /></label>
          <label className="fd">Ciudad<input name="location" defaultValue={userData?.location || ''} placeholder="Tu ubicación" /></label>
        </div>
        <div className="ma">
          <button type="button" className="btn bd2 bsm" onClick={handleLogout}>Cerrar sesión</button>
          <button className="btn bv" type="submit" disabled={loading}>{loading ? 'Guardando...' : '💾 Guardar'}</button>
        </div>
      </form>
    </div>
  );
}
