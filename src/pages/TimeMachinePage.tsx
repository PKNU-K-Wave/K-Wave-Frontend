import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, Clapperboard, History, Music2, RefreshCw, Users } from 'lucide-react';
import { fetchTimelineYear, fetchTimelineYears, type TimelineContent, type TimelineYear } from '../api/backend';
import { TimelineYearPicker } from '../components/TimelineYearPicker';
import { ContentCard } from '../components/ContentCard';
import { ContentSkeleton } from '../components/ContentSkeleton';
import { useUI } from '../utils/ui';
import { readState, writeState } from '../utils/browserState';
import type { KWaveContent, Language } from '../types/content';

export function TimeMachinePage({ language, year, active, onYearChange, onHome, onOpen }: { language: Language; year?: number; active: boolean; onYearChange: (year: number) => void; onHome: () => void; onOpen: (item: KWaveContent) => void }) {
  const t = useUI();
  const stored = readState('timeline-year-v2', 2019);
  const selected = year ?? (Number.isInteger(stored) && stored >= 1900 && stored <= 2100 ? stored : 2019);
  const [years, setYears] = useState<TimelineYear[]>([]);
  const [yearsError, setYearsError] = useState(false);
  const [data, setData] = useState<TimelineContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const cache = useRef(new Map<string, TimelineContent>());
  const cacheKey = `${selected}:${language}`;
  useEffect(() => {if (active && year === undefined) onYearChange(selected);}, [active, year, selected, onYearChange]);
  useEffect(() => { writeState('timeline-year-v2', selected); }, [selected]);
  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    setYearsError(false);
    fetchTimelineYears(controller.signal).then(value => {if (!controller.signal.aborted) setYears(value);}).catch(() => {if (!controller.signal.aborted) setYearsError(true);});
    return () => controller.abort();
  }, [active, retry]);
  useEffect(() => {
    if (!active) return;
    const cached = cache.current.get(cacheKey);
    if (cached) {setData(cached);setLoading(false);setFailed(false);return;}
    const controller = new AbortController();
    setLoading(true); setFailed(false); setData(null);
    fetchTimelineYear(selected, language, controller.signal).then(value => {if (!controller.signal.aborted) {if(cache.current.size >= 8) cache.current.clear();cache.current.set(cacheKey,value);setData(value);}}).catch(() => {if (!controller.signal.aborted) setFailed(true);}).finally(() => {if (!controller.signal.aborted) setLoading(false);});
    return () => controller.abort();
  }, [active, selected, language, retry, cacheKey]);
  const choose = (value: number) => {if (value !== selected) onYearChange(value);};
  const current = data?.year === selected ? data : null;
  return <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
    <button onClick={onHome} className="mb-5 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-sea"><ArrowLeft className="h-4 w-4" />{t('Home')}</button>
    <header className="timeline-intro border-b border-ink/10 pb-6 sm:pb-8">
      <p className="flex items-center gap-2 text-xs font-black uppercase text-sea"><History className="h-4 w-4" />{t('K-Wave Time Machine')}</p>
      <h1 className="mt-3 text-2xl font-black sm:text-3xl">{t('Which year are you curious about?')}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-ink/60">{t('Travel through Korean culture, one year at a time. Find movies, dramas and songs released that year, plus artists who made their debut.')}</p>
    </header>
    <section aria-label={t('Choose a year')} className="border-b border-ink/10 py-6">
      <TimelineYearPicker value={selected} years={years.map(row=>row.year)} onChange={choose} />
      {yearsError && <button onClick={() => setRetry(value=>value+1)} className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-sea"><RefreshCw className="h-4 w-4" />{t('Could not load year choices. Try again.')}</button>}
    </section>
    <div className="py-5"><p className="text-xs leading-6 text-ink/50">{t('Ranked by available listener and vote counts, not historical charts.')}</p></div>
    {loading ? <div role="status" aria-label={t('Loading your year...')}><ContentSkeleton /></div> : failed ? <div role="alert" className="flex flex-wrap items-center gap-4 border-y border-ink/10 py-12"><p>{t('Could not load this year.')}</p><button onClick={() => setRetry(value=>value+1)} className="inline-flex min-h-11 items-center gap-2 font-bold text-sea"><RefreshCw className="h-4 w-4" />{t('Try again')}</button></div> : current && <div key={`${selected}:${language}`} className="timeline-results space-y-10 pb-6" aria-live="polite">
      <p className="text-sm font-semibold text-ink/60">{selected} · {current.videoCount.toLocaleString()} {t('titles')} · {current.songCount.toLocaleString()} {t('tracks')}</p>
      <TimelineSection title={t('Movies and dramas')} subtitle={t('Released that year · Most voted')} icon={<Clapperboard className="h-5 w-5" />} items={current.videos} onOpen={onOpen} />
      <TimelineSection title={t('Songs')} subtitle={t('Released that year · Most listened')} icon={<Music2 className="h-5 w-5" />} items={current.songs} onOpen={onOpen} />
      <TimelineSection title={t('Artist debuts')} subtitle={t('Their first chapter started here')} icon={<Users className="h-5 w-5" />} items={current.artists} onOpen={onOpen} />
    </div>}
  </main>;
}

function TimelineSection({ title, subtitle, icon, items, onOpen }: { title: string; subtitle: string; icon: ReactNode; items: KWaveContent[]; onOpen: (item: KWaveContent) => void }) {
  const t = useUI();
  return <section><div className="mb-4 flex items-center gap-3 border-b border-ink/10 pb-4"><span className="text-sea">{icon}</span><div><h2 className="text-xl font-black">{title}</h2><p className="mt-1 text-xs leading-5 text-ink/55">{subtitle}</p></div></div>{items.length ? <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">{items.map(item=><ContentCard key={item.id} item={item} onOpen={onOpen} />)}</div> : <p className="py-6 text-sm text-ink/50">{t('No records for this year yet.')}</p>}</section>;
}
