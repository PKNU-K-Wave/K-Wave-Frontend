import type { RecommendationPreference } from '../utils/recommendations';
import type { IdolContent, KWaveContent, Language, Person, SongContent, VideoContent } from '../types/content';

const DEFAULT_API_BASE_URL = 'http://localhost:8080';
const FALLBACK_IMAGE_URL =
  'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80';
const FALLBACK_SONG_IMAGE_URL =
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=80';
const FALLBACK_VIDEO_IMAGE_URL =
  'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=900&q=80';

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

type ArtistResponse = {
  artistId: number;
  contentId?: number;
  name: string;
  isGroup: boolean;
  repImgUrl?: string | null;
  fandomName?: string | null;
  instagramUrl?: string | null;
};

type MemberResponse = {
  memberId: number;
  name: string;
  photoUrl?: string | null;
};

type SongResponse = {
  songId: number;
  contentId?: number;
  title: string;
  albumImgUrl?: string | null;
  releaseDate?: string | null;
  featuring?: string | null;
  artistId?: number;
  artistName?: string;
};

type VideoSummaryResponse = {
  contentId: number;
  type: string;
  title: string;
  description?: string | null;
  releaseDate?: string | null;
  director?: string | null;
  posterUrl?: string | null;
  genres?: string[] | null;
  relatedContentIds?: number[] | null;
};

type VideoDetailResponse = VideoSummaryResponse & {
  actors?: Array<{
    actorId: number;
    name: string;
    profileUrl?: string | null;
  }>;
  famousLines?: Array<{
    lineId: number;
    lineText: string;
  }>;
};

export type RecommendationApiResponse = {
  id: string;
  contentType: 'movie' | 'drama' | 'song' | 'idol';
  domainId: number;
  contentId: number;
  title: string;
  subtitle: string;
  imageUrl?: string | null;
  tags: string[];
  description: string;
  score: number;
  reasons: string[];
};

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? DEFAULT_API_BASE_URL;

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, { signal });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  const body = (await response.json()) as T | ApiResponse<T>;

  if (isApiResponse<T>(body)) {
    return body.data;
  }

  return body;
}

