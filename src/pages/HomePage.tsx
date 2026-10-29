import { useUI } from "../utils/ui";
import { ContentImage } from "../components/ContentImage";
import { ArrowLeft, ArrowRight, Clapperboard, Music2, Soup, Users, Pause, Play, type LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ContentCard } from '../components/ContentCard';
import { SectionHeader } from '../components/SectionHeader';
import { ContentSkeleton } from '../components/ContentSkeleton';
import type { KWaveContent } from '../types/content';
import type { useKWaveContent } from '../hooks/useKWaveContent';

type HomePageProps = {
  content: ReturnType<typeof useKWaveContent>;
  onOpen: (item: KWaveContent) => void;
  onSelectCategory: (category: 'video' | 'kpop' | 'food') => void;
};

export function HomePage({ content, onOpen, onSelectCategory }: HomePageProps) {
  const t = useUI();
  const { foods, idols, songs, videos } = content;
  const featuredItems = [videos[0], songs[0], idols[0], foods[0]].filter(isContent);
  const previewVideos = videos.filter(item => item.id !== videos[0]?.id).slice(0, 3);
  const previewSongs = songs.filter(item => item.id !== songs[0]?.id).slice(0, 3);
  const previewIdols = idols.filter(item => item.id !== idols[0]?.id).slice(0, 3);
  const previewFoods = foods;
  if (content.isLoading) return <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6"><ContentSkeleton /></main>;

  return (
    <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-8 lg:px-8">
      <FeaturedCarousel items={featuredItems} onOpen={onOpen} />
      {content.isUsingFallback && <div role="status" className="mt-4 border-b border-ink/10 pb-4 text-sm text-ink/60">{t("Sample content · Live titles are unavailable right now.")}<button className="min-h-11 font-bold text-sea" onClick={content.retry}>{t("Try again")}</button></div>}

      <section className="mt-8 sm:mt-12">
        <SectionHeader
          eyebrow={t("Watch")}
          title={t("K-Video")}
          description={t("Discover Korean movies, dramas and their music.")}
        />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {previewVideos.map((item) => (
            <ContentCard key={item.id} item={item} onOpen={onOpen} />
          ))}
          <ExploreCard
            title={t("Explore videos")}
            description={t("Open the full K-Video collection.")}
            accent="dark"
            icon={<Clapperboard className="h-9 w-9 text-citron" />}
            onClick={() => onSelectCategory('video')}
          />
        </div>
      </section>

      <section className="mt-8 sm:mt-12">
        <SectionHeader
          eyebrow={t("Listen")}
          title={t("K-POP")}
          description={t("Tracks, artists and the stories behind the music.")}
        />
        <div className="grid gap-5 lg:grid-cols-2">
          <PreviewPanel
            label={t("Tracks")}
            title={t("Songs")}
            icon={<Music2 className="h-5 w-5" />}
            items={previewSongs}
            onOpen={onOpen}
          />
          <PreviewPanel
            label={t("Artists")}
            title={t("Idol groups")}
            icon={<Users className="h-5 w-5" />}
            items={previewIdols}
            onOpen={onOpen}
          />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ExploreCard
            title={t("Explore K-POP")}
            description={t("Browse songs and idol profiles with clear sections.")}
            accent="light"
            icon={<Music2 className="h-9 w-9 text-coral" />}
            onClick={() => onSelectCategory('kpop')}
          />
        </div>
      </section>

      <section className="mt-8 sm:mt-12">
        <SectionHeader
          eyebrow={t("Cook")}
          title={t("K-Food")}
          description={t("Simple Korean home cooking.")}
        />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {previewFoods.map((item) => (
            <ContentCard key={item.id} item={item} onOpen={onOpen} />
          ))}
          <ExploreCard
            title={t("Open K-Food")}
            description={t("Quick recipes for foods people actually make at home.")}
            accent="light"
            icon={<Soup className="h-9 w-9 text-sea" />}
            onClick={() => onSelectCategory('food')}
          />
        </div>
      </section>

      <section className="mt-8 border-t border-ink/10 py-6 sm:mt-12 sm:py-8">
        <div className="grid gap-6 md:grid-cols-[0.7fr_1.3fr] md:items-center">
          <div>
            <Music2 className="h-9 w-9 text-coral" />
            <h2 className="mt-4 text-3xl font-black tracking-normal text-ink">{t("Culture is connected.")}</h2>
          </div>
          <p className="text-sm leading-7 text-ink/65">
            {t("Follow a movie or drama into its OST, then continue into songs and artist profiles without losing the thread. K-Wave turns separate culture categories into one connected discovery path.")}</p>
        </div>
      </section>
    </main>
  );
}

