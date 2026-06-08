import { ArrowRight, Clapperboard, Music2, Soup } from 'lucide-react';
import { ContentCard } from '../components/ContentCard';
import { SectionHeader } from '../components/SectionHeader';
import { foods, idols, songs, videos } from '../data/mockContent';
import type { KWaveContent } from '../types/content';

type HomePageProps = {
  onOpen: (item: KWaveContent) => void;
  onSelectCategory: (category: 'video' | 'kpop' | 'food') => void;
};

export function HomePage({ onOpen, onSelectCategory }: HomePageProps) {
  const featuredVideo = videos[0];
  const featuredSong = songs[0];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <ContentCard item={featuredVideo} onOpen={onOpen} variant="large" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <button
            className="rounded-lg bg-ink p-6 text-left text-white shadow-soft"
            onClick={() => onSelectCategory('video')}
          >
            <Clapperboard className="h-8 w-8 text-citron" />
            <h1 className="mt-6 text-4xl font-black leading-tight tracking-normal">K-Video</h1>
            <p className="mt-3 text-sm leading-6 text-white/70">
              Korean movies and dramas connected through casts, OSTs, and cultural context.
            </p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-black text-citron">
              Explore videos <ArrowRight className="h-4 w-4" />
            </span>
          </button>
          <ContentCard item={featuredSong} onOpen={onOpen} />
        </div>
      </section>

      <section className="mt-12">
        <SectionHeader
          eyebrow="Watch"
          title="K-Video"
          description="Movies and dramas are grouped together first, then connected to OSTs and music pages when the data relationship exists."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {videos.map((item) => (
            <ContentCard key={item.id} item={item} onOpen={onOpen} />
          ))}
        </div>
      </section>

      <section className="mt-12">
        <SectionHeader
          eyebrow="Listen"
          title="K-POP"
          description="Songs appear with album-style visuals, while idol pages expose members, Instagram, and challenge links."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...songs, ...idols].map((item) => (
            <ContentCard key={item.id} item={item} onOpen={onOpen} />
          ))}
        </div>
      </section>

      <section className="mt-12">
        <SectionHeader
          eyebrow="Cook"
          title="K-Food"
          description="The food section focuses on casual Korean home meals instead of only globally famous restaurant dishes."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {foods.map((item) => (
            <ContentCard key={item.id} item={item} onOpen={onOpen} />
          ))}
          <button
            className="flex min-h-72 flex-col justify-between rounded-lg border border-dashed border-sea/40 bg-white p-6 text-left transition hover:border-sea hover:bg-sea/5"
            onClick={() => onSelectCategory('food')}
          >
            <Soup className="h-9 w-9 text-sea" />
            <span>
              <h3 className="text-2xl font-black tracking-normal text-ink">Everyday Korean table</h3>
              <p className="mt-3 text-sm leading-6 text-ink/60">Quick recipes for foods people actually make at home.</p>
            </span>
            <span className="inline-flex items-center gap-2 text-sm font-black text-sea">
              Open K-Food <ArrowRight className="h-4 w-4" />
            </span>
          </button>
        </div>
      </section>

      <section className="mt-12 rounded-lg bg-white p-6 shadow-soft sm:p-8">
        <div className="grid gap-6 md:grid-cols-[0.7fr_1.3fr] md:items-center">
          <div>
            <Music2 className="h-9 w-9 text-coral" />
            <h2 className="mt-4 text-3xl font-black tracking-normal text-ink">Culture is connected.</h2>
          </div>
          <p className="text-sm leading-7 text-ink/65">
            The first version uses mock relationships. Once backend ERD and DTOs are finalized, these cards can be wired to
            real relationship data such as video OSTs, idol songs, artists, and food culture tags.
          </p>
        </div>
      </section>
    </main>
  );
}
