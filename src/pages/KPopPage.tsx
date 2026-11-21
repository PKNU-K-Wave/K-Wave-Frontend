import { useUI } from "../utils/ui";
import { Music2, RefreshCw, Users } from 'lucide-react';
import { Pagination } from '../components/Pagination';
import { CatalogFilters, FilterChoices } from '../components/CatalogFilters';
import { useContext, useEffect, useRef, useState } from 'react';
import { UIContext } from '../utils/ui';
import { fetchKPopPage, fetchKPopFilters, musicDiscoveryAvailable, MUSIC_GENRES, MUSIC_MOODS, KPOP_PAGE_SIZE, type ApiPage, type KPopCollection, type KPopFilters, type MusicCatalogOptions } from '../api/backend';
import { ContentCard } from '../components/ContentCard';
import { ContentSkeleton } from '../components/ContentSkeleton';
import type { IdolContent, KWaveContent, SongContent } from '../types/content';
import { useSessionState } from '../hooks/useSessionState';

export function KPopPage({ onOpen }: { onOpen: (item: KWaveContent) => void }) {
  const t = useUI();
  const [tab, setTab] = useSessionState<KPopCollection>('kpop-tab', 'songs');
  const language = useContext(UIContext);
  return <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-8 lg:px-8">
    <header>
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
  const [mood, setMood] = useSessionState('music-mood', '');
  const [generation, setGeneration] = useSessionState('artist-generation', '');
  const [ostOnly, setOstOnly] = useSessionState('music-ost-only', false);
  const [filters, setFilters] = useState<KPopFilters>({ generation: false, generations: [], ostOnly: false });
  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    fetchKPopFilters(collection, controller.signal).then(result => { if (!controller.signal.aborted) setFilters(result); }).catch(() => {});
    return () => controller.abort();
  }, [active, collection]);
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
  const selectedGeneration = filters.generation ? generation : '';
  const selectedOst = filters.ostOnly && ostOnly;
  const selectedMood = collection === 'songs' && available ? mood : '';
  const queryKey = `${page}:${sort}:${genre}:${available}:${selectedGeneration}:${selectedOst}:${selectedMood}`;
  const [loadedKey, setLoadedKey] = useState('');
  const start = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (!active || available === null) return;
    if (loadedPage.current === queryKey) { setLoading(false); setFailed(false); return; }
    const controller = new AbortController();
    setLoading(true); setFailed(false);
    fetchKPopPage(collection, page, controller.signal, available || filters.generation || filters.ostOnly ? { sort: available ? sort : 'recent', genre: available && collection === 'songs' ? genre : undefined, mood: selectedMood, language, generation: collection === 'artists' ? selectedGeneration : undefined, ostOnly: collection === 'songs' ? selectedOst : undefined } : undefined).then(result => {
      if (!controller.signal.aborted) {
        const last = Math.max(0, Math.min(result.totalPages, Math.floor(10_000 / KPOP_PAGE_SIZE) + 1) - 1);
        if (page > last) { setPage(last); return; }
        setData(result); loadedPage.current = queryKey; setLoadedKey(queryKey);
      }
    }).catch(() => { if (!controller.signal.aborted) setFailed(true); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [active, collection, page, retry, queryKey, sort, genre, language, setPage, available, selectedGeneration, selectedOst, selectedMood, filters.generation, filters.ostOnly]);
  const current = data?.number === page && loadedKey === queryKey ? data : null;
  const more = current && page + 1 < current.totalPages;
  const withinRange = (page + 1) * KPOP_PAGE_SIZE <= 10_000;
  const go = (next: number) => { if (loading) return; setPage(next); start.current?.scrollIntoView({ block: 'start' }); };
  return <section aria-busy={loading} className="pb-5">
    {available === false && <div role="status" className="mb-4 flex flex-wrap items-center gap-3 text-sm text-ink/60"><span>{t('Popularity is unavailable. Showing newest first.')}</span><button className="min-h-11 font-bold text-sea" onClick={() => setCapabilityRetry(value => value + 1)}>{t('Try again')}</button></div>}
    {(available || filters.generation || filters.ostOnly) && <CatalogFilters count={Number(sort !== 'popularity') + (collection === 'songs' ? Number(Boolean(genre)) + Number(Boolean(selectedMood)) + Number(selectedOst) : Number(Boolean(selectedGeneration)))} onReset={() => {setPage(0);setSort('popularity');if(collection === 'songs'){setGenre('');setMood('');setOstOnly(false);}else setGeneration('');}}>
      {available && <FilterChoices label={t('Sort')} value={sort} options={[{value:'popularity',label:t('Most listened')},{value:'recent',label:t('Newest')}]} onChange={value => {setPage(0);setSort(value as MusicCatalogOptions['sort']);}} />}
      {available && collection === 'songs' && <>
        <FilterChoices label={t('Genre')} value={genre} options={[{value:'',label:t('All genres')},...MUSIC_GENRES.map(value => ({value,label:t(value)}))]} onChange={value => {setPage(0);setGenre(value);}} />
        <FilterChoices label={t('Mood')} value={mood} options={[{value:'',label:t('All moods')},...MUSIC_MOODS.map(value => ({value,label:t(value)}))]} onChange={value => {setPage(0);setMood(value);}} />
      </>}
      {collection === 'artists' && filters.generation && <FilterChoices label={t('Generation')} value={generation} options={[{value:'',label:t('All generations')},...filters.generations.map(value => ({value,label:t(`Gen ${value.replace('세대','')}`)}))]} onChange={value => {setPage(0);setGeneration(value);}} />}
      {collection === 'songs' && filters.ostOnly && <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={ostOnly} onChange={event => {setPage(0);setOstOnly(event.target.checked);}} className="h-4 w-4 accent-sea" />{t('OST only')}</label>}
    </CatalogFilters>}
    <p ref={start} className="mb-4 scroll-mt-44 text-sm text-ink/60">{current ? `${current.totalElements.toLocaleString()} ${t(collection === 'songs' ? 'tracks' : 'artists')}` : collection === 'songs' ? t("Tracks") : t("Artists")}</p>
    {failed ? <div role="alert" className="flex flex-wrap items-center gap-3 py-8"><span>{t(collection === 'songs' ? 'Could not load songs.' : 'Could not load artists.')}</span><button className="inline-flex min-h-11 items-center gap-2 font-bold text-sea" onClick={() => setRetry(value => value + 1)}><RefreshCw className="h-4 w-4" />{t("Try again")}</button></div>
      : loading || !current ? <ContentSkeleton />
      : !current.content.length ? <p role="status" className="py-10 text-ink/60">{t(collection === 'songs' ? 'No matching songs.' : 'No matching artists.')}</p>
      : <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">{current.content.map(item => <ContentCard key={item.id} item={item} onOpen={onOpen} />)}</div>}
    {data && <Pagination page={page} totalPages={Math.min(data.totalPages, Math.floor(10_000 / KPOP_PAGE_SIZE) + 1)} disabled={loading} onChange={go} />}
    {more && !withinRange && <p role="status" className="mt-4 text-center text-sm text-ink/60">{t("Use search to find more titles.")}</p>}
  </section>;
}
