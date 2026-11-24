import type { RecommendationPreference } from '../utils/recommendations';
import { displayData } from '../utils/displayText';
import { groupTrends, safeTrendUrl } from '../utils/trends';
import type { TrendGroups } from '../types/trends';
import type { FoodContent, FoodInfo, RecipeDetail, RecipeSummary, IdolContent, KWaveContent, Language, Person, SongContent, VideoContent } from '../types/content';

const DEFAULT_API_BASE_URL = 'https://kwavepknu.me';
export async function fetchTrendFeed(language: Language, signal?: AbortSignal) {
  const raw = await request<{items: unknown[]; pastItems: unknown[]; songs?: {entries?: unknown[]}; netflix?: {entries?: unknown[]}}>('/api/v1/trends?' + new URLSearchParams({lang:language}), signal);
  const charts = (['songs','netflix'] as const).flatMap(source => (raw[source]?.entries ?? []).flatMap(value => {
    if (!value || typeof value !== 'object') return [];
    const row = value as Record<string, unknown>;
    const url = safeTrendUrl(row.externalUrl) ?? (source === 'netflix' ? 'https://www.netflix.com/tudum/top10/south-korea/tv' : null);
    if (!url || typeof row.title !== 'string' || !Number.isSafeInteger(row.rank) || Number(row.rank) < 1) return [];
    return [{key:`${source}:${row.rank}`,name:row.title,description:typeof row.subtitle === 'string' ? row.subtitle : '',url,source:source === 'songs' ? 'Apple Music Korea' : 'Netflix Korea',rank:Number(row.rank)}];
  }));
  charts.sort((a,b)=>a.rank-b.rank);
  return {...groupTrends(raw),charts};
}
export async function fetchTrends(language: Language, signal?: AbortSignal): Promise<TrendGroups> {
  return groupTrends(await request<unknown>(`/api/v1/trends?${new URLSearchParams({lang:language})}`,signal));
}
export async function fetchTrendReference(id: number, language: Language, signal?: AbortSignal): Promise<string | null> {
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error('Invalid trend item ID');
  const detail = await request<{item:{trendItemId:number};referenceUrl?:string}>(`/api/v1/trends/items/${id}?${new URLSearchParams({lang:language})}`,signal);
  if (detail.item?.trendItemId !== id) throw new Error('Invalid trend item detail');
  return safeTrendUrl(detail.referenceUrl);
}

