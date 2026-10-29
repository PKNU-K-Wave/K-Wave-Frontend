import type { RecommendationPreference } from '../utils/recommendations';
import type { IdolContent, KWaveContent, Language, Person, SongContent, VideoContent } from '../types/content';

const DEFAULT_API_BASE_URL = 'https://kwavepknu.me';
const FALLBACK_IMAGE_URL = '';
const FALLBACK_SONG_IMAGE_URL = '';
const FALLBACK_VIDEO_IMAGE_URL = '';

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
  debutYear?: number | null;
  generation?: string | null;
  agency?: string | null;
  genres?: string | null;
  description?: string | null;
  fandomCulture?: string | null;
  trackTotal?: number | null;
};

type MemberResponse = {
  memberId: number;
  name: string;
  photoUrl?: string | null;
};

type SongResponse = {
  songId: number;
  previewUrl?: string | null;
  contentId?: number;
  title: string;
  albumImgUrl?: string | null;
  releaseDate?: string | null;
  featuring?: string | null;
  artistId?: number;
  artistName?: string;
  genre?: string | null;
  trackSeconds?: number | null;
  recordType?: string | null;
  isTitleTrack?: boolean | null;
};

type VideoSummaryResponse = {
  contentId: number;
  type: string;
  title: string;
  description?: string | null;
  summary?: string | null;
  resolvedLanguage?: string | null;
  voteAverage?: number | null;
  voteCount?: number | null;
  posterThumbUrl?: string | null;
  releaseDate?: string | null;
  director?: string | null;
  posterUrl?: string | null;
  genres?: string[] | null;
  relatedContentIds?: number[] | null;
  relatedCount?: number | null;
  ostCount?: number | null;
  relationType?: string;
  sharedActors?: Array<{ actorId: number; name: string }>;
};

