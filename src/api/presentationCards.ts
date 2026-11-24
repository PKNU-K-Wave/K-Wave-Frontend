import { fetchContentDetail } from './backend';
import type { KWaveContent, Language } from '../types/content';

const cache = new Map<string, { expires: number; item: KWaveContent }>();

// Favorites and personal picks are identity summaries, not localized card DTOs.
export async function fetchPresentationCards(items: KWaveContent[], language: Language, signal: AbortSignal) {
  const result = new Array<KWaveContent>(items.length);
  let cursor = 0;
  let failed = false;
  await Promise.all(Array.from({ length: Math.min(3, items.length) }, async () => {
    while (cursor < items.length && !signal.aborted) {
      const index = cursor++;
      const item = items[index];
      const key = `${language}:${item.kind}:${item.contentId ?? item.id}`;
      try {
        const cached = cache.get(key);
        const detail = cached && cached.expires > Date.now() ? cached.item : await fetchContentDetail(item, language, signal, true);
        if (signal.aborted) return;
        const localized = { ...detail, contentId: item.contentId ?? detail.contentId };
        result[index] = localized;
        cache.delete(key);
        cache.set(key, { item: localized, expires: Date.now() + 300_000 });
        if (cache.size > 200) cache.delete(cache.keys().next().value!);
      } catch (error) {
        if (signal.aborted) throw error;
        failed = true;
        // Do not mislabel a stored Korean subtitle as selected-language metadata.
        result[index] = { ...item, subtitle: '', tags: [], description: '', ...((item.kind === 'movie' || item.kind === 'drama') ? { summary: '', genres: [] } : {}) };
      }
    }
  }));
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
  return { items: result, failed };
}
