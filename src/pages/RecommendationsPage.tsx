import { useUI } from "../utils/ui";
import { useEffect, useMemo, useState } from 'react';
import { Heart, LogOut, Settings2, Sparkles } from 'lucide-react';
import { fetchContentDetail, fetchPersonalRecommendations, personalPickToContent, type PersonalPick, type PersonalType } from '../api/backend';
import { withAccessToken } from '../api/auth';
import { ContentCard } from '../components/ContentCard';
import { RecommendationPanel } from '../components/RecommendationPanel';
import { useSavedContent } from '../hooks/savedContentContext';
import type { useKWaveContent } from '../hooks/useKWaveContent';
import type { KWaveContent, Language } from '../types/content';
import { collectionOf, favoriteId, similarSaved, type Collection } from '../utils/savedContent';
import { personalReason } from '../utils/personalReason';

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
  const { items, loading: loadingSaved } = useSavedContent();
  const [tab, setTab] = useState<Collection>('video');
  const [videoType, setVideoType] = useState<PersonalType>('movie');
  const [musicType, setMusicType] = useState<PersonalType>('song');
  const [savedLimit, setSavedLimit] = useState(8);
  const [editingTastes, setEditingTastes] = useState(false);
  const [remote, setRemote] = useState<PersonalPick[]>([]);
  const [foodDetails, setFoodDetails] = useState<KWaveContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const type = tab === 'video' ? videoType : tab === 'kpop' ? musicType : null;
  const saved = useMemo(() => items.filter(item => collectionOf(item) === tab), [items, tab]);
  useEffect(() => {
    setRemote([]); setFoodDetails([]); setFailed(false);
    if (loadingSaved || (!type && !saved.length)) { setLoading(false); return; }
    const controller = new AbortController();
    const { signal } = controller;
    setLoading(true);
    const load = async () => {
      if (type) {
        const picks = await withAccessToken(token => fetchPersonalRecommendations(type, language, token, signal));
        if (!signal.aborted) setRemote(picks);
      } else {
        const foods: KWaveContent[] = [];
        for (let i = 0; i < saved.length && !signal.aborted; i += 6) {
          foods.push(...await Promise.all(saved.slice(i, i + 6).map(item => item.tags.length ? item : fetchContentDetail(item, language, signal))));
        }
        if (!signal.aborted) setFoodDetails(foods);
      }
    };
    void load().catch(() => { if (!signal.aborted) setFailed(true); })
      .finally(() => { if (!signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [type, language, retry, saved, loadingSaved]);
  const recommendations = type
    ? remote.filter(pick => !items.some(item => favoriteId(item) === pick.contentId)).map(pick => ({ item: personalPickToContent(pick), label: personalReason(pick.reason, pick.reasonGenre, language) }))
    : similarSaved(content.allContent, foodDetails, 'food').map(result => ({ item: result.item, label: result.matches.join(' · ') }));
  const name = groups.find(group => group.id === tab)?.name;
  return <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
    <header className="border-b border-ink/10 pb-5">
      <p className="text-xs font-black uppercase text-coral">{t("For You")}</p>
      <h1 className="mt-1 text-2xl font-black sm:text-3xl">{t("Your K-Wave collection")}</h1>
      <p className="mt-2 text-sm text-ink/60">{loadingSaved ? t('Loading favorites...') : `${items.length} ${t('saved to your account')}`}</p>
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
      <section aria-label={t('More like your favorites')} className="border-t border-ink/10 py-6 sm:py-8">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-black"><Sparkles className="h-5 w-5 text-sea" />{t('More like your favorites')}</h2>
        {type && <div role="group" aria-label={t('Category')} className="mb-4 flex gap-2">
          {(tab === 'video' ? [['movie', 'Movies'], ['drama', 'Dramas']] : [['song', 'Tracks'], ['artist', 'Artists']]).map(([value, label]) => <button key={value} aria-pressed={type === value} className={`min-h-11 rounded-lg border px-4 text-sm font-bold ${type === value ? 'border-sea bg-sea text-white' : 'border-ink/10 bg-white text-ink/70'}`} onClick={() => tab === 'video' ? setVideoType(value as PersonalType) : setMusicType(value as PersonalType)}>{t(label)}</button>)}
        </div>}
        {loading || loadingSaved ? <p role="status" className="text-sm text-ink/60">{t('Finding matching titles...')}</p>
          : failed ? <p role="alert" className="text-sm text-ink/60">{t('Could not load recommendations.')} <button className="min-h-11 font-bold text-sea" onClick={() => setRetry(retry + 1)}>{t('Retry')}</button></p>
          : recommendations.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">{recommendations.map(result => <div key={result.item.id} className="min-w-0"><span className="mb-2 inline-block rounded bg-sea/10 px-2 py-1 text-xs font-semibold text-sea">{result.label}</span><ContentCard item={result.item} language={language} onOpen={onOpenRecommendation} /></div>)}</div>
          : <p className="py-6 text-sm text-ink/60">{t(type ? 'No picks yet' : 'Save a few titles to start discovering similar picks.')}</p>}
      </section>
    </div>
    <details className="border-t border-ink/10 py-5" onToggle={event => setEditingTastes(event.currentTarget.open)}><summary className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-bold text-ink/70"><Settings2 className="h-4 w-4" />{t("Taste preferences")}</summary>{editingTastes && <div className="pt-4"><RecommendationPanel key={userId} userId={userId} content={content.allContent} onOpen={onOpenRecommendation} /></div>}</details>
    <footer className="border-t border-ink/10 py-3"><button onClick={onLogout} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink/55 hover:text-ink"><LogOut className="h-4 w-4" />{language === 'ja' ? 'ログアウト' : language === 'zh' ? '退出登录' : t("Sign out")}</button></footer>
  </main>;
}
