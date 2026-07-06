import { useEffect, useMemo, useState } from 'react';
import { fetchKPopContent, mergeContentWithKPop } from '../api/backend';
import { allContent, foods, idols as mockIdols, songs as mockSongs, videos } from '../data/mockContent';
import type { IdolContent, KWaveContent, SongContent } from '../types/content';

type ContentState = {
  allContent: KWaveContent[];
  videos: typeof videos;
  songs: SongContent[];
  idols: IdolContent[];
  foods: typeof foods;
  isLoading: boolean;
  isUsingFallback: boolean;
};

export function useKWaveContent(): ContentState {
  const [songs, setSongs] = useState<SongContent[]>(mockSongs);
  const [idols, setIdols] = useState<IdolContent[]>(mockIdols);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  useEffect(() => {
    let isMounted = true;

    fetchKPopContent()
      .then((content) => {
        if (!isMounted) {
          return;
        }

        const hasApiContent = content.songs.length > 0 || content.idols.length > 0;
        if (hasApiContent) {
          setSongs(content.songs.length > 0 ? content.songs : mockSongs);
          setIdols(content.idols.length > 0 ? content.idols : mockIdols);
          setIsUsingFallback(false);
        } else {
          setIsUsingFallback(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsUsingFallback(true);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const currentAllContent = useMemo(
    () => mergeContentWithKPop(allContent, { songs, idols }),
    [songs, idols],
  );

  return {
    allContent: currentAllContent,
    videos,
    songs,
    idols,
    foods,
    isLoading,
    isUsingFallback,
  };
}
