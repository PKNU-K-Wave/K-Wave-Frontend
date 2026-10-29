import type { ContentKind } from '../types/content';
import type { RecommendationPreference } from './recommendations';

export function preferenceStorageKey(userId: number) { return `kwave-recommendation-preference:user:${userId}`; }

export function readUserPreference(userId: number, storage: Pick<Storage, 'getItem'> = localStorage): RecommendationPreference | null {
  try {
    const value = JSON.parse(storage.getItem(preferenceStorageKey(userId)) || 'null');
    if (!value || !Array.isArray(value.categories) || !Array.isArray(value.tags)) return null;
    return { categories: [...new Set<ContentKind>(value.categories.filter((kind: unknown) => typeof kind === 'string' && ['movie', 'drama', 'song', 'idol', 'food'].includes(kind)))], tags: [...new Set<string>(value.tags.filter((tag: unknown) => typeof tag === 'string'))] };
  } catch { return null; }
}

export function saveUserPreference(userId: number, preference: RecommendationPreference, storage: Pick<Storage, 'setItem'> = localStorage): boolean {
  try { storage.setItem(preferenceStorageKey(userId), JSON.stringify(preference)); return true; } catch { return false; }
}
