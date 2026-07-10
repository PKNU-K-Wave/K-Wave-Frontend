import { useEffect, useMemo, useState } from 'react';
import { fetchKPopContent, fetchVideoContent, resolveVideoRelations } from '../api/backend';
import {
  allContent as mockAllContent,
  foods,
  idols as mockIdols,
  songs as mockSongs,
  videos as mockVideos,
} from '../data/mockContent';
import type { IdolContent, KWaveContent, Language, SongContent, VideoContent } from '../types/content';

type ContentState = {
  allContent: KWaveContent[];
  videos: VideoContent[];
  songs: SongContent[];
  idols: IdolContent[];
  foods: typeof foods;
  isLoading: boolean;
  isUsingFallback: boolean;
};

export function useKWaveContent(language: Language): ContentState {
  const [videos, setVideos] = useState<VideoContent[]>(mockVideos);
  const [songs, setSongs] = useState<SongContent[]>(mockSongs);
  const [idols, setIdols] = useState<IdolContent[]>(mockIdols);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);

    Promise.allSettled([
      fetchVideoContent(language, controller.signal),
      fetchKPopContent(controller.signal),
    ]).then(([videoResult, kpopResult]) => {
      if (controller.signal.aborted) {
        return;
      }

      const videoContent = videoResult.status === 'fulfilled' ? videoResult.value : null;
      const kpopContent = kpopResult.status === 'fulfilled' ? kpopResult.value : null;
      const hasVideos = Boolean(videoContent?.length);
      const hasKPop = Boolean(kpopContent && (kpopContent.songs.length > 0 || kpopContent.idols.length > 0));

      setVideos(videoContent?.length ? videoContent : mockVideos);
      setSongs(kpopContent?.songs.length ? kpopContent.songs : mockSongs);
      setIdols(kpopContent?.idols.length ? kpopContent.idols : mockIdols);
      setIsUsingFallback(!hasVideos || !hasKPop);
      setIsLoading(false);
    });

    return () => controller.abort();
  }, [language]);

  const currentAllContent = useMemo(() => {
    const mergedContent: KWaveContent[] = [...videos, ...songs, ...idols, ...foods];
    return mergedContent.map((item) =>
      item.kind === 'movie' || item.kind === 'drama' ? resolveVideoRelations(item, mergedContent) : item,
    );
  }, [videos, songs, idols]);

  const resolvedVideos = useMemo(
    () => currentAllContent.filter((item): item is VideoContent => item.kind === 'movie' || item.kind === 'drama'),
    [currentAllContent],
  );

  return {
    allContent: currentAllContent.length > 0 ? currentAllContent : mockAllContent,
    videos: resolvedVideos,
    songs,
    idols,
    foods,
    isLoading,
    isUsingFallback,
  };
}
