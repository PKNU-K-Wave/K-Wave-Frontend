import { useUI } from "../utils/ui";
import { ContentImage } from "../components/ContentImage";
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Loader2, X } from 'lucide-react';
import { useSessionState } from '../hooks/useSessionState';
import { fetchSearchDetail, searchContent, type ApiPage, type SearchResult, type SearchType } from '../api/backend';
import type { KWaveContent, Language } from '../types/content';

const copy = {
  en: { title: 'Search results', all: 'All', video: 'Videos', song: 'Songs', artist: 'Artists', empty: 'No results found.', prompt: 'Search for a title or artist.', error: 'Search is unavailable. Please try again.', detailError: 'Could not open this content. Please try again.', retry: 'Try again', loading: 'Loading', results: 'results', back: 'Back to search' },
  zh: { title: '搜索结果', all: '全部', video: '影视', song: '歌曲', artist: '艺人', empty: '没有找到结果。', prompt: '搜索作品或艺人。', error: '搜索暂不可用，请重试。', detailError: '无法打开此内容，请重试。', retry: '重试', loading: '加载中', results: '条结果', back: '返回搜索' },
  ja: { title: '検索結果', all: 'すべて', video: '映像', song: '楽曲', artist: 'アーティスト', empty: '結果が見つかりません。', prompt: '作品名やアーティスト名で検索。', error: '検索できませんでした。もう一度お試しください。', detailError: 'コンテンツを開けませんでした。', retry: '再試行', loading: '読み込み中', results: '件', back: '検索に戻る' },
};

