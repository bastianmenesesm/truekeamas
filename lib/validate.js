/**
 * lib/validate.js — Helpers de validación y sanitización para rutas API.
 *
 * Centraliza las reglas de validación de inputs para evitar duplicación
 * y garantizar que todos los endpoints apliquen los mismos controles.
 */

// ── Tipos ─────────────────────────────────────────────────────────

/**
 * Comprueba que el valor sea una cadena no vacía dentro del largo máximo.
 * @param {unknown} value
 * @param {number}  maxLen
 * @returns {boolean}
 */
export function isValidString(value, maxLen = 500) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLen;
}

/**
 * Comprueba que el valor sea una cadena (puede estar vacía) dentro del largo máximo.
 * @param {unknown} value
 * @param {number}  maxLen
 * @returns {boolean}
 */
export function isOptionalString(value, maxLen = 1000) {
  if (value === undefined || value === null || value === '') return true;
  return typeof value === 'string' && value.length <= maxLen;
}

/**
 * Valida un UID de Firebase (alfanumérico, entre 1 y 128 caracteres).
 * @param {unknown} uid
 * @returns {boolean}
 */
export function isValidUid(uid) {
  return typeof uid === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(uid);
}

/**
 * Valida un ID de Firestore (alfanumérico + algunos símbolos, 1-128 chars).
 * @param {unknown} id
 * @returns {boolean}
 */
export function isValidId(id) {
  return typeof id === 'string' && id.trim().length > 0 && id.length <= 128;
}

/**
 * Valida una dirección de correo electrónico básica.
 * @param {unknown} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Valida que un número esté dentro de un rango [min, max].
 * @param {unknown} value
 * @param {number}  min
 * @param {number}  max
 * @returns {boolean}
 */
export function isInRange(value, min, max) {
  const n = Number(value);
  return !isNaN(n) && n >= min && n <= max;
}

// ── Sanitización ──────────────────────────────────────────────────

/**
 * Escapa caracteres especiales HTML para usar texto de usuario en plantillas HTML
 * (emails, htmlContent, etc.). NO usar para contenido que va a JSX — React ya escapa.
 *
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#039;');
}

/**
 * Limpia y trunca un string de usuario para almacenarlo de forma segura.
 * - Elimina espacios extremos
 * - Trunca al máximo permitido
 * @param {unknown} value
 * @param {number}  maxLen
 * @returns {string}
 */
export function sanitizeText(value, maxLen = 500) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLen);
}
