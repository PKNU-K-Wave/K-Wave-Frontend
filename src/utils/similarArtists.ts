import type { IdolContent } from '../types/content';

const normalized = (value?: string) => {
  const text = value?.trim().toLocaleLowerCase() || '';
  return ['n/a', 'unknown', 'not available', '-', '미상'].includes(text) ? '' : text;
};
export function similarArtists(source: IdolContent, candidates: IdolContent[], limit = 6) {
  const seen = new Set<string>([source.id]);
  return candidates.filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  }).map(item => {
    const generation = Boolean(normalized(source.generation) && normalized(source.generation) === normalized(item.generation));
    const agency = Boolean(normalized(source.agency) && normalized(source.agency) === normalized(item.agency));
    const sharedGenres = (source.genres ?? []).filter(genre => (item.genres ?? []).some(value => normalized(value) === normalized(genre)));
    return { item, generation, agency, sharedGenres, score: Number(generation) * 3 + Number(agency) * 2 + Math.min(sharedGenres.length, 2) };
  }).filter(result => result.score > 0).sort((a, b) => b.score - a.score).slice(0, limit);
}
