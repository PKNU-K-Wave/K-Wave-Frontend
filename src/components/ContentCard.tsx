import { Clock3, Music2, Play, Star } from 'lucide-react';
import type { KWaveContent } from '../types/content';

type ContentCardProps = {
  item: KWaveContent;
  onOpen: (item: KWaveContent) => void;
  variant?: 'large' | 'compact';
};

const iconByKind = {
  movie: Play,
  drama: Play,
  song: Music2,
  idol: Star,
  food: Clock3,
};

export function ContentCard({ item, onOpen, variant = 'compact' }: ContentCardProps) {
  const Icon = iconByKind[item.kind];
  const isLarge = variant === 'large';
  const isVideo = item.kind === 'movie' || item.kind === 'drama';
  const mediaRatio = isVideo ? 'aspect-[2/3]' : item.kind === 'song' || item.kind === 'idol' ? 'aspect-square' : 'aspect-[16/10]';

  return (
    <button
      className={`group flex h-full min-w-0 flex-col overflow-hidden rounded-lg bg-white text-left shadow-soft ring-1 ring-ink/5 transition hover:-translate-y-1 hover:ring-coral/30 ${
        isLarge ? 'sm:grid sm:grid-cols-[1.15fr_0.85fr]' : ''
      }`}
      onClick={() => onOpen(item)}
    >
      <div className={`relative w-full overflow-hidden bg-ink/5 ${mediaRatio} ${isLarge ? 'sm:self-center' : ''}`}>
        <img loading="lazy" decoding="async" className={`absolute inset-0 h-full w-full ${item.kind === 'food' ? 'object-cover' : 'object-contain'}`} src={item.imageUrl} alt="" />
        <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-black text-ink shadow sm:left-3 sm:top-3 sm:gap-2 sm:px-3 sm:text-xs">
          <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-coral" />
          {item.kind.toUpperCase()}
        </div>
      </div>

      <div className={`flex flex-1 flex-col p-3 sm:p-4 ${isLarge ? 'justify-end sm:p-6' : ''}`}>
        <div className="mb-3 hidden flex-wrap gap-2 sm:flex">
          {item.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full bg-ink/5 px-2.5 py-1 text-[11px] font-bold text-ink/60">
              {tag}
            </span>
          ))}
        </div>
        <h3 className={`${isLarge ? 'text-2xl sm:text-3xl' : 'line-clamp-2 break-words text-sm sm:text-lg'} font-black leading-tight tracking-normal text-ink`}>
          {item.title}
        </h3>
        <p className="mt-1 line-clamp-1 text-xs font-semibold text-sea sm:line-clamp-none sm:text-sm">{item.subtitle}</p>
        <p className="mt-3 hidden text-sm leading-6 text-ink/60 sm:block sm:line-clamp-3">{item.description}</p>
      </div>
    </button>
  );
}
