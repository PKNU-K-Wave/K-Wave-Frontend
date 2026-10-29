import type { KWaveContent } from '../types/content';

export type Collection = 'video' | 'kpop' | 'food';
export function collectionOf(item: KWaveContent): Collection {
  return item.kind === 'movie' || item.kind === 'drama' ? 'video' : item.kind === 'food' ? 'food' : 'kpop';
}
export const savedKey = (userId: number) => `kwave-saved:user:${userId}`;
export function readSaved(userId: number, storage?: Pick<Storage, 'getItem'>): KWaveContent[] {
  try {
    const items: unknown = JSON.parse((storage ?? localStorage).getItem(savedKey(userId)) || '[]');
    if (!Array.isArray(items)) return [];
    return [...new Map(items.filter((item): item is KWaveContent => item && typeof item.id === 'string' && typeof item.title === 'string' && typeof item.imageUrl === 'string' && typeof item.description === 'string' && typeof item.subtitle === 'string' && ['movie', 'drama', 'song', 'idol', 'food'].includes(item.kind) && Array.isArray(item.tags) && item.tags.every((tag: unknown) => typeof tag === 'string')).map(item => [item.id, item])).values()].slice(0, 500);
  } catch { return []; }
}
export function writeSaved(userId: number, items: KWaveContent[], storage: Pick<Storage, 'setItem'> = localStorage) {
  // Connections can be large and are fetched afresh when opening a saved title.
  storage.setItem(savedKey(userId), JSON.stringify(items.map(item => ({ ...item, connectedItems: undefined }))));
}

const generic = new Set(['movie', 'drama', 'k-pop', 'kpop', 'group', 'solo', 'artist', 'idol', 'song', 'food', 'title track']);
const aliases: Record<string, string> = { '로맨스': 'romance', '멜로': 'romance', '코미디': 'comedy', '스릴러': 'thriller', '액션': 'action', '공포': 'horror', '드라마': 'drama', '가족': 'family', '애니메이션': 'animation', '범죄': 'crime', '미스터리': 'mystery', '판타지': 'fantasy', '음악': 'music' };
const normalize = (tag: string) => aliases[tag.trim()] || tag.trim().toLowerCase();
export function tasteTags(item: KWaveContent): string[] {
  return [...new Set((item.genres ?? item.tags).map(normalize).filter(tag => tag && (!generic.has(tag) || (item.genres !== undefined && tag === 'drama'))))];
}
export function similarSaved(candidates: KWaveContent[], saved: KWaveContent[], collection: Collection, limit = 8) {
  const weights = new Map<string, number>();
  saved.filter(item => collectionOf(item) === collection).forEach(item => tasteTags(item).forEach(tag => weights.set(tag, (weights.get(tag) ?? 0) + 1)));
  const excluded = new Set(saved.map(item => item.id));
  return [...new Map(candidates.map(item => [item.id, item])).values()]
    .filter(item => collectionOf(item) === collection && !excluded.has(item.id))
    .map(item => { const matches = tasteTags(item).filter(tag => weights.has(tag)); return { item, matches, score: matches.reduce((sum, tag) => sum + (weights.get(tag) ?? 0), 0) }; })
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score || a.item.id.localeCompare(b.item.id))
    .slice(0, limit);
}