export type FoodCategory = { code: string; name: string; foodCount: number };
export type FoodFilters = { category: string; vegetarian: boolean; exclude: string[] };
export type RecipeFilters = { dishType: string; cookingMethod: string };
type FoodResponse = FoodInfo & { foodId: number; name: string; imageUrl?: string | null; description?: string | null; ingredients?: string | null };
export const FOOD_PAGE_SIZE = 24;
export const RECIPE_DISH_TYPES = ['SIDE', 'ONE_DISH', 'DESSERT', 'RICE', 'SOUP', 'ETC'] as const;
export const RECIPE_METHODS = ['BOIL', 'GRILL', 'STIR_FRY', 'STEAM', 'FRY', 'ETC'] as const;
export async function fetchFoodCategories(language: Language, signal?: AbortSignal): Promise<FoodCategory[]> {
  const result = await request<FoodCategory[]>(`/api/v1/foods/categories?lang=${language}`, signal);
  if (!Array.isArray(result) || result.some(item => typeof item.code !== 'string' || typeof item.name !== 'string')) throw new Error('Invalid food categories.');
  return result;
}
function validateFoodPage(page: number) {
  if (!Number.isSafeInteger(page) || page < 0 || page * FOOD_PAGE_SIZE > 10_000) throw new Error('This page is outside the food browsing range.');
}
function validateFoodResult<T>(result: ApiPage<T>, page: number) {
  if (!result || !Array.isArray(result.content) || result.number !== page || !Number.isSafeInteger(result.totalPages) || result.totalPages < 0 || !Number.isSafeInteger(result.totalElements) || result.totalElements < 0) throw new Error('Invalid food catalog response.');
}
export async function fetchFoodPage(language: Language, filters: FoodFilters, page: number, signal?: AbortSignal): Promise<ApiPage<FoodContent>> {
  validateFoodPage(page);
  const params = new URLSearchParams({ page: String(page), size: String(FOOD_PAGE_SIZE), lang: language, sort: 'popularity', direction: 'desc' });
  if (filters.category) params.set('category', filters.category);
  if (filters.vegetarian) params.set('vegetarian', 'true');
  if (filters.exclude.length) params.set('exclude', filters.exclude.join(','));
  const result = await request<ApiPage<FoodResponse>>(`/api/v1/foods?${params}`, signal);
  validateFoodResult(result, page);
  return { ...result, content: result.content.map(mapFoodToContent) };
}
export async function fetchRecipePage(filters: RecipeFilters, page: number, language: Language, signal?: AbortSignal): Promise<ApiPage<FoodContent>> {
  validateFoodPage(page);
  const params = new URLSearchParams({ page: String(page), size: String(FOOD_PAGE_SIZE), lang: language });
  if (filters.dishType) params.set('dishType', filters.dishType);
  if (filters.cookingMethod) params.set('cookingMethod', filters.cookingMethod);
  const result = await request<ApiPage<RecipeSummary>>(`/api/v1/recipes?${params}`, signal);
  validateFoodResult(result, page);
  return { ...result, content: result.content.map(recipe => mapRecipeToContent(recipe, language)) };
}
export function fetchRecipeDetail(recipeId: number, language: Language, signal?: AbortSignal): Promise<RecipeDetail> {
  if (!Number.isSafeInteger(recipeId) || recipeId <= 0) return Promise.reject(new Error('Invalid recipe ID.'));
  return request<RecipeDetail>(`/api/v1/recipes/${recipeId}?lang=${language}`, signal);
}
function mapFoodToContent(food: FoodResponse): FoodContent {
  return { id: `food-${food.foodId}`, contentId: food.foodId, kind: 'food', title: food.name, subtitle: food.categoryName || food.nameRomanized || '', imageUrl: food.imageUrl || '', tags: [food.categoryName || '', ...(food.isVegetarian === true ? ['Vegetarian'] : [])].filter(Boolean), description: food.description || '', ingredients: food.ingredients ? [food.ingredients] : [], steps: [], foodInfo: { ...food } };
}
function mapRecipeToContent(recipe: RecipeSummary, language: Language): FoodContent {
  const subtitle = [recipe.dishTypeName, recipe.cookingMethodName].filter(Boolean).join(' · ') || { en: 'Recipe', zh: '食谱', ja: 'レシピ' }[language];
  return { id: `food-recipe-${recipe.recipeId}`, recipeId: recipe.recipeId, kind: 'food', title: recipe.name, subtitle, imageUrl: recipe.imageUrl || '', tags: ['Recipe'], description: '', ingredients: [], steps: [] };
}

