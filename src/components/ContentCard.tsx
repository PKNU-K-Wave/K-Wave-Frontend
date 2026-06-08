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

  return (
    <button
      className={`group flex h-full min-w-0 flex-col overflow-hidden rounded-lg bg-white text-left shadow-soft ring-1 ring-ink/5 transition hover:-translate-y-1 hover:ring-coral/30 ${
        isLarge ? 'sm:grid sm:grid-cols-[1.15fr_0.85fr]' : ''
      }`}
      onClick={() => onOpen(item)}
    >
      <div className={`relative overflow-hidden ${isLarge ? 'min-h-72 sm:min-h-96' : 'aspect-[4/5]'}`}>
        <img className="h-full w-full object-cover transition duration-500 group-hover:scale-105" src={item.imageUrl} alt="" />
        <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-ink shadow">
          <Icon className="h-3.5 w-3.5 text-coral" />
          {item.kind.toUpperCase()}
        </div>
      </div>

      <div className={`flex flex-1 flex-col p-4 ${isLarge ? 'justify-end sm:p-6' : ''}`}>
        <div className="mb-3 flex flex-wrap gap-2">
          {item.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full bg-ink/5 px-2.5 py-1 text-[11px] font-bold text-ink/60">
              {tag}
            </span>
          ))}
        </div>
        <h3 className={`${isLarge ? 'text-3xl' : 'text-lg'} font-black leading-tight tracking-normal text-ink`}>
          {item.title}
        </h3>
        <p className="mt-1 text-sm font-semibold text-sea">{item.subtitle}</p>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-ink/60">{item.description}</p>
      </div>
    </button>
  );
}
