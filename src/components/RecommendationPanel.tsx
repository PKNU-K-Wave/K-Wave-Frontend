import { useEffect, useMemo, useState } from 'react';
import { RotateCcw, Sparkles } from 'lucide-react';
import { fetchRecommendations, type RecommendationApiResponse } from '../api/backend';
import { ContentCard } from './ContentCard';
import type { ContentKind, KWaveContent } from '../types/content';
import { useRecommendationPreference } from '../hooks/useRecommendationPreference';
import {
  calculateRecommendations,
  defaultPreference,
  getAvailableTags,
  getCategoryKinds,
  preferenceOptions,
  type RecommendedContent,
  type RecommendationPreference,
} from '../utils/recommendations';

type RecommendationPanelProps = {
  content: KWaveContent[];
  onOpen: (item: KWaveContent) => void;
};

export function RecommendationPanel({ content, onOpen }: RecommendationPanelProps) {
  const [preference, setPreference] = useRecommendationPreference();
  const availableTags = getAvailableTags(preference.categories);
  const localRecommendations = useMemo(
    () => calculateRecommendations(content, preference, 4),
    [content, preference],
  );
  const [serverRecommendations, setServerRecommendations] = useState<RecommendedContent[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const recommendations = serverRecommendations ?? localRecommendations;

  useEffect(() => {
    if (preference.categories.length === 0) {
      setServerRecommendations(null);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);

    fetchRecommendations(preference, controller.signal)
      .then((response) => mapRecommendations(response, content))
      .then((mappedRecommendations) => {
        if (!controller.signal.aborted) {
          setServerRecommendations(mappedRecommendations.length > 0 ? mappedRecommendations : null);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setServerRecommendations(null);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [content, preference]);

  const toggleCategory = (categoryValue: string) => {
    const kinds = getCategoryKinds(categoryValue);
    setPreference((current) => {
      const nextPreference = toggleKinds(current, kinds);
      const nextAvailableTags = getAvailableTags(nextPreference.categories);

      return {
        ...nextPreference,
        tags: nextPreference.tags.filter((tag) => nextAvailableTags.includes(tag)),
      };
    });
  };

  const toggleTag = (tag: string) => {
    setPreference((current) => ({
      ...current,
      tags: current.tags.includes(tag) ? current.tags.filter((value) => value !== tag) : [...current.tags, tag],
    }));
  };

  return (
    <section className="rounded-lg bg-white p-5 shadow-soft sm:p-6">
      <div className="flex flex-col gap-4 border-b border-ink/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-coral">
            <Sparkles className="h-4 w-4" />
            For you
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-normal text-ink sm:text-3xl">Personalized K-Wave picks</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">
            Choose what you like and K-Wave will surface connected culture cards first.
          </p>
        </div>
        <button
          className="inline-flex h-10 w-fit items-center gap-2 rounded-full border border-ink/10 px-4 text-sm font-black text-ink/60 transition hover:bg-ink hover:text-white"
          onClick={() => setPreference(defaultPreference)}
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </button>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[18rem_1fr]">
        <div className="space-y-5">
          <PreferenceGroup title="Category">
            {preferenceOptions.categories.map((option) => {
              const isActive = option.kinds.some((kind) => preference.categories.includes(kind));

              return (
                <Chip key={option.value} isActive={isActive} onClick={() => toggleCategory(option.value)}>
                  {option.label}
                </Chip>
              );
            })}
          </PreferenceGroup>

          <PreferenceGroup title="Taste">
            {availableTags.length > 0 ? (
              availableTags.map((tag) => (
                <Chip key={tag} isActive={preference.tags.includes(tag)} onClick={() => toggleTag(tag)}>
                  {tag}
                </Chip>
              ))
            ) : (
              <p className="rounded-lg bg-ink/5 p-3 text-xs font-semibold leading-5 text-ink/50">
                Select a category first.
              </p>
            )}
          </PreferenceGroup>
        </div>

        <div
          className={`grid gap-4 transition sm:grid-cols-2 xl:grid-cols-4 ${isLoading ? 'opacity-70' : ''}`}
          aria-busy={isLoading}
        >
          {recommendations.length > 0 ? (
            recommendations.map((recommendation) => (
              <div key={recommendation.item.id} className="min-w-0">
                <ContentCard item={recommendation.item} onOpen={onOpen} />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {recommendation.reasons.map((reason) => (
                    <span key={reason} className="rounded-full bg-sea/10 px-2.5 py-1 text-[11px] font-black text-sea">
                      {reason}
                    </span>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-ink/15 bg-ink/5 p-5 sm:col-span-2 xl:col-span-4">
              <p className="text-sm font-black text-ink">No picks yet</p>
              <p className="mt-2 text-sm leading-6 text-ink/55">
                Choose a category and taste tags to build your recommendation list.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function mapRecommendations(
  recommendations: RecommendationApiResponse[],
  content: KWaveContent[],
): RecommendedContent[] {
  return recommendations.flatMap((recommendation) => {
    const item =
      content.find((candidate) => candidate.id === recommendation.id) ??
      content.find(
        (candidate) =>
          candidate.contentId === recommendation.contentId && candidate.kind === recommendation.contentType,
      );

    return item
      ? [
          {
            item,
            score: recommendation.score,
            reasons: recommendation.reasons,
          },
        ]
      : [];
  });
}

function PreferenceGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-black text-ink">{title}</h3>
      <div className="mt-3 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({ children, isActive, onClick }: { children: React.ReactNode; isActive: boolean; onClick: () => void }) {
  return (
    <button
      className={`h-9 rounded-full px-3 text-xs font-black transition ${
        isActive ? 'bg-ink text-white' : 'bg-ink/5 text-ink/55 hover:bg-white hover:text-ink hover:ring-1 hover:ring-ink/10'
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function toggleKinds(preference: RecommendationPreference, kinds: ContentKind[]): RecommendationPreference {
  const hasAnyKind = kinds.some((kind) => preference.categories.includes(kind));

  return {
    ...preference,
    categories: hasAnyKind
      ? preference.categories.filter((kind) => !kinds.includes(kind))
      : [...preference.categories, ...kinds],
  };
}
