import type { RecommendationPreference } from '../utils/recommendations';
import type { IdolContent, KWaveContent, Language, Person, SongContent, VideoContent } from '../types/content';

const DEFAULT_API_BASE_URL = 'http://13.209.94.227';
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
  osts?: SongResponse[];
  relatedContents?: VideoSummaryResponse[];
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

export type ChatContextPayload = {
  contentType: string;
  domainId?: number;
  contentId?: number;
  title: string;
};

export type ChatTurnPayload = {
  role: 'user' | 'assistant';
  content: string;
};

export type ChatApiResponse = {
  answer: string;
  suggestions: RecommendationApiResponse[];
  responseMode: 'llm' | 'catalog' | 'web';
  citations?: ChatCitation[];
};

export type ChatCitation = { url: string; title: string; startIndex: number; endIndex: number };

export type ChatRequestPayload = {
  message: string;
  language: Language;
  context?: ChatContextPayload;
  history: ChatTurnPayload[];
};

const apiBaseUrl = ((import.meta.env.VITE_API_BASE_URL as string | undefined) || DEFAULT_API_BASE_URL).replace(/\/$/, '');

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, { signal });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  const body = (await response.json()) as T | ApiResponse<T>;

  if (isApiResponse<T>(body)) {
    if (!body.success) throw new Error(body.message || 'API request failed');
    return body.data;
  }

  return body;
}

async function postRequest<T>(path: string, payload: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  const body = (await response.json()) as T | ApiResponse<T>;
  if (isApiResponse<T>(body)) {
    if (!body.success) throw new Error(body.message || 'API request failed');
    return body.data;
  }
  return body;
}

function isApiResponse<T>(body: T | ApiResponse<T>): body is ApiResponse<T> {
  return typeof body === 'object' && body !== null && 'success' in body && 'data' in body;
}

export async function fetchVideoContent(language: Language, signal?: AbortSignal): Promise<VideoContent[]> {
  const videos = await request<ApiPage<VideoSummaryResponse>>(`/api/v1/videos?lang=${language}&size=50`, signal);
  return videos.content.map(mapVideoToContent);
}

export type ApiPage<T> = { content: T[]; number: number; totalPages: number; totalElements: number };
export type VideoFilters = { type: string; genre: string; sort: string };
export async function fetchVideoPage(language: Language, filters: VideoFilters, page: number, signal: AbortSignal): Promise<ApiPage<VideoContent>> {
  const params = new URLSearchParams({ lang: language, page: String(page), size: '12', sort: filters.sort });
  if (filters.type) params.set('type', filters.type);
  if (filters.genre) params.set('genre', filters.genre);
  const response = await request<ApiPage<VideoSummaryResponse>>(`/api/v1/videos?${params}`, signal);
  return { ...response, content: response.content.map(mapVideoToContent) };
}

export type ActorProfile = { actorId: number; name: string; profileUrl: string | null; filmographyCount: number };
export type FilmographyItem = { contentId: number; title: string; posterUrl: string | null; releaseDate: string | null; type: string; characterName: string | null; voteAverage: number | null };
export async function fetchActor(actorId: number, language: Language, signal: AbortSignal) {
  const [profile, films] = await Promise.all([
    request<ActorProfile>(`/api/v1/actors/${actorId}`, signal),
    request<FilmographyItem[]>(`/api/v1/actors/${actorId}/filmography?lang=${language}`, signal),
  ]);
  return { profile, films };
}

export function fetchRecommendationTags(categories: string[], signal: AbortSignal) {
  return request<string[]>(`/api/v1/recommendations/tags?${new URLSearchParams({ categories: categories.join(',') })}`, signal);
}