function FeaturedCarousel({ items, onOpen }: { items: KWaveContent[]; onOpen: (item: KWaveContent) => void }) {
  const t = useUI();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [manualPause, setManualPause] = useState(false);

  useEffect(() => {
    if (items.length < 2 || isPaused || manualPause || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % items.length);
    }, 6000);

    return () => window.clearInterval(intervalId);
  }, [isPaused, manualPause, items.length]);

  useEffect(() => {
    if (activeIndex >= items.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, items.length]);

  if (items.length === 0) {
    return null;
  }

  const activeItem = items[activeIndex];
  const kind = featuredKind[activeItem.kind];
  const KindIcon = kind.icon;

  const move = (direction: -1 | 1) => {
    setActiveIndex((current) => (current + direction + items.length) % items.length);
  };

  return (
    <section
      className="relative h-[23rem] overflow-hidden rounded-lg bg-ink shadow-soft sm:h-[27rem] lg:h-[28rem]"
      aria-label={t("Featured K-Wave content")}
      aria-roledescription="carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsPaused(false);
        }
      }}
    >
      {items.map((item, index) => (
        <ContentImage
          key={item.id}
          className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-700 ${
            index === activeIndex ? 'opacity-100' : 'opacity-0'
          }`}
          src={item.thumbnailUrl || item.imageUrl}
          loading={index === activeIndex ? 'eager' : 'lazy'}
          alt=""
        />
      ))}
      <div className="absolute inset-0 bg-ink/45" />

      <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 p-4 sm:p-6">
        <span className="inline-flex min-w-0 items-center gap-2 text-xs font-black uppercase text-white">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-citron text-ink">
            <KindIcon className="h-4 w-4" />
          </span>
          <span className="truncate">{kind.label}</span>
        </span>

        <div className="flex shrink-0 items-center gap-2">
          <button title={t(manualPause ? 'Play carousel' : 'Pause carousel')} aria-label={t(manualPause ? 'Play carousel' : 'Pause carousel')} aria-pressed={manualPause} onClick={() => setManualPause(value => !value)} className="grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white">{manualPause ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}</button>
          <span className="mr-1 text-xs font-black tabular-nums text-white/70">
            {activeIndex + 1} / {items.length}
          </span>
          <button
            className="grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white transition hover:bg-white hover:text-ink focus:outline-none focus:ring-4 focus:ring-white/25"
            onClick={() => move(-1)}
            aria-label={t("Previous featured content")}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            className="grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white transition hover:bg-white hover:text-ink focus:outline-none focus:ring-4 focus:ring-white/25"
            onClick={() => move(1)}
            aria-label={t("Next featured content")}
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-5 pb-12 text-white drop-shadow-md sm:p-8 sm:pb-14 lg:max-w-3xl lg:p-10 lg:pb-14">
        <p className="text-xs font-black uppercase text-citron">{t("K-Wave picks")}</p>
        <h1 className="mt-2 line-clamp-2 break-words text-3xl font-black leading-tight tracking-normal sm:text-4xl">{activeItem.title}</h1>
        <p className="mt-2 text-sm font-bold text-white/80">{activeItem.subtitle}</p>
        <p className="mt-3 line-clamp-2 max-w-2xl text-sm leading-6 text-white/70 sm:text-base sm:leading-7">
          {activeItem.description}
        </p>
        <button
          className="mt-5 inline-flex h-11 items-center gap-2 rounded-lg bg-coral px-4 text-sm font-black text-white transition hover:bg-white hover:text-ink focus:outline-none focus:ring-4 focus:ring-coral/30"
          onClick={() => onOpen(activeItem)}
        >
          {t("View details")}<ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1" aria-label={t("Choose featured content")}>
        {items.map((item, index) => (
          <button
            key={item.id}
            className="grid h-11 w-11 place-items-center"
            onClick={() => setActiveIndex(index)}
            aria-label={`Show ${item.title}`}
            aria-current={index === activeIndex ? 'true' : undefined}
          ><span className={`h-1.5 rounded-full transition-all ${index === activeIndex ? 'w-8 bg-citron' : 'w-4 bg-white/40'}`} /></button>
        ))}
      </div>
    </section>
  );
}

const featuredKind: Record<KWaveContent['kind'], { label: string; icon: LucideIcon }> = {
  movie: { label: 'K-Movie', icon: Clapperboard },
  drama: { label: 'K-Drama', icon: Clapperboard },
  song: { label: 'K-POP track', icon: Music2 },
  idol: { label: 'K-POP artist', icon: Users },
  food: { label: 'K-Food', icon: Soup },
};

function isContent(item: KWaveContent | undefined): item is KWaveContent {
  return Boolean(item);
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
  const t = useUI();
  return (
    <div className="min-w-0 border-t border-ink/10 pt-4">
      <div className="mb-4 flex items-center justify-between border-b border-ink/10 pb-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-coral">{t(label)}</p>
          <h3 className="mt-1 text-xl font-black tracking-normal text-ink">{t(title)}</h3>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-full bg-ink text-white">{icon}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
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
  const t = useUI();
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
        <h3 className="text-2xl font-black tracking-normal">{t(title)}</h3>
        <p className={`mt-3 text-sm leading-6 ${isDark ? 'text-white/70' : 'text-ink/60'}`}>{t(description)}</p>
      </span>
      <span className={`inline-flex items-center gap-2 text-sm font-black ${isDark ? 'text-citron' : 'text-sea'}`}>
        {t("View more")}<ArrowRight className="h-4 w-4" />
      </span>
    </button>
  );
}