type VideoDetailResponse = VideoSummaryResponse & {
  culturalBackground?: string | null;
  seasonCount?: number | null;
  totalEpisodes?: number | null;
  seasons?: VideoContent['seasons'];
  osts?: SongResponse[];
  relatedContents?: VideoSummaryResponse[];
  actors?: Array<{
    actorId: number;
    name: string;
    profileUrl?: string | null;
    profileThumbUrl?: string | null;
    characterName?: string | null;
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
  thumbnailUrl?: string | null;
  voteAverage?: number | null;
  voteCount?: number | null;
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

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
export const apiBaseUrl = (configuredApiBaseUrl === undefined ? DEFAULT_API_BASE_URL : configuredApiBaseUrl.trim()).replace(/\/$/, '');

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

async function request<T>(path: string, signal?: AbortSignal, accessToken?: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, { signal, headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined });

  if (!response.ok) {
    throw new ApiError(response.status, `API request failed: ${response.status} ${response.statusText}`);
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
  const videos = await request<ApiPage<VideoSummaryResponse>>(`/api/v1/videos?lang=${language}&size=12&sort=voteCount&direction=desc`, signal);
  return videos.content.map(mapVideoToContent);
}

export type ApiPage<T> = { content: T[]; number: number; totalPages: number; totalElements: number };
export type VideoFilters = { type: string; genre: string; sort: string; direction?: 'asc' | 'desc'; yearFrom?: number; yearTo?: number; hasOst?: boolean };
export async function fetchVideoPage(language: Language, filters: VideoFilters, page: number, signal: AbortSignal): Promise<ApiPage<VideoContent>> {
  if (!Number.isSafeInteger(page) || page < 0 || page * 12 > 10_000) throw new Error('This page is outside the catalog browsing range.');
  const params = new URLSearchParams({ lang: language, page: String(page), size: '12', sort: filters.sort });
  if (filters.type) params.set('type', filters.type);
  if (filters.genre) params.set('genre', filters.genre);
  if (filters.direction) params.set('direction', filters.direction);
  if (filters.yearFrom !== undefined) params.set('yearFrom', String(filters.yearFrom));
  if (filters.yearTo !== undefined) params.set('yearTo', String(filters.yearTo));
  if (filters.hasOst !== undefined) params.set('hasOst', String(filters.hasOst));
  const response = await request<ApiPage<VideoSummaryResponse>>(`/api/v1/videos?${params}`, signal);
  return { ...response, content: response.content.map(mapVideoToContent) };
}

export type VideoGenre = { code: string; name: string; count: number };
export async function fetchVideoCapabilities(signal: AbortSignal) {
  const unavailable = { years: false, direction: false, ost: false };
  const sample = await request<ApiPage<VideoSummaryResponse>>('/api/v1/videos?lang=en&page=0&size=1', signal);
  const first = sample.content?.[0];
  // These fields identify the audited video release, after direction and hasOst were added.
  if (!first || typeof first.ostCount !== 'number' || typeof first.relatedCount !== 'number' || !('resolvedLanguage' in first)) return unavailable;
  // Old deployments silently ignore unknown query parameters; verify year filtering as well.
  const probe = await request<ApiPage<VideoSummaryResponse>>('/api/v1/videos?lang=en&page=0&size=1&yearFrom=1900&yearTo=1901', signal);
  if (!Array.isArray(probe.content) || (probe.content.length === 0 && probe.totalElements !== 0)) return unavailable;
  const years = probe.content.every(video => { const year = toYear(video.releaseDate); return year >= 1900 && year <= 1901; });
  return years ? { years: true, direction: true, ost: true } : unavailable;
}

export async function fetchVideoGenres(language: Language, type: string, signal: AbortSignal): Promise<VideoGenre[]> {
  const params = new URLSearchParams({ lang: language });
  if (type) params.set('type', type);
  const genres = await request<VideoGenre[]>(`/api/v1/videos/genres?${params}`, signal);
  if (!Array.isArray(genres) || !genres.every(value => typeof value.code === 'string' && typeof value.name === 'string' && typeof value.count === 'number')) throw new Error('Invalid genre response.');
  return genres;
}

export async function fetchVideoConnections(contentId: number, kind: 'related' | 'osts', language: Language, page: number, signal: AbortSignal): Promise<ApiPage<KWaveContent>> {
  if (!Number.isSafeInteger(page) || page < 0 || page * 12 > 10_000) throw new Error('This page is outside the catalog browsing range.');
  const params = new URLSearchParams({ page: String(page), size: '12' });
  if (kind === 'related') params.set('lang', language);
  const result = await request<ApiPage<VideoSummaryResponse | SongResponse>>(`/api/v1/videos/${contentId}/${kind}?${params}`, signal);
  if (!result || !Array.isArray(result.content) || result.number !== page || !Number.isInteger(result.totalPages) || !Number.isInteger(result.totalElements)) throw new Error('Invalid connection response.');
  return { ...result, content: result.content.map(item => kind === 'related' ? mapVideoToContent(item as VideoSummaryResponse) : mapSongToContent(item as SongResponse)) };
}

export type ActorProfile = { actorId: number; name: string; profileUrl: string | null; profileThumbUrl?: string | null; filmographyCount: number };
export type FilmographyItem = { contentId: number; title: string; posterUrl: string | null; posterThumbUrl?: string | null; releaseDate: string | null; type: string; characterName: string | null; voteAverage: number | null };
export async function fetchActor(actorId: number, language: Language, signal: AbortSignal) {
  const [profile, films] = await Promise.all([
    request<ActorProfile>(`/api/v1/actors/${actorId}`, signal),
    request<FilmographyItem[]>(`/api/v1/actors/${actorId}/filmography?lang=${language}`, signal),
  ]);
  return { profile, films };
}

export function fetchRecommendationTags(categories: string[], signal: AbortSignal, accessToken?: string) {
  return request<string[]>(`/api/v1/recommendations/tags?${new URLSearchParams({ categories: categories.join(',') })}`, signal, accessToken);
}

export function recommendationToContent(result: RecommendationApiResponse): KWaveContent {
  const base = { id: result.id, contentId: result.contentId, title: result.title, subtitle: result.subtitle, imageUrl: result.imageUrl || FALLBACK_IMAGE_URL, thumbnailUrl: result.thumbnailUrl || undefined, tags: result.tags, description: result.description };
  if (result.contentType === 'song') return { ...base, kind: 'song', artist: result.subtitle, album: '', releaseYear: 0, relatedIdolIds: [] };
  if (result.contentType === 'idol') return { ...base, kind: 'idol', instagramUrl: '', members: [], relatedSongIds: [] };
  return { ...base, kind: result.contentType, year: 0, director: '', cast: [], ostIds: [], streaming: [], voteAverage: result.voteAverage ?? undefined, voteCount: result.voteCount ?? undefined };
}

export function fetchContentDetail(item: KWaveContent, language: Language, signal: AbortSignal): Promise<KWaveContent> {
  if (item.kind === 'food') return Promise.resolve(item);
  const domainId = Number(item.id.split('-').pop());
  if (!Number.isSafeInteger(domainId) || domainId <= 0) return Promise.resolve(item);
  return fetchSearchDetail({ resultType: item.kind === 'song' ? 'SONG' : item.kind === 'idol' ? 'ARTIST' : 'VIDEO', domainId, contentId: item.contentId ?? domainId, subtype: null, title: item.title, subtitle: item.subtitle, imageUrl: item.imageUrl }, language, signal);
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
  thumbnailUrl?: string | null;
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
    fetchKPopPage('artists', 0, signal),
    fetchKPopPage('songs', 0, signal),
  ]);
  return {
    idols: artists.content as IdolContent[],
    songs: songs.content as SongContent[],
  };
}

