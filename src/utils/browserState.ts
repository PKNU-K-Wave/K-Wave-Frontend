export function readState<T>(key: string, fallback: T): T {
  try {
    const value = JSON.parse(sessionStorage.getItem(`kwave:${key}`) || 'null');
    if (value == null) return fallback;
    if (Array.isArray(fallback)) return Array.isArray(value) ? value.filter(item => typeof item === 'string') as T : fallback;
    if (fallback !== null && typeof fallback === 'object') return typeof value === 'object' && Object.entries(fallback).every(([field, expected]) => typeof value[field] === typeof expected) ? value : fallback;
    if (typeof fallback === 'number') return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value as T : fallback;
    if (fallback !== null && typeof value !== typeof fallback) return fallback;
    return value;
  } catch { return fallback; }
}
export function writeState(key: string, value: unknown) {
  try { sessionStorage.setItem(`kwave:${key}`, JSON.stringify(value)); } catch { /* Storage is optional for public browsing. */ }
}
