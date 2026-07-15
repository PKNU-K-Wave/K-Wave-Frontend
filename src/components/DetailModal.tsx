import { ExternalLink, Instagram, Link2, MessageCircle, Music2, Play, Quote, Users, X } from 'lucide-react';
import type { FoodContent, IdolContent, KWaveContent, SongContent, VideoContent } from '../types/content';

type DetailModalProps = {
  item: KWaveContent | null;
  allContent: KWaveContent[];
  onClose: () => void;
  onOpenRelated: (item: KWaveContent) => void;
  onAsk: (item: KWaveContent) => void;
};

export function DetailModal({ item, allContent, onClose, onOpenRelated, onAsk }: DetailModalProps) {
  if (!item) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-ink/60 px-0 py-0 backdrop-blur-sm sm:px-4 sm:py-10"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="mx-auto min-h-screen max-w-5xl overflow-hidden bg-paper shadow-soft sm:min-h-0 sm:rounded-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative grid min-h-[20rem] md:grid-cols-[0.9fr_1.1fr]">
          <img className="h-64 w-full object-cover sm:h-80 md:h-full" src={item.imageUrl} alt="" />
          <button
            className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white text-ink shadow transition hover:bg-coral hover:text-white"
            onClick={onClose}
            aria-label="Close detail"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex flex-col justify-end p-5 sm:p-8">
            <div className="mb-4 flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-white px-3 py-1 text-xs font-black text-ink/60">
                  {tag}
                </span>
              ))}
            </div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-coral">{item.kind}</p>
            <h2 className="mt-2 text-3xl font-black leading-tight tracking-normal text-ink sm:text-5xl">{item.title}</h2>
            <p className="mt-2 text-base font-bold text-sea">{item.subtitle}</p>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-ink/65">{item.description}</p>
          </div>
        </div>

        <div className="grid gap-6 p-5 sm:gap-8 sm:p-8 md:grid-cols-[1fr_18rem]">
          <main className="min-w-0">
            {item.kind === 'movie' || item.kind === 'drama' ? (
              <VideoDetails item={item} allContent={allContent} onOpenRelated={onOpenRelated} />
            ) : null}
            {item.kind === 'song' ? <SongDetails item={item} allContent={allContent} onOpenRelated={onOpenRelated} /> : null}
            {item.kind === 'idol' ? <IdolDetails item={item} allContent={allContent} onOpenRelated={onOpenRelated} /> : null}
            {item.kind === 'food' ? <FoodDetails item={item} /> : null}
          </main>

          <aside className="rounded-lg border border-ink/10 bg-white p-5">
            <h3 className="text-sm font-black uppercase tracking-[0.14em] text-ink/45">Why it connects</h3>
            <p className="mt-3 text-sm leading-6 text-ink/65">
              K-Wave treats culture as a network. A drama can lead to an OST, a song can lead to an idol group, and a food
              page can lead to everyday Korean habits.
            </p>
            {item.kind !== 'food' ? (
              <button
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 py-3 text-sm font-black text-white transition hover:bg-coral"
                onClick={() => onAsk(item)}
              >
                <MessageCircle className="h-4 w-4" />
                Ask about this
              </button>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}

function VideoDetails({
  item,
  allContent,
  onOpenRelated,
}: {
  item: VideoContent;
  allContent: KWaveContent[];
  onOpenRelated: (item: KWaveContent) => void;
}) {
  return (
    <div className="space-y-8">
      <InfoGrid
        items={[
          ['Year', String(item.year)],
          ['Director', item.director],
          ['Streaming', item.streaming.join(', ')],
        ]}
      />
      <People title="Cast" people={item.cast} />
      {item.famousLines && item.famousLines.length > 0 ? (
        <div>
          <h3 className="flex items-center gap-2 text-lg font-black text-ink">
            <Quote className="h-5 w-5 text-coral" />
            Famous Lines
          </h3>
          <div className="mt-4 space-y-3">
            {item.famousLines.map((line) => (
              <blockquote key={line} className="rounded-lg bg-white p-4 text-sm font-semibold leading-7 text-ink/70">
                {line}
              </blockquote>
            ))}
          </div>
        </div>
      ) : null}
      <RelatedItems
        title="Connected OST"
        ids={item.ostIds}
        allContent={allContent}
        icon={<Music2 className="h-4 w-4" />}
        onOpen={onOpenRelated}
      />
    </div>
  );
}

function SongDetails({
  item,
  allContent,
  onOpenRelated,
}: {
  item: SongContent;
  allContent: KWaveContent[];
  onOpenRelated: (item: KWaveContent) => void;
}) {
  return (
    <div className="space-y-8">
      <InfoGrid
        items={[
          ['Artist', item.artist],
          ['Album', item.album],
          ['Release', String(item.releaseYear)],
        ]}
      />
      <RelatedItems
        title="Related Idol"
        ids={item.relatedIdolIds}
        allContent={allContent}
        icon={<Users className="h-4 w-4" />}
        onOpen={onOpenRelated}
      />
      {item.challengeUrl ? <ExternalButton href={item.challengeUrl} label="Open challenge link" icon="play" /> : null}
    </div>
  );
}

function IdolDetails({
  item,
  allContent,
  onOpenRelated,
}: {
  item: IdolContent;
  allContent: KWaveContent[];
  onOpenRelated: (item: KWaveContent) => void;
}) {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3">
        {item.instagramUrl ? <ExternalButton href={item.instagramUrl} label="Instagram" icon="instagram" /> : null}
        {item.challengeUrl ? <ExternalButton href={item.challengeUrl} label="Challenge video" icon="play" /> : null}
      </div>
      <People title="Members" people={item.members} />
      <RelatedItems
        title="Popular Songs"
        ids={item.relatedSongIds}
        allContent={allContent}
        icon={<Music2 className="h-4 w-4" />}
        onOpen={onOpenRelated}
      />
    </div>
  );
}

