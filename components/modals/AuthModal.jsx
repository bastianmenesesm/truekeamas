'use client';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { REGIONES_CHILE } from '@/lib/regions';

const EYE_ON  = '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>';
const EYE_OFF = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';

function getPasswordStrength(pwd) {
  if (!pwd) return { level: 0, label: '', bars: [false, false, false, false] };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const labels = ['', 'Débil', 'Regular', 'Buena', 'Fuerte'];
  const cls    = ['', 'weak', 'fair', 'good', 'strong'];
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
  const { loginUser, registerUser, socialLogin, closeModal, showToast, openModal } = useApp();
  const [tab, setTab]             = useState('l');
  const [loading, setLoading]     = useState(false);
  const [socialLoading, setSocialLoading] = useState('');
  const [regPwd, setRegPwd]     = useState('');
  const [termsOk, setTermsOk]   = useState(false);
  const [forgotSent, setForgotSent]   = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const strength = getPasswordStrength(regPwd);

  async function handleSocialLogin(provider) {
    setSocialLoading(provider);
    try {
      await socialLogin(provider);
      showToast('¡Bienvenido/a! 👋');
      closeModal();
      setTimeout(() => openModal('privacy_reminder'), 350);
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') return;
      if (err.code === 'auth/account-exists-with-different-credential') {
        showToast('Este correo ya está registrado con otro método. Intenta con correo y contraseña.');
      } else {
        showToast('Error al conectar con ' + provider + '. Intenta de nuevo.');
      }
    } finally { setSocialLoading(''); }
  }

  async function handleLogin(e) {
    e.preventDefault();
    const fd       = new FormData(e.target);
    const email    = fd.get('email')?.toString().trim();
    const password = fd.get('password')?.toString();
    if (!email || !password) return;
    setLoading(true);
    try {
      await loginUser(email, password);
      showToast('¡Bienvenido de vuelta! 👋');
      closeModal();
      // Mostrar recordatorio de privacidad en cada login
      setTimeout(() => openModal('privacy_reminder'), 350);
    } catch (err) {
      const msg = err.code === 'auth/invalid-credential' ? 'Correo o contraseña incorrectos.' :
        err.code === 'auth/too-many-requests' ? 'Demasiados intentos. Intenta más tarde.' : 'Error al iniciar sesión.';
      showToast(msg);
    } finally { setLoading(false); }
  }

  async function handleRegister(e) {
    e.preventDefault();
    const fd       = new FormData(e.target);
    const email    = fd.get('email')?.toString().trim();
    const password = fd.get('password')?.toString();
    const name     = fd.get('name')?.toString().trim();
    if (!email || !password || !name) return;
    if (strength.level < 3) { showToast('La contraseña debe tener mayúscula, número y carácter especial.'); return; }
    if (!termsOk) { showToast('Debes aceptar los Términos y Política de Privacidad.'); return; }
    setLoading(true);
    try {
      await registerUser(email, password, name, fd.get('phone')?.toString(), fd.get('region')?.toString());
      showToast('¡Cuenta creada! Bienvenido/a 🎉');
      closeModal();
      // Recordatorio también al registrarse
      setTimeout(() => openModal('privacy_reminder'), 350);
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
      const res  = await fetch('/api/reset-request', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al enviar');
      setForgotSent(true);
    } catch (err) {
      showToast(err.message);
    } finally { setLoading(false); }
  }

  /* ── Forgot ─────────────────────────────── */
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

  /* ── Login / Register ───────────────────── */
  return (
    <div>
      {/* ── Social login ── */}
      <div className="auth-social">
        <button
          type="button"
          className="social-btn social-btn--google"
          onClick={() => handleSocialLogin('google')}
          disabled={!!socialLoading}
        >
          {socialLoading === 'google' ? <span className="sp" style={{ width: 18, height: 18, borderWidth: 2 }} /> : (
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          Continuar con Google
        </button>

      </div>

      <div className="auth-divider"><span>o continúa con correo</span></div>

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

          {/* Aceptación de términos */}
          <div className="terms-check-row">
            <input
              type="checkbox" id="terms-ok"
              checked={termsOk}
              onChange={e => setTermsOk(e.target.checked)}
            />
            <label htmlFor="terms-ok">
              He leído y acepto los{' '}
              <a href="/privacidad" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--v)', fontWeight: 600 }}>
                Términos de Uso y Política de Privacidad
              </a>
              {' '}de Truekeamas. Entiendo que la plataforma actúa como intermediario y no se responsabiliza por los intercambios.
            </label>
          </div>

          <div className="ma">
            <button className="btn bl btn-full" type="submit" disabled={loading || !termsOk}>
              {loading ? <><span className="sp" style={{ width: 16, height: 16, borderWidth: 2, marginRight: 6 }} />Creando...</> : 'Crear cuenta'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
