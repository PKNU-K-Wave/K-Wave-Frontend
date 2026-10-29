import { useUI } from "../utils/ui";
import { ContentImage } from "./ContentImage";
import { ExternalLink, Instagram, Link2, MessageCircle, Music2, Play, Quote, Users, X, Share2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ActorPanel } from './ActorPanel';
import { SongPreview } from './SongPreview';
import { SaveButton } from './SaveButton';
import { VideoConnections } from './VideoConnections';
import { seasonLabel, translationNotice } from '../utils/videoPresentation';
import type { Language, Person } from '../types/content';
import type { FoodContent, IdolContent, KWaveContent, SongContent, VideoContent } from '../types/content';

type DetailModalProps = {
  item: KWaveContent | null;
  allContent: KWaveContent[];
  onClose: () => void;
  onOpenRelated: (item: KWaveContent) => void;
  onAsk: (item: KWaveContent) => void;
  language: Language;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
};

export function DetailModal({ item, allContent, onClose, onOpenRelated, onAsk, language, loading, error, onRetry }: DetailModalProps) {
  const t = useUI();
  const [actorId, setActorId] = useState<number | null>(null);
  const [shareStatus, setShareStatus] = useState('');
  const dialog = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const hasItem = Boolean(item);
  useEffect(() => {
    if (!hasItem) return;
    const previous = document.activeElement as HTMLElement | null;
    const root = document.getElementById('root');
    const wasInert = root?.inert ?? false;
    if (root) root.inert = true;
    const focusable = () => Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input,select,textarea,[tabindex="0"]') ?? []).filter(element => element.getClientRects().length > 0);
    const timer = window.setTimeout(() => (focusable()[0] ?? dialog.current)?.focus(), 0);
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); closeRef.current(); }
      if (event.key !== 'Tab') return;
      const nodes = focusable(); const first = nodes[0]; const last = nodes[nodes.length - 1];
      if (!first) { event.preventDefault(); dialog.current?.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || !dialog.current?.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !dialog.current?.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => { window.clearTimeout(timer); document.removeEventListener('keydown', keydown); if (root) root.inert = wasInert; if (previous?.isConnected) previous.focus({ preventScroll: true }); };
  }, [hasItem, item?.id]);
  const openActorTitle = useCallback((next: KWaveContent) => {
    setActorId(null);
    onOpenRelated(next);
  }, [onOpenRelated]);
  if (!item) {
    return null;
  }

  return createPortal(
    <div
      ref={dialog}
      tabIndex={-1}
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-ink/60 px-0 py-0 backdrop-blur-sm sm:px-4 sm:py-10"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={item.title || 'Content details'}
    >
      <div
        className="mx-auto min-h-screen max-w-5xl overflow-hidden bg-paper shadow-soft sm:min-h-0 sm:rounded-lg"
        onClick={(event) => event.stopPropagation()}
      >
        {actorId !== null ? <ActorPanel actorId={actorId} language={language} onBack={() => setActorId(null)} onOpen={openActorTitle} /> : <>
        <div className="relative grid min-h-[20rem] md:grid-cols-[0.9fr_1.1fr]">
          <div className="flex items-center justify-center bg-ink/5 p-4"><ContentImage className="max-h-[65vh] w-full object-contain md:max-h-[36rem]" src={item.imageUrl} alt="" /></div>
          <button
            className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white text-ink shadow transition hover:bg-coral hover:text-white"
            onClick={onClose}
            aria-label={t("Close detail")}
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex flex-col justify-end p-5 sm:p-8">
            <div className="mb-3"><SaveButton item={item} /></div>
            <button className="mb-3 inline-flex min-h-11 w-fit items-center gap-2 text-sm font-bold text-sea" onClick={async () => { try { await navigator.clipboard.writeText(window.location.href); setShareStatus('Link copied'); } catch { setShareStatus(window.location.href); } }}><Share2 className="h-4 w-4" />{t("Copy link")}</button>
            {shareStatus && <p role="status" className="mb-3 break-all text-xs text-sea">{t(shareStatus)}</p>}
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
            {(item.kind === 'movie' || item.kind === 'drama') && translationNotice(language, item.resolvedLanguage) && <p className="mt-3 text-xs font-semibold text-ink/50">{translationNotice(language, item.resolvedLanguage)}</p>}
          </div>
        </div>

        {loading && <p role="status" className="px-5 py-3">{t("Loading details...")}</p>}
        {error && <p role="alert" className="px-5 py-3">{t("Could not load details.")}<button onClick={onRetry} className="min-h-11 underline">{t("Try again")}</button></p>}
        <div className="grid gap-6 p-5 sm:gap-8 sm:p-8 md:grid-cols-[1fr_18rem]">
          <main className="min-w-0">
            {item.kind === 'movie' || item.kind === 'drama' ? (
              <VideoDetails item={item} language={language} allContent={allContent} onOpenRelated={onOpenRelated} onActor={setActorId} />
            ) : null}
            {item.kind === 'song' ? <SongDetails item={item} allContent={allContent} onOpenRelated={onOpenRelated} language={language} /> : null}
            {item.kind === 'idol' ? <IdolDetails item={item} allContent={allContent} onOpenRelated={onOpenRelated} /> : null}
            {item.kind === 'food' ? <FoodDetails item={item} /> : null}
          </main>

          <aside className="rounded-lg border border-ink/10 bg-white p-5">
            <h3 className="text-sm font-black uppercase tracking-[0.14em] text-ink/45">{t("Why it connects")}</h3>
            <p className="mt-3 text-sm leading-6 text-ink/65">
              {t("K-Wave treats culture as a network. A drama can lead to an OST, a song can lead to an idol group, and a food page can lead to everyday Korean habits.")}</p>
            {item.kind !== 'food' ? (
              <button
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 py-3 text-sm font-black text-white transition hover:bg-coral"
                onClick={() => onAsk(item)}
              >
                <MessageCircle className="h-4 w-4" />
                {t("Ask about this")}</button>
            ) : null}
          </aside>
        </div>
        </>}
      </div>
    </div>, document.body
  );
}