export type KPopCollection = 'songs' | 'artists';
export const KPOP_PAGE_SIZE = 24;
const legacyKPop = new Map<KPopCollection, Array<SongResponse | ArtistResponse>>();

export async function fetchKPopPage(collection: KPopCollection, page: number, signal?: AbortSignal): Promise<ApiPage<SongContent | IdolContent>> {
  if (!Number.isSafeInteger(page) || page < 0 || page * KPOP_PAGE_SIZE > 10_000) throw new Error('This page is outside the catalog browsing range.');
  const params = new URLSearchParams({ page: String(page), size: String(KPOP_PAGE_SIZE), sort: collection === 'songs' ? 'releaseDate' : 'debutYear', direction: 'desc' });
  const response = legacyKPop.get(collection) ?? await request<ApiPage<SongResponse | ArtistResponse> | Array<SongResponse | ArtistResponse>>(`/api/v1/${collection}?${params}`, signal);
  let result: ApiPage<SongResponse | ArtistResponse>;
  if (Array.isArray(response)) {
    // Older deployments ignore paging. Keep one snapshot rather than downloading it on every page.
    const sorted = legacyKPop.get(collection) ?? [...response].sort((a, b) => {
      if (collection === 'songs') return (('releaseDate' in b && b.releaseDate) || '').localeCompare(('releaseDate' in a && a.releaseDate) || '');
      return (('debutYear' in b && b.debutYear) || 0) - (('debutYear' in a && a.debutYear) || 0);
    });
    legacyKPop.set(collection, sorted);
    result = { content: sorted.slice(page * KPOP_PAGE_SIZE, (page + 1) * KPOP_PAGE_SIZE), number: page, totalElements: sorted.length, totalPages: Math.ceil(sorted.length / KPOP_PAGE_SIZE) };
  } else {
    if (!response || !Array.isArray(response.content) || !Number.isInteger(response.number) || !Number.isInteger(response.totalPages) || !Number.isInteger(response.totalElements)) throw new Error('Invalid catalog response.');
    result = response;
  }
  return { ...result, content: result.content.map(item => collection === 'songs' ? mapSongToContent(item as SongResponse) : mapArtistToIdol(item as ArtistResponse, [], [])) };
}

export async function fetchRecommendations(
  preference: RecommendationPreference,
  signal?: AbortSignal,
  accessToken?: string,
  limit = 4,
): Promise<RecommendationApiResponse[]> {
  if (preference.categories.length === 0) {
    return [];
  }

  const params = new URLSearchParams({
    categories: preference.categories.join(','),
    limit: String(Math.max(1, Math.min(20, limit))),
  });
  if (preference.tags.length > 0) {
    params.set('tags', preference.tags.join(','));
  }

  return request<RecommendationApiResponse[]>(`/api/v1/recommendations?${params.toString()}`, signal, accessToken);
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
    thumbnailUrl: video.posterThumbUrl || undefined,
    tags: unique([typeLabel, ...genres]),
    genres,
    description: video.description || video.summary || '',
    voteAverage: video.voteAverage ?? undefined,
    voteCount: video.voteCount ?? undefined,
    resolvedLanguage: video.resolvedLanguage || undefined,
    culturalBackground: detail.culturalBackground || undefined,
    summary: video.summary || undefined,
    seasonCount: detail.seasonCount ?? undefined,
    totalEpisodes: detail.totalEpisodes ?? undefined,
    seasons: detail.seasons,
    relatedCount: video.relatedCount ?? undefined,
    ostCount: video.ostCount ?? undefined,
    relationType: video.relationType,
    sharedActors: video.sharedActors,
    year: toYear(video.releaseDate),
    director: video.director?.trim() || '',
    cast: (detail.actors ?? []).map(mapActorToPerson),
    ostIds: (detail.osts ?? []).map(song => `song-${song.songId}`),
    connectedItems: [
      ...(detail.osts ?? []).map(song => mapSongToContent(song, { artistId: song.artistId ?? 0, name: song.artistName ?? '', isGroup: false })),
      ...(detail.relatedContents ?? []).map(mapVideoToContent),
    ],
    streaming: [],
    famousLines: (detail.famousLines ?? []).map((line) => line.lineText).filter(line => line?.trim() && line.trim() !== '현재준비중'),
  };
}

