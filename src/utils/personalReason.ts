const copy = {
  ko: { taste: '찜한 취향 기반', genre: (genre: string) => `찜한 ${genre} 장르 기반`, explore: '새로운 장르 탐색', popular: '인기' },
  en: { taste: 'Based on your favorites', genre: (genre: string) => `Because you saved ${genre} titles`, explore: 'Explore a new genre', popular: 'Popular' },
  zh: { taste: '根据你的收藏', genre: (genre: string) => `根据你收藏的「${genre}」推荐`, explore: '探索新类型', popular: '热门' },
  ja: { taste: 'お気に入りに基づく', genre: (genre: string) => `お気に入りの「${genre}」から`, explore: '新しいジャンルを探す', popular: '人気' },
};

export function personalReason(reason: string, genre: string | null, language: keyof typeof copy): string {
  const labels = copy[language];
  if (reason === 'TASTE') return genre ? labels.genre(genre) : labels.taste;
  if (reason === 'EXPLORE') return labels.explore;
  return reason === 'POPULAR' ? labels.popular : '';
}