const FALLBACK_IMAGE_URL = '';
export type TimelineYear = { year: number; songCount: number; videoCount: number };
export type TimelineContent = TimelineYear & { songs: SongContent[]; videos: VideoContent[]; artists: IdolContent[] };
export async function fetchTimelineYears(signal?: AbortSignal): Promise<TimelineYear[]> {
  const rows = await request<TimelineYear[]>('/api/v1/years', signal);
  if (!Array.isArray(rows) || rows.some(row => !Number.isInteger(row.year) || row.year < 1900 || row.year > 2100 || !Number.isSafeInteger(row.songCount) || row.songCount < 0 || !Number.isSafeInteger(row.videoCount) || row.videoCount < 0)) throw new Error('Invalid timeline years.');
  return [...rows].sort((a,b) => a.year-b.year);
}
export async function fetchTimelineYear(year: number, language: Language, signal?: AbortSignal): Promise<TimelineContent> {
  if (!Number.isInteger(year) || year < 1900 || year > 2100) throw new Error('Invalid timeline year.');
  const data = await request<TimelineYear & {songs: SongResponse[]; videos: VideoSummaryResponse[]; debutArtists: ArtistResponse[]}>(`/api/v1/years/${year}?${new URLSearchParams({limit:'4',lang:language})}`, signal);
  if (data.year !== year || !Array.isArray(data.songs) || !Array.isArray(data.videos) || !Array.isArray(data.debutArtists) || !Number.isSafeInteger(data.songCount) || data.songCount < 0 || !Number.isSafeInteger(data.videoCount) || data.videoCount < 0) throw new Error('Invalid timeline response.');
  return {...data,songs:data.songs.map(song => mapSongToContent(song)),videos:data.videos.map(mapVideoToContent),artists:data.debutArtists.map(artist => mapArtistToIdol(artist,[],[]))};
}
const FALLBACK_SONG_IMAGE_URL = '';
const normalizeSongGenre = (value: string) => {
  const genre = value.trim();
  return genre.toLowerCase() === 'k-pop' ? 'K-POP' : genre === '팝' ? 'Pop' : genre;
};
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
  generationName?: string | null;
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
  genreMain?: string | null;
  genreSub?: string | null;
  moodMain?: string | null;
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
  originalDirector?: string | null;
  posterUrl?: string | null;
  genres?: string[] | null;
  relatedContentIds?: number[] | null;
  relatedCount?: number | null;
  ostCount?: number | null;
  relationType?: string;
  sharedActors?: Array<{ actorId: number; name: string; originalName?: string | null }>;
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
    originalName?: string | null;
    profileUrl?: string | null;
    profileThumbUrl?: string | null;
    characterName?: string | null;
    originalCharacterName?: string | null;
  }>;
  famousLines?: Array<{
    lineId: number;
    lineText: string;
  }>;
};

export type RecommendationApiResponse = {
  id: string;
  contentType: 'movie' | 'drama' | 'song' | 'idol' | 'food' | 'recipe';
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

async function request<T>(path: string, signal?: AbortSignal, accessToken?: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers);
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  const response = await fetch(`${apiBaseUrl}${path}`, { ...options, signal, headers });

  if (!response.ok) {
    throw new ApiError(response.status, `API request failed: ${response.status} ${response.statusText}`);
  }

  const body = (await response.json()) as T | ApiResponse<T>;

  if (isApiResponse<T>(body)) {
    if (!body.success) throw new Error(body.message || 'API request failed');
    return displayData(body.data);
  }

  return displayData(body);
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
    return displayData(body.data);
  }
  return displayData(body);
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

export type ActorProfile = { actorId: number; name: string; originalName?: string | null; profileUrl: string | null; profileThumbUrl?: string | null; filmographyCount: number };
export type FilmographyItem = { contentId: number; title: string; posterUrl: string | null; posterThumbUrl?: string | null; releaseDate: string | null; type: string; characterName: string | null; originalCharacterName?: string | null; voteAverage: number | null };
export async function fetchActor(actorId: number, language: Language, signal: AbortSignal) {
  const [profile, films] = await Promise.all([
    request<ActorProfile>(`/api/v1/actors/${actorId}?${new URLSearchParams({ lang: language })}`, signal),
    request<FilmographyItem[]>(`/api/v1/actors/${actorId}/filmography?lang=${language}`, signal),
  ]);
  return { profile, films };
}

export function fetchRecommendationTags(categories: string[], language: Language, signal: AbortSignal, accessToken?: string) {
  return request<string[]>(`/api/v1/recommendations/tags?${new URLSearchParams({ categories: categories.join(','), lang: language })}`, signal, accessToken);
}

