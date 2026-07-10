import type { ContentKind, KWaveContent } from '../types/content';

export type RecommendationPreference = {
  categories: ContentKind[];
  tags: string[];
};

export type RecommendedContent = {
  item: KWaveContent;
  score: number;
  reasons: string[];
};

const kindGroup: Record<'video' | 'kpop' | 'food', ContentKind[]> = {
  video: ['movie', 'drama'],
  kpop: ['song', 'idol'],
  food: ['food'],
};

export const preferenceOptions = {
  categories: [
    { label: 'K-Video', value: 'video', kinds: kindGroup.video },
    { label: 'K-POP', value: 'kpop', kinds: kindGroup.kpop },
    { label: 'K-Food', value: 'food', kinds: kindGroup.food },
  ],
  tags: ['Romance', 'Thriller', 'OST', 'Dance', 'Girl Group', 'Home Food', 'Quick', 'One Pan', 'Award-winning'],
};

export const defaultPreference: RecommendationPreference = {
  categories: ['movie', 'drama', 'song', 'idol'],
  tags: ['OST', 'Dance'],
};

export function calculateRecommendations(
  content: KWaveContent[],
  preference: RecommendationPreference,
  limit = 4,
): RecommendedContent[] {
  return content
    .map((item) => scoreContent(item, preference))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
    .slice(0, limit);
}

export function getCategoryKinds(categoryValue: string): ContentKind[] {
  if (categoryValue === 'video' || categoryValue === 'kpop' || categoryValue === 'food') {
    return kindGroup[categoryValue];
  }

  return [];
}

function scoreContent(item: KWaveContent, preference: RecommendationPreference): RecommendedContent {
  let score = 0;
  const reasons: string[] = [];

  if (preference.categories.includes(item.kind)) {
    score += 7;
    reasons.push(kindLabel(item.kind));
  }

  const matchingTags = item.tags.filter((tag) =>
    preference.tags.some((preferredTag) => normalize(preferredTag) === normalize(tag)),
  );

  if (matchingTags.length > 0) {
    score += matchingTags.length * 4;
    reasons.push(...matchingTags);
  }

  const searchableText = normalize(`${item.title} ${item.subtitle} ${item.description} ${item.tags.join(' ')}`);
  const softMatches = preference.tags.filter((tag) => searchableText.includes(normalize(tag)));

  if (softMatches.length > matchingTags.length) {
    score += softMatches.length - matchingTags.length;
  }

  if (hasConnectedCulture(item)) {
    score += 2;
    reasons.push('Connected culture');
  }

  return {
    item,
    score,
    reasons: [...new Set(reasons)].slice(0, 3),
  };
}

function hasConnectedCulture(item: KWaveContent) {
  if (item.kind === 'movie' || item.kind === 'drama') {
    return item.ostIds.length > 0;
  }

  if (item.kind === 'song') {
    return item.relatedIdolIds.length > 0;
  }

  if (item.kind === 'idol') {
    return item.relatedSongIds.length > 0;
  }

  return item.tags.length > 1;
}

function kindLabel(kind: ContentKind) {
  if (kind === 'movie' || kind === 'drama') {
    return 'K-Video';
  }

  if (kind === 'song' || kind === 'idol') {
    return 'K-POP';
  }

  return 'K-Food';
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}