function mapActorToPerson(actor: NonNullable<VideoDetailResponse['actors']>[number]): Person {
  return {
    actorId: actor.actorId,
    name: actor.name,
    role: actor.characterName || 'Cast',
    imageUrl: actor.profileThumbUrl || actor.profileUrl || FALLBACK_IMAGE_URL,
  };
}

function mapArtistToIdol(artist: ArtistResponse, members: MemberResponse[], songs: SongResponse[]): IdolContent {
  return {
    id: `artist-${artist.artistId}`,
    contentId: artist.contentId,
    kind: 'idol',
    title: artist.name,
    subtitle: artist.isGroup ? 'Group' : 'Artist',
    imageUrl: artist.repImgUrl || FALLBACK_IMAGE_URL,
    tags: [artist.isGroup ? 'Group' : 'Solo', artist.fandomName ? `${artist.fandomName} fandom` : 'K-POP'],
    genres: artist.genres ? artist.genres.split(/[,;/|]/).map(value => value.trim()).filter(Boolean) : [],
    description: artist.description || (artist.fandomName
      ? `${artist.name} is connected with the ${artist.fandomName} fandom and Korean pop culture discovery.`
      : `${artist.name} is part of the K-Wave music and artist network.`),
    instagramUrl: artist.instagramUrl || '',
    debutYear: artist.debutYear ?? undefined,
    generation: artist.generation || undefined,
    agency: artist.agency || undefined,
    fandomName: artist.fandomName || undefined,
    fandomCulture: artist.fandomCulture || undefined,
    trackTotal: artist.trackTotal ?? undefined,
    members: members.map(mapMemberToPerson),
    relatedSongIds: songs.map((song) => `song-${song.songId}`),
    connectedItems: songs.map(song => mapSongToContent(song, artist)),
  };
}

function mapMemberToPerson(member: MemberResponse): Person {
  return {
    name: member.name,
    role: 'Member',
    imageUrl: member.photoUrl || FALLBACK_IMAGE_URL,
  };
}

function mapSongToContent(song: SongResponse, artist?: ArtistResponse): SongContent {
  return {
    id: `song-${song.songId}`,
    contentId: song.contentId,
    kind: 'song',
    title: song.title,
    subtitle: song.artistName || artist?.name || '',
    artist: song.artistName || artist?.name || '',
    album: '',
    releaseYear: toYear(song.releaseDate),
    imageUrl: song.albumImgUrl || artist?.repImgUrl || FALLBACK_SONG_IMAGE_URL,
    tags: unique(['K-POP', song.genre || '', artist ? (artist.isGroup ? 'Group' : 'Solo') : '', song.isTitleTrack ? 'Title track' : '']),
    genres: song.genre ? song.genre.split(/[,;/|]/).map(value => value.trim()).filter(Boolean) : undefined,
    description: '',
    relatedIdolIds: song.artistId || artist?.artistId ? [`artist-${song.artistId || artist?.artistId}`] : [],
    previewUrl: song.previewUrl || undefined,
    trackSeconds: song.trackSeconds ?? undefined,
    recordType: song.recordType || undefined,
    isTitleTrack: song.isTitleTrack ?? undefined,
    featuring: song.featuring || undefined,
    connectedItems: artist ? [mapArtistToIdol(artist, [], [])] : [],
  };
}

function toYear(date?: string | null): number {
  if (!date) {
    return 0;
  }

  const parsedYear = new Date(date).getFullYear();
  return Number.isNaN(parsedYear) ? 0 : parsedYear;
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}
