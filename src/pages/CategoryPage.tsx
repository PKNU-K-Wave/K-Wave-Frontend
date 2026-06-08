import { ContentCard } from '../components/ContentCard';
import { SectionHeader } from '../components/SectionHeader';
import { foods, idols, songs, videos } from '../data/mockContent';
import type { KWaveContent } from '../types/content';

type Category = 'video' | 'kpop' | 'food';

type CategoryPageProps = {
  category: Category;
  onOpen: (item: KWaveContent) => void;
};

const contentByCategory: Record<Category, KWaveContent[]> = {
  video: videos,
  kpop: [...songs, ...idols],
  food: foods,
};

const copyByCategory: Record<Category, { eyebrow: string; title: string; description: string }> = {
  video: {
    eyebrow: 'K-Video',
    title: 'Movies and dramas',
    description: 'Browse Korean films and dramas, then jump into connected OSTs when the relationship data exists.',
  },
  kpop: {
    eyebrow: 'K-POP',
    title: 'Songs and idols',
    description: 'Start from tracks or idol groups. Detail popups include members, social links, and challenge links.',
  },
  food: {
    eyebrow: 'K-Food',
    title: 'Everyday Korean recipes',
    description: 'Simple home meals designed for international fans who want something realistic to try.',
  },
};

export function CategoryPage({ category, onOpen }: CategoryPageProps) {
  const copy = copyByCategory[category];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <SectionHeader eyebrow={copy.eyebrow} title={copy.title} description={copy.description} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {contentByCategory[category].map((item) => (
          <ContentCard key={item.id} item={item} onOpen={onOpen} />
        ))}
      </div>
    </main>
  );
}
