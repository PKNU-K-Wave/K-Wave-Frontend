import { useUI } from "../utils/ui";
import { Clock3, Music2, Play, Star } from 'lucide-react';
import type { KWaveContent, Language } from '../types/content';
import { translationNotice } from '../utils/videoPresentation';
import { SaveButton } from './SaveButton';
import { ContentImage } from './ContentImage';

type ContentCardProps = {
  item: KWaveContent;
  onOpen: (item: KWaveContent) => void;
  variant?: 'large' | 'compact' | 'saved';
  language?: Language;
};

const iconByKind = {
  movie: Play,
  drama: Play,
  song: Music2,
  idol: Star,
  food: Clock3,
};

export function ContentCard({ item, onOpen, variant = 'compact', language }: ContentCardProps) {
  const t = useUI();
  const Icon = iconByKind[item.kind];
  const isLarge = variant === 'large';
  const isVideo = item.kind === 'movie' || item.kind === 'drama';
  const mediaRatio = isVideo ? 'aspect-[2/3]' : item.kind === 'song' || item.kind === 'idol' ? 'aspect-square' : 'aspect-[16/10]';

  if (variant === 'saved') return <div className="relative min-w-0 rounded-lg bg-white ring-1 ring-ink/10">
    <button className="flex h-full min-h-28 w-full items-center gap-3 p-3 text-left transition hover:bg-ink/5" onClick={() => onOpen(item)}>
      <ContentImage src={item.thumbnailUrl || item.imageUrl} className="h-24 w-16 shrink-0 rounded bg-ink/5 object-contain" />
      <div className="min-w-0 flex-1 pr-10"><p className="text-[10px] font-bold uppercase text-sea">{item.kind === 'idol' ? t("Artist") : item.kind}</p><h3 className="mt-1 line-clamp-2 break-words text-sm font-black leading-5">{item.title}</h3><p className="mt-1 line-clamp-1 text-xs text-ink/55">{item.subtitle}</p></div>
    </button>
    <div className="absolute right-2 top-2"><SaveButton item={item} /></div>
  </div>;

  return (
    <div className="relative h-full min-w-0">
    <button
      className={`group flex h-full w-full min-w-0 flex-col overflow-hidden rounded-lg bg-white text-left shadow-soft ring-1 ring-ink/5 transition hover:-translate-y-1 hover:ring-coral/30 ${
        isLarge ? 'sm:grid sm:grid-cols-[1.15fr_0.85fr]' : ''
      }`}
      onClick={() => onOpen(item)}
    >
      <div className={`relative w-full overflow-hidden bg-ink/5 ${mediaRatio} ${isLarge ? 'sm:self-center' : ''}`}>
        <ContentImage className={`absolute inset-0 h-full w-full ${item.kind === 'food' ? 'object-cover' : 'object-contain'}`} src={item.thumbnailUrl || item.imageUrl} />
        <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-black text-ink shadow sm:left-3 sm:top-3 sm:gap-2 sm:px-3 sm:text-xs">
          <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-coral" />
          {item.kind === 'idol' ? t("ARTIST") : item.kind.toUpperCase()}
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
        <h3 className={`${isLarge ? 'text-2xl sm:text-3xl' : `line-clamp-2 break-words text-sm sm:text-lg ${isVideo ? 'min-h-9 sm:min-h-[2.8rem]' : ''}`} font-black leading-tight tracking-normal text-ink`}>
          {item.title}
        </h3>
        <p className="mt-1 line-clamp-1 text-xs font-semibold text-sea sm:text-sm">{item.subtitle}</p>
        {(item.kind === 'movie' || item.kind === 'drama') && item.voteAverage != null && (item.voteCount ?? 0) > 0 && <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-ink/65"><Star className="h-3.5 w-3.5 text-sea" aria-hidden="true" /><span>{item.voteAverage.toFixed(1)} / 10</span><span className="ml-1 text-ink/45">({item.voteCount?.toLocaleString()})</span></p>}
        {isVideo && language && translationNotice(language, item.resolvedLanguage) && <p className="mt-2 text-xs text-ink/50">{language === 'ja' ? '翻訳準備中' : language === 'zh' ? '翻译准备中' : t("Translation pending")}</p>}
        <p className={`mt-3 hidden text-sm leading-6 text-ink/60 sm:line-clamp-3 ${isVideo ? 'sm:min-h-[4.5rem]' : ''}`}>{isVideo ? item.summary || item.description : item.description}</p>
      </div>
    </button>
    <div className="absolute right-2 top-2"><SaveButton item={item} /></div>
    </div>
  );
}