async function requestWithFallback<T>(paths: string[], signal?: AbortSignal): Promise<T> {
  let lastError: unknown;

  for (const path of paths) {
    try {
      return await request<T>(path, signal);
    } catch (error) {
      if (signal?.aborted) {
        throw error;
      }
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('API request failed');
}

function isApiResponse<T>(body: T | ApiResponse<T>): body is ApiResponse<T> {
  return typeof body === 'object' && body !== null && 'success' in body && 'data' in body;
}

export async function fetchVideoContent(language: Language, signal?: AbortSignal): Promise<VideoContent[]> {
  const videos = await request<VideoSummaryResponse[]>(`/api/v1/videos?lang=${language}`, signal);
  return videos.map(mapVideoToContent);
}

export async function fetchVideoDetailContent(
  contentId: number,
  language: Language,
  signal?: AbortSignal,
): Promise<VideoContent> {
  const video = await request<VideoDetailResponse>(`/api/v1/videos/${contentId}?lang=${language}`, signal);
  return mapVideoToContent(video);
}

export async function fetchKPopContent(
  signal?: AbortSignal,
): Promise<{ idols: IdolContent[]; songs: SongContent[] }> {
  const artists = await requestWithFallback<ArtistResponse[]>(['/api/v1/artists', '/api/artists'], signal);
  const artistBundles = await Promise.all(
    artists.map(async (artist) => {
      const [members, songs] = await Promise.all([
        artist.isGroup
          ? requestWithFallback<MemberResponse[]>(
              [`/api/v1/artists/${artist.artistId}/members`, `/api/artists/${artist.artistId}/members`],
              signal,
            ).catch(() => [])
          : [],
        requestWithFallback<SongResponse[]>(
          [`/api/v1/artists/${artist.artistId}/songs`, `/api/artists/${artist.artistId}/songs`],
          signal,
        ).catch(() => []),
      ]);

      return {
        idol: mapArtistToIdol(artist, members, songs),
        songs: songs.map((song) => mapSongToContent(song, artist)),
      };
    }),
  );

  return {
    idols: artistBundles.map((bundle) => bundle.idol),
    songs: artistBundles.flatMap((bundle) => bundle.songs),
  };
}

export async function fetchRecommendations(
  preference: RecommendationPreference,
  signal?: AbortSignal,
): Promise<RecommendationApiResponse[]> {
  if (preference.categories.length === 0) {
    return [];
  }

  const params = new URLSearchParams({
    categories: preference.categories.join(','),
    limit: '4',
  });
  if (preference.tags.length > 0) {
    params.set('tags', preference.tags.join(','));
  }

  return request<RecommendationApiResponse[]>(`/api/v1/recommendations?${params.toString()}`, signal);
}

export function resolveVideoRelations(video: VideoContent, allContent: KWaveContent[]): VideoContent {
  const relatedIds = (video.relatedContentIds ?? [])
    .map((contentId) => allContent.find((item) => item.contentId === contentId))
    .filter((item): item is SongContent => item?.kind === 'song')
    .map((item) => item.id);

  return {
    ...video,
    ostIds: relatedIds.length > 0 ? relatedIds : video.ostIds,
  };
}

function mapVideoToContent(video: VideoSummaryResponse | VideoDetailResponse): VideoContent {
  const kind = video.type.toUpperCase() === 'DRAMA' ? 'drama' : 'movie';
  const typeLabel = kind === 'drama' ? 'Drama' : 'Movie';
  const genres = video.genres ?? [];
  const detail = video as VideoDetailResponse;

  return {
    id: `video-${video.contentId}`,
    contentId: video.contentId,
    relatedContentIds: video.relatedContentIds ?? [],
    kind,
    title: video.title,
    subtitle: genres.length > 0 ? genres.slice(0, 2).join(', ') : `Korean ${typeLabel.toLowerCase()}`,
    imageUrl: video.posterUrl || FALLBACK_VIDEO_IMAGE_URL,
    tags: unique([typeLabel, ...genres]),
    description: video.description || `${video.title} is part of the K-Wave video catalog.`,
    year: toYear(video.releaseDate),
    director: video.director || 'Not available',
    cast: (detail.actors ?? []).map(mapActorToPerson),
    ostIds: [],
    streaming: [],
    famousLines: (detail.famousLines ?? []).map((line) => line.lineText),
  };
}

function mapActorToPerson(actor: NonNullable<VideoDetailResponse['actors']>[number]): Person {
  return {
    name: actor.name,
    role: 'Cast',
    imageUrl: actor.profileUrl || FALLBACK_IMAGE_URL,
  };
}

function mapArtistToIdol(artist: ArtistResponse, members: MemberResponse[], songs: SongResponse[]): IdolContent {
  return {
    id: `artist-${artist.artistId}`,
    contentId: artist.contentId,
    kind: 'idol',
    title: artist.name,
    subtitle: artist.isGroup ? 'K-POP group' : 'K-POP artist',
    imageUrl: artist.repImgUrl || FALLBACK_IMAGE_URL,
    tags: [artist.isGroup ? 'Group' : 'Solo', artist.fandomName ? `${artist.fandomName} fandom` : 'K-POP'],
    description: artist.fandomName
      ? `${artist.name} is connected with the ${artist.fandomName} fandom and Korean pop culture discovery.`
      : `${artist.name} is part of the K-Wave music and artist network.`,
    instagramUrl: artist.instagramUrl || '',
    challengeUrl: artist.instagramUrl || undefined,
    members: members.map(mapMemberToPerson),
    relatedSongIds: songs.map((song) => `song-${song.songId}`),
  };
}

function mapMemberToPerson(member: MemberResponse): Person {
  return {
    name: member.name,
    role: 'Member',
    imageUrl: member.photoUrl || FALLBACK_IMAGE_URL,
  };
}

function mapSongToContent(song: SongResponse, artist: ArtistResponse): SongContent {
  return {
    id: `song-${song.songId}`,
    contentId: song.contentId,
    kind: 'song',
    title: song.title,
    subtitle: song.artistName || artist.name,
    artist: song.artistName || artist.name,
    album: song.featuring ? `Featuring ${song.featuring}` : 'K-POP release',
    releaseYear: toYear(song.releaseDate),
    imageUrl: song.albumImgUrl || artist.repImgUrl || FALLBACK_SONG_IMAGE_URL,
    tags: ['K-POP', artist.isGroup ? 'Group' : 'Solo'],
    description: `${song.title} connects listeners to ${artist.name} and the wider K-Wave music catalog.`,
    relatedIdolIds: [`artist-${song.artistId || artist.artistId}`],
    challengeUrl: artist.instagramUrl || undefined,
  };
}

function toYear(date?: string | null): number {
  if (!date) {
    return new Date().getFullYear();
  }

  const parsedYear = new Date(date).getFullYear();
  return Number.isNaN(parsedYear) ? new Date().getFullYear() : parsedYear;
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}