function VideoDetails({
  item,
  language,
  allContent,
  onOpenRelated,
  onActor,
}: {
  item: VideoContent;
  language: Language;
  allContent: KWaveContent[];
  onOpenRelated: (item: KWaveContent) => void;
  onActor: (actorId: number) => void;
}) {
  const t = useUI();
  return (
    <div className="space-y-8">
      <InfoGrid
        items={[
          ['Year', item.year ? String(item.year) : ''],
          ['Director', item.director],
          ['Streaming', item.streaming.join(', ')],
          ['Seasons', item.seasonCount != null && item.seasonCount > 0 ? String(item.seasonCount) : ''],
          ['Episodes', item.totalEpisodes != null && item.totalEpisodes > 0 ? String(item.totalEpisodes) : ''],
        ]}
      />
      {item.voteAverage != null && (item.voteCount ?? 0) > 0 && <p className="text-sm font-semibold text-sea">{item.voteAverage.toFixed(1)} / 10 · {item.voteCount?.toLocaleString()} {t("votes")}</p>}
      {item.culturalBackground && <section><h3 className="text-lg font-black">{t("Cultural background")}</h3><p className="mt-3 whitespace-pre-line text-sm leading-7 text-ink/65">{item.culturalBackground}</p></section>}
      {item.kind === 'drama' && (item.seasons?.length ?? 0) > 0 && <section><h3 className="text-lg font-black">{language === 'ja' ? 'シーズン' : language === 'zh' ? '季数' : t("Seasons")}</h3><ul className="mt-3 divide-y divide-ink/10">{item.seasons?.map(season => <li key={season.number} className="flex flex-wrap items-baseline justify-between gap-2 py-3 text-sm"><span className="font-bold">{seasonLabel(season, language)}</span><span className="text-ink/60">{[season.episodes != null ? `${season.episodes} ${language === 'ja' ? '話' : language === 'zh' ? '集' : 'episodes'}` : '', season.airDate || ''].filter(Boolean).join(' · ')}</span></li>)}</ul></section>}
      <People title={t("Cast")} people={item.cast} onActor={onActor} />
      {item.famousLines && item.famousLines.length > 0 ? (
        <div>
          <h3 className="flex items-center gap-2 text-lg font-black text-ink">
            <Quote className="h-5 w-5 text-coral" />
            {t("Famous Lines")}</h3>
          <div className="mt-4 space-y-3">
            {item.famousLines.map((line) => (
              <blockquote key={line} className="rounded-lg bg-white p-4 text-sm font-semibold leading-7 text-ink/70">
                {line}
              </blockquote>
            ))}
          </div>
        </div>
      ) : null}
      <VideoConnections key={`${item.id}:${language}:osts`} item={item} kind="osts" language={language} allContent={allContent} onOpen={onOpenRelated} />
      <VideoConnections key={`${item.id}:${language}:related`} item={item} kind="related" language={language} allContent={allContent} onOpen={onOpenRelated} />
    </div>
  );
}

