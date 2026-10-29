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
  retry: () => void;
};

export function useKWaveContent(language: Language): ContentState {
  const [videos, setVideos] = useState<VideoContent[]>(mockVideos);
  const [songs, setSongs] = useState<SongContent[]>(mockSongs);
  const [idols, setIdols] = useState<IdolContent[]>(mockIdols);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [attempt, setAttempt] = useState(0);

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

      setVideos(videoContent ?? mockVideos);
      setSongs(kpopContent?.songs ?? mockSongs);
      setIdols(kpopContent?.idols ?? mockIdols);
      setIsUsingFallback(videoResult.status === 'rejected' || kpopResult.status === 'rejected');
      setIsLoading(false);
    });

    return () => controller.abort();
  }, [language, attempt]);

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
    retry: () => setAttempt(value => value + 1),
  };
}
