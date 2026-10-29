import { useUI } from "../utils/ui";
import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { RefreshCw, SlidersHorizontal } from 'lucide-react';
import { fetchVideoCapabilities, fetchVideoGenres, type VideoFilters, type VideoGenre } from '../api/backend';
import type { Language } from '../types/content';

const labels = {
  en: { all: 'All', movie: 'Movies', drama: 'Dramas', filters: 'Filters', genre: 'Genre', allGenres: 'All genres', era: 'Release period', anyEra: 'Any period', before: 'Before 2000', ost: 'With connected OST', rating: 'Top rated', votes: 'Most voted', newest: 'Newest', oldest: 'Oldest', reset: 'Reset', unavailable: 'Additional filters are unavailable on this server.', retry: 'Try again' },
  zh: { all: '全部', movie: '电影', drama: '电视剧', filters: '筛选', genre: '类型', allGenres: '所有类型', era: '上映年代', anyEra: '全部年代', before: '2000年以前', ost: '有原声带', rating: '评分最高', votes: '评价最多', newest: '最新', oldest: '最早', reset: '重置', unavailable: '此服务器暂不提供更多筛选条件。', retry: '重试' },
  ja: { all: 'すべて', movie: '映画', drama: 'ドラマ', filters: '絞り込み', genre: 'ジャンル', allGenres: '全ジャンル', era: '公開年代', anyEra: 'すべての年代', before: '2000年より前', ost: 'OSTのある作品', rating: '高評価順', votes: '評価件数順', newest: '新しい順', oldest: '古い順', reset: 'リセット', unavailable: 'このサーバーでは追加の絞り込みを利用できません。', retry: '再試行' },
};

export function VideoFilterBar({ language, filters, onChange, onReset }: { language: Language; filters: VideoFilters; onChange: Dispatch<SetStateAction<VideoFilters>>; onReset: () => void }) {
  const t = useUI();
  const c = labels[language];
  const [expanded, setExpanded] = useState(false);
  const [genres, setGenres] = useState<VideoGenre[]>([]);
  const [capabilities, setCapabilities] = useState({ years: false, direction: false, ost: false });
  const [capabilityError, setCapabilityError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setCapabilityError(false);
    fetchVideoCapabilities(controller.signal).then(values => {
      if (!controller.signal.aborted) { setCapabilities(values); setCapabilityError(!values.years || !values.direction || !values.ost); }
    }).catch(() => { if (!controller.signal.aborted) setCapabilityError(true); });
    return () => controller.abort();
  }, [retry]);
  useEffect(() => {
    const controller = new AbortController();
    setGenres([]); setLoading(true); setError(false);
    fetchVideoGenres(language, filters.type, controller.signal).then(values => {
      if (!controller.signal.aborted) setGenres(values);
    }).catch(() => { if (!controller.signal.aborted) setError(true); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [language, filters.type, retry]);
  const era = filters.yearFrom ? String(filters.yearFrom) : filters.yearTo === 1999 ? 'before2000' : '';
  return <>
    <div className="mt-5 flex flex-wrap items-center gap-3">
      <div className="flex min-h-11 w-full gap-1 sm:w-auto" role="group" aria-label={t("Video type")}>{[['', c.all], ['MOVIE', c.movie], ['DRAMA', c.drama]].map(([value, label]) => <button key={value} aria-pressed={filters.type === value} className={`min-h-11 rounded-lg px-3 text-sm font-bold ${filters.type === value ? 'bg-ink text-white' : 'text-ink/60 hover:bg-white'}`} onClick={() => onChange(current => ({ ...current, type: value, genre: '' }))}>{label}</button>)}</div>
      <select aria-label={t("Video sort")} className="h-11 min-w-[9rem] flex-1 rounded-lg border border-ink/10 bg-white px-3 text-sm sm:flex-none" value={`${filters.sort}:${filters.direction ?? 'desc'}`} onChange={event => { const [sort, direction] = event.target.value.split(':'); onChange(current => ({ ...current, sort, direction: direction as 'asc' | 'desc' })); }}>
        <option value="voteAverage:desc">{c.rating}</option><option value="voteCount:desc">{c.votes}</option><option value="releaseDate:desc">{c.newest}</option><option value="releaseDate:asc" disabled={!capabilities.direction}>{c.oldest}</option>
      </select>
      <button title={c.filters} aria-label={c.filters} aria-expanded={expanded} aria-controls="video-filters" onClick={() => setExpanded(value => !value)} className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-ink/10 bg-white"><SlidersHorizontal className="h-5 w-5" /></button>
    </div>
    {expanded && <div id="video-filters" className="mt-4 border-t border-ink/10 pt-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid min-w-0 gap-2 text-sm font-semibold">{c.era}<select aria-label={c.era} disabled={!capabilities.years} value={era} className="h-11 w-full rounded-lg border border-ink/10 bg-white px-3 disabled:opacity-50" onChange={event => {
          const value = event.target.value;
          onChange(current => ({ ...current, yearFrom: value && value !== 'before2000' ? Number(value) : undefined, yearTo: value === 'before2000' ? 1999 : value ? Number(value) + 9 : undefined }));
        }}><option value="">{c.anyEra}</option>{[2020, 2010, 2000].map(year => <option key={year} value={year}>{year}{t("s")}</option>)}<option value="before2000">{c.before}</option></select></label>
        <label className="grid min-w-0 gap-2 text-sm font-semibold">{c.genre}<select aria-label={c.genre} disabled={loading || error} value={filters.genre} className="h-11 w-full rounded-lg border border-ink/10 bg-white px-3 disabled:opacity-50" onChange={event => onChange(current => ({ ...current, genre: event.target.value }))}><option value="">{c.allGenres}</option>{genres.map(genre => <option key={genre.code} value={genre.code}>{genre.name} ({genre.count.toLocaleString()})</option>)}</select></label>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" disabled={!capabilities.ost} checked={filters.hasOst === true} onChange={event => onChange(current => ({ ...current, hasOst: event.target.checked ? true : undefined }))} className="h-4 w-4 accent-sea" />{c.ost}</label><button onClick={onReset} className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-sea"><RefreshCw className="h-4 w-4" />{c.reset}</button></div>
      {(error || capabilityError) && <div role="status" className="mt-2 flex flex-wrap items-center gap-3 text-sm text-ink/60"><span>{c.unavailable}</span><button className="min-h-11 font-bold text-sea" onClick={() => setRetry(value => value + 1)}>{c.retry}</button></div>}
    </div>}
  </>;
}
