import { useUI } from "../utils/ui";
import { useEffect, useRef, useState, type SetStateAction } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { fetchVideoPage, type ApiPage, type VideoFilters } from '../api/backend';
import { ContentCard } from '../components/ContentCard';
import { VideoFilterBar } from '../components/VideoFilterBar';
import { ContentSkeleton } from '../components/ContentSkeleton';
import { videos as demoVideos } from '../data/mockContent';
import type { Language, VideoContent, KWaveContent } from '../types/content';
import { useSessionState } from '../hooks/useSessionState';
import { Pagination } from '../components/Pagination';

const defaultFilters: VideoFilters = { type: '', genre: '', sort: 'voteCount', direction: 'desc' };

export function VideoPage({ language, onOpen, active = true }: { language: Language; onOpen: (item: KWaveContent) => void; active?: boolean }) {
  return <VideoCatalog key={language} language={language} onOpen={onOpen} active={active} />;
}

function VideoCatalog({ language, onOpen, active }: { language: Language; onOpen: (item: KWaveContent) => void; active: boolean }) {
  const t = useUI();
  const [filters, setFilters] = useSessionState('video-filters', defaultFilters);
  const [page, setPage] = useSessionState('video-page', 0);
  const changeFilters = (next: SetStateAction<VideoFilters>) => { setPage(0); setFilters(next); };
  return <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-8 lg:px-8">
    <header className="mb-5 border-b border-ink/10 pb-5">
      <p className="text-xs font-black uppercase text-coral">{t("K-Video")}</p>
      <h1 className="mt-1 text-2xl font-black text-ink sm:text-3xl">{t("Movies and dramas")}</h1>
      <VideoFilterBar language={language} filters={filters} onChange={changeFilters} onReset={() => changeFilters(defaultFilters)} />
    </header>
    <VideoFeed key={JSON.stringify(filters)} filters={filters} language={language} onOpen={onOpen} active={active} page={page} onPageChange={setPage} />
  </main>;
}

function VideoFeed({ language, filters, onOpen, active, page, onPageChange }: { language: Language; filters: VideoFilters; onOpen: (item: KWaveContent) => void; active: boolean; page: number; onPageChange: (page: number) => void }) {
  const t = useUI();
  const [meta, setMeta] = useState<ApiPage<VideoContent> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const start = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    setLoading(true); setError(false);
    fetchVideoPage(language, filters, page, controller.signal).then(result => {
      if (controller.signal.aborted) return;
      const last = Math.max(0, Math.min(result.totalPages, Math.floor(10_000 / 12) + 1) - 1);
      if (page > last) { onPageChange(last); return; }
      setMeta(result);
    }).catch(() => { if (!controller.signal.aborted) setError(true); }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [language, filters, page, retry, active, onPageChange]);
  const items = !error && meta?.number === page ? meta.content : [];
  const showDemo = error && page === 0 && !meta && JSON.stringify(filters) === JSON.stringify(defaultFilters);
  const visibleItems = showDemo ? demoVideos : items;
  const copy = {
    en: { demo: 'Sample content', offline: 'Live titles are unavailable right now.', retry: 'Try again' },
    zh: { demo: '\u793a\u4f8b\u5185\u5bb9', offline: '\u6682\u65f6\u65e0\u6cd5\u52a0\u8f7d\u6700\u65b0\u5f71\u7247\u3002', retry: '\u91cd\u8bd5' },
    ja: { demo: '\u30b5\u30f3\u30d7\u30eb', offline: '\u73fe\u5728\u3001\u4f5c\u54c1\u3092\u53d6\u5f97\u3067\u304d\u307e\u305b\u3093\u3002', retry: '\u518d\u8a66\u884c' },
  }[language];
  return <>
    <div ref={start} className="scroll-mt-44" />
    {showDemo && <div className="mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-ink/10 pb-3" role="status">
      <div className="min-w-0"><p className="text-sm font-bold text-ink/75">{copy.demo}</p><p className="text-sm text-ink/60">{copy.offline}</p></div>
      <button onClick={() => setRetry(current => current + 1)} className="inline-flex min-h-11 shrink-0 items-center gap-2 text-sm font-bold text-sea"><RefreshCw className="h-4 w-4" aria-hidden="true" />{copy.retry}</button>
    </div>}
    {meta && <p className="mb-4 text-sm text-ink/60">{meta.totalElements} {t("titles")}</p>}
    {loading ? <ContentSkeleton /> : <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">{visibleItems.map(item => <ContentCard key={item.id} item={item} language={language} onOpen={onOpen} />)}</div>}
    <div className="flex min-h-16 flex-wrap items-center justify-center gap-3" role="status">
      {!showDemo && <>
      {loading ? <><Loader2 className="h-5 w-5 animate-spin" />{t("Loading videos...")}</> : error ? <><span>{t("Could not load videos.")}</span><button onClick={() => setRetry(retry + 1)} className="min-h-11 rounded-lg bg-white px-4 font-bold">{t("Try again")}</button></> : !items.length ? t("No matching videos.") : null}
      </>}
    </div>
    {meta && !showDemo && <Pagination page={page} totalPages={Math.min(meta.totalPages, Math.floor(10_000 / 12) + 1)} disabled={loading} onChange={next => { onPageChange(next); start.current?.scrollIntoView({ block: 'start' }); }} />}
  </>;
}
