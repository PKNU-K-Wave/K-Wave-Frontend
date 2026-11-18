import { useUI } from "../utils/ui";
import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { CatalogFilters, FilterChoices } from './CatalogFilters';
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
  const count = Number(Boolean(filters.type)) + Number(Boolean(filters.genre)) + Number(Boolean(era)) + Number(filters.hasOst === true) + Number(filters.sort !== 'voteCount' || filters.direction === 'asc');
  return <CatalogFilters count={count} onReset={onReset}>
    <FilterChoices label={t('Video type')} value={filters.type} options={[[ '', c.all ], ['MOVIE', c.movie], ['DRAMA', c.drama]].map(([value, label]) => ({value, label}))} onChange={value => onChange(current => ({ ...current, type: value, genre: '' }))} />
    <FilterChoices label={t('Sort')} value={`${filters.sort}:${filters.direction ?? 'desc'}`} options={[{value:'voteCount:desc',label:c.votes},{value:'voteAverage:desc',label:c.rating},{value:'releaseDate:desc',label:c.newest},{value:'releaseDate:asc',label:c.oldest,disabled:!capabilities.direction}]} onChange={value => { const [sort, direction] = value.split(':'); onChange(current => ({...current, sort, direction: direction as 'asc' | 'desc'})); }} />
    <FilterChoices label={c.genre} value={filters.genre} disabled={loading || error} options={[{value:'',label:c.allGenres},...genres.map(genre => ({value:genre.code,label:`${genre.name} (${genre.count.toLocaleString()})`}))]} onChange={value => onChange(current => ({...current,genre:value}))} />
    <FilterChoices label={c.era} value={era} disabled={!capabilities.years} options={[{value:'',label:c.anyEra},...[2020,2010,2000].map(year => ({value:String(year),label:`${year}${t('s')}`})),{value:'before2000',label:c.before}]} onChange={value => onChange(current => ({...current,yearFrom:value && value !== 'before2000' ? Number(value) : undefined,yearTo:value === 'before2000' ? 1999 : value ? Number(value)+9 : undefined}))} />
    <label className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold"><input type="checkbox" disabled={!capabilities.ost} checked={filters.hasOst === true} onChange={event => onChange(current => ({...current,hasOst:event.target.checked ? true : undefined}))} className="h-4 w-4 accent-sea" />{c.ost}</label>
    {(error || capabilityError) && <div role="status" className="flex flex-wrap items-center gap-3 text-sm text-ink/60"><span>{c.unavailable}</span><button className="min-h-11 font-bold text-sea" onClick={() => setRetry(value => value+1)}>{c.retry}</button></div>}
  </CatalogFilters>;
}