export function recommendationToContent(result: RecommendationApiResponse): KWaveContent {
  const base = { id: result.id, contentId: result.contentId, title: result.title, subtitle: result.subtitle, imageUrl: result.imageUrl || FALLBACK_IMAGE_URL, tags: result.tags, description: result.description };
  if (result.contentType === 'song') return { ...base, kind: 'song', artist: result.subtitle, album: '', releaseYear: 0, relatedIdolIds: [] };
  if (result.contentType === 'idol') return { ...base, kind: 'idol', instagramUrl: '', members: [], relatedSongIds: [] };
  return { ...base, kind: result.contentType, year: 0, director: '', cast: [], ostIds: [], streaming: [] };
}

export function fetchContentDetail(item: KWaveContent, language: Language, signal: AbortSignal): Promise<KWaveContent> {
  if (item.kind === 'food' || !item.contentId) return Promise.resolve(item);
  const domainId = Number(item.id.split('-').pop());
  return fetchSearchDetail({ resultType: item.kind === 'song' ? 'SONG' : item.kind === 'idol' ? 'ARTIST' : 'VIDEO', domainId, contentId: item.contentId, subtype: null, title: item.title, subtitle: item.subtitle, imageUrl: item.imageUrl }, language, signal);
}
export type SearchType = 'VIDEO' | 'SONG' | 'ARTIST';
export type SearchResult = {
  resultType: SearchType;
  subtype: string | null;
  domainId: number;
  contentId: number;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
};

export function searchContent(q: string, language: Language, type: SearchType | '', page: number, signal: AbortSignal) {
  const params = new URLSearchParams({ q: q.trim(), lang: language, page: String(page), size: '12' });
  if (type) params.set('type', type);
  return request<ApiPage<SearchResult>>(`/api/v1/search?${params}`, signal);
}

export async function fetchSearchDetail(result: SearchResult, language: Language, signal: AbortSignal): Promise<KWaveContent> {
  if (result.resultType === 'VIDEO') return fetchVideoDetailContent(result.contentId, language, signal);
  if (result.resultType === 'ARTIST') {
    const artist = await request<ArtistResponse>(`/api/v1/artists/${result.domainId}`, signal);
    const [members, songs] = await Promise.all([
      artist.isGroup ? request<MemberResponse[]>(`/api/v1/artists/${result.domainId}/members`, signal) : Promise.resolve([]),
      request<SongResponse[]>(`/api/v1/artists/${result.domainId}/songs`, signal),
    ]);
    return mapArtistToIdol(artist, members, songs);
  }
  const song = await request<SongResponse>(`/api/v1/songs/${result.domainId}`, signal);
  const artist = song.artistId
    ? await request<ArtistResponse>(`/api/v1/artists/${song.artistId}`, signal)
    : { artistId: 0, name: song.artistName || '', isGroup: false };
  return mapSongToContent(song, artist);
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
  const [artists, songs] = await Promise.all([
    request<ArtistResponse[]>('/api/v1/artists', signal),
    request<SongResponse[]>('/api/v1/songs', signal),
  ]);
  const artistById = new Map(artists.map(artist => [artist.artistId, artist]));
  return {
    idols: artists.map(artist => mapArtistToIdol(artist, [], [])),
    songs: songs.map(song => mapSongToContent(song, artistById.get(song.artistId ?? 0) ?? { artistId: song.artistId ?? 0, name: song.artistName ?? '', isGroup: false })),
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

export async function sendChatMessage(payload: ChatRequestPayload, signal?: AbortSignal): Promise<ChatApiResponse> {
  return postRequest<ChatApiResponse>('/api/v1/chat', payload, signal);
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
    ostIds: (detail.osts ?? []).map(song => `song-${song.songId}`),
    connectedItems: [
      ...(detail.osts ?? []).map(song => mapSongToContent(song, { artistId: song.artistId ?? 0, name: song.artistName ?? '', isGroup: false })),
      ...(detail.relatedContents ?? []).map(mapVideoToContent),
    ],
    streaming: [],
    famousLines: (detail.famousLines ?? []).map((line) => line.lineText),
  };
}

function mapActorToPerson(actor: NonNullable<VideoDetailResponse['actors']>[number]): Person {
  return {
    actorId: actor.actorId,
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
