'use client';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { REGIONES_CHILE } from '@/lib/regions';

const EYE_ON = '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>';
const EYE_OFF = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';

function getPasswordStrength(pwd) {
  if (!pwd) return { level: 0, label: '', bars: [false, false, false, false] };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const labels = ['', 'Débil', 'Regular', 'Buena', 'Fuerte'];
  const cls = ['', 'weak', 'fair', 'good', 'strong'];
  return { level: score, label: labels[score], cls: cls[score], bars: [score >= 1, score >= 2, score >= 3, score >= 4] };
}

function PasswordInput({ name, placeholder, value, onChange, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div className="pwd-wrap">
      <input type={show ? 'text' : 'password'} name={name} placeholder={placeholder}
        value={value} onChange={onChange} autoComplete={autoComplete} required />
      <button type="button" className="pwd-eye" onClick={() => setShow(s => !s)} tabIndex={-1}>
        <svg viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: show ? EYE_OFF : EYE_ON }} />
      </button>
    </div>
  );
}

export default function AuthModal() {
  const { loginUser, registerUser, closeModal, showToast } = useApp();
  const [tab, setTab] = useState('l');
  const [loading, setLoading] = useState(false);
  const [regPwd, setRegPwd] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const strength = getPasswordStrength(regPwd);

  async function handleLogin(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const email = fd.get('email')?.toString().trim();
    const password = fd.get('password')?.toString();
    if (!email || !password) return;
    setLoading(true);
    try {
      await loginUser(email, password);
      showToast('¡Bienvenido de vuelta! 👋');
      closeModal();
    } catch (err) {
      const msg = err.code === 'auth/invalid-credential' ? 'Correo o contraseña incorrectos.' :
        err.code === 'auth/too-many-requests' ? 'Demasiados intentos. Intenta más tarde.' : 'Error al iniciar sesión.';
      showToast(msg);
    } finally { setLoading(false); }
  }

  async function handleRegister(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const email = fd.get('email')?.toString().trim();
    const password = fd.get('password')?.toString();
    const name = fd.get('name')?.toString().trim();
    if (!email || !password || !name) return;
    if (strength.level < 3) { showToast('La contraseña debe tener mayúscula, número y carácter especial.'); return; }
    setLoading(true);
    try {
      await registerUser(email, password, name, fd.get('phone')?.toString(), fd.get('region')?.toString());
      showToast('¡Cuenta creada! Bienvenido/a 🎉');
      closeModal();
    } catch (err) {
      const msg = err.code === 'auth/email-already-in-use' ? 'Este correo ya está registrado.' :
        err.code === 'auth/weak-password' ? 'Contraseña demasiado débil.' : 'Error al crear cuenta.';
      showToast(msg);
    } finally { setLoading(false); }
  }

  async function handleForgot(e) {
    e.preventDefault();
    const email = forgotEmail.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast('Ingresa un correo válido.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/reset-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al enviar');
      setForgotSent(true);
    } catch (err) {
      showToast(err.message);
    } finally { setLoading(false); }
  }

  if (tab === 'forgot') {
    return (
      <div>
        <button className="lk" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={() => { setTab('l'); setForgotSent(false); setForgotEmail(''); }}>
          ← Volver al login
        </button>

        {forgotSent ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
            <h3 style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 900, marginBottom: 8 }}>¡Revisa tu correo!</h3>
            <p style={{ color: 'var(--mu)', fontSize: 14, lineHeight: 1.6 }}>
              Enviamos un enlace de recuperación a<br />
              <strong style={{ color: 'var(--ink)' }}>{forgotEmail}</strong>
            </p>
            <p style={{ color: 'var(--mu)', fontSize: 12, marginTop: 12 }}>El enlace expira en 30 minutos.</p>
          </div>
        ) : (
          <form onSubmit={handleForgot}>
            <p style={{ color: 'var(--mu)', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
              Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
            </p>
            <div className="fg">
              <label className="fd fl">Correo electrónico
                <input type="email" placeholder="tu@correo.cl" value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)} required autoComplete="email" />
              </label>
            </div>
            <div className="ma">
              <button className="btn bv btn-full" type="submit" disabled={loading}>
                {loading ? 'Enviando...' : '📨 Enviar enlace de recuperación'}
              </button>
            </div>
          </form>
        )}
      </div>
    );
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
            <label className="fd fl">Correo
              <input type="email" name="email" placeholder="tu@correo.cl" autoComplete="email" required />
            </label>
            <label className="fd fl">Contraseña
              <PasswordInput name="password" placeholder="••••••••" autoComplete="current-password" />
              <button type="button" className="forgot-link" onClick={() => setTab('forgot')}>
                ¿Olvidaste tu contraseña?
              </button>
            </label>
          </div>
          <div className="ma">
            <button className="btn bv btn-full" type="submit" disabled={loading}>
              {loading ? <><span className="sp" style={{ width: 16, height: 16, borderWidth: 2, marginRight: 6 }} />Ingresando...</> : 'Iniciar sesión'}
            </button>
          </div>
        </form>
      )}

      {tab === 'r' && (
        <form onSubmit={handleRegister}>
          <div className="fg">
            <label className="fd fl">Nombre completo
              <input type="text" name="name" placeholder="Ej: Camila Torres" required autoComplete="name" />
            </label>
            <label className="fd fl">Correo
              <input type="email" name="email" placeholder="tu@correo.cl" required autoComplete="email" />
            </label>
            <label className="fd fl">Contraseña
              <PasswordInput name="password" placeholder="Mín. 8 caracteres" autoComplete="new-password"
                value={regPwd} onChange={e => setRegPwd(e.target.value)} />
              {regPwd && (
                <>
                  <div className="pwd-strength">
                    {strength.bars.map((active, i) => (
                      <div key={i} className={`pwd-bar${active ? ' ' + strength.cls : ''}`} />
                    ))}
                  </div>
                  <div className="pwd-hint">{strength.label}</div>
                </>
              )}
              <div className="pwd-reqs">Debe incluir: mayúscula · número · carácter especial (!@#$%...)</div>
            </label>
            <label className="fd">Teléfono<input type="tel" name="phone" placeholder="+56 9..." autoComplete="tel" /></label>
            <label className="fd">Región
              <select name="region" defaultValue="">
                <option value="" disabled>Selecciona tu región</option>
                {REGIONES_CHILE.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
          </div>
          <div className="ma">
            <button className="btn bl btn-full" type="submit" disabled={loading}>
              {loading ? <><span className="sp" style={{ width: 16, height: 16, borderWidth: 2, marginRight: 6 }} />Creando...</> : 'Crear cuenta'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
