import { Music2, Users } from 'lucide-react';
import { ContentCard } from '../components/ContentCard';
import { SectionHeader } from '../components/SectionHeader';
import type { KWaveContent } from '../types/content';
import type { useKWaveContent } from '../hooks/useKWaveContent';

type Category = 'video' | 'kpop' | 'food';

type CategoryPageProps = {
  category: Category;
  content: ReturnType<typeof useKWaveContent>;
  onOpen: (item: KWaveContent) => void;
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

export function CategoryPage({ category, content, onOpen }: CategoryPageProps) {
  const copy = copyByCategory[category];
  const contentByCategory: Record<Category, KWaveContent[]> = {
    video: content.videos,
    kpop: [...content.songs, ...content.idols],
    food: content.foods,
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-8 lg:px-8">
      <SectionHeader eyebrow={copy.eyebrow} title={copy.title} description={copy.description} />
      {category === 'kpop' ? (
        <div className="space-y-8">
          <KPopGroup
            label="Tracks"
            title="K-POP Songs"
            description="Album jackets, song titles, artists, and tracks that can later connect to OST or idol data."
            icon={<Music2 className="h-5 w-5" />}
            items={content.songs}
            onOpen={onOpen}
          />
          <KPopGroup
            label="Artists"
            title="Idol Groups"
            description="Profiles focused on members, social links, and challenge videos."
            icon={<Users className="h-5 w-5" />}
            items={content.idols}
            onOpen={onOpen}
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {contentByCategory[category].map((item) => (
            <ContentCard key={item.id} item={item} onOpen={onOpen} />
          ))}
        </div>
      )}
    </main>
  );
}

function KPopGroup({
  label,
  title,
  description,
  icon,
  items,
  onOpen,
}: {
  label: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  items: KWaveContent[];
  onOpen: (item: KWaveContent) => void;
}) {
  return (
    <section className="rounded-lg border border-ink/10 bg-white/80 p-5 shadow-soft sm:p-6">
      <div className="mb-5 flex flex-col gap-3 border-b border-ink/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-coral">{label}</p>
          <h2 className="mt-1 text-2xl font-black tracking-normal text-ink">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">{description}</p>
        </div>
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ink text-white">{icon}</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <ContentCard key={item.id} item={item} onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
}
