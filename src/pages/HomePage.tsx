import { ArrowRight, Clapperboard, Music2, Soup, Users } from 'lucide-react';
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
  const previewVideos = videos.slice(0, 3);
  const previewSongs = songs.slice(0, 3);
  const previewIdols = idols.slice(0, 3);
  const previewFoods = foods.slice(0, 3);

  return (
    <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-8 lg:px-8">
      <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <ContentCard item={featuredVideo} onOpen={onOpen} variant="large" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <button
            className="flex min-h-56 flex-col justify-between rounded-lg bg-ink p-5 text-left text-white shadow-soft sm:min-h-72 sm:p-6"
            onClick={() => onSelectCategory('video')}
          >
            <Clapperboard className="h-9 w-9 text-citron" />
            <span>
              <h1 className="text-3xl font-black leading-tight tracking-normal sm:text-4xl">K-Video</h1>
              <p className="mt-3 text-sm leading-6 text-white/70">
                Korean movies and dramas connected through casts, OSTs, and cultural context.
              </p>
            </span>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-black text-citron">
              Explore videos <ArrowRight className="h-4 w-4" />
            </span>
          </button>
          <button
            className="flex min-h-56 flex-col justify-between rounded-lg bg-white p-5 text-left shadow-soft ring-1 ring-ink/5 transition hover:-translate-y-1 hover:ring-sea/30 sm:min-h-72 sm:p-6"
            onClick={() => onSelectCategory('kpop')}
          >
            <Music2 className="h-9 w-9 text-coral" />
            <span>
              <h2 className="text-3xl font-black tracking-normal text-ink">K-POP Network</h2>
              <p className="mt-3 text-sm leading-6 text-ink/60">
                Songs, idol groups, members, social links, and challenge videos stay clearly connected.
              </p>
            </span>
            <span className="inline-flex items-center gap-2 text-sm font-black text-sea">
              Explore K-POP <ArrowRight className="h-4 w-4" />
            </span>
          </button>
        </div>
      </section>

      <section className="mt-8 sm:mt-12">
        <SectionHeader
          eyebrow="Watch"
          title="K-Video"
          description="Movies and dramas are grouped together first, then connected to OSTs and music pages when the data relationship exists."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {previewVideos.map((item) => (
            <ContentCard key={item.id} item={item} onOpen={onOpen} />
          ))}
          <ExploreCard
            title="Explore videos"
            description="Open the full K-Video collection."
            accent="dark"
            icon={<Clapperboard className="h-9 w-9 text-citron" />}
            onClick={() => onSelectCategory('video')}
          />
        </div>
      </section>

      <section className="mt-8 sm:mt-12">
        <SectionHeader
          eyebrow="Listen"
          title="K-POP"
          description="Songs appear with album-style visuals, while idol pages expose members, Instagram, and challenge links."
        />
        <div className="grid gap-5 lg:grid-cols-2">
          <PreviewPanel
            label="Tracks"
            title="Songs"
            icon={<Music2 className="h-5 w-5" />}
            items={previewSongs}
            onOpen={onOpen}
          />
          <PreviewPanel
            label="Artists"
            title="Idol groups"
            icon={<Users className="h-5 w-5" />}
            items={previewIdols}
            onOpen={onOpen}
          />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ExploreCard
            title="Explore K-POP"
            description="Browse songs and idol profiles with clear sections."
            accent="light"
            icon={<Music2 className="h-9 w-9 text-coral" />}
            onClick={() => onSelectCategory('kpop')}
          />
        </div>
      </section>

      <section className="mt-8 sm:mt-12">
        <SectionHeader
          eyebrow="Cook"
          title="K-Food"
          description="The food section focuses on casual Korean home meals instead of only globally famous restaurant dishes."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {previewFoods.map((item) => (
            <ContentCard key={item.id} item={item} onOpen={onOpen} />
          ))}
          <ExploreCard
            title="Open K-Food"
            description="Quick recipes for foods people actually make at home."
            accent="light"
            icon={<Soup className="h-9 w-9 text-sea" />}
            onClick={() => onSelectCategory('food')}
          />
        </div>
      </section>

      <section className="mt-8 rounded-lg bg-white p-5 shadow-soft sm:mt-12 sm:p-8">
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

function PreviewPanel({
  label,
  title,
  icon,
  items,
  onOpen,
}: {
  label: string;
  title: string;
  icon: React.ReactNode;
  items: KWaveContent[];
  onOpen: (item: KWaveContent) => void;
}) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white/75 p-4 shadow-soft">
      <div className="mb-4 flex items-center justify-between border-b border-ink/10 pb-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-coral">{label}</p>
          <h3 className="mt-1 text-xl font-black tracking-normal text-ink">{title}</h3>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-full bg-ink text-white">{icon}</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <ContentCard key={item.id} item={item} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}

function ExploreCard({
  title,
  description,
  icon,
  accent,
  onClick,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  accent: 'dark' | 'light';
  onClick: () => void;
}) {
  const isDark = accent === 'dark';

  return (
    <button
      className={`flex min-h-56 flex-col justify-between rounded-lg p-5 text-left transition sm:min-h-72 sm:p-6 ${
        isDark
          ? 'bg-ink text-white shadow-soft hover:bg-plum'
          : 'border border-dashed border-sea/40 bg-white text-ink hover:border-sea hover:bg-sea/5'
      }`}
      onClick={onClick}
    >
      {icon}
      <span>
        <h3 className="text-2xl font-black tracking-normal">{title}</h3>
        <p className={`mt-3 text-sm leading-6 ${isDark ? 'text-white/70' : 'text-ink/60'}`}>{description}</p>
      </span>
      <span className={`inline-flex items-center gap-2 text-sm font-black ${isDark ? 'text-citron' : 'text-sea'}`}>
        View more <ArrowRight className="h-4 w-4" />
      </span>
    </button>
  );
}
