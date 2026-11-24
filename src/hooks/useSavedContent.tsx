import { useEffect, useRef, useState, type ReactNode } from 'react';
import { changeFavorite, fetchFavorites } from '../api/backend';
import { withAccessToken } from '../api/auth';
import { readSaved, writeSaved, favoriteId } from '../utils/savedContent';
import type { KWaveContent } from '../types/content';
import { SavedContentContext as Context } from './savedContentContext';
import { readState, writeState } from '../utils/browserState';
import { useUI } from '../utils/ui';
import type { Route } from '../utils/navigation';

export function SavedContentProvider({ userId, onLogin, children, returnRoute }: { userId?: number; onLogin: () => void; children: ReactNode; returnRoute: Route }) {
  const t = useUI();
  const [items, setItems] = useState<KWaveContent[]>([]);
  const [ready, setReady] = useState(!userId);
  const [loading, setLoading] = useState(Boolean(userId));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const session = useRef<AbortController | null>(null);
  const writing = useRef(false);

  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();
    session.current = controller;
    const { signal } = controller;
    setReady(false); setLoading(true); setError(null); setBusy(false); writing.current = false;
    const load = async () => {
      const list = await withAccessToken(token => fetchFavorites(token, signal));
      const ids = new Set(list.map(favoriteId));
      const legacy = readSaved(userId);
      const moved = new Set<number>();
      const pending = readState<{ item: KWaveContent; createdAt: number } | null>('save-intent', null);
      const pendingId = pending && pending.createdAt <= Date.now() && Date.now() - pending.createdAt <= 30 * 60_000 ? favoriteId(pending.item) : undefined;
      const candidates = new Map(legacy.flatMap(item => {
        const id = favoriteId(item);
        return id ? [[id, item] as const] : [];
      }).reverse());
      if (pending && pendingId) candidates.set(pendingId, pending.item);
      let migrationFailed = false;
      for (const [id, item] of candidates) {
        if (signal.aborted) return;
        try {
          if (!ids.has(id)) {
            await withAccessToken(token => changeFavorite(id, true, token, signal));
            ids.add(id);
            list.unshift(item);
          }
          moved.add(id);
        } catch {
          if (signal.aborted) return;
          migrationFailed = true;
        }
      }
      if (signal.aborted) return;
      if (moved.size) {
        try { writeSaved(userId, readSaved(userId).filter(item => !moved.has(favoriteId(item) ?? 0))); }
        catch { /* The server already has the migrated items. */ }
      }
      if (pending && (!pendingId || moved.has(pendingId))) writeState('save-intent', null);
      setItems(list); setReady(true);
      if (migrationFailed) setError('Some saved titles could not be transferred.');
    };
    void load().catch(() => { if (!signal.aborted) setError('Could not load favorites.'); })
      .finally(() => { if (!signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [userId, retry]);

  const toggle = async (item: KWaveContent) => {
    const id = favoriteId(item);
    if (!id) return;
    if (!userId) { writeState('save-intent', { item, route: returnRoute, createdAt: Date.now() }); onLogin(); return; }
    const signal = session.current?.signal;
    if (!ready || writing.current || !signal || signal.aborted) return;
    const add = !items.some(saved => favoriteId(saved) === id);
    writing.current = true; setBusy(true); setError(null);
    try {
      await withAccessToken(token => changeFavorite(id, add, token, signal));
      if (!signal.aborted) setItems(current => add ? [item, ...current] : current.filter(saved => favoriteId(saved) !== id));
    } catch {
      if (!signal.aborted) setError('Could not update favorites.');
    } finally {
      if (!signal.aborted) { writing.current = false; setBusy(false); }
    }
  };
  return <Context.Provider value={{ items, error, toggle, loading, busy: busy || !ready, signedIn: Boolean(userId) }}>
    {children}
    {error && <div role="alert" className="fixed inset-x-4 bottom-24 z-[70] mx-auto max-w-lg rounded-lg border border-red-200 bg-white p-4 text-sm text-red-700">{t(error)}
      <button className="ml-3 underline" disabled={loading || busy} onClick={() => setRetry(value => value + 1)}>{t('Retry')}</button>
      <button className="ml-3 underline" onClick={() => setError(null)}>{t('Dismiss')}</button>
    </div>}
  </Context.Provider>;
}
