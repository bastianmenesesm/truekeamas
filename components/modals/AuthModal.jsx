'use client';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';

export default function AuthModal() {
  const { loginUser, registerUser, closeModal, showToast } = useApp();
  const [tab, setTab] = useState('l');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    setLoading(true);
    try {
      await loginUser(fd.get('email'), fd.get('password'));
      showToast('¡Bienvenido de vuelta!');
      closeModal();
    } catch (err) {
      showToast('Error: ' + err.message);
    } finally { setLoading(false); }
  }

  async function handleRegister(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    setLoading(true);
    try {
      await registerUser(fd.get('email'), fd.get('password'), fd.get('name'), fd.get('phone'), fd.get('location'));
      showToast('¡Cuenta creada! Bienvenido/a 🎉');
      closeModal();
    } catch (err) {
      showToast('Error: ' + err.message);
    } finally { setLoading(false); }
  }

  return (
    <div>
      <div className="at">
        <button className={`atb${tab === 'l' ? ' active' : ''}`} onClick={() => setTab('l')}>Iniciar sesión</button>
        <button className={`atb${tab === 'r' ? ' active' : ''}`} onClick={() => setTab('r')}>Registrarse</button>
      </div>

      {tab === 'l' && (
        <form onSubmit={handleLogin}>
          <div className="fg">
            <label className="fd fl">Correo<input type="email" name="email" placeholder="tu@correo.cl" autoComplete="email" required /></label>
            <label className="fd fl">Contraseña<input type="password" name="password" placeholder="••••••••" required /></label>
          </div>
          <div className="ma"><button className="btn bv" style={{ width: '100%' }} disabled={loading}>{loading ? 'Cargando...' : 'Iniciar sesión'}</button></div>
        </form>
      )}

      {tab === 'r' && (
        <form onSubmit={handleRegister}>
          <div className="fg">
            <label className="fd fl">Nombre completo<input type="text" name="name" placeholder="Ej: Camila Torres" required /></label>
            <label className="fd fl">Correo<input type="email" name="email" placeholder="tu@correo.cl" required /></label>
            <label className="fd fl">Contraseña (mín. 6 caracteres)<input type="password" name="password" placeholder="••••••••" required minLength={6} /></label>
            <label className="fd">Teléfono<input type="tel" name="phone" placeholder="+56 9..." /></label>
            <label className="fd">Comuna<input type="text" name="location" placeholder="Ej: La Florida" /></label>
          </div>
          <div className="ma"><button className="btn bl" style={{ width: '100%' }} disabled={loading}>{loading ? 'Cargando...' : 'Crear cuenta'}</button></div>
        </form>
      )}
    </div>
  );
}
