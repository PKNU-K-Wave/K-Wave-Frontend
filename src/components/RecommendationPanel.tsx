import { UIContext, useUI } from "../utils/ui";
import { useContext, useEffect, useMemo, useState } from 'react';
import { RotateCcw, Sparkles } from 'lucide-react';
import { fetchRecommendations, recommendationToContent, type RecommendationApiResponse } from '../api/backend';
import { ContentCard } from './ContentCard';
import type { KWaveContent } from '../types/content';
import { useRecommendationPreference } from '../hooks/useRecommendationPreference';
import { withAccessToken } from '../api/auth';
import { usePresentationCards } from '../hooks/usePresentationCards';
import { usePreferenceTags } from '../hooks/usePreferenceTags';
import {
  calculateRecommendations,
  defaultPreference,
  selectPreferenceCategory,
  preferenceOptions,
  type RecommendedContent,
} from '../utils/recommendations';

type RecommendationPanelProps = {
  content: KWaveContent[];
  onOpen: (item: KWaveContent) => void;
  userId: number;
};

export function RecommendationPanel({ content, onOpen, userId }: RecommendationPanelProps) {
  const t = useUI();
  const language = useContext(UIContext);
  const [preference, setPreference, saved] = useRecommendationPreference(userId);
  const tasteOptions = usePreferenceTags(preference, language);
  const availableTags = tasteOptions.tags;
  const [failed, setFailed] = useState(false);
  const localRecommendations = useMemo(
    () => calculateRecommendations(content, preference, 4),
    [content, preference],
  );
  const [serverRecommendations, setServerRecommendations] = useState<RecommendedContent[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const recommendations = preference.categories.length ? serverRecommendations ?? localRecommendations : [];
  const presentation = usePresentationCards(recommendations.map(result => result.item), language);

  useEffect(() => {
    if (preference.categories.length === 0) {
      setServerRecommendations(null);
      setIsLoading(false);
      setFailed(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setServerRecommendations([]);
    setFailed(false);

    withAccessToken(token => fetchRecommendations(preference, language, controller.signal, token))
      .then((response) => mapRecommendations(response))
      .then((mappedRecommendations) => {
        if (!controller.signal.aborted) {
          setServerRecommendations([...mappedRecommendations, ...localRecommendations.filter(result => result.item.kind === 'food')].slice(0, 4));
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setServerRecommendations(null);
          setFailed(true);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [content, preference, localRecommendations, language]);

  const toggleCategory = (categoryValue: string) => {
    setPreference(current => selectPreferenceCategory(current, categoryValue));
  };

  const toggleTag = (tag: string) => {
    setPreference((current) => ({
      ...current,
      tags: current.tags.includes(tag) ? current.tags.filter((value) => value !== tag) : [...current.tags, tag],
    }));
  };

  return (
    <section className="border-t border-ink/10 py-5 sm:py-6">
      <div className="flex flex-col gap-4 border-b border-ink/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-coral">
            <Sparkles className="h-4 w-4" />
            {t("For you")}</p>
          <h2 className="mt-2 text-xl font-black text-ink">{t("Your interests")}</h2>
          <p className="mt-2 text-sm text-ink/60" role={saved ? 'status' : 'alert'}>{saved ? t("Saved for your account on this browser.") : t("Your changes could not be saved. Please allow browser storage.")}</p>
        </div>
        <button
          className="inline-flex h-10 w-fit items-center gap-2 rounded-full border border-ink/10 px-4 text-sm font-black text-ink/60 transition hover:bg-ink hover:text-white"
          onClick={() => setPreference(defaultPreference)}
        >
          <RotateCcw className="h-4 w-4" />
          {t("Reset")}</button>
      </div>

      <div className="mt-5 grid min-w-0 gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="min-w-0 space-y-5">
          <PreferenceGroup title={t("Category")}>
            {preferenceOptions.categories.map((option) => {
              const isActive = option.kinds.some((kind) => preference.categories.includes(kind));

              return (
                <Chip key={option.value} isActive={isActive} onClick={() => toggleCategory(option.value)}>
                  {option.label}
                </Chip>
              );
            })}
          </PreferenceGroup>

          <PreferenceGroup title={t("Taste")}>
            {tasteOptions.loading && <p role="status" className="text-xs text-ink/60">{t('Loading tastes...')}</p>}
            {tasteOptions.failed && <p role="status" className="text-xs text-ink/60">{t('Could not load taste options.')} <button className="min-h-11 font-bold text-sea" onClick={tasteOptions.retry}>{t('Retry')}</button></p>}
            {failed && <p role="status" className="text-xs text-ink/60">{t("Recommendations are offline. Showing available titles.")}</p>}
            {availableTags.length > 0 ? (
              availableTags.map((tag) => (
                <Chip key={tag} isActive={preference.tags.includes(tag)} onClick={() => toggleTag(tag)}>
                  {tag}
                </Chip>
              ))
            ) : !tasteOptions.loading && (
              <p className="rounded-lg bg-ink/5 p-3 text-xs font-semibold leading-5 text-ink/50">
                {t("Select a category first.")}</p>
            )}
          </PreferenceGroup>
        </div>

        <div
          className="grid min-w-0 content-start gap-4 sm:grid-cols-2 xl:grid-cols-4"
          aria-busy={preference.categories.length > 0 && (isLoading || presentation.loading)}
        >
          {preference.categories.length > 0 && (isLoading || presentation.loading) ? <p role="status" className="text-sm text-ink/60 sm:col-span-2 xl:col-span-4">{t('Finding matching titles...')}</p> : preference.categories.length > 0 && presentation.items.length > 0 ? (
            presentation.items.map(item => <ContentCard key={item.id} item={item} onOpen={onOpen} language={language} />)
          ) : (
            <div className="rounded-lg border border-dashed border-ink/15 bg-ink/5 p-5 sm:col-span-2 xl:col-span-4">
              <p className="text-sm font-black text-ink">{t("No picks yet")}</p>
              <p className="mt-2 text-sm leading-6 text-ink/55">
                {t("Choose a category and taste tags to build your recommendation list.")}</p>
            </div>
          )}
        </div>
      </div>
      {preference.categories.length > 0 && presentation.failed && <p role="status" className="mt-3 text-sm text-ink/60">{t('Some details could not be loaded.')} <button className="min-h-11 font-bold text-sea" onClick={presentation.retry}>{t('Retry')}</button></p>}
    </section>
  );
}

function mapRecommendations(
  recommendations: RecommendationApiResponse[],
): RecommendedContent[] {
  return recommendations.map(recommendation => ({ item: recommendationToContent(recommendation), score: recommendation.score, reasons: recommendation.reasons }));
}

function PreferenceGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const t = useUI();
  return (
    <div>
      <h3 className="text-sm font-black text-ink">{t(title)}</h3>
      <div className="mt-3 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({ children, isActive, onClick }: { children: React.ReactNode; isActive: boolean; onClick: () => void }) {
  const t = useUI();
  return (
    <button
      aria-pressed={isActive}
      className={`min-h-9 max-w-full break-words rounded-full px-3 py-2 text-left text-xs font-black transition ${
        isActive ? 'bg-ink text-white' : 'bg-ink/5 text-ink/55 hover:bg-white hover:text-ink hover:ring-1 hover:ring-ink/10'
      }`}
      onClick={onClick}
    >
      {typeof children === 'string' ? t(children) : children}
    </button>
  );
}
