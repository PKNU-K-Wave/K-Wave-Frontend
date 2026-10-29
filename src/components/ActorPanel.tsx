import { useUI } from "../utils/ui";
import { ContentImage } from "./ContentImage";
import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { fetchActor, fetchVideoDetailContent } from '../api/backend';
import type { KWaveContent, Language } from '../types/content';

export function ActorPanel({ actorId, language, onBack, onOpen }: { actorId: number; language: Language; onBack: () => void; onOpen: (item: KWaveContent) => void }) {
  const t = useUI();
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchActor>> | null>(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [filmId, setFilmId] = useState<number | null>(null);
  const [filmError, setFilmError] = useState(false);
  useEffect(() => {
    const controller = new AbortController(); setData(null); setError(false);
    fetchActor(actorId, language, controller.signal).then(value => { if (!controller.signal.aborted) setData(value); }).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [actorId, language, retry]);
  useEffect(() => {
    if (filmId === null) return;
    const controller = new AbortController(); setFilmError(false);
    fetchVideoDetailContent(filmId, language, controller.signal).then(value => { if (!controller.signal.aborted) onOpen(value); }).catch(() => { if (!controller.signal.aborted) { setFilmError(true); setFilmId(null); } });
    return () => controller.abort();
  }, [filmId, language, onOpen]);
  return <div className="p-5 sm:p-8">
    <button onClick={onBack} className="mb-6 flex min-h-11 items-center gap-2 font-bold"><ArrowLeft className="h-5 w-5" />{t("Back to title")}</button>
    {error ? <div role="alert">{t("Could not load this actor.")}<button onClick={() => setRetry(retry + 1)} className="min-h-11 underline">{t("Try again")}</button></div> : !data ? <p role="status">{t("Loading actor...")}</p> : <>
      <div className="flex items-center gap-5">{data.profile.profileUrl && <ContentImage src={data.profile.profileUrl} alt="" className="h-36 w-28 rounded-lg object-cover" />}<div className="min-w-0"><h2 className="break-words text-2xl font-black">{data.profile.name}</h2><p className="mt-2 text-sm text-sea">{data.profile.filmographyCount} {t("titles")}</p></div></div>
      <h3 className="mb-4 mt-8 text-lg font-bold">{t("Filmography")}</h3>
      {filmError && <p role="alert" className="mb-4 text-red-700">{t("Could not open this title. Please try again.")}</p>}
      {!data.films.length && <p>{t("No filmography available yet.")}</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{data.films.map(film => <button key={film.contentId} disabled={filmId !== null} onClick={() => setFilmId(film.contentId)} className="flex gap-3 rounded-lg bg-white p-3 text-left disabled:opacity-60">
        {film.posterUrl && <ContentImage src={film.posterUrl} alt="" className="h-28 w-20 shrink-0 rounded object-cover" />}
        <div className="min-w-0"><p className="text-xs font-bold text-sea">{film.type}</p><h4 className="mt-1 break-words font-bold">{film.title}</h4><p className="mt-2 text-sm text-ink/60">{film.releaseDate?.slice(0, 4)}</p>{film.characterName && <p className="text-sm text-ink/60">{film.characterName}</p>}{film.voteAverage !== null && <p className="text-sm">{film.voteAverage} / 10</p>}{filmId === film.contentId && <Loader2 aria-label={t("Loading title")} className="h-5 w-5 animate-spin" />}</div>
      </button>)}</div>
    </>}
  </div>;
}
