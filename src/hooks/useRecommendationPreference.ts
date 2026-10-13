import { useEffect, useState } from 'react';
import { defaultPreference, type RecommendationPreference } from '../utils/recommendations';

const STORAGE_KEY = 'kwave-recommendation-preference';

export function useRecommendationPreference() {
  const [preference, setPreference] = useState<RecommendationPreference>(() => {
    try {
      const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
      if (!value || !Array.isArray(value.categories) || !Array.isArray(value.tags)) return defaultPreference;
      return {
        categories: value.categories.filter((kind: unknown) => typeof kind === 'string' && ['movie', 'drama', 'song', 'idol', 'food'].includes(kind)),
        tags: value.tags.filter((tag: unknown) => typeof tag === 'string'),
      } as RecommendationPreference;
    } catch {
      return defaultPreference;
    }
  });

  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preference)); } catch { /* Storage may be unavailable in private browsing. */ }
  }, [preference]);

  return [preference, setPreference] as const;
}
