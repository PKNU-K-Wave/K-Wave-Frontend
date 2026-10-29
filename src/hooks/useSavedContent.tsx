import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { readSaved, savedKey, writeSaved } from '../utils/savedContent';
import type { KWaveContent } from '../types/content';

import { SavedContentContext as Context } from './savedContentContext';
import { readState, writeState } from '../utils/browserState';
import type { Route } from '../utils/navigation';
export function SavedContentProvider({ userId, onLogin, children, returnRoute }: { userId?: number; onLogin: () => void; children: ReactNode; returnRoute: Route }) {
  const [items, setItems] = useState<KWaveContent[]>(() => userId ? readSaved(userId) : []);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!userId) return;
    const pending = readState<{ item: KWaveContent; createdAt: number } | null>('save-intent', null);
    if (!pending) return;
    if (pending.createdAt > Date.now() || Date.now() - pending.createdAt > 30 * 60_000) { writeState('save-intent', null); return; }
    const current = readSaved(userId);
    try { const next = current.some(item => item.id === pending.item.id) ? current : [pending.item, ...current]; writeSaved(userId, next); setItems(next); window.setTimeout(() => writeState('save-intent', null), 0); }
    catch { setError('Could not save on this browser. Please allow browser storage and try again.'); }
  }, [userId]);
  useEffect(() => {
    const refresh = (event: StorageEvent) => { if (userId && (event.key === savedKey(userId) || event.key === null)) setItems(readSaved(userId)); };
    window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, [userId]);
  const toggle = useCallback((item: KWaveContent) => {
    if (!userId) { writeState('save-intent', { item, route: returnRoute, createdAt: Date.now() }); onLogin(); return; }
    const current = readSaved(userId);
    const next = current.some(saved => saved.id === item.id) ? current.filter(saved => saved.id !== item.id) : [item, ...current];
    if (next.length > 500) { setError('Your collection is full. Remove a saved title before adding another.'); return; }
    try { writeSaved(userId, next); setItems(next); setError(null); }
    catch { setError('Could not save on this browser. Please allow browser storage and try again.'); }
  }, [userId, onLogin, returnRoute]);
  const value = useMemo(() => ({ items, error, toggle, signedIn: Boolean(userId) }), [items, error, toggle, userId]);
  return <Context.Provider value={value}>{children}{error && <div role="alert" className="fixed inset-x-4 bottom-24 z-[70] mx-auto max-w-lg rounded-lg border border-red-200 bg-white p-4 text-sm text-red-700">{error}<button className="ml-3 underline" onClick={() => setError(null)}>Dismiss</button></div>}</Context.Provider>;
}
