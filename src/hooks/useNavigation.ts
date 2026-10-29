import { useCallback, useEffect, useState } from 'react';
import { readRoute, routeHash, type Route } from '../utils/navigation';
import { readState, writeState } from '../utils/browserState';

export function useNavigation() {
  const [route, setRoute] = useState(readRoute);
  const navigate = useCallback((next: Route, replace = false) => {
    const old = readRoute();
    if (!old.detail) writeState(`scroll:${old.view}`, window.scrollY);
    const hash = routeHash(next);
    if (window.location.hash !== hash) window.history[replace ? 'replaceState' : 'pushState']({ kwave: true, detailEntry: Boolean(next.detail) }, '', hash);
    setRoute(next);
  }, []);
  useEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    const update = () => setRoute(readRoute());
    window.addEventListener('popstate', update); window.addEventListener('hashchange', update);
    const save = () => { const current = readRoute(); if (!current.detail) writeState(`scroll:${current.view}`, window.scrollY); };
    window.addEventListener('scroll', save, { passive: true });
    return () => { window.history.scrollRestoration = previousRestoration; window.removeEventListener('popstate', update); window.removeEventListener('hashchange', update); window.removeEventListener('scroll', save); };
  }, []);
  useEffect(() => {
    if (route.detail) return;
    const y = readState<number>(`scroll:${route.view}`, 0);
    let id: number; let attempt = 0; let cancelled = false;
    const cancel = () => { cancelled = true; };
    const restore = () => { if (cancelled) return; window.scrollTo({ top: y, behavior: 'instant' }); if (document.documentElement.scrollHeight - window.innerHeight < y && attempt++ < 20) id = window.setTimeout(restore, 150); };
    id = window.setTimeout(restore, 0);
    window.addEventListener('wheel', cancel, { passive: true }); window.addEventListener('touchstart', cancel, { passive: true }); window.addEventListener('keydown', cancel);
    return () => { window.clearTimeout(id); window.removeEventListener('wheel', cancel); window.removeEventListener('touchstart', cancel); window.removeEventListener('keydown', cancel); };
  }, [route.view, route.detail]);
  return { route, navigate };
}