function SongDetails({
  item,
  allContent,
  onOpenRelated,
  language,
}: {
  item: SongContent;
  language: Language;
  allContent: KWaveContent[];
  onOpenRelated: (item: KWaveContent) => void;
}) {
  const t = useUI();
  const facts: Array<[string, string]> = [
    ['Artist', item.artist],
    ['Album', item.album],
    ['Release', item.releaseYear ? String(item.releaseYear) : ''],
    ['Release type', item.recordType || ''],
    ['Duration', item.trackSeconds && item.trackSeconds > 0 ? `${Math.floor(item.trackSeconds / 60)}:${String(item.trackSeconds % 60).padStart(2, '0')}` : ''],
    ['Featuring', item.featuring || ''],
  ];
  return (
    <div className="space-y-8">
      <SongPreview key={`${item.id}:${item.previewUrl}`} url={item.previewUrl} title={item.title} language={language} />
      <InfoGrid items={facts.filter(([, value]) => Boolean(value))} />
      <RelatedItems
        title={t("Related Idol")}
        ids={item.relatedIdolIds}
        allContent={[...(item.connectedItems ?? []), ...allContent]}
        icon={<Users className="h-4 w-4" />}
        onOpen={onOpenRelated}
      />
      {item.challengeUrl ? <ExternalButton href={item.challengeUrl} label={t("Open challenge link")} icon="play" /> : null}
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
  const t = useUI();
  const facts: Array<[string, string]> = [
    ['Debut', item.debutYear ? String(item.debutYear) : ''],
    ['Generation', item.generation || ''],
    ['Agency', item.agency || ''],
    ['Fandom', item.fandomName || ''],
    ['Tracks', item.trackTotal != null ? item.trackTotal.toLocaleString() : ''],
  ];
  return (
    <div className="space-y-8">
      <InfoGrid items={facts.filter(([, value]) => Boolean(value))} />
      <div className="flex flex-wrap gap-3">
        {item.instagramUrl ? <ExternalButton href={item.instagramUrl} label={t("Instagram")} icon="instagram" /> : null}
        {item.challengeUrl ? <ExternalButton href={item.challengeUrl} label={t("Challenge video")} icon="play" /> : null}
      </div>
      {item.fandomCulture && <section><h3 className="text-lg font-black">{t("Fandom culture")}</h3><p className="mt-3 whitespace-pre-line text-sm leading-7 text-ink/65">{item.fandomCulture}</p></section>}
      <People title={t("Members")} people={item.members} />
      <RelatedItems
        title={t("Songs")}
        ids={item.relatedSongIds}
        allContent={[...(item.connectedItems ?? []), ...allContent]}
        icon={<Music2 className="h-4 w-4" />}
        onOpen={onOpenRelated}
      />
    </div>
  );
}

function FoodDetails({ item }: { item: FoodContent }) {
  const t = useUI();
  return (
    <div className="space-y-8">
      <InfoGrid
        items={[
          ['Cook Time', item.cookTime],
          ['Difficulty', item.difficulty],
        ]}
      />
      <div>
        <h3 className="text-lg font-black text-ink">{t("Ingredients")}</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {item.ingredients.map((ingredient) => (
            <span key={ingredient} className="rounded-full bg-white px-3 py-2 text-sm font-bold text-ink/65">
              {ingredient}
            </span>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-lg font-black text-ink">{t("Simple Recipe")}</h3>
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
  const t = useUI();
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.filter(([, value]) => value && !['Not available', 'N/A'].includes(value.trim())).map(([label, value]) => (
        <div key={label} className="rounded-lg bg-white p-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-ink/40">{t(label)}</p>
          <p className="mt-2 text-sm font-bold text-ink">{value || 'Not available'}</p>
        </div>
      ))}
    </div>
  );
}

function People({ title, people, onActor }: { title: string; people: Person[]; onActor?: (actorId: number) => void }) {
  const t = useUI();
  return (
    <div>
      <h3 className="text-lg font-black text-ink">{t(title)}</h3>
      {people.length > 0 ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {people.map((person) => (
            <div key={person.name} className="flex items-center gap-3 rounded-lg bg-white p-3">
              <ContentImage className="h-16 w-16 rounded-lg object-cover" src={person.imageUrl} alt="" />
              <div className="min-w-0">
                {person.actorId && onActor ? <button className="min-h-11 text-left text-sm font-black text-sea underline" onClick={() => onActor(person.actorId!)}>{person.name}</button> : <p className="truncate text-sm font-black text-ink">{person.name}</p>}
                <p className="mt-1 text-xs font-semibold leading-5 text-ink/55">{person.role}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 rounded-lg bg-white p-4 text-sm text-ink/55">{title === 'Members' ? t("No member information is available yet.") : t("No cast information is available yet.")}</p>
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
  const t = useUI();
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
              <ContentImage className="h-16 w-16 rounded-lg object-cover" src={related.imageUrl} alt="" />
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
        <p className="mt-3 rounded-lg bg-white p-4 text-sm text-ink/55">{t("No connected item is available yet.")}</p>
      )}
    </div>
  );
}

function ExternalButton({ href, label, icon }: { href: string; label: string; icon: 'instagram' | 'play' }) {
  const t = useUI();
  const Icon = icon === 'instagram' ? Instagram : Play;
  let safeHref: string;
  try { const url = new URL(href); if (!['http:', 'https:'].includes(url.protocol)) return null; safeHref = url.href; } catch { return null; }

  return (
    <a
      className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-black text-white transition hover:bg-coral"
      href={safeHref}
      target="_blank"
      rel="noopener noreferrer"
    >
      <Icon className="h-4 w-4" />
      {t(label)}
      <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );
}