export function SearchPage({ query, language, active, fallbackContent, onOpen, onSearchQuery }: { query: string; language: Language; active: boolean; fallbackContent: KWaveContent[]; onOpen: (item: KWaveContent) => void; onSearchQuery: (query: string) => void }) {
  const t = useUI();
  const c = copy[language];
  const [type, setType] = useSessionState<SearchType | ''>(`search-type:${query}`, '');
  const [page, setPage] = useSessionState(`search-page:${query}`, 0);
  const [recent, setRecent] = useSessionState<string[]>('recent-searches', []);
  useEffect(() => { if (active && query.trim()) setRecent(current => [query.trim(), ...current.filter(value => value !== query.trim())].slice(0, 8)); }, [active, query, setRecent]);
  const [retry, setRetry] = useState(0);
  const [data, setData] = useState<ApiPage<SearchResult> | null>(null);
  const [error, setError] = useState(false);
  const [opening, setOpening] = useState<SearchResult | null>(null);
  const [detailError, setDetailError] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setData(null); setError(false); setOpening(null); setDetailError(false); setUsingFallback(false);
    if (query.trim()) searchContent(query, language, type, page, controller.signal)
      .then((result) => { if (!controller.signal.aborted) setData(result); })
      .catch(() => {
        if (controller.signal.aborted) return;
        const normalized = query.trim().toLocaleLowerCase();
        const matches = fallbackContent.filter(item => {
          const matchesType = !type || (type === 'VIDEO' && ['movie', 'drama'].includes(item.kind)) || (type === 'SONG' && item.kind === 'song') || (type === 'ARTIST' && item.kind === 'idol');
          return item.kind !== 'food' && matchesType && `${item.title} ${item.subtitle} ${item.tags.join(' ')} ${item.description}`.toLocaleLowerCase().includes(normalized);
        });
        const pageItems = matches.slice(page * 12, page * 12 + 12).map(toFallbackSearchResult);
        setData({ content: pageItems, number: page, totalPages: Math.ceil(matches.length / 12), totalElements: matches.length });
        setUsingFallback(true);
        setError(true);
      });
    return () => controller.abort();
  }, [query, language, type, page, retry, fallbackContent]);
  useEffect(() => {
    if (!active) { setOpening(null); return; }
    if (!opening) return;
    const controller = new AbortController();
    setDetailError(false);
    const localItem = fallbackContent.find(item => item.id === `${opening.resultType === 'ARTIST' ? 'artist' : opening.resultType === 'SONG' ? 'song' : 'video'}-${opening.domainId}`);
    (usingFallback && localItem ? Promise.resolve(localItem) : fetchSearchDetail(opening, language, controller.signal)).then((item) => {
      if (!controller.signal.aborted) { setOpening(null); onOpen(item); }
    }).catch(() => { if (!controller.signal.aborted) { setOpening(null); setDetailError(true); } });
    return () => controller.abort();
  }, [opening, language, active, onOpen, fallbackContent, usingFallback]);
  const filters: Array<[SearchType | '', string]> = [['', c.all], ['VIDEO', c.video], ['SONG', c.song], ['ARTIST', c.artist]];
  return <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
    <h1 className="break-words text-2xl font-black">{c.title}{query && `: ${query}`}</h1>
    {recent.length > 0 && <section aria-label={t('Recent searches')} className="mt-4 border-b border-ink/10 pb-4"><div className="flex items-center justify-between"><h2 className="text-sm font-bold text-ink/60">{t('Recent searches')}</h2><button className="min-h-11 text-xs text-ink/55" onClick={() => setRecent([])}>{t('Clear all')}</button></div><div className="flex flex-wrap gap-2">{recent.map(value => <span key={value} className="inline-flex max-w-full items-center rounded-lg border border-ink/10 bg-white"><button onClick={() => onSearchQuery(value)} className="min-h-11 max-w-48 truncate px-3 text-sm">{value}</button><button className="grid h-11 w-9 shrink-0 place-items-center" aria-label={`${t('Clear search')}: ${value}`} onClick={() => setRecent(current => current.filter(item => item !== value))}><X className="h-3.5 w-3.5" /></button></span>)}</div></section>}
    <div role="group" aria-label={c.title} className="my-5 flex flex-wrap gap-2">{filters.map(([value, label]) => <button key={value} aria-pressed={type === value} onClick={() => { setType(value); setPage(0); }} className={`min-h-11 rounded-lg px-4 text-sm font-bold ${type === value ? 'bg-ink text-white' : 'bg-white text-ink'}`}>{label}</button>)}</div>
    <div role="status" className="mb-4 text-sm text-ink/65">{!query ? c.prompt : error ? `${c.error} ${usingFallback ? t('Offline results from loaded content.') : ''}` : !data ? c.loading : `${data.totalElements} ${c.results}`}</div>
    {error && <button className="min-h-11 rounded-lg bg-ink px-4 text-white" onClick={() => setRetry(retry + 1)}>{c.retry}</button>}
    {detailError && <p role="alert" className="mb-4 text-red-700">{c.detailError}</p>}
    {!error && data?.content.length === 0 && <p className="py-12 text-ink/60">{c.empty}</p>}
    {query && !data && !error && <div className="grid gap-3 lg:grid-cols-2" aria-hidden="true">{[0,1,2,3].map(i => <div key={i} className="flex h-28 items-center gap-3 rounded-lg border border-ink/5 bg-white p-3 motion-safe:animate-pulse"><div className="h-24 w-16 bg-ink/10" /><div className="h-4 w-1/2 bg-ink/5" /></div>)}</div>}
    <div aria-busy={Boolean(query && !data && !error)} className="grid gap-3 lg:grid-cols-2">{data?.content.map((item) => <button key={`${item.resultType}-${item.domainId}`} disabled={!!opening} onClick={() => setOpening(item)} className="flex min-w-0 items-center gap-3 overflow-hidden rounded-lg border border-ink/10 bg-white p-3 text-left disabled:opacity-60">
      <ContentImage src={item.thumbnailUrl || item.imageUrl} className="h-24 w-16 shrink-0 rounded bg-ink/5 object-contain" />
      <div className="min-w-0 flex-1"><p className="text-xs font-bold text-sea">{item.resultType === 'VIDEO' ? c.video : item.resultType === 'SONG' ? c.song : c.artist}</p><h2 className="mt-1 line-clamp-2 break-words text-base font-black">{item.title}</h2><p className="mt-2 line-clamp-2 break-words text-sm text-ink/60">{item.subtitle}</p>{opening === item && <Loader2 aria-label={c.loading} className="mt-2 h-5 w-5 animate-spin" />}</div>
    </button>)}</div>
    {data && data.totalPages > 1 && <nav aria-label={t("Pagination")} className="mt-6 flex items-center justify-center gap-4"><button title={t("Previous page")} aria-label={t("Previous page")} disabled={page === 0} onClick={() => setPage(page - 1)} className="grid h-11 w-11 place-items-center rounded-lg bg-white disabled:opacity-30"><ArrowLeft /></button><span>{page + 1} / {data.totalPages}</span><button title={t("Next page")} aria-label={t("Next page")} disabled={page + 1 >= data.totalPages} onClick={() => setPage(page + 1)} className="grid h-11 w-11 place-items-center rounded-lg bg-white disabled:opacity-30"><ArrowRight /></button></nav>}
  </main>;
}

function toFallbackSearchResult(item: KWaveContent): SearchResult {
  const domainId = Number(item.id.split('-').pop()) || 0;
  return { resultType: item.kind === 'idol' ? 'ARTIST' : item.kind === 'song' ? 'SONG' : 'VIDEO', subtype: item.kind === 'movie' || item.kind === 'drama' ? item.kind.toUpperCase() : null, domainId, contentId: item.contentId ?? domainId, title: item.title, subtitle: item.subtitle, imageUrl: item.imageUrl };
}
