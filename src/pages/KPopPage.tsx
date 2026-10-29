import { useUI } from "../utils/ui";
import { ChevronLeft, ChevronRight, Music2, RefreshCw, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { fetchKPopPage, KPOP_PAGE_SIZE, type ApiPage, type KPopCollection } from '../api/backend';
import { ContentCard } from '../components/ContentCard';
import { ContentSkeleton } from '../components/ContentSkeleton';
import type { IdolContent, KWaveContent, SongContent } from '../types/content';
import { useSessionState } from '../hooks/useSessionState';

export function KPopPage({ onOpen }: { onOpen: (item: KWaveContent) => void }) {
  const t = useUI();
  const [tab, setTab] = useSessionState<KPopCollection>('kpop-tab', 'songs');
  return <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-8 lg:px-8">
    <header className="border-b border-ink/10 pb-5">
      <p className="text-xs font-black uppercase text-coral">{t("K-POP")}</p>
      <h1 className="mt-1 text-2xl font-black sm:text-3xl">{t("Songs and artists")}</h1>
      <div className="mt-5 flex gap-1" role="tablist" aria-label={t("K-POP catalog")}>
        {(['songs', 'artists'] as const).map(value => {
          const Icon = value === 'songs' ? Music2 : Users;
          return <button key={value} id={`tab-${value}`} role="tab" tabIndex={tab === value ? 0 : -1} aria-selected={tab === value} aria-controls={`panel-${value}`} className={`inline-flex min-h-11 items-center gap-2 border-b-2 px-4 text-sm font-bold ${tab === value ? 'border-sea text-sea' : 'border-transparent text-ink/55'}`} onClick={() => setTab(value)} onKeyDown={event => {
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault();
            const next = event.key === 'Home' ? 'songs' : event.key === 'End' ? 'artists' : value === 'songs' ? 'artists' : 'songs';
            setTab(next); document.getElementById(`tab-${next}`)?.focus();
          }}><Icon className="h-4 w-4" />{value === 'songs' ? t("Tracks") : t("Artists")}</button>;
        })}
      </div>
    </header>
    {(['songs', 'artists'] as const).map(collection => <div key={collection} id={`panel-${collection}`} role="tabpanel" aria-labelledby={`tab-${collection}`} hidden={tab !== collection}>
      <KPopFeed collection={collection} active={tab === collection} onOpen={onOpen} />
    </div>)}
  </main>;
}

function KPopFeed({ collection, active, onOpen }: { collection: KPopCollection; active: boolean; onOpen: (item: KWaveContent) => void }) {
  const t = useUI();
  const [page, setPage] = useSessionState(`kpop-page:${collection}`, 0);
  const [data, setData] = useState<ApiPage<SongContent | IdolContent> | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const loadedPage = useRef<number | null>(null);
  const start = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (!active) return;
    if (loadedPage.current === page) { setLoading(false); setFailed(false); return; }
    const controller = new AbortController();
    setLoading(true); setFailed(false);
    fetchKPopPage(collection, page, controller.signal).then(result => {
      if (!controller.signal.aborted) { setData(result); loadedPage.current = page; }
    }).catch(() => { if (!controller.signal.aborted) setFailed(true); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [active, collection, page, retry]);
  const current = data?.number === page ? data : null;
  const more = current && page + 1 < current.totalPages;
  const withinRange = (page + 1) * KPOP_PAGE_SIZE <= 10_000;
  const go = (next: number) => { if (loading) return; setPage(next); start.current?.scrollIntoView({ block: 'start' }); };
  return <section aria-busy={loading} className="py-5">
    <p ref={start} className="mb-4 scroll-mt-44 text-sm text-ink/60">{current ? `${current.totalElements.toLocaleString()} ${t(collection === 'songs' ? 'tracks' : 'artists')}` : collection === 'songs' ? t("Tracks") : t("Artists")}</p>
    {failed ? <div role="alert" className="flex flex-wrap items-center gap-3 py-8"><span>{t(collection === 'songs' ? 'Could not load songs.' : 'Could not load artists.')}</span><button className="inline-flex min-h-11 items-center gap-2 font-bold text-sea" onClick={() => setRetry(value => value + 1)}><RefreshCw className="h-4 w-4" />{t("Try again")}</button></div>
      : loading || !current ? <ContentSkeleton />
      : !current.content.length ? <p role="status" className="py-10 text-ink/60">{t(collection === 'songs' ? 'No songs are available yet.' : 'No artists are available yet.')}</p>
      : <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">{current.content.map(item => <ContentCard key={item.id} item={item} onOpen={onOpen} />)}</div>}
    {(page > 0 || (current && current.totalPages > 1)) && <nav className="mt-6 flex items-center justify-center gap-5" aria-label={`${collection} pages`}>
      <button title={t("Previous page")} aria-label={`Previous ${collection} page`} className="grid h-11 w-11 place-items-center rounded-lg border border-ink/10 disabled:opacity-30" disabled={loading || page === 0} onClick={() => go(page - 1)}><ChevronLeft className="h-5 w-5" /></button>
      <span className="text-sm" aria-live="polite">{page + 1}{current ? ` / ${Math.min(current.totalPages, Math.floor(10_000 / KPOP_PAGE_SIZE) + 1)}` : ''}</span>
      <button title={t("Next page")} aria-label={`Next ${collection} page`} className="grid h-11 w-11 place-items-center rounded-lg border border-ink/10 disabled:opacity-30" disabled={loading || failed || !more || !withinRange} onClick={() => go(page + 1)}><ChevronRight className="h-5 w-5" /></button>
    </nav>}
    {more && !withinRange && <p role="status" className="mt-4 text-center text-sm text-ink/60">{t("Use search to find more titles.")}</p>}
  </section>;
}
