import type { KWaveContent, Language } from '../types/content';

export type View = 'home' | 'video' | 'kpop' | 'food' | 'recommendations' | 'search' | 'login' | 'onboarding' | 'timeline';
export type Route = { view: View; query: string; detail: string | null; contentId?: number; year?: number };
const paths: Record<View, string> = { home: '/', video: '/video', kpop: '/kpop', food: '/food', recommendations: '/for-you', search: '/search', login: '/login', onboarding: '/preferences', timeline: '/time-machine' };
export function readRoute(hash = window.location.hash): Route {
  const url = new URL(hash.replace(/^#/, '') || '/', 'https://kwave.local');
  const view = (Object.keys(paths) as View[]).find(view => paths[view] === url.pathname) ?? 'home';
  const detail = url.searchParams.get('detail');
  const id = Number(url.searchParams.get('contentId'));
  const year = Number(url.searchParams.get('year'));
  return { view, query: (url.searchParams.get('q') || '').slice(0, 300), detail: detail && /^(video|song|artist|idol|food)-[\w-]+$/.test(detail) ? detail : null, contentId: Number.isSafeInteger(id) && id > 0 ? id : undefined, ...(view === 'timeline' && Number.isInteger(year) && year >= 1900 && year <= 2100 ? { year } : {}) };
}
export function routeHash(route: Route): string {
  const params = new URLSearchParams();
  if (route.query && route.view === 'search') params.set('q', route.query);
  if (route.view === 'timeline' && route.year && Number.isInteger(route.year) && route.year >= 1900 && route.year <= 2100) params.set('year', String(route.year));
  if (route.detail) { params.set('detail', route.detail); if (route.contentId) params.set('contentId', String(route.contentId)); }
  return `#${paths[route.view]}${params.size ? `?${params}` : ''}`;
}
export function storedLanguage(): Language {
  try { const value = localStorage.getItem('kwave-language'); return value === 'zh' || value === 'ja' ? value : 'en'; } catch { return 'en'; }
}
export function detailSeed(id: string, contentId?: number): KWaveContent {
  const kind = id.startsWith('song-') ? 'song' : id.startsWith('artist-') ? 'idol' : id.startsWith('food-') ? 'food' : 'movie';
  return { id, contentId: contentId ?? (kind === 'movie' ? Number(id.split('-').pop()) : undefined), kind, title: '', subtitle: '', imageUrl: '', tags: [], description: '', year: 0, director: '', cast: [], ostIds: [], streaming: [], artist: '', album: '', releaseYear: 0, relatedIdolIds: [], members: [], instagramUrl: '', relatedSongIds: [], cookTime: '', difficulty: 'Easy', ingredients: [], steps: [] } as KWaveContent;
}
