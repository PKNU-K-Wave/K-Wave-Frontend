import { useUI } from "../utils/ui";
import { Music2, RefreshCw, Users } from 'lucide-react';
import { Pagination } from '../components/Pagination';
import { useContext, useEffect, useRef, useState } from 'react';
import { UIContext } from '../utils/ui';
import { fetchKPopPage, musicDiscoveryAvailable, MUSIC_GENRES, KPOP_PAGE_SIZE, type ApiPage, type KPopCollection, type MusicCatalogOptions } from '../api/backend';
import { ContentCard } from '../components/ContentCard';
import { ContentSkeleton } from '../components/ContentSkeleton';
import type { IdolContent, KWaveContent, SongContent } from '../types/content';
import { useSessionState } from '../hooks/useSessionState';

export function KPopPage({ onOpen }: { onOpen: (item: KWaveContent) => void }) {
  const t = useUI();
  const [tab, setTab] = useSessionState<KPopCollection>('kpop-tab', 'songs');
  const language = useContext(UIContext);
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
      <KPopFeed key={`${collection}:${language}`} collection={collection} active={tab === collection} onOpen={onOpen} />
    </div>)}
  </main>;
}

function KPopFeed({ collection, active, onOpen }: { collection: KPopCollection; active: boolean; onOpen: (item: KWaveContent) => void }) {
  const t = useUI();
  const language = useContext(UIContext);
  const [sort, setSort] = useSessionState<MusicCatalogOptions['sort']>(`music-sort:${collection}`, 'popularity');
  const [genre, setGenre] = useSessionState('music-genre', '');
  const [available, setAvailable] = useState<boolean | null>(null);
  const [capabilityRetry, setCapabilityRetry] = useState(0);
  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    musicDiscoveryAvailable(collection, controller.signal).then(value => { if (!controller.signal.aborted) setAvailable(value); }).catch(() => {});
    return () => controller.abort();
  }, [active, collection, capabilityRetry]);
  const [page, setPage] = useSessionState(`kpop-page:${collection}`, 0);
  const [data, setData] = useState<ApiPage<SongContent | IdolContent> | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const loadedPage = useRef<string | null>(null);
  const queryKey = `${page}:${sort}:${genre}:${available}`;
  const [loadedKey, setLoadedKey] = useState('');
  const start = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (!active || available === null) return;
    if (loadedPage.current === queryKey) { setLoading(false); setFailed(false); return; }
    const controller = new AbortController();
    setLoading(true); setFailed(false);
    fetchKPopPage(collection, page, controller.signal, available ? { sort, genre: collection === 'songs' ? genre : undefined, language } : undefined).then(result => {
      if (!controller.signal.aborted) {
        const last = Math.max(0, Math.min(result.totalPages, Math.floor(10_000 / KPOP_PAGE_SIZE) + 1) - 1);
        if (page > last) { setPage(last); return; }
        setData(result); loadedPage.current = queryKey; setLoadedKey(queryKey);
      }
    }).catch(() => { if (!controller.signal.aborted) setFailed(true); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [active, collection, page, retry, queryKey, sort, genre, language, setPage, available]);
  const current = data?.number === page && loadedKey === queryKey ? data : null;
  const more = current && page + 1 < current.totalPages;
  const withinRange = (page + 1) * KPOP_PAGE_SIZE <= 10_000;
  const go = (next: number) => { if (loading) return; setPage(next); start.current?.scrollIntoView({ block: 'start' }); };
  return <section aria-busy={loading} className="py-5">
    {available === false && <div role="status" className="mb-4 flex flex-wrap items-center gap-3 text-sm text-ink/60"><span>{t('Popularity is unavailable. Showing newest first.')}</span><button className="min-h-11 font-bold text-sea" onClick={() => setCapabilityRetry(value => value + 1)}>{t('Try again')}</button></div>}
    {available && <div className="mb-5 flex flex-wrap items-center gap-3 border-b border-ink/10 pb-4">
      <label className="flex items-center gap-2 text-sm">{t('Sort')}<select value={sort} onChange={event => { setPage(0); setSort(event.target.value as MusicCatalogOptions['sort']); }} className="min-h-11 rounded-lg border border-ink/10 bg-white px-3"><option value="popularity">{t('Most listened')}</option><option value="recent">{t('Newest')}</option></select></label>
      {collection === 'songs' && <label className="flex items-center gap-2 text-sm">{t('Genre')}<select value={genre} onChange={event => { setPage(0); setGenre(event.target.value); }} className="min-h-11 max-w-48 rounded-lg border border-ink/10 bg-white px-3"><option value="">{t('All genres')}</option>{MUSIC_GENRES.map(value => <option key={value} value={value}>{t(value)}</option>)}</select></label>}
    </div>}
    <p ref={start} className="mb-4 scroll-mt-44 text-sm text-ink/60">{current ? `${current.totalElements.toLocaleString()} ${t(collection === 'songs' ? 'tracks' : 'artists')}` : collection === 'songs' ? t("Tracks") : t("Artists")}</p>
    {failed ? <div role="alert" className="flex flex-wrap items-center gap-3 py-8"><span>{t(collection === 'songs' ? 'Could not load songs.' : 'Could not load artists.')}</span><button className="inline-flex min-h-11 items-center gap-2 font-bold text-sea" onClick={() => setRetry(value => value + 1)}><RefreshCw className="h-4 w-4" />{t("Try again")}</button></div>
      : loading || !current ? <ContentSkeleton />
      : !current.content.length ? <p role="status" className="py-10 text-ink/60">{t(collection === 'songs' ? 'No songs are available yet.' : 'No artists are available yet.')}</p>
      : <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">{current.content.map(item => <ContentCard key={item.id} item={item} onOpen={onOpen} />)}</div>}
    {data && <Pagination page={page} totalPages={Math.min(data.totalPages, Math.floor(10_000 / KPOP_PAGE_SIZE) + 1)} disabled={loading} onChange={go} />}
    {more && !withinRange && <p role="status" className="mt-4 text-center text-sm text-ink/60">{t("Use search to find more titles.")}</p>}
  </section>;
}
