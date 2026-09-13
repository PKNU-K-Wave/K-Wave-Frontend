import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { fetchVideoPage, type ApiPage, type VideoFilters } from '../api/backend';
import { ContentCard } from '../components/ContentCard';
import type { Language, VideoContent, KWaveContent } from '../types/content';

export function VideoPage({ language, onOpen }: { language: Language; onOpen: (item: KWaveContent) => void }) {
  const [filters, setFilters] = useState<VideoFilters>({ type: '', genre: '', sort: 'voteAverage' });
  return <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
    <h1 className="text-2xl font-black">Movies and dramas</h1>
    <div className="my-6 flex flex-wrap gap-3">
      <label className="text-sm font-bold">Type<select aria-label="Video type" value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })} className="ml-2 min-h-11 rounded-lg bg-white px-3"><option value="">All</option><option value="MOVIE">Movies</option><option value="DRAMA">Dramas</option></select></label>
      <form onSubmit={e => { e.preventDefault(); const data = new FormData(e.currentTarget); setFilters({ ...filters, genre: String(data.get('genre') || '').trim() }); }} className="flex items-center gap-2"><label className="text-sm font-bold">Genre<input name="genre" aria-label="Genre" placeholder="All genres" className="ml-2 h-11 w-36 rounded-lg bg-white px-3 font-normal" /></label><button className="min-h-11 rounded-lg bg-white px-3 text-sm font-bold">Apply</button></form>
      <label className="text-sm font-bold">Sort<select aria-label="Video sort" value={filters.sort} onChange={e => setFilters({ ...filters, sort: e.target.value })} className="ml-2 min-h-11 rounded-lg bg-white px-3"><option value="voteAverage">Top rated</option><option value="voteCount">Most voted</option><option value="releaseDate">Newest</option></select></label>
    </div>
    <VideoFeed key={JSON.stringify([language, filters])} language={language} filters={filters} onOpen={onOpen} />
  </main>;
}

function VideoFeed({ language, filters, onOpen }: { language: Language; filters: VideoFilters; onOpen: (item: KWaveContent) => void }) {
  const [items, setItems] = useState<VideoContent[]>([]);
  const [page, setPage] = useState(0);
  const [meta, setMeta] = useState<ApiPage<VideoContent> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const sentinel = useRef<HTMLDivElement>(null);
  const pending = useRef(true);
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
  const more = meta !== null && meta.number + 1 < meta.totalPages;
  useEffect(() => {
    if (loading || error || !more || !sentinel.current) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting) && !pending.current) {
        pending.current = true; setPage(current => current + 1);
      }
    }, { rootMargin: '250px' });
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [loading, error, more]);
  return <>
    {meta && <p className="mb-4 text-sm text-ink/60">{meta.totalElements} titles</p>}
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{items.map(item => <ContentCard key={item.id} item={item} onOpen={onOpen} />)}</div>
    <div ref={sentinel} className="flex min-h-24 items-center justify-center gap-3" role="status">
      {loading ? <><Loader2 className="h-5 w-5 animate-spin" />Loading videos...</> : error ? <><span>Could not load videos.</span><button onClick={() => setRetry(retry + 1)} className="min-h-11 rounded-lg bg-white px-4 font-bold">Try again</button></> : !items.length ? 'No matching videos.' : more ? <button className="min-h-11 rounded-lg bg-white px-4" onClick={() => { if (!pending.current) { pending.current = true; setPage(page + 1); } }}>Load more</button> : 'You have reached the end.'}
    </div>
  </>;
}
