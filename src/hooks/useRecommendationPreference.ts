import { useEffect, useState } from 'react';
import { defaultPreference, type RecommendationPreference } from '../utils/recommendations';

const STORAGE_KEY = 'kwave-recommendation-preference';

export function useRecommendationPreference() {
  const [preference, setPreference] = useState<RecommendationPreference>(() => {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);

    if (!storedValue) {
      return defaultPreference;
    }

    try {
      return JSON.parse(storedValue) as RecommendationPreference;
    } catch {
      return defaultPreference;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preference));
  }, [preference]);

  return [preference, setPreference] as const;
}
