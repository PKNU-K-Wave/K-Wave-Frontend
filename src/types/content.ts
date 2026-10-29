export type Language = 'en' | 'zh' | 'ja';

export type ContentKind = 'movie' | 'drama' | 'song' | 'idol' | 'food';

export type BaseContent = {
  id: string;
  contentId?: number;
  relatedContentIds?: number[];
  kind: ContentKind;
  title: string;
  subtitle: string;
  imageUrl: string;
  thumbnailUrl?: string;
  tags: string[];
  genres?: string[];
  description: string;
};

export type VideoContent = BaseContent & {
  kind: 'movie' | 'drama';
  year: number;
  director: string;
  cast: Person[];
  ostIds: string[];
  streaming: string[];
  famousLines?: string[];
  connectedItems?: KWaveContent[];
  voteAverage?: number;
  voteCount?: number;
  resolvedLanguage?: string;
  culturalBackground?: string;
  summary?: string;
  seasonCount?: number;
  totalEpisodes?: number;
  seasons?: Array<{ number: number; name?: string | null; episodes?: number | null; airDate?: string | null }>;
  ostCount?: number;
  relatedCount?: number;
  relationType?: string;
  sharedActors?: Array<{ actorId: number; name: string }>;
};

export type SongContent = BaseContent & {
  kind: 'song';
  artist: string;
  album: string;
  releaseYear: number;
  relatedIdolIds: string[];
  previewUrl?: string;
  trackSeconds?: number;
  recordType?: string;
  isTitleTrack?: boolean;
  featuring?: string;
  connectedItems?: KWaveContent[];
  challengeUrl?: string;
};

export type IdolContent = BaseContent & {
  kind: 'idol';
  instagramUrl: string;
  challengeUrl?: string;
  members: Person[];
  relatedSongIds: string[];
  connectedItems?: KWaveContent[];
  debutYear?: number;
  generation?: string;
  agency?: string;
  fandomName?: string;
  fandomCulture?: string;
  trackTotal?: number;
};

export type FoodContent = BaseContent & {
  kind: 'food';
  cookTime: string;
  difficulty: 'Easy' | 'Medium';
  ingredients: string[];
  steps: string[];
};

export type Person = {
  actorId?: number;
  name: string;
  role: string;
  imageUrl: string;
};

export type KWaveContent = VideoContent | SongContent | IdolContent | FoodContent;
