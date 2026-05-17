'use client';
import { useState } from 'react';

/**
 * Input de teléfono chileno con formato fijo +56 9 XXXX XXXX
 *
 * Modos de uso:
 *   Formulario:   <PhoneInput name="phone" required />
 *                 → lee el valor desde FormData con fd.get('phone') → "+569XXXXXXXX"
 *
 *   Controlado:   <PhoneInput value={val} onChange={setVal} />
 *                 → onChange recibe "+569XXXXXXXX" cuando hay 8 dígitos, o string parcial
 */

function extractEightDigits(phone) {
  if (!phone) return '';
  const d = phone.replace(/\D/g, '');
  if (d.startsWith('569')) return d.slice(3, 11);
  if (d.startsWith('56'))  return d.slice(2, 10);
  if (d.startsWith('9'))   return d.slice(1,  9);
  return d.slice(0, 8);
}

export default function PhoneInput({ name, required, value: externalValue, onChange: externalOnChange, style }) {
  const isControlled = externalValue !== undefined;
  const [digits, setDigits] = useState(() => extractEightDigits(externalValue || ''));

  const activeDigits = isControlled ? extractEightDigits(externalValue || '') : digits;

  // Formatea los 8 dígitos como "XXXX XXXX"
  const display = activeDigits.slice(0, 4) + (activeDigits.length > 4 ? ' ' + activeDigits.slice(4) : '');

  function handleChange(e) {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 8);
    if (isControlled) {
      externalOnChange?.(raw.length === 8 ? `+569${raw}` : raw);
    } else {
      setDigits(raw);
    }
  }

  const fullValue = activeDigits.length === 8 ? `+569${activeDigits}` : '';

  return (
    <div style={{ display: 'flex', alignItems: 'stretch', border: '1.5px solid var(--ln)', borderRadius: 10, overflow: 'hidden', background: 'var(--bg)', ...style }}>
      <span style={{
        padding: '0 12px',
        background: 'var(--sf)',
        borderRight: '1.5px solid var(--ln)',
        color: 'var(--mu)',
        fontSize: 14,
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        letterSpacing: '0.01em',
      }}>
        +56 9
      </span>
      <input
        type="tel"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        placeholder="XXXX XXXX"
        maxLength={9} /* "XXXX XXXX" = 9 chars */
        style={{
          flex: 1,
          border: 'none',
          outline: 'none',
          padding: '10px 12px',
          background: 'transparent',
          fontSize: 14,
          color: 'var(--ink)',
          letterSpacing: '0.05em',
          fontFamily: 'monospace',
        }}
      />
      {/* Input oculto para FormData */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={fullValue}
          required={required}
        />
      )}
    </div>
  );
}
