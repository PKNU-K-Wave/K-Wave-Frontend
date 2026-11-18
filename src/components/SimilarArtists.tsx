import { useContext, useEffect, useState } from 'react';
import { ArrowUpRight, RefreshCw } from 'lucide-react';
import { fetchKPopFilters, fetchKPopPage } from '../api/backend';
import type { IdolContent, KWaveContent } from '../types/content';
import { similarArtists } from '../utils/similarArtists';
import { UIContext, useUI } from '../utils/ui';
import { ContentImage } from './ContentImage';

export function SimilarArtists({ item, onOpen }: { item: IdolContent; onOpen: (item: KWaveContent) => void }) {
  const t = useUI();
  const language = useContext(UIContext);
  const [candidates, setCandidates] = useState<IdolContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setCandidates([]); setLoading(true); setError(false);
    async function load() {
      const filters = item.generation ? await fetchKPopFilters('artists', controller.signal) : null;
      const popular = fetchKPopPage('artists', 0, controller.signal, {sort:'popularity',language});
      const generation = filters?.generation && item.generation ? fetchKPopPage('artists', 0, controller.signal, {sort:'popularity',language,generation:item.generation}) : null;
      const pages = await Promise.allSettled(generation ? [generation, popular] : [popular]);
      if (controller.signal.aborted) return;
      const success = pages.filter(result => result.status === 'fulfilled');
      if (!success.length) throw new Error('Artist candidates unavailable');
      setCandidates(success.flatMap(result => result.value.content).filter((value): value is IdolContent => value.kind === 'idol'));
    }
    load().catch(() => {if (!controller.signal.aborted) setError(true);}).finally(() => {if (!controller.signal.aborted) setLoading(false);});
    return () => controller.abort();
  }, [item.id, item.generation, language, retry]);
  const results = similarArtists(item, candidates);
  return <section aria-busy={loading} className="border-t border-ink/10 pt-6">
    <h3 className="text-lg font-black">{t('Similar artists')}</h3>
    {loading ? <p role="status" className="py-4 text-sm text-ink/55">{t('Loading artists...')}</p> : error ? <button onClick={() => setRetry(value => value+1)} className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-sea"><RefreshCw className="h-4 w-4" />{t('Try again')}</button> : results.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{results.map(result => <button key={result.item.id} onClick={() => onOpen(result.item)} className="flex min-w-0 items-center gap-3 rounded-lg border border-ink/10 bg-white p-3 text-left hover:border-sea">
      <ContentImage src={result.item.imageUrl} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{result.item.title}</span><span className="mt-1 block text-xs leading-5 text-sea">{[result.generation ? t('Same generation') : '', result.agency ? t('Same agency') : '', ...result.sharedGenres.map(genre => t(genre))].filter(Boolean).join(' · ')}</span></span><ArrowUpRight className="h-4 w-4 shrink-0" />
    </button>)}</div> : <p className="mt-3 text-sm text-ink/55">{t('No matching artists in the current selection.')}</p>}
  </section>;
}
