import { useUI } from "../utils/ui";
import { useEffect, useMemo, useState } from 'react';
import { Heart, LogOut, Settings2, Sparkles } from 'lucide-react';
import { fetchKPopPage, fetchRecommendations, recommendationToContent } from '../api/backend';
import { withAccessToken } from '../api/auth';
import { ContentCard } from '../components/ContentCard';
import { RecommendationPanel } from '../components/RecommendationPanel';
import { useSavedContent } from '../hooks/savedContentContext';
import type { useKWaveContent } from '../hooks/useKWaveContent';
import type { KWaveContent, Language } from '../types/content';
import { collectionOf, similarSaved, tasteTags, type Collection } from '../utils/savedContent';

type RecommendationsPageProps = {
  content: ReturnType<typeof useKWaveContent>;
  onOpenRecommendation: (item: KWaveContent) => void;
  userId: number;
  language: Language;
  onLogout: () => void;
};

const groups = [{ id: 'video', name: 'K-Video' }, { id: 'kpop', name: 'K-POP' }, { id: 'food', name: 'K-Food' }] as const;
export function RecommendationsPage({ content, onOpenRecommendation, userId, language, onLogout }: RecommendationsPageProps) {
  const t = useUI();
  const { items } = useSavedContent();
  const [tab, setTab] = useState<Collection>('video');
  const [savedLimit, setSavedLimit] = useState(8);
  const [editingTastes, setEditingTastes] = useState(false);
  const [remote, setRemote] = useState<KWaveContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const saved = useMemo(() => items.filter(item => collectionOf(item) === tab), [items, tab]);
  const tagSignature = JSON.stringify([...new Set(saved.flatMap(tasteTags))].sort().slice(0, 12));
  useEffect(() => {
    const tags: string[] = JSON.parse(tagSignature);
    setRemote([]); setFailed(false);
    if (!tags.length || tab === 'food') { setLoading(false); return; }
    const controller = new AbortController();
    setLoading(true);
    const candidates = async () => {
      if (tab === 'kpop') {
        // Bounded candidate window; never download the entire music catalog for personalization.
        const first = await fetchKPopPage('songs', 0, controller.signal);
        const next = await Promise.all([1, 2].filter(page => page < first.totalPages).map(page => fetchKPopPage('songs', page, controller.signal)));
        return [...first.content, ...next.flatMap(page => page.content)];
      }
      const results = await withAccessToken(token => fetchRecommendations({ categories: ['movie', 'drama'], tags }, controller.signal, token, 20));
      return results.map(recommendationToContent);
    };
    candidates()
      .then(results => { if (!controller.signal.aborted) setRemote(results); })
      .catch(() => { if (!controller.signal.aborted) setFailed(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [tagSignature, tab, retry]);
  const recommendations = useMemo(() => similarSaved([...remote, ...content.allContent], items, tab), [content.allContent, remote, items, tab]);
  const name = groups.find(group => group.id === tab)?.name;
  return <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
    <header className="border-b border-ink/10 pb-5">
      <p className="text-xs font-black uppercase text-coral">{t("For You")}</p>
      <h1 className="mt-1 text-2xl font-black sm:text-3xl">{t("Your K-Wave collection")}</h1>
      <p className="mt-2 text-sm text-ink/60">{items.length} {t("saved · Saved on this browser for your account")}</p>
    </header>
    <div role="tablist" aria-label={t("Your collections")} className="mt-5 flex border-b border-ink/10" onKeyDown={event => {
      const index = groups.findIndex(group => group.id === tab);
      const next = event.key === 'ArrowRight' ? (index + 1) % groups.length : event.key === 'ArrowLeft' ? (index + groups.length - 1) % groups.length : event.key === 'Home' ? 0 : event.key === 'End' ? groups.length - 1 : -1;
      if (next < 0) return;
      event.preventDefault(); setTab(groups[next].id); setSavedLimit(8); document.getElementById(`collection-${groups[next].id}`)?.focus();
    }}>
      {groups.map(group => <button key={group.id} id={`collection-${group.id}`} role="tab" tabIndex={tab === group.id ? 0 : -1} aria-selected={tab === group.id} aria-controls="collection-panel" onClick={() => { setTab(group.id); setSavedLimit(8); }} className={`min-h-12 flex-1 border-b-2 px-2 text-sm font-bold sm:flex-none sm:px-6 ${tab === group.id ? 'border-sea text-sea' : 'border-transparent text-ink/55'}`}>{group.name}<span className="ml-2 text-xs text-ink/45">{items.filter(item => collectionOf(item) === group.id).length}</span></button>)}
    </div>
    <div id="collection-panel" role="tabpanel" aria-labelledby={`collection-${tab}`}>
      <section aria-label={t("Saved titles")} className="py-6 sm:py-8">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-black"><Heart className="h-5 w-5 text-coral" />{t("Saved")} {name}</h2>
        {saved.length ? <><div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">{saved.slice(0, savedLimit).map(item => <ContentCard key={item.id} item={item} variant="saved" language={language} onOpen={onOpenRecommendation} />)}</div>{saved.length > savedLimit && <button className="mt-4 min-h-11 font-bold text-sea" onClick={() => setSavedLimit(savedLimit + 8)}>{t("Show more (")}{saved.length - savedLimit})</button>}{savedLimit > 8 && <button className="ml-4 mt-4 min-h-11 font-bold text-ink/55" onClick={() => setSavedLimit(8)}>{t("Show less")}</button>}</> : <div className="border-y border-dashed border-ink/15 py-8 text-center"><Heart className="mx-auto mb-3 h-6 w-6 text-ink/30" /><p className="font-semibold">{t("No saved")} {name} {t("yet")}</p><p className="mt-1 text-sm text-ink/55">{t("Your favorites will appear here.")}</p></div>}
      </section>
      <section aria-label={t("Similar to your favorites")} className="border-t border-ink/10 py-6 sm:py-8">
        <h2 className="flex items-center gap-2 text-lg font-black"><Sparkles className="h-5 w-5 text-sea" />{t("More like your favorites")}</h2>
        <p className="mb-5 mt-2 text-sm text-ink/55">{tab === 'food' ? t("Based on shared food tags · Sample recipes") : t("Based on genres in your saved collection")}</p>
        {loading && <p role="status" className="mb-4 text-sm text-ink/60">{t("Finding matching titles...")}</p>}
        {failed && <p role="status" className="mb-4 text-sm text-ink/60">{t("Live recommendations are unavailable. Showing matches from loaded titles.")}<button className="min-h-11 font-bold text-sea" onClick={() => setRetry(retry + 1)}>{t("Retry")}</button></p>}
        {recommendations.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">{recommendations.map(result => <div key={result.item.id} className="flex min-w-0 flex-col"><p className="mb-2 truncate text-xs font-semibold text-sea" title={result.matches.join(', ')}>{result.matches.join(' · ')}</p><div className="min-h-0 flex-1"><ContentCard item={result.item} language={language} onOpen={onOpenRecommendation} /></div></div>)}</div> : !loading && <p className="py-6 text-sm text-ink/60">{!saved.length ? t("Save a few titles to start discovering similar picks.") : !JSON.parse(tagSignature).length ? t("Genre information is not available for these saved titles yet.") : t("No matching titles in the available catalog yet. Try saving more favorites.")}</p>}
      </section>
    </div>
    <details className="border-t border-ink/10 py-5" onToggle={event => setEditingTastes(event.currentTarget.open)}><summary className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-bold text-ink/70"><Settings2 className="h-4 w-4" />{t("Taste preferences")}</summary>{editingTastes && <div className="pt-4"><RecommendationPanel key={userId} userId={userId} content={content.allContent} onOpen={onOpenRecommendation} /></div>}</details>
    <footer className="border-t border-ink/10 py-3"><button onClick={onLogout} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink/55 hover:text-ink"><LogOut className="h-4 w-4" />{language === 'ja' ? 'ログアウト' : language === 'zh' ? '退出登录' : t("Sign out")}</button></footer>
  </main>;
}