function FoodDetails({ item }: { item: FoodContent }) {
  return (
    <div className="space-y-8">
      <InfoGrid
        items={[
          ['Cook Time', item.cookTime],
          ['Difficulty', item.difficulty],
        ]}
      />
      <div>
        <h3 className="text-lg font-black text-ink">Ingredients</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {item.ingredients.map((ingredient) => (
            <span key={ingredient} className="rounded-full bg-white px-3 py-2 text-sm font-bold text-ink/65">
              {ingredient}
            </span>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-lg font-black text-ink">Simple Recipe</h3>
        <ol className="mt-3 space-y-3">
          {item.steps.map((step, index) => (
            <li key={step} className="flex gap-3 rounded-lg bg-white p-4 text-sm leading-6 text-ink/70">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-citron text-xs font-black text-ink">
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function InfoGrid({ items }: { items: Array<[string, string]> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-lg bg-white p-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-ink/40">{label}</p>
          <p className="mt-2 text-sm font-bold text-ink">{value || 'Not available'}</p>
        </div>
      ))}
    </div>
  );
}

function People({ title, people }: { title: string; people: Array<{ name: string; role: string; imageUrl: string }> }) {
  return (
    <div>
      <h3 className="text-lg font-black text-ink">{title}</h3>
      {people.length > 0 ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {people.map((person) => (
            <div key={person.name} className="flex items-center gap-3 rounded-lg bg-white p-3">
              <img className="h-16 w-16 rounded-lg object-cover" src={person.imageUrl} alt="" />
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-ink">{person.name}</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-ink/55">{person.role}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 rounded-lg bg-white p-4 text-sm text-ink/55">No cast information is available yet.</p>
      )}
    </div>
  );
}

function RelatedItems({
  title,
  ids,
  allContent,
  icon,
  onOpen,
}: {
  title: string;
  ids: string[];
  allContent: KWaveContent[];
  icon: React.ReactNode;
  onOpen: (item: KWaveContent) => void;
}) {
  const relatedItems = ids.map((id) => allContent.find((content) => content.id === id)).filter(Boolean) as KWaveContent[];

  return (
    <div>
      <h3 className="text-lg font-black text-ink">{title}</h3>
      {relatedItems.length > 0 ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {relatedItems.map((related) => (
            <button
              key={related.id}
              className="flex items-center gap-3 rounded-lg bg-white p-3 text-left transition hover:bg-sea hover:text-white"
              onClick={() => onOpen(related)}
            >
              <img className="h-16 w-16 rounded-lg object-cover" src={related.imageUrl} alt="" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-xs font-black uppercase opacity-60">
                  {icon}
                  {related.kind}
                </span>
                <span className="mt-1 block truncate text-sm font-black">{related.title}</span>
              </span>
              <Link2 className="h-4 w-4 shrink-0" />
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-3 rounded-lg bg-white p-4 text-sm text-ink/55">No connected item is available yet.</p>
      )}
    </div>
  );
}

function ExternalButton({ href, label, icon }: { href: string; label: string; icon: 'instagram' | 'play' }) {
  const Icon = icon === 'instagram' ? Instagram : Play;

  return (
    <a
      className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-black text-white transition hover:bg-coral"
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={(event) => {
        event.preventDefault();
        window.open(href, '_blank', 'noopener,noreferrer');
      }}
    >
      <Icon className="h-4 w-4" />
      {label}
      <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );
}
