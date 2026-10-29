import { useEffect, useState } from 'react';
import { defaultPreference, type RecommendationPreference } from '../utils/recommendations';
import { readUserPreference, saveUserPreference } from '../utils/preferenceStorage';

export function useRecommendationPreference(userId: number) {
  const [preference, setPreference] = useState<RecommendationPreference>(() => {
    return readUserPreference(userId) ?? defaultPreference;
  });
  const [saved, setSaved] = useState(true);

  useEffect(() => {
    setSaved(saveUserPreference(userId, preference));
  }, [preference, userId]);

  return [preference, setPreference, saved] as const;
}
