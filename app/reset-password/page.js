'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const EYE_ON = '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>';
const EYE_OFF = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';

function getPasswordStrength(pwd) {
  if (!pwd) return { level: 0, label: '', cls: '', bars: [false, false, false, false] };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const labels = ['', 'Débil', 'Regular', 'Buena', 'Fuerte'];
  const cls = ['', 'weak', 'fair', 'good', 'strong'];
  return { level: score, label: labels[score], cls: cls[score], bars: [score >= 1, score >= 2, score >= 3, score >= 4] };
}

function PasswordInput({ placeholder, value, onChange, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div className="pwd-wrap">
      <input type={show ? 'text' : 'password'} placeholder={placeholder}
        value={value} onChange={onChange} autoComplete={autoComplete} required />
      <button type="button" className="pwd-eye" onClick={() => setShow(s => !s)} tabIndex={-1}>
        <svg viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: show ? EYE_OFF : EYE_ON }} />
      </button>
    </div>
  );
}

function ResetForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const strength = getPasswordStrength(password);

  useEffect(() => {
    if (!token) setError('Enlace inválido. Solicita un nuevo enlace de recuperación.');
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (strength.level < 3) { setError('La contraseña debe tener mayúscula, número y carácter especial.'); return; }
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/reset-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al restablecer la contraseña.');
      setDone(true);
      setTimeout(() => router.push('/'), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="reset-page">
      <div className="reset-card">
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
          <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 26, fontWeight: 900, margin: '0 0 8px', color: 'var(--ink)' }}>
            Nueva contraseña
          </h1>
          <p style={{ color: 'var(--mu)', fontSize: 14, margin: 0 }}>Elige una contraseña segura para tu cuenta Truekeamas</p>
        </div>

        {done ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h3 style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 900, marginBottom: 8, color: 'var(--ink)' }}>
              ¡Contraseña actualizada!
            </h3>
            <p style={{ color: 'var(--mu)', fontSize: 14, lineHeight: 1.6 }}>
              Tu contraseña fue restablecida correctamente.<br />Serás redirigido en unos segundos...
            </p>
            <Link href="/" className="btn bv btn-full" style={{ marginTop: 20, display: 'block', textAlign: 'center', textDecoration: 'none' }}>
              Ir al inicio →
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="nb nbd" style={{ marginBottom: 16, color: 'var(--dg)', borderColor: 'var(--dg)' }}>
                ⚠️ {error}
              </div>
            )}
            <div className="fg">
              <label className="fd fl">Nueva contraseña
                <PasswordInput
                  placeholder="Mín. 8 caracteres"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
                {password && (
                  <>
                    <div className="pwd-strength">
                      {strength.bars.map((active, i) => (
                        <div key={i} className={`pwd-bar${active ? ' ' + strength.cls : ''}`} />
                      ))}
                    </div>
                    <div className="pwd-hint">{strength.label}</div>
                  </>
                )}
              </label>
              <label className="fd fl">Confirmar contraseña
                <PasswordInput
                  placeholder="Repite la contraseña"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  autoComplete="new-password"
                />
              </label>
            </div>
            <div className="ma">
              <button className="btn bv btn-full" type="submit" disabled={loading || !token}>
                {loading
                  ? <><span className="sp" style={{ width: 16, height: 16, borderWidth: 2, marginRight: 6 }} />Guardando...</>
                  : '🔐 Guardar nueva contraseña'}
              </button>
            </div>
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Link href="/" className="lk" style={{ fontSize: 13 }}>← Volver al inicio</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="reset-page">
        <div className="cem"><div className="sp" style={{ margin: '0 auto 12px' }} />Cargando...</div>
      </div>
    }>
      <ResetForm />
    </Suspense>
  );
}
