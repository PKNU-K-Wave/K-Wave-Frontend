import { useUI } from "../utils/ui";
import { useEffect, useRef, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { fetchVideoPage, type ApiPage, type VideoFilters } from '../api/backend';
import { ContentCard } from '../components/ContentCard';
import { VideoFilterBar } from '../components/VideoFilterBar';
import { ContentSkeleton } from '../components/ContentSkeleton';
import { videos as demoVideos } from '../data/mockContent';
import type { Language, VideoContent, KWaveContent } from '../types/content';
import { useSessionState } from '../hooks/useSessionState';
import { readState, writeState } from '../utils/browserState';

const defaultFilters: VideoFilters = { type: '', genre: '', sort: 'voteCount', direction: 'desc' };

export function VideoPage({ language, onOpen, active = true }: { language: Language; onOpen: (item: KWaveContent) => void; active?: boolean }) {
  return <VideoCatalog key={language} language={language} onOpen={onOpen} active={active} />;
}

function VideoCatalog({ language, onOpen, active }: { language: Language; onOpen: (item: KWaveContent) => void; active: boolean }) {
  const t = useUI();
  const [filters, setFilters] = useSessionState('video-filters', defaultFilters);
  return <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-8 lg:px-8">
    <header className="mb-5 border-b border-ink/10 pb-5">
      <p className="text-xs font-black uppercase text-coral">{t("K-Video")}</p>
      <h1 className="mt-1 text-2xl font-black text-ink sm:text-3xl">{t("Movies and dramas")}</h1>
      <VideoFilterBar language={language} filters={filters} onChange={setFilters} onReset={() => setFilters(defaultFilters)} />
    </header>
    <VideoFeed key={JSON.stringify(filters)} filters={filters} language={language} onOpen={onOpen} active={active} />
  </main>;
}

function VideoFeed({ language, filters, onOpen, active }: { language: Language; filters: VideoFilters; onOpen: (item: KWaveContent) => void; active: boolean }) {
  const t = useUI();
  const cacheKey = `video-feed:${language}:${JSON.stringify(filters)}`;
  const [initial] = useState(() => readState<{ items: VideoContent[]; page: number; meta: ApiPage<VideoContent> | null; time: number } | null>(cacheKey, null));
  const valid = initial && Array.isArray(initial.items) && Number.isSafeInteger(initial.page) && initial.page >= 0 && initial.meta && Number.isFinite(initial.time) && initial.time <= Date.now() && Date.now() - initial.time < 15 * 60_000;
  const [items, setItems] = useState<VideoContent[]>(valid ? initial.items : []);
  const [page, setPage] = useState(valid ? initial.page : 0);
  const [meta, setMeta] = useState<ApiPage<VideoContent> | null>(valid ? initial.meta : null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const sentinel = useRef<HTMLDivElement>(null);
  const pending = useRef(true);
  useEffect(() => { if (meta && items.length <= 240) writeState(cacheKey, { items, page: meta.number, meta, time: Date.now() }); }, [items, meta, cacheKey]);
  useEffect(() => {
    const controller = new AbortController();
    pending.current = true; setLoading(true); setError(false);
    fetchVideoPage(language, filters, page, controller.signal).then(result => {
      if (controller.signal.aborted) return;
      setItems(current => [...new Map([...current, ...result.content].map(item => [item.id, item])).values()]);
      setMeta(result);
    }).catch(() => { if (!controller.signal.aborted) setError(true); }).finally(() => {
      if (!controller.signal.aborted) { setLoading(false); pending.current = false; }
    });
    return () => controller.abort();
  }, [language, filters, page, retry]);
  const more = meta !== null && meta.number + 1 < meta.totalPages && (page + 1) * 12 <= 10_000;
  useEffect(() => {
    if (!active || loading || error || !more || !sentinel.current) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting) && !pending.current) {
        pending.current = true; setPage(current => current + 1);
      }
    }, { rootMargin: '250px' });
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [loading, error, more, active]);
  const showDemo = error && page === 0 && items.length === 0 && JSON.stringify(filters) === JSON.stringify(defaultFilters);
  const visibleItems = showDemo ? demoVideos : items;
  const copy = {
    en: { demo: 'Sample content', offline: 'Live titles are unavailable right now.', retry: 'Try again' },
    zh: { demo: '\u793a\u4f8b\u5185\u5bb9', offline: '\u6682\u65f6\u65e0\u6cd5\u52a0\u8f7d\u6700\u65b0\u5f71\u7247\u3002', retry: '\u91cd\u8bd5' },
    ja: { demo: '\u30b5\u30f3\u30d7\u30eb', offline: '\u73fe\u5728\u3001\u4f5c\u54c1\u3092\u53d6\u5f97\u3067\u304d\u307e\u305b\u3093\u3002', retry: '\u518d\u8a66\u884c' },
  }[language];
  return <>
    {showDemo && <div className="mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-ink/10 pb-3" role="status">
      <div className="min-w-0"><p className="text-sm font-bold text-ink/75">{copy.demo}</p><p className="text-sm text-ink/60">{copy.offline}</p></div>
      <button onClick={() => setRetry(current => current + 1)} className="inline-flex min-h-11 shrink-0 items-center gap-2 text-sm font-bold text-sea"><RefreshCw className="h-4 w-4" aria-hidden="true" />{copy.retry}</button>
    </div>}
    {meta && <p className="mb-4 text-sm text-ink/60">{meta.totalElements} {t("titles")}</p>}
    {loading && !visibleItems.length ? <ContentSkeleton /> : <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">{visibleItems.map(item => <ContentCard key={item.id} item={item} language={language} onOpen={onOpen} />)}</div>}
    <div ref={sentinel} className="flex min-h-24 flex-wrap items-center justify-center gap-3" role="status">
      {!showDemo && <>
      {loading ? <><Loader2 className="h-5 w-5 animate-spin" />{t("Loading videos...")}</> : error ? <><span>{t("Could not load videos.")}</span><button onClick={() => setRetry(retry + 1)} className="min-h-11 rounded-lg bg-white px-4 font-bold">{t("Try again")}</button></> : !items.length ? t("No matching videos.") : more ? <button className="min-h-11 rounded-lg bg-white px-4" onClick={() => { if (!pending.current) { pending.current = true; setPage(page + 1); } }}>{t("Load more")}</button> : t("You have reached the end.")}
      </>}
    </div>
  </>;
}
