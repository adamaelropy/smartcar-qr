/* eslint-disable no-unused-vars */
const STORAGE_KEY = 'smartcar_anonymous_id';

function isValidStoredId(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed.length < 8 || trimmed.length > 128) return false;
  return /^[A-Za-z0-9_-]+$/.test(trimmed) || /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(trimmed);
}

function generateFallbackId() {
  try {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      // format as UUID v4-like hex
      const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
    }
  } catch (_err) {
    // ignore
  }
  // last resort (should not happen in modern browsers)
  return `fallback-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getAnonymousDeviceId() {
  try {
    const existing = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (existing && isValidStoredId(existing)) {
      return existing;
    }
    let newId;
    try {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        newId = crypto.randomUUID();
      } else {
        newId = generateFallbackId();
      }
    } catch (_err2) {
      newId = generateFallbackId();
    }
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, newId);
      } catch (_err3) {
        // ignore quota errors
      }
    }
    return newId;
  } catch (_err4) {
    // if localStorage unavailable, just generate ephemeral id (still groups per tab)
    try {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    } catch (_err5) {
      // ignore
    }
    return generateFallbackId();
  }
}

export function clearAnonymousDeviceId() {
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY);
  } catch (_err6) {
    // ignore
  }
}
