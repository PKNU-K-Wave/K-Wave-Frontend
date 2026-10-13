import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Image, Loader2 } from 'lucide-react';
import { fetchSearchDetail, searchContent, type ApiPage, type SearchResult, type SearchType } from '../api/backend';
import type { KWaveContent, Language } from '../types/content';

const copy = {
  en: { title: 'Search results', all: 'All', video: 'Videos', song: 'Songs', artist: 'Artists', empty: 'No results found.', prompt: 'Search for a title or artist.', error: 'Search is unavailable. Please try again.', detailError: 'Could not open this content. Please try again.', retry: 'Try again', loading: 'Loading', results: 'results', back: 'Back to search' },
  zh: { title: '搜索结果', all: '全部', video: '影视', song: '歌曲', artist: '艺人', empty: '没有找到结果。', prompt: '搜索作品或艺人。', error: '搜索暂不可用，请重试。', detailError: '无法打开此内容，请重试。', retry: '重试', loading: '加载中', results: '条结果', back: '返回搜索' },
  ja: { title: '検索結果', all: 'すべて', video: '映像', song: '楽曲', artist: 'アーティスト', empty: '結果が見つかりません。', prompt: '作品名やアーティスト名で検索。', error: '検索できませんでした。もう一度お試しください。', detailError: 'コンテンツを開けませんでした。', retry: '再試行', loading: '読み込み中', results: '件', back: '検索に戻る' },
};

export function SearchPage({ query, language, active, fallbackContent, onOpen }: { query: string; language: Language; active: boolean; fallbackContent: KWaveContent[]; onOpen: (item: KWaveContent) => void }) {
  const c = copy[language];
  const [type, setType] = useState<SearchType | ''>('');
  const [page, setPage] = useState(0);
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
          return matchesType && `${item.title} ${item.subtitle} ${item.tags.join(' ')} ${item.description}`.toLocaleLowerCase().includes(normalized);
        });
        const pageItems = matches.slice(page * 12, page * 12 + 12).map(toFallbackSearchResult);
        setData({ content: pageItems, number: page, totalPages: Math.ceil(matches.length / 12), totalElements: matches.length });
        setUsingFallback(true);
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
    <div role="group" aria-label={c.title} className="my-5 flex flex-wrap gap-2">{filters.map(([value, label]) => <button key={value} aria-pressed={type === value} onClick={() => { setType(value); setPage(0); }} className={`min-h-11 rounded-lg px-4 text-sm font-bold ${type === value ? 'bg-ink text-white' : 'bg-white text-ink'}`}>{label}</button>)}</div>
    <div role="status" className="mb-4 text-sm text-ink/65">{!query ? c.prompt : error ? c.error : !data ? c.loading : `${data.totalElements} ${c.results}${usingFallback ? ' · Demo catalog' : ''}`}</div>
    {error && <button className="min-h-11 rounded-lg bg-ink px-4 text-white" onClick={() => setRetry(retry + 1)}>{c.retry}</button>}
    {detailError && <p role="alert" className="mb-4 text-red-700">{c.detailError}</p>}
    {data?.content.length === 0 && <p className="py-12 text-ink/60">{c.empty}</p>}
    <div aria-busy={Boolean(query && !data && !error)} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{data?.content.map((item) => <button key={`${item.resultType}-${item.domainId}`} disabled={!!opening} onClick={() => setOpening(item)} className="overflow-hidden rounded-lg bg-white text-left shadow-soft disabled:opacity-60">
      <div className="aspect-[4/3] bg-ink/5">{item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-cover" /> : <Image aria-hidden="true" className="h-full w-full p-12 text-ink/20" />}</div>
      <div className="p-4"><p className="text-xs font-bold text-sea">{item.resultType === 'VIDEO' ? c.video : item.resultType === 'SONG' ? c.song : c.artist}</p><h2 className="mt-1 break-words text-lg font-black">{item.title}</h2><p className="mt-2 break-words text-sm text-ink/60">{item.subtitle}</p>{opening === item && <Loader2 aria-label={c.loading} className="mt-2 h-5 w-5 animate-spin" />}</div>
    </button>)}</div>
    {data && data.totalPages > 1 && <nav aria-label="Pagination" className="mt-6 flex items-center justify-center gap-4"><button title="Previous page" aria-label="Previous page" disabled={page === 0} onClick={() => setPage(page - 1)} className="grid h-11 w-11 place-items-center rounded-lg bg-white disabled:opacity-30"><ArrowLeft /></button><span>{page + 1} / {data.totalPages}</span><button title="Next page" aria-label="Next page" disabled={page + 1 >= data.totalPages} onClick={() => setPage(page + 1)} className="grid h-11 w-11 place-items-center rounded-lg bg-white disabled:opacity-30"><ArrowRight /></button></nav>}
  </main>;
}

function toFallbackSearchResult(item: KWaveContent): SearchResult {
  const domainId = Number(item.id.split('-').pop()) || 0;
  return { resultType: item.kind === 'idol' ? 'ARTIST' : item.kind === 'song' ? 'SONG' : 'VIDEO', subtype: item.kind === 'movie' || item.kind === 'drama' ? item.kind.toUpperCase() : null, domainId, contentId: item.contentId ?? domainId, title: item.title, subtitle: item.subtitle, imageUrl: item.imageUrl };
}