type Favorite = { contentId: number; contentType: KWaveContent['kind']; domainId: number; title: string; subtitle: string | null; imageUrl: string | null };
export async function fetchFavorites(token: string, signal: AbortSignal): Promise<KWaveContent[]> {
  const items = new Map<number, KWaveContent>();
  for (let page = 0; ; page++) {
    const data = await request<ApiPage<Favorite>>(`/api/v1/favorites?page=${page}&size=50`, signal, token);
    validateFoodResult(data, page);
    for (const row of data.content) {
      const prefix = row.contentType === 'movie' || row.contentType === 'drama' ? 'video' : row.contentType === 'idol' ? 'artist' : row.contentType;
      items.set(row.contentId, recommendationToContent({ ...row, id: `${prefix}-${row.domainId}`, subtitle: row.subtitle ?? '', description: '', tags: [], score: 0, reasons: [] }));
    }
    if (page + 1 >= data.totalPages) return [...items.values()];
  }
}
export function changeFavorite(contentId: number, add: boolean, token: string, signal?: AbortSignal) {
  return request<null>(add ? '/api/v1/favorites' : `/api/v1/favorites/${contentId}`, signal, token, add ? {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contentId }),
  } : { method: 'DELETE' });
}

export type PersonalType = 'movie' | 'drama' | 'song' | 'artist';
export type PersonalPick = { contentId: number; type: PersonalType; domainId?: number; title: string; artistName: string | null; imageUrl: string | null; genres: string[]; reason: 'TASTE' | 'EXPLORE' | 'POPULAR'; reasonGenre: string | null };
export async function fetchPersonalRecommendations(type: PersonalType, language: Language, token: string, signal: AbortSignal) {
  const data = await request<ApiPage<PersonalPick>>(`/api/v1/recommendations/me?${new URLSearchParams({ type, lang: language, page: '0', size: '10' })}`, signal, token);
  validateFoodResult(data, 0);
  return data.content;
}
export function personalPickToContent(row: PersonalPick): KWaveContent {
  const kind = row.type === 'artist' ? 'idol' : row.type;
  const music = kind === 'song' || kind === 'idol';
  const prefix = kind === 'idol' ? 'artist' : music ? kind : 'video';
  return { ...recommendationToContent({
    id: music && !row.domainId ? `${prefix}-content-${row.contentId}` : `${prefix}-${music ? row.domainId : row.contentId}`,
    contentId: row.contentId, domainId: row.domainId ?? row.contentId, contentType: kind, title: row.title,
    subtitle: row.artistName ?? '', imageUrl: row.imageUrl, description: '', tags: row.genres ?? [], score: 0, reasons: [],
  }), genres: row.genres ?? [] };
}

export function recommendationToContent(result: RecommendationApiResponse): KWaveContent {
  const base = { id: result.id, contentId: result.contentId, title: result.title, subtitle: result.subtitle, imageUrl: result.imageUrl || FALLBACK_IMAGE_URL, thumbnailUrl: result.thumbnailUrl || undefined, tags: result.tags, description: result.description };
  if (result.contentType === 'song') return { ...base, kind: 'song', artist: result.subtitle, album: '', releaseYear: 0, relatedIdolIds: [] };
  if (result.contentType === 'idol') return { ...base, kind: 'idol', instagramUrl: '', members: [], relatedSongIds: [] };
  if (result.contentType === 'food' || result.contentType === 'recipe') return { ...base, kind: 'food', recipeId: result.contentType === 'recipe' ? result.domainId : undefined, ingredients: [], steps: [] };
  return { ...base, kind: result.contentType, year: 0, director: '', cast: [], ostIds: [], streaming: [], voteAverage: result.voteAverage ?? undefined, voteCount: result.voteCount ?? undefined };
}

