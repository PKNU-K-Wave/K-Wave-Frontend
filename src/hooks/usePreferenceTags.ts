import { useEffect, useState } from 'react';
import { fetchRecommendationTags } from '../api/backend';
import { withAccessToken } from '../api/auth';
import { getAvailableTags, type RecommendationPreference } from '../utils/recommendations';
import type { Language } from '../types/content';

export function usePreferenceTags(preference: RecommendationPreference, language: Language) {
  const categoriesKey = preference.categories.join(',');
  const key = `${language}:${categoriesKey}`;
  const remote = preference.categories.some(kind => kind !== 'food');
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ key: '', tags: null as string[] | null, failed: false });
  useEffect(() => {
    if (!remote) return;
    const controller = new AbortController();
    setState({ key, tags: null, failed: false });
    void withAccessToken(token => fetchRecommendationTags(categoriesKey.split(','), language, controller.signal, token)).then(tags => {
      if (!Array.isArray(tags) || tags.some(tag => typeof tag !== 'string')) throw new Error('Invalid taste options');
      if (!controller.signal.aborted) setState({ key, tags, failed: false });
    }).catch(() => {
      if (!controller.signal.aborted) setState({ key, tags: null, failed: true });
    });
    return () => controller.abort();
  }, [key, categoriesKey, language, remote, attempt]);
  const current = state.key === key ? state : { tags: null, failed: false };
  const loading = remote && current.tags === null && !current.failed;
  const options = remote && current.tags !== null
    ? [...current.tags, ...(preference.categories.includes('food') ? getAvailableTags(['food']) : [])]
    : loading ? [] : getAvailableTags(preference.categories);
  return {
    tags: preference.categories.length ? [...new Set([...options, ...preference.tags])] : [],
    loading, failed: remote && current.failed, retry: () => setAttempt(value => value + 1),
  };
}