export function fetchContentDetail(item: KWaveContent, language: Language, signal: AbortSignal, cardOnly = false): Promise<KWaveContent> {
  if (item.kind === 'food') {
    const recipeMatch = /^food-recipe-(\d+)$/.exec(item.id);
    if (recipeMatch) return fetchRecipeDetail(Number(recipeMatch[1]), language, signal).then(recipe => ({ ...mapRecipeToContent(recipe, language), recipe }));
    const foodMatch = /^food-(\d+)$/.exec(item.id);
    if (!foodMatch) return Promise.resolve(item);
    return request<FoodResponse>(`/api/v1/foods/${foodMatch[1]}?${new URLSearchParams({ lang: language })}`, signal).then(mapFoodToContent);
  }
  if (/^(song|artist)-content-\d+$/.test(item.id) && item.contentId) {
    return resolvePersonalMusicDetail(item, item.contentId, language, signal, cardOnly);
  }
  const domainId = Number(item.id.split('-').pop());
  if (!Number.isSafeInteger(domainId) || domainId <= 0) return Promise.resolve(item);
  return fetchSearchDetail({ resultType: item.kind === 'song' ? 'SONG' : item.kind === 'idol' ? 'ARTIST' : 'VIDEO', domainId, contentId: item.contentId ?? domainId, subtype: null, title: item.title, subtitle: item.subtitle, imageUrl: item.imageUrl }, language, signal, cardOnly);
}
async function resolvePersonalMusicDetail(item: KWaveContent, contentId: number, language: Language, signal: AbortSignal, cardOnly: boolean) {
  const type = item.kind === 'song' ? 'SONG' : 'ARTIST';
  const canonical = await request<{ title: string }>(`/api/v1/contents/${contentId}?lang=ko`, signal);
  for (const title of new Set([item.title, canonical.title].filter(Boolean))) {
    const first = await searchContent(title, language, type, 0, signal);
    let results = first.content;
    for (let page = 0; page < Math.min(first.totalPages, 10); page++) {
      if (page) results = (await searchContent(title, language, type, page, signal)).content;
      const match = results.find(result => result.contentId === contentId);
      if (match) return fetchSearchDetail(match, language, signal, cardOnly);
    }
  }
  throw new Error('Could not resolve the recommended title.');
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

export async function fetchSearchDetail(result: SearchResult, language: Language, signal: AbortSignal, cardOnly = false): Promise<KWaveContent> {
  if (result.resultType === 'VIDEO') return fetchVideoDetailContent(result.contentId, language, signal);
  if (result.resultType === 'ARTIST') {
    const artist = await request<ArtistResponse>(`/api/v1/artists/${result.domainId}?lang=${language}`, signal);
    if (cardOnly) return mapArtistToIdol(artist, [], []);
    const [members, songs] = await Promise.all([
      artist.isGroup ? request<MemberResponse[]>(`/api/v1/artists/${result.domainId}/members`, signal) : Promise.resolve([]),
      request<SongResponse[]>(`/api/v1/artists/${result.domainId}/songs`, signal),
    ]);
    return mapArtistToIdol(artist, members, songs);
  }
  const song = await request<SongResponse>(`/api/v1/songs/${result.domainId}?lang=${language}`, signal);
  if (cardOnly) return mapSongToContent(song);
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
  const artistDiscovery = await musicDiscoveryAvailable('artists', signal);
  const songDiscovery = await musicDiscoveryAvailable('songs', signal);
  const [artists, songs] = await Promise.all([
    fetchKPopPage('artists', 0, signal, artistDiscovery ? { sort: 'popularity' } : undefined),
    fetchKPopPage('songs', 0, signal, songDiscovery ? { sort: 'popularity' } : undefined),
  ]);
  return {
    idols: artists.content as IdolContent[],
    songs: songs.content as SongContent[],
  };
}

export type KPopCollection = 'songs' | 'artists';
export const KPOP_PAGE_SIZE = 24;
export const MUSIC_GENRES = ['Dance', 'Ballad', 'Hip-Hop', 'Rock', 'R&B', 'Indie', 'Other'] as const;
export async function musicDiscoveryAvailable(collection: KPopCollection, signal?: AbortSignal): Promise<boolean> {
  try {
    const result = await request<ApiPage<Record<string, unknown>>>(`/api/v1/${collection}?page=0&size=1&sort=popularity&direction=desc`, signal);
    return Array.isArray(result?.content) && result.content.length > 0 && result.content.every(item => Object.prototype.hasOwnProperty.call(item, 'lastfmListeners'));
  } catch (error) {
    if (signal?.aborted) throw error;
    return false;
  }
}
export type KPopFilters = { generation: boolean; generations: string[]; ostOnly: boolean };
export async function fetchKPopFilters(collection: KPopCollection, signal?: AbortSignal): Promise<KPopFilters> {
  try {
    const value = await request<Partial<KPopFilters>>(`/api/v1/${collection}/filters`, signal);
    return { generation: collection === 'artists' && value.generation === true, generations: Array.isArray(value.generations) ? value.generations.filter(item => typeof item === 'string' && item.trim()) : [], ostOnly: collection === 'songs' && value.ostOnly === true };
  } catch (error) {
    if (signal?.aborted) throw error;
    return { generation: false, generations: [], ostOnly: false };
  }
}
export const MUSIC_MOODS = ['happy', 'sad', 'calm', 'romantic', 'intense'] as const;
export type MusicCatalogOptions = { sort: 'popularity' | 'recent'; genre?: string; mood?: string; language?: Language; generation?: string; ostOnly?: boolean };
const legacyKPop = new Map<KPopCollection, Array<SongResponse | ArtistResponse>>();

export async function fetchKPopPage(collection: KPopCollection, page: number, signal?: AbortSignal, options?: MusicCatalogOptions): Promise<ApiPage<SongContent | IdolContent>> {
  if (!Number.isSafeInteger(page) || page < 0 || page * KPOP_PAGE_SIZE > 10_000) throw new Error('This page is outside the catalog browsing range.');
  const params = new URLSearchParams({ page: String(page), size: String(KPOP_PAGE_SIZE), sort: collection === 'songs' ? 'releaseDate' : 'debutYear', direction: 'desc' });
  if (options?.sort === 'popularity') params.set('sort', 'popularity');
  if (options?.genre && collection === 'songs') params.set('genre', options.genre);
  if (options?.mood && collection === 'songs') params.set('mood', options.mood);
  if (options?.ostOnly && collection === 'songs') params.set('ostOnly', 'true');
  if (options?.generation && collection === 'artists') params.set('generation', options.generation);
  if (options?.language) params.set('lang', options.language);
  const response = (!options ? legacyKPop.get(collection) : undefined) ?? await request<ApiPage<SongResponse | ArtistResponse> | Array<SongResponse | ArtistResponse>>(`/api/v1/${collection}?${params}`, signal);
  let result: ApiPage<SongResponse | ArtistResponse>;
  if (Array.isArray(response)) {
    if (options) throw new Error('This server does not support music catalog discovery yet.');
    // Older deployments ignore paging. Keep one snapshot rather than downloading it on every page.
    const sorted = legacyKPop.get(collection) ?? response;
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
  language: Language,
  signal?: AbortSignal,
  accessToken?: string,
  limit = 4,
): Promise<RecommendationApiResponse[]> {
  if (preference.categories.length === 0) {
    return [];
  }

  const params = new URLSearchParams({
    categories: preference.categories.join(','),
    lang: language,
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
    director: video.director?.trim() || video.originalDirector?.trim() || '',
    originalDirector: video.originalDirector?.trim() || undefined,
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
    name: actor.name || actor.originalName || '',
    originalName: actor.originalName || undefined,
    role: actor.characterName || actor.originalCharacterName || 'Cast',
    originalCharacterName: actor.originalCharacterName || undefined,
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
    generationName: artist.generationName || artist.generation || undefined,
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
    tags: unique(['K-POP', normalizeSongGenre(song.genre || ''), artist ? (artist.isGroup ? 'Group' : 'Solo') : '', song.isTitleTrack ? 'Title track' : '']),
    genres: song.genreMain ? unique([song.genreMain, song.genreSub || ''].map(normalizeSongGenre)) : song.genre ? song.genre.split(/[,;/|]/).map(normalizeSongGenre).filter(Boolean) : undefined,
    description: '',
    relatedIdolIds: song.artistId || artist?.artistId ? [`artist-${song.artistId || artist?.artistId}`] : [],
    previewUrl: song.previewUrl || undefined,
    trackSeconds: song.trackSeconds ?? undefined,
    recordType: song.recordType || undefined,
    isTitleTrack: song.isTitleTrack ?? undefined,
    featuring: song.featuring || undefined,
    mood: song.moodMain || undefined,
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
